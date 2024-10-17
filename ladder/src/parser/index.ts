import { Err, Ok, type Result } from "../blocks/result.ts";
import type { Token } from "../scanner/tokens.ts";
import type { And, Branch, Expression, Rung } from "./tree.ts";

type Parser = {
	parse: (tokens: Token[]) => Rung[];
};

type Error = {
	error: string;
};

const newEmptyRung = (): Rung => ({ logic: { typ: "And", conditions: [] } });

const newParser = (): Parser => {
	const parse = (tokens: Token[]) => {
		const rungs: Rung[] = [];

		let i = 0;
		let currentRung: Rung = newEmptyRung();

		/** Check if is at end */
		const _isAtEnd = () => i >= tokens.length;

		/** Advance and return last character */
		const _advance = (): Token => {
			const prev = tokens[i];
			i++;

			return prev;
		};

		const _consume = (match: Token["typ"], message: string): Result<Token, Error> => {
			if (_peek().typ === match) {
				return Ok(_advance());
			}

			return Err({ error: message });
		};

		const _peek = () => tokens[i];

		const _match = (...mat: Token["typ"][]): boolean => mat.includes(_peek().typ);

		const _or = (): Result<Branch, Error> => {
			if (_match("[")) {
				_advance();

				const branches: Branch[] = [];

				while (!_isAtEnd() && !_match("]")) {
					if (branches.length > 0) {
						const consumeRes = _consume(",", "Expected ',' before next condition.");

						if (consumeRes.isErr()) {
							return Err(consumeRes.unwrapErr());
						}
					}

					const branchRes = _or();

					if (branchRes.isErr()) {
						return branchRes;
					}

					branches.push(branchRes.unwrap());
				}

				if (_match("]")) {
					_advance();
				}

				return Ok({ typ: "Or", conditions: branches });
			}

			return _and();
		};

		const _and = (): Result<Branch, Error> => {
			const instructionRes = _instruction();

			if (instructionRes.isErr()) {
				return Err(instructionRes.unwrapErr());
			}

			const branches: Branch[] = [instructionRes.unwrap()];

			while (!_isAtEnd() && !_match(",", "]", ";")) {
				const instructionRes = _or();

				if (instructionRes.isErr()) {
					return instructionRes;
				}

				branches.push(instructionRes.unwrap());
			}

			const and: Branch = { typ: "And", conditions: branches };

			const simplified = _simplifyLogic(and);

			return Ok(simplified);
		};

		/** Simplifies nested logic into it's simplest form */
		const _simplifyLogic = (logic: Branch): Branch => {
			// cannot be simplified because it is an Instruction or an Or
			if (logic.typ !== "And") return logic;

			// already in it's simplest form
			if (logic.conditions.length == 0) return logic;

			if (logic.conditions.length == 1) {
				const condition = logic.conditions[0];

				// if there is only one instruction as the condition we just return the instruction
				if (condition.typ == "Instruction") {
					return condition;
				} else if (condition.typ == "And") {
					// continue simplification
					return _simplifyLogic(condition);
				} else {
					return condition;
				}
			}

			// for > 1 condition

			const newConditions: Branch[] = [];

			for (const condition of logic.conditions) {
				if (condition.typ == "Instruction") {
					// already simplified
					newConditions.push(condition);
				} else if (condition.typ == "And") {
					// continue simplification
					const newCondition = _simplifyLogic(condition);

					if (newCondition.typ == "And") {
						newConditions.push(...newCondition.conditions);
					} else {
						newConditions.push(newCondition);
					}
				} else if (condition.typ == "Or") {
					// we don't know how to simplify ors
					newConditions.push(condition);
				}
			}

			return { typ: "And", conditions: newConditions };
		};

		const _instruction = (): Result<Branch, Error> => {
			if (_match("instruction")) {
				const instruction = _advance();

				const parameters: Expression[] = [];

				const consumeRes = _consume("(", "Expected '(' before expression parameters.");

				if (consumeRes.isErr()) {
					return Err(consumeRes.unwrapErr());
				}

				while (!_isAtEnd() && !_match(")")) {
					if (parameters.length > 0) {
						const consumeRes = _consume(",", "Expected ',' after parameter.");

						if (consumeRes.isErr()) {
							return Err(consumeRes.unwrapErr());
						}
					}

					const paramResult = _expression();

					if (paramResult.isErr()) {
						return Err(paramResult.unwrapErr());
					}

					parameters.push(paramResult.unwrap());
				}

				if (_match(")")) {
					_advance();
				}

				return Ok({ typ: "Instruction", name: instruction.lexeme, parameters });
			}

			return Ok({ typ: "And", conditions: [] });
		};

		const _expression = (): Result<Expression, Error> => {
			return _unary();
		};

		const _unary = (): Result<Expression, Error> => {
			if (_match("-")) {
				const operator = _advance();

				const unaryRes = _unary();

				if (unaryRes.isErr()) {
					return Err(unaryRes.unwrapErr());
				}

				return Ok({ typ: "Unary", operator, right: unaryRes.unwrap() });
			}

			return _primary();
		};

		const _primary = (): Result<Expression, Error> => {
			if (_match("number")) {
				return Ok({ typ: "Number", value: parseFloat(_advance().lexeme) });
			}

			if (_match("string")) {
				let trimmed = _advance().lexeme;

				if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
					trimmed = trimmed.slice(1, trimmed.length - 1);
				}

				return Ok({ typ: "String", value: trimmed });
			}

			if (_match("tag")) {
				return Ok({ typ: "Tag", token: _advance() });
			}

			if (_match("?", "??")) {
				return Ok({ typ: "Undefined", token: _advance() });
			}

			return Err({ error: "Expected expression!" });
		};

		/** Simplifies 'And' expression back into another 'And' but gets rid of any unnecessary nesting */
		const _simplifyAnd = (and: And): And => {
			// already in simplest form
			if (and.conditions.length == 0) return and;

			if (and.conditions.length == 1) {
				const condition = and.conditions[0];

				if (condition.typ == "And") {
					return { typ: "And", conditions: condition.conditions };
				} else {
					return and;
				}
			}

			const newConditions: Branch[] = [];

			for (const condition of and.conditions) {
				if (condition.typ == "And") {
					newConditions.push(..._simplifyAnd(condition).conditions);
				} else {
					newConditions.push(condition);
				}
			}

			return { typ: "And", conditions: newConditions };
		};

		while (!_isAtEnd()) {
			if (_peek().typ == ";") {
				currentRung.logic = _simplifyAnd(currentRung.logic);
				rungs.push(currentRung);
				currentRung = newEmptyRung();
				_advance();
				continue;
			}

			_or().match(
				(branch) => {
					currentRung.logic.conditions.push(branch);
				},
				() => {}
			);
		}

		return rungs;
	};

	return {
		parse,
	};
};

export { newParser as new };

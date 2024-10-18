import { Err, Ok, type Result } from "../blocks/result.ts";
import { EXPRESSION_KEYWORDS, type Token } from "../scanner/tokens.ts";
import type { And, Branch, Rung } from "./tree.ts";
import type { Expression } from "../expressions/index.ts";

type Parser = {
	parse: (tokens: Token[]) => Rung[];
	/** Returns the errors (if any) for the most recent parser pass. */
	errors: Error[] | null;
};

type Error = {
	error: string;
};

const newEmptyRung = (): Rung => ({ logic: { typ: "And", conditions: [] } });

const newParser = (): Parser => {
	let errors: Error[] | null = null;
	const parse = (tokens: Token[]) => {
		errors = null;
		const rungs: Rung[] = [];

		let i = 0;
		let currentRungInstruction = 0;
		let currentRung: Rung = newEmptyRung();

		/** Check if is at end */
		const _isAtEnd = () => i >= tokens.length;

		/** Advance and return last character */
		const _advance = (): Token => {
			const prev = tokens[i];
			i++;

			return prev;
		};

		const _consume = (
			match: Token["typ"],
			message: string,
		): Result<Token, Error> => {
			if (_peek().typ === match) {
				return Ok(_advance());
			}

			return Err({ error: message });
		};

		const _peek = () => tokens[i];

		const _match = (...mat: Token["typ"][]): boolean =>
			mat.includes(_peek().typ);

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

		const _or = (): Result<Branch, Error> => {
			if (_match("[")) {
				_advance();

				const branches: Branch[] = [];

				while (!_isAtEnd() && !_match("]")) {
					if (branches.length > 0) {
						const consumeRes = _consume(
							",",
							"Expected ',' before next condition.",
						);

						if (consumeRes.isErr()) {
							return Err(consumeRes.unwrapErr());
						}
					}

					const branchRes = _and();

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

			return _instruction();
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
						// moves conditions to top level
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
				const instructionIndex = currentRungInstruction;
				currentRungInstruction++;
				const instruction = _advance();

				const parameters: Expression[] = [];

				const consumeRes = _consume(
					"(",
					"Expected '(' before expression parameters.",
				);

				if (consumeRes.isErr()) {
					return Err(consumeRes.unwrapErr());
				}

				while (!_isAtEnd() && !_match(")")) {
					if (parameters.length > 0) {
						const consumeRes = _consume(
							",",
							"Expected ',' after parameter.",
						);

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

				return Ok({
					typ: "Instruction",
					index: instructionIndex,
					name: instruction.lexeme,
					parameters,
				});
			}

			return Ok({ typ: "And", conditions: [] });
		};

		const _expression = (): Result<Expression, Error> => {
			return _equality();
		};

		const _equality = (): Result<Expression, Error> => {
			const orResult = _orExpression();

			if (orResult.isErr()) {
				return orResult;
			}

			let expr = orResult.unwrap();

			if (_match("<", ">", "<=", ">=", "<>", "=")) {
				const operator = _advance();
				const rightRes = _orExpression();

				if (rightRes.isErr()) {
					return rightRes;
				}

				expr = {
					typ: "Binary",
					left: expr,
					operator,
					right: rightRes.unwrap(),
				};
			}

			return Ok(expr);
		};

		const _orExpression = (): Result<Expression, Error> => {
			const xorResult = _xorExpression();

			if (xorResult.isErr()) {
				return xorResult;
			}

			let expr = xorResult.unwrap();

			if (_match("OR")) {
				_advance();
				const rightRes = _orExpression();

				if (rightRes.isErr()) {
					return rightRes;
				}

				expr = {
					typ: "Or",
					left: expr,
					right: rightRes.unwrap(),
				};
			}

			return Ok(expr);
		};

		const _xorExpression = (): Result<Expression, Error> => {
			const andResult = _andExpression();

			if (andResult.isErr()) {
				return andResult;
			}

			let expr = andResult.unwrap();

			if (_match("XOR")) {
				_advance();
				const rightRes = _andExpression();

				if (rightRes.isErr()) {
					return rightRes;
				}

				expr = {
					typ: "Xor",
					left: expr,
					right: rightRes.unwrap(),
				};
			}

			return Ok(expr);
		};

		const _andExpression = (): Result<Expression, Error> => {
			const binaryResult = _term();

			if (binaryResult.isErr()) {
				return binaryResult;
			}

			let expr = binaryResult.unwrap();

			if (_match("AND")) {
				_advance();
				const rightRes = _term();

				if (rightRes.isErr()) {
					return rightRes;
				}

				expr = {
					typ: "And",
					left: expr,
					right: rightRes.unwrap(),
				};
			}

			return Ok(expr);
		};

		const _term = (): Result<Expression, Error> => {
			const factorResult = _factor();

			if (factorResult.isErr()) {
				return factorResult;
			}

			let expr = factorResult.unwrap();

			if (_match("+", "-")) {
				const operator = _advance();
				const rightRes = _factor();

				if (rightRes.isErr()) {
					return rightRes;
				}

				expr = {
					typ: "Binary",
					left: expr,
					operator,
					right: rightRes.unwrap(),
				};
			}

			return Ok(expr);
		};

		const _factor = (): Result<Expression, Error> => {
			const unaryResult = _unary();

			if (unaryResult.isErr()) {
				return unaryResult;
			}

			let expr = unaryResult.unwrap();

			if (_match("*", "/")) {
				const operator = _advance();
				const rightRes = _unary();

				if (rightRes.isErr()) {
					return rightRes;
				}

				expr = {
					typ: "Binary",
					left: expr,
					operator,
					right: rightRes.unwrap(),
				};
			}

			return Ok(expr);
		};

		const _unary = (): Result<Expression, Error> => {
			if (_match("-")) {
				const operator = _advance();

				const unaryRes = _unary();

				if (unaryRes.isErr()) {
					return Err(unaryRes.unwrapErr());
				}

				const unary: Expression = {
					typ: "Unary",
					operator,
					right: unaryRes.unwrap(),
				};

				// attempt to simplify unary if into a number if possible
				// gets rid of unnecessary expressions and errors where expressions are not expected
				if (unary.operator.typ == "-" && unary.right.typ == "Number") {
					return Ok({ typ: "Number", value: -unary.right.value });
				}

				return Ok(unary);
			}

			return _pow();
		};

		const _pow = (): Result<Expression, Error> => {
			const funcResult = _func();

			if (funcResult.isErr()) {
				return funcResult;
			}

			let expr = funcResult.unwrap();

			if (_match("**")) {
				const operator = _advance();
				const rightRes = _func();

				if (rightRes.isErr()) {
					return rightRes;
				}

				expr = {
					typ: "Binary",
					left: expr,
					operator,
					right: rightRes.unwrap(),
				};
			}

			return Ok(expr);
		};

		const _func = (): Result<Expression, Error> => {
			const factorResult = _primary();

			if (factorResult.isErr()) {
				return factorResult;
			}

			let expr = factorResult.unwrap();

			if (_match(...EXPRESSION_KEYWORDS)) {
				const func = _advance();

				const params: Expression[] = [];

				while (!_isAtEnd() && !_match(")")) {
					if (params.length > 0) {
						const consumeRes = _consume(
							",",
							"Expected ',' after parameter.",
						);

						if (consumeRes.isErr()) {
							return Err(consumeRes.unwrapErr());
						}
					}

					const paramRes = _term();

					if (paramRes.isErr()) {
						return paramRes;
					}

					params.push(paramRes.unwrap());
				}

				expr = {
					typ: "Func",
					name: func,
					params,
				};
			}

			return Ok(expr);
		};

		const _primary = (): Result<Expression, Error> => {
			if (_match("number")) {
				return Ok({
					typ: "Number",
					value: parseFloat(_advance().lexeme),
				});
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

			if (_match("(")) {
				_advance();
				const expressionResult = _expression();

				if (expressionResult.isErr()) {
					return Err(expressionResult.unwrapErr());
				}

				const consumeRes = _consume(")", "'(' left unclosed.");

				if (consumeRes.isErr()) {
					return Err(consumeRes.unwrapErr());
				}

				return Ok({
					typ: "Grouping",
					expression: expressionResult.unwrap(),
				});
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
				// this should really only go one level as the rest should already be simplified
				currentRung.logic = _simplifyAnd(currentRung.logic);
				currentRungInstruction = 0;
				rungs.push(currentRung);
				currentRung = newEmptyRung();
				_advance();
				continue;
			}

			_and().match(
				(branch) => {
					currentRung.logic.conditions.push(branch);
				},
				(err) => {
					if (errors == null) {
						errors = [];
					}

					errors.push(err);

					// try to recover from the error
					while (!_isAtEnd() && _match(")", "]", ";")) {
						_advance();
					}
				},
			);
		}

		return rungs;
	};

	return {
		parse,
		get errors() {
			return errors;
		},
	};
};

export { newParser as new };

import { Err, Ok, type Result } from "../blocks/result.ts";
import type { Token } from "../scanner/tokens.ts";
import type { Branch, Expression, Rung } from "./tree.ts";

type Parser = {
	parse: (tokens: Token[]) => Rung[];
};

type Error = {
	error: string;
};

const EMPTY_RUNG: Rung = { logic: { typ: "And", conditions: [] } } as const;

const newParser = (): Parser => {
	const parse = (tokens: Token[]) => {
		const rungs: Rung[] = [];
		let errors: Error[] | null = null;

		let i = 0;
		let currentRung: Rung = EMPTY_RUNG;

		const _error = (error: string, start: number) => {
			const err = { error, startColumn: start, endColumn: i };
			if (errors === null) {
				errors = [err];
				return;
			}

			errors.push(err);
		};

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

		/** See the next token */
		const _peekNext = () => tokens[i + 1];

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
			console.log(_peek())
			const instructionRes = _instruction();

			if (instructionRes.isErr()) {
				return Err(instructionRes.unwrapErr());
			}

			const branches: Branch[] = [instructionRes.unwrap()];

			while (!_isAtEnd() && !_match(",", "]")) {
				const instructionRes = _or();

				if (instructionRes.isErr()) {
					return instructionRes;
				}

				branches.push(instructionRes.unwrap());
			}

			if (branches.length == 1) {
				return Ok(branches[0]);
			}

			return Ok({ typ: "And", conditions: branches });
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
			if (_match("number", "string")) {
				return Ok({ typ: "Literal", value: _advance().lexeme });
			}

			if (_match("tag")) {
				return Ok({ typ: "Tag", token: _advance() });
			}

			if (_match("?", "??")) {
				return Ok({ typ: "Undefined", token: _advance() });
			}

			return Err({ error: "Expected expression!" });
		};

		while (!_isAtEnd()) {
			if (_peek().typ == ";") {
				rungs.push(currentRung);
				currentRung = EMPTY_RUNG;
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

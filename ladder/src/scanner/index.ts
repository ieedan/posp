import type { Token } from "../tokens/index.ts";
import {
	isAlpha,
	isNumber,
	isValidForIdentifierBody,
	isValidForTagBody,
} from "../utils/index.ts";

type Error = {
	error: string;
	startColumn: number;
	endColumn: number;
};

type Scanner = {
	scan: (code: string) => [Token[], string[] | null];
};

/** Creates a new scanner instance  */
const newScanner = (): Scanner => {
	const scan = (code: string): [Token[], string[] | null] => {
		let i = 0;
		const tokens: Token[] = [];
		let errors: Error[] | null = null;
		let isParam = false;

		const _error = (error: string, start: number) => {
			const err = { error, startColumn: start, endColumn: i };
			if (errors === null) {
				errors = [err];
				return;
			}

			errors.push(err);
		};

		/** Check if is at end */
		const _isAtEnd = () => i >= code.length;

		/** Advance and return last character */
		const _advance = (): string => {
			const prev = code[i];
			i++;

			return prev;
		};

		const _consume = (match: string): number | undefined => {
			while (!_isAtEnd()) {
				if (_advance() === match) {
					return i;
				}
			}
		};

		const _peek = () => code[i];

		/** See the next token */
		const _peekNext = () => code[i + 1];

		while (!_isAtEnd()) {
			// console.log(`i: ${i} - ${_peek()}`, tokens, errors);
			switch (code[i]) {
				case "[":
					tokens.push({
						typ: "[",
						column: i,
						lexeme: "[",
					});
					_advance();
					break;
				case "]":
					tokens.push({
						typ: "]",
						column: i,
						lexeme: "]",
					});
					_advance();
					break;
				case "(":
					isParam = true;
					tokens.push({
						typ: "(",
						column: i,
						lexeme: "(",
					});
					_advance();
					break;
				case ")":
					isParam = false;
					tokens.push({
						typ: ")",
						column: i,
						lexeme: ")",
					});
					_advance();
					break;
				case ";":
					tokens.push({
						typ: ";",
						column: i,
						lexeme: ";",
					});
					_advance();
					break;
				case ",":
					tokens.push({
						typ: ",",
						column: i,
						lexeme: ",",
					});
					_advance();
					break;
				case " ":
					tokens.push({
						typ: " ",
						column: i,
						lexeme: " ",
					});
					_advance();
					break;
				default:
					if (isParam) {
						let start = i;

						while (!_isAtEnd() && _peek() != ")") {
							if (_peek() === ",") {
								tokens.push({
									typ: ",",
									column: start,
									lexeme: ",",
								});

								_advance();

								start = i;

								continue;
							}

							// first character
							if (start == i) {
								const first = _peek();
								if (first === "'") {
									_advance();

									// parse expecting a string literal
									const end = _consume("'");

									if (end === undefined) {
										_error(
											"Unterminated string literal '''!",
											start,
										);
									} else {
										const str = code.slice(start, end);

										tokens.push({
											typ: "string",
											column: start,
											lexeme: str,
										});
									}
								} else if (isNumber(first) || first == "-") {
									// parse expecting a number

									_advance();

									while (isNumber(_peek())) {
										_advance();
									}

									if (
										_peek() == "." &&
										isNumber(_peekNext())
									) {
										_advance();

										while (isNumber(_peek())) {
											_advance();
										}
									}

									const num = code.slice(start, i);

									tokens.push({
										typ: "number",
										column: start,
										lexeme: num,
									});
								} else if (isAlpha(first)) {
									_advance();

									while (isValidForTagBody(_peek())) {
										_advance();
									}

									const tag = code.slice(start, i);

									tokens.push({
										typ: "tag",
										column: start,
										lexeme: tag,
									});
								} else {
									_error(
										"Invalid first character for instruction parameter.",
										i,
									);
									_advance();
								}

								continue;
							}

							_error("Unexpected token", i);

							_advance();
						}
					} else if (isAlpha(_peek())) {
						const start = i;
						_advance();

						while (isValidForIdentifierBody(_peek())) {
							_advance();
						}

						const instruction = code.slice(start, i);

						tokens.push({
							typ: "instruction",
							column: start,
							lexeme: instruction,
						});
					} else {
						_error("Unexpected token", i);
						_advance();
					}
					break;
			}
		}

		return [tokens, errors];
	};

	return {
		scan,
	};
};

export { type Error, newScanner as new };

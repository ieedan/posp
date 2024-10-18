import { EXPRESSION_KEYWORDS, type Token } from "./tokens.ts";
import {
	isAlpha,
	isAlphaNumeric,
	isNumber,
	isValidForTagBody,
} from "../utils/index.ts";
import { Err, Ok, type Result } from "../blocks/index.ts";

type Error = {
	error: string;
	startColumn: number;
	endColumn: number;
};

type Scanner = {
	scan: (code: string) => Result<Token[], Error[] | null>;
};

/** Creates a new scanner instance  */
const newScanner = (): Scanner => {
	const scan = (code: string): Result<Token[], Error[] | null> => {
		let i = 0;
		const tokens: Token[] = [];
		let errors: Error[] | null = null;

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

		const _consume = (
			match: string,
			message: string,
		): Result<string, Error> => {
			if (_peek() === match) {
				return Ok(_advance());
			}

			return Err({ error: message, startColumn: i, endColumn: i });
		};

		const _peek = () => code[i];

		/** See the next token */
		const _peekNext = () => code[i + 1];

		while (!_isAtEnd()) {
			// only valid syntax for branches here
			switch (_peek()) {
				case " ":
					// strip whitespace
					_advance();
					break;
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
				case ",":
					tokens.push({
						typ: ",",
						column: i,
						lexeme: ",",
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
				default:
					if (isAlpha(_peek()) || _peek() == "_") {
						const s = i;
						while (isAlphaNumeric(_peek()) || _peek() == "_") {
							_advance();
						}

						const instruction = code.slice(s, i);

						tokens.push({
							typ: "instruction",
							column: s,
							lexeme: instruction,
						});

						if (
							_consume("(", "Expected '(' after instruction.")
								.isErr()
						) {
							_error("Expected '(' after instruction", i);
							_advance();
							continue;
						} else {
							tokens.push({
								typ: "(",
								column: i - 1,
								lexeme: "(",
							});
						}

						// start parsing parameters

						const start = i;

						// when stack hits 0 we know we should be done with parameters
						let parensStack: number = 1;

						let done = false;

						while (!_isAtEnd() && !done) {
							switch (_peek()) {
								case "(":
									// add to stack
									parensStack++;
									tokens.push({
										typ: "(",
										column: i,
										lexeme: "(",
									});
									_advance();
									break;
								case ")":
									// pop prop stack
									parensStack--;
									tokens.push({
										typ: ")",
										column: i,
										lexeme: ")",
									});
									_advance();

									// if we reach 0 on the stack break out
									if (parensStack == 0) {
										done = true;
										break;
									}

									break;
								case " ":
									// strip whitespace
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
								case "-":
									tokens.push({
										typ: "-",
										column: i,
										lexeme: "-",
									});
									_advance();
									break;
								case "+":
									tokens.push({
										typ: "+",
										column: i,
										lexeme: "+",
									});
									_advance();
									break;
								case "*": {
									const s = i;
									if (_peekNext() == "*") {
										_advance();
									}

									const lex = code.slice(s, i + 1);

									tokens.push({
										// @ts-ignore we know this is either * or **
										typ: lex,
										column: s,
										lexeme: lex,
									});
									_advance();
									break;
								}
								case "/":
									tokens.push({
										typ: "/",
										column: i,
										lexeme: "/",
									});
									_advance();
									break;
								case "<":
									switch (_peekNext()) {
										case ">":
											tokens.push({
												typ: "<>",
												column: i,
												lexeme: "<>",
											});
											_advance();
											break;
										case "=":
											tokens.push({
												typ: "<=",
												column: i,
												lexeme: "<=",
											});
											_advance();
											break;
										default:
											tokens.push({
												typ: "<",
												column: i,
												lexeme: "<",
											});
											break;
									}
									_advance();
									break;
								case ">":
									switch (_peekNext()) {
										case "=":
											tokens.push({
												typ: ">=",
												column: i,
												lexeme: ">=",
											});
											_advance();
											break;
										default:
											tokens.push({
												typ: ">",
												column: i,
												lexeme: ">",
											});
											break;
									}
									_advance();
									break;
								case "?": {
									const s = i;
									if (_peekNext() == "?") {
										_advance();
									}

									const lex = code.slice(s, i + 1);

									tokens.push({
										// @ts-ignore we know this is either ? or ??
										typ: lex,
										column: s,
										lexeme: lex,
									});
									_advance();
									break;
								}
								case "=": {
									tokens.push({
										// @ts-ignore we know this is either = or ==
										typ: "=",
										column: i,
										lexeme: "=",
									});
									_advance();
									break;
								}
								case "'": {
									const s = i;
									_advance();

									while (!_isAtEnd() && _peek() !== "'") {
										_advance();
									}

									if (_isAtEnd() && _peek() !== "'") {
										_error("Unclosed string literal!", i);
										break;
									}

									const str = code.slice(s, i);

									tokens.push({
										typ: "string",
										column: s,
										lexeme: str,
									});
									break;
								}
								default: {
									// when referencing a program parameter tags are prefixed with '\'
									if (
										isAlpha(_peek()) || _peek() == "_" ||
										_peek() == "\\"
									) {
										const s = i;
										_advance();

										while (isValidForTagBody(_peek())) {
											_advance();
										}

										const tag = code.slice(s, i);

										// @ts-ignore we must do this check
										if (EXPRESSION_KEYWORDS.includes(tag)) {
											tokens.push({
												// @ts-ignore it must be a keyword
												typ: tag,
												column: s,
												lexeme: tag,
											});
										} else {
											tokens.push({
												typ: "tag",
												column: s,
												lexeme: tag,
											});
										}
									} else if (isNumber(_peek())) {
										const s = i;
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

										const num = code.slice(s, i);

										tokens.push({
											typ: "number",
											column: s,
											lexeme: num,
										});
									} else {
										_error(
											`Unexpected token '${_peek()}'!`,
											i,
										);
										_advance();
									}
									break;
								}
							}
						}

						if (!done) {
							_error("Unfinished params", start);
						}
					} else {
						_error(`Unexpected token '${_peek()}'!`, i);
						_advance();
						continue;
					}
					break;
			}
		}

		return errors === null ? Ok(tokens) : Err(errors);
	};

	return {
		scan,
	};
};

export { type Error, newScanner as new };

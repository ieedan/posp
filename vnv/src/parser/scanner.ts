import { Token, TokenType } from './tokens';
import { is_alpha, is_alphanumeric, is_digit } from './utils';

export type Options = {
	tab_width: number;
};

export const scanner = ({ tab_width }: Options) => {
	let current = 0;
	let line = 1;
	let column = 0;
	let source: string;
	let had_error = false;
	let tokens: Token[] = [];
	let start = 0;

	const is_at_end = () => current >= source.length;

	const advance = (columns: number = 1) => {
		current++;
		column++;
	};

	const new_line = () => {
		line++;
		column = 0;
		advance();
	};

	const error = (msg: string) => {
		had_error = true;
		console.log(msg);
	};

	const add_token = (type: TokenType) => {
		const lexeme = source.substring(start, current + 1);
		tokens.push({ column, line, lexeme, type });
		advance();
	};

	const peek = (amount: number = 0) => source[current + amount];

	const peek_next = () => peek(1);

	return {
		scan: (src: string): Token[] => {
			// re-initialize variables
			if (current != 0) {
				current = 0;
				line = 1;
				had_error = false;
				tokens = [];
				start = 0;
			}

			source = src;

			while (!is_at_end()) {
				let char = source[current];

				start = current;

				switch (char) {
					case '=':
						add_token(TokenType.EQUAL);
						break;
					case '[':
						add_token(TokenType.LEFT_SQUARE_BRACKET);
						break;
					case ']':
						add_token(TokenType.LEFT_SQUARE_BRACKET);
						break;
					case '"':
						let start_line = line;
						let start_column = column;
						advance();

						while (peek() != '"' && !is_at_end()) {
							advance();
						}

						if (peek() != '"' && is_at_end()) {
							error(`Unterminated string at ${start_line}:${start_column}.`);
							break;
						}

						advance();

						const lexeme = source.substring(start, current);

						const literal = source.substring(start + 1, current - 1);

						tokens.push({
							type: TokenType.STRING,
							line: start_line,
							column: start_column,
							lexeme,
							literal,
						});

						break;
					// comments go to the end of the line
					case '#':
						while (peek_next() != '\n' && !is_at_end()) {
							advance();
						}
						break;
					case '\n':
						new_line();
						break;
					case ' ' || '\r' || '\t':
						advance();
						break;
					default:
						if (is_alpha(char) || char == '_') {
							const is_value = tokens[tokens.length - 1]?.type == TokenType.EQUAL;

							advance();

							while (is_alphanumeric(peek()) && !is_at_end()) {
								advance();
							}

							const lexeme = source.substring(start, current);

							if (is_value) {
								tokens.push({
									column: column - lexeme.length,
									line,
									lexeme,
									type: TokenType.STRING,
									literal: lexeme,
								});
							} else {
								tokens.push({
									column: column - lexeme.length,
									line,
									lexeme,
									type: TokenType.IDENTIFIER,
								});
							}

							break;
						} else if (is_digit(char) || peek() == '-') {
							advance();
							while (is_digit(peek()) && !is_at_end()) {
								advance();
							}

							if (peek() == '.' && is_digit(peek_next())) {
								advance();

								while (is_digit(peek()) && !is_at_end()) {
									advance();
								}
							}

							if (peek() == 'e' || peek() == 'E') {
								advance();
								if (peek() == '+' || peek() == '-') {
									advance();
								}

								while (is_digit(peek()) && !is_at_end()) {
									advance();
								}
							}

							const literal = source.substring(start, current);

							const number = Number(literal);

							tokens.push({
								type: TokenType.NUMBER,
								column: column - literal.length,
								line: line,
								literal: number,
								lexeme: literal,
							});

							break;
						}

						error(`Unexpected token ${char} at ${line}:${column}`);

						advance();
						break;
				}
			}

			return tokens;
		},
	};
};

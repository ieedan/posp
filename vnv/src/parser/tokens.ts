export enum TokenType {
	// single character tokens
	EQUAL,
	LEFT_SQUARE_BRACKET,
	RIGHT_SQUARE_BRACKET,

	IDENTIFIER,

	NUMBER,
	STRING
}

export type Literal = number | string;

export type Token = {
	type: TokenType;
	line: number;
	column: number;
	lexeme: string;
    literal?: Literal
};
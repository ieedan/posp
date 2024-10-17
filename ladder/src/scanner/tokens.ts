// See CMP instruction help for expression syntax

export const EXPRESSION_KEYWORDS = [
	"AND",
	"OR",
	"XOR",
	"ABS",
	"ACS",
	"ASN",
	"ATN",
	"COS",
	"DEG",
	"FRD",
	"LN",
	"LOG",
	"RAD",
	"SIN",
	"SQR",
	"TAN",
	"TON",
	"TRN",
	"MOD",
	"NOT",
] as const;

export type ExpressionKeyword = (typeof EXPRESSION_KEYWORDS)[number];

export type Token = {
	typ:
		| "instruction"
		| "tag"
		// literals
		| "string"
		| "number"
		// symbols
		| "["
		| "]"
		| "("
		| ")"
		| ";"
		| ","
		| "?"
		| "??"
		// expressions
		| "="
		| "<>"
		| "<"
		| "<="
		| ">="
		| ">"
		| "*"
		| "**"
		| "/"
		| "-"
		| "+"
		| ExpressionKeyword;
	lexeme: string;
	column: number;
};

export type Instruction = {
	typ: string;
	params: string[];
};

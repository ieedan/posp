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
		| "AND"
		| "OR"
		| "XOR"
		| "ABS"
		| "ACS"
		| "ASN"
		| "ATN"
		| "COS"
		| "DEG"
		| "FRD"
		| "LN"
		| "LOG"
		| "RAD"
		| "SIN"
		| "SQR"
		| "TAN"
		| "TON"
		| "TRN"
		| "MOD"
		| "NOT"
	lexeme: string;
	column: number;
};

// See CMP instruction help for expression syntax

export const EXPRESSION_FUNCTIONS = [
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

export type Instruction = {
	typ: string;
	params: string[];
};

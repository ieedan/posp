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
		| " "

		// expressions
		| "=="
		| "!="
		| "<"
		| ">"
		| ">="
		| "<="
		| "*"
		| "/"
		| "%"
		| "&&"
		| "||"
		| "!"
		| "-"
		| "+"
		| "~"
		| "^"
		| ">>"
		| "<<"
		| "max"
		| "min"
		| "avg"
		| "abs"
		| "trunc"
		| "ceil"
		| "floor"
		| "round"
		| "sqrt"
		| "sign";
	lexeme: string;
	column: number;
};

export type Instruction = {
	typ: string;
	params: string[];
};

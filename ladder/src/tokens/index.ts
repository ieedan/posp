export type Token = {
	typ:
		| "instruction"
		| "tag"
		| "string"
		| "number"
		| "["
		| "]"
		| "("
		| ")"
		| ";"
		| ","
		| " ";
	lexeme: string;
	column: number;
};

export type Instruction = {
	typ: string;
	params: string[];
};

import type { Token } from "../scanner/tokens.ts";

/** Expression types. You can determine which type by checking the `typ` prop on each expression. */
export type Expression =
	| Number
	| String
	| Undefined
	| Tag
	| Unary
	| Binary
	| Or
	| Xor
	| And
	| Func
	| Grouping;

export type Number = {
	typ: "Number";
	value: number;
};

export type String = {
	typ: "String";
	value: string;
};

export type Tag = {
	typ: "Tag";
	token: Token;
};

export type Undefined = {
	typ: "Undefined";
	token: Token;
};

export type Unary = {
	typ: "Unary";
	operator: Token;
	right: Expression;
};

export type Binary = {
	typ: "Binary";
	left: Expression;
	operator: Token;
	right: Expression;
};

export type Or = {
	typ: "Or";
	left: Expression;
	right: Expression;
};

export type Xor = {
	typ: "Xor";
	left: Expression;
	right: Expression;
};

export type And = {
	typ: "And";
	left: Expression;
	right: Expression;
};

export type Func = {
	typ: "Func";
	name: Token;
	params: Expression[];
};

export type Grouping = {
	typ: "Grouping";
	expression: Expression;
};

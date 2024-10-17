import type { Token } from "../scanner/tokens.ts";

export type Rung = {
	logic: And;
};

export type Branch = And | Or | Instruction;

export type And = {
	typ: "And";
	conditions: Branch[];
};

export type Or = {
	typ: "Or";
	conditions: Branch[];
};

export type Instruction = {
	typ: "Instruction";
	name: string;
	parameters: Expression[];
};

// this is later
export type Expression = Number | String | Undefined | Tag | Unary;

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

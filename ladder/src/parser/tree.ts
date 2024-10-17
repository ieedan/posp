import type { Expression } from "../expressions/index.ts";

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

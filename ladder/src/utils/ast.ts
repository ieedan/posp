import type { And, Instruction, Or, Rung } from "../parser/tree.ts";
import * as instructions from "./ascii.ts";

const toString = (rungs: Rung[]): string[] => {
	const rungDisplays: string[] = [];

	for (const rung of rungs) {
		rungDisplays.push(displayAnd(rung.logic));
	}

	return rungDisplays;
};

const displayOr = (_or: Or) => {
	return "--O--";
};

const displayAnd = (and: And): string => {
	let display = "";

	for (const condition of and.conditions) {
		switch (condition.typ) {
			case "And":
				display += displayAnd(condition as And);
				break;
			case "Or":
				display += displayOr(condition as Or);
				break;
			case "Instruction":
				display += instructionToString(condition as Instruction);
				break;
		}
	}

	return display;
};

const instructionToString = (instruction: Instruction): string => {
	switch (instruction.name) {
		case "XIC":
			return instructions.XIC;
		case "XIO":
			return instructions.XIO;
		case "OTE":
			return instructions.OTE;
		case "OTL":
			return instructions.OTL;
		case "OTU":
			return instructions.OTU;
		case "NOP":
			return instructions.NOP;
		default:
			return "?????";
	}
};

export { toString };

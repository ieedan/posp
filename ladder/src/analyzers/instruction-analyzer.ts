import { arrayToMap } from "../blocks/index.ts";
import type { Expression } from "../expressions/index.ts";
import type { Branch, Rung } from "../parser/tree.ts";

type Observation = {
	level: "error" | "warn" | "info";
	message: string;
	rung: number;
	instruction?: number;
	parameter?: number;
};

type Parameter = {
	/** Name of the parameter to appear in error messages. Defaults to `"Operand [index]"` */
	name?: string;
	/** If parameter is valid return undefined else return an error string.
	 *
	 * @param expr Expression to check
	 * @param index Parameter index
	 * @param name Name of the parameter
	 * @returns
	 */
	accept: (expr: Expression, index: number, name: string | undefined) => string | undefined;
};

type LogixInstruction = {
	name: string;
	warnMessage?: string;
	banMessage?: string;
	parameters: Parameter[];
};

const acceptTag: Parameter["accept"] = (expr, index, name = undefined) =>
	expr.typ === "Tag" ? undefined : `${name ?? `Operand ${index}`} only accepts Tags`;

const acceptExpression: Parameter["accept"] = (expr, index, name = undefined) =>
	expr.typ !== "String" ? undefined : `${name ?? `Operand ${index}`} only accepts Expressions`;

const acceptNumber: Parameter["accept"] = (expr, index, name = undefined) =>
	expr.typ === "Number" ? undefined : `${name ?? `Operand ${index}`} only accepts Numbers`;

const acceptComparable: Parameter["accept"] = (expr, index, name = undefined) => {
	const ok = ["Number", "String", "Tag"].includes(expr.typ);

	return ok ? undefined : `${name ?? `Operand ${index}`} accepts Numbers, Strings, Tags`;
};

const DEFAULT_INSTRUCTIONS: Map<string, LogixInstruction> = arrayToMap(
	[
		{
			name: "XIC",
			parameters: [
				{
					accept: acceptTag,
				},
			],
		},
		{
			name: "NOP",
			parameters: [],
		},
		{
			name: "AFI",
			warnMessage: "This AFI should be removed!",
			parameters: [],
		},
		{
			name: "XIO",
			parameters: [
				{
					accept: acceptTag,
				},
			],
		},
		{
			name: "ONS",
			parameters: [
				{
					accept: acceptTag,
				},
			],
		},
		{
			name: "OTE",
			parameters: [
				{
					accept: acceptTag,
				},
			],
		},
		{
			name: "OTL",
			parameters: [
				{
					accept: acceptTag,
				},
			],
		},
		{
			name: "OTU",
			parameters: [
				{
					accept: acceptTag,
				},
			],
		},
		{
			name: "TON",
			parameters: [
				{
					name: "Timer",
					accept: acceptTag,
				},
				{
					name: "Preset",
					accept: acceptNumber,
				},
				{
					name: "Accum",
					accept: acceptNumber,
				},
			],
		},
		{
			name: "EQU",
			parameters: [
				{
					name: "Source A",
					accept: acceptComparable,
				},
				{
					name: "Source B",
					accept: acceptComparable,
				},
			],
		},
		{
			name: "NEQ",
			parameters: [
				{
					name: "Source A",
					accept: acceptComparable,
				},
				{
					name: "Source B",
					accept: acceptComparable,
				},
			],
		},
		{
			name: "GEQ",
			parameters: [
				{
					name: "Source A",
					accept: acceptComparable,
				},
				{
					name: "Source B",
					accept: acceptComparable,
				},
			],
		},
		{
			name: "LEQ",
			parameters: [
				{
					name: "Source A",
					accept: acceptComparable,
				},
				{
					name: "Source B",
					accept: acceptComparable,
				},
			],
		},
		{
			name: "LES",
			parameters: [
				{
					name: "Source A",
					accept: acceptComparable,
				},
				{
					name: "Source B",
					accept: acceptComparable,
				},
			],
		},
		{
			name: "GRT",
			parameters: [
				{
					name: "Source A",
					accept: acceptComparable,
				},
				{
					name: "Source B",
					accept: acceptComparable,
				},
			],
		},
		{
			name: "MOV",
			parameters: [
				{
					name: "Source",
					accept: acceptComparable,
				},
				{
					name: "Dest",
					accept: acceptComparable,
				},
			],
		},
		{
			name: "CPS",
			parameters: [
				{
					name: "Source",
					accept: acceptComparable,
				},
				{
					name: "Dest",
					accept: acceptComparable,
				},
				{
					name: "Length",
					accept: acceptNumber,
				},
			],
		},
		{
			name: "FLL",
			parameters: [
				{
					name: "Source",
					accept: acceptComparable,
				},
				{
					name: "Dest",
					accept: acceptComparable,
				},
				{
					name: "Length",
					accept: acceptNumber,
				},
			],
		},
		{
			name: "JSR",
			parameters: [
				{
					name: "Routine Name",
					accept: acceptTag,
				},
			],
		},
		{
			name: "FSC",
			parameters: [
				{
					accept: acceptTag,
				},
				{
					name: "Length",
					accept: (expr, index, name) =>
						expr.typ === "Undefined" || expr.typ == "Number"
							? undefined
							: `${name ?? `Operand ${index}`} only accepts numbers.`,
				},
				{
					name: "Position",
					accept: (expr, index, name) =>
						expr.typ === "Undefined" || expr.typ == "Number"
							? undefined
							: `${name ?? `Operand ${index}`} only accepts numbers.`,
				},
				{
					name: "Mode",
					accept: acceptNumber,
				},
				{
					accept: acceptExpression,
				},
			],
		},
	] satisfies LogixInstruction[],
	(instruction) => [instruction.name, instruction]
);

const analyze = (rungs: Rung[]): Observation[] | null => {
	let observations: Observation[] | null = null;
	let rungIndex = 0;

	const _error = (
		message: string,
		instruction: number | undefined = undefined,
		parameter: number | undefined = undefined
	) => {
		if (observations == null) {
			observations = [];
		}

		observations.push({ level: "error", message, rung: rungIndex, instruction, parameter });
	};

	const _warn = (
		message: string,
		instruction: number | undefined = undefined,
		parameter: number | undefined = undefined
	) => {
		if (observations == null) {
			observations = [];
		}

		observations.push({ level: "warn", message, rung: rungIndex, instruction, parameter });
	};

	const _info = (
		message: string,
		instruction: number | undefined = undefined,
		parameter: number | undefined = undefined
	) => {
		if (observations == null) {
			observations = [];
		}

		observations.push({ level: "info", message, rung: rungIndex, instruction, parameter });
	};

	const _isAtEnd = () => rungIndex >= rungs.length;

	const _analyze = (branch: Branch) => {
		switch (branch.typ) {
			case "Instruction": {
				const instruction = DEFAULT_INSTRUCTIONS.get(branch.name);

				if (!instruction) {
					_error(`Unknown instruction '${branch.name}'!`, branch.index);
					return;
				}

				if (instruction.parameters.length != branch.parameters.length) {
					_error(
						`Parameter length mismatch. Expected ${instruction.parameters.length} parameters got ${branch.parameters.length}.`,
						branch.index
					);
					return;
				}

				if (instruction.warnMessage) {
					_warn(instruction.warnMessage, branch.index);
				}

				if (instruction.banMessage) {
					_warn(instruction.banMessage, branch.index);
				}

				for (let i = 0; i < instruction.parameters.length; i++) {
					const result = instruction.parameters[i].accept(
						branch.parameters[i],
						i,
						instruction.parameters[i].name
					);

					if (result !== undefined) {
						_error(result, branch.index, i);
					}
				}

				break;
			}
			case "And": {
				if (branch.conditions.length == 0) {
					_warn("Empty branch");
				} else {
					for (const cond of branch.conditions) {
						_analyze(cond);
					}
				}

				break;
			}
			case "Or": {
				for (const cond of branch.conditions) {
					_analyze(cond);
				}
				break;
			}
		}
	};

	while (!_isAtEnd()) {
		if (rungs[rungIndex].logic.conditions.length == 0) {
			_warn("Empty rung");
		} else {
			_analyze(rungs[rungIndex].logic);
		}

		rungIndex++;
	}

	return observations;
};

export { analyze };

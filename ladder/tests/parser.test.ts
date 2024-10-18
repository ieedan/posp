import { assertEquals } from "@std/assert";
import * as s from "../src/scanner/index.ts";
import * as p from "../src/parser/index.ts";

const scanner = s.new();
const parser = p.new();

Deno.test("Expect correct ast And", () => {
	const input = "XIC(Tag)XIO(Tag2)OTE(Tag3);";

	const tokens = scanner.scan(input);

	const ast = parser.parse(
		tokens.expect("This syntax is valid and should not fail."),
	);

	assertEquals(ast, [
		{
			logic: {
				typ: "And",
				conditions: [
					{
						typ: "Instruction",
						index: 0,
						name: "XIC",
						parameters: [
							{
								typ: "Tag",
								token: {
									typ: "tag",
									column: 4,
									lexeme: "Tag",
								},
							},
						],
					},
					{
						typ: "Instruction",
						index: 1,
						name: "XIO",
						parameters: [
							{
								typ: "Tag",
								token: {
									typ: "tag",
									column: 12,
									lexeme: "Tag2",
								},
							},
						],
					},
					{
						typ: "Instruction",
						index: 2,
						name: "OTE",
						parameters: [
							{
								typ: "Tag",
								token: {
									typ: "tag",
									column: 21,
									lexeme: "Tag3",
								},
							},
						],
					},
				],
			},
		},
	]);
	assertEquals(parser.errors, null);
});

Deno.test("Expect correct ast Or", () => {
	const input = "[XIC(Tag),XIO(Tag2)]OTE(Tag3);";

	const tokens = scanner.scan(input);

	const ast = parser.parse(
		tokens.expect("This syntax is valid and should not fail."),
	);

	assertEquals(ast, [
		{
			logic: {
				typ: "And",
				conditions: [
					{
						typ: "Or",
						conditions: [
							{
								typ: "Instruction",
								index: 0,
								name: "XIC",
								parameters: [
									{
										typ: "Tag",
										token: {
											typ: "tag",
											column: 5,
											lexeme: "Tag",
										},
									},
								],
							},
							{
								typ: "Instruction",
								index: 1,
								name: "XIO",
								parameters: [
									{
										typ: "Tag",
										token: {
											typ: "tag",
											column: 14,
											lexeme: "Tag2",
										},
									},
								],
							},
						],
					},
					{
						typ: "Instruction",
						index: 2,
						name: "OTE",
						parameters: [
							{
								typ: "Tag",
								token: {
									typ: "tag",
									column: 24,
									lexeme: "Tag3",
								},
							},
						],
					},
				],
			},
		},
	]);
	assertEquals(parser.errors, null);
});

Deno.test("Expect correct ast Nested Or", () => {
	const input = "NOP()[[NOP(),NOP()][NOP(),NOP()]];";

	const tokens = scanner.scan(input);

	const ast = parser.parse(
		tokens.expect("This syntax is valid and should not fail."),
	);

	assertEquals(ast, [
		{
			logic: {
				typ: "And",
				conditions: [
					{
						typ: "Instruction",
						index: 0,
						name: "NOP",
						parameters: [],
					},
					{
						typ: "Or",
						conditions: [
							{
								typ: "And",
								conditions: [
									{
										typ: "Or",
										conditions: [
											{
												typ: "Instruction",
												index: 1,
												name: "NOP",
												parameters: [],
											},
											{
												typ: "Instruction",
												index: 2,
												name: "NOP",
												parameters: [],
											},
										],
									},
									{
										typ: "Or",
										conditions: [
											{
												typ: "Instruction",
												index: 3,
												name: "NOP",
												parameters: [],
											},
											{
												typ: "Instruction",
												index: 4,
												name: "NOP",
												parameters: [],
											},
										],
									},
								],
							},
						],
					},
				],
			},
		},
	]);
	assertEquals(parser.errors, null);
});

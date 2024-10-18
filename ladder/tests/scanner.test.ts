import { assertEquals } from "@std/assert";
import * as s from "../src/scanner/index.ts";

const scanner = s.new();

Deno.test("Expect correct tokenization", () => {
	const input = "XIC(Tag)OTE(Tag3);";

	const tokens = scanner.scan(input);

	assertEquals(tokens.unwrap(), [
		{
			typ: "instruction",
			column: 0,
			lexeme: "XIC",
		},
		{
			typ: "(",
			column: 3,
			lexeme: "(",
		},
		{
			typ: "tag",
			column: 4,
			lexeme: "Tag",
		},
		{
			typ: ")",
			column: 7,
			lexeme: ")",
		},
		{
			typ: "instruction",
			column: 8,
			lexeme: "OTE",
		},
		{
			typ: "(",
			column: 11,
			lexeme: "(",
		},
		{
			typ: "tag",
			column: 12,
			lexeme: "Tag3",
		},
		{
			typ: ")",
			column: 16,
			lexeme: ")",
		},
		{
			typ: ";",
			column: 17,
			lexeme: ";",
		},
	]);
});

Deno.test("Expect correct syntax error", () => {
	const input = "XIC;";

	const tokens = scanner.scan(input);

	assertEquals(tokens.unwrapErr(), [{
		error: "Expected '(' after instruction",
		startColumn: 3,
		endColumn: 3,
	}]);
});

Deno.test("Expect correct syntax error", () => {
	const input = "XIC(;";

	const tokens = scanner.scan(input);

	assertEquals(tokens.unwrapErr(), [
		{
			endColumn: 4,
			error: "Unexpected token ';'!",
			startColumn: 4,
		},
		{
			endColumn: 5,
			error: "Unfinished params",
			startColumn: 4,
		},
	]);
});

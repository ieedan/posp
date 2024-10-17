import * as s from "./src/scanner/index.ts";
import * as p from "./src/parser/index.ts";
import * as highlight from "./src/highlight/index.ts";
import { toString } from "./src/utils/ast.ts";

if (import.meta.main) {
	const scanner = s.new();

	const fileText = await Deno.readTextFileSync("./test.txt");

	const code = fileText;

	const [tokens, errors] = scanner.scan(code);

	if (errors != null) {
		console.log(errors);
		Deno.exit(1);
	}

	console.log("");
	console.log(highlight.terminal(tokens));
	console.log("");

	const parser = p.new();

	const rungs = parser.parse(tokens);

	console.log("");
	console.log(JSON.stringify(rungs, null, 2));
	console.log("");

	const display = toString(rungs);

	for (const rung of display) {
		console.log(rung);
		console.log("");
	}
}

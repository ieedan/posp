import * as s from "./src/scanner/index.ts";
import * as p from "./src/parser/index.ts";
import * as logixAnalyzer from "./src/analyzers/instruction-analyzer.ts";
import * as highlight from "./src/highlight/index.ts";

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

	const analzyerErrors = logixAnalyzer.analyze(rungs);

	console.log(JSON.stringify(analzyerErrors, null, 2));
}

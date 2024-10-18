import * as s from "./src/scanner/index.ts";
import * as p from "./src/parser/index.ts";
import * as logixAnalyzer from "./src/analyzers/instruction-analyzer.ts";
import * as highlight from "./src/highlight/index.ts";
import { stopwatch } from "./src/blocks/stopwatch.ts";

if (import.meta.main) {
	const w = stopwatch();

	w.start();

	const scanner = s.new();

	const fileText = Deno.readTextFileSync("./test.txt");

	const code = fileText;

	const scanResult = scanner.scan(code);

	if (scanResult.isErr()) {
		console.log(scanResult.unwrapErr());
		Deno.exit(1);
	}

	const tokens = scanResult.unwrap();

	// console.log("");
	// console.log(highlight.terminal(tokens));
	// console.log("");

	const parser = p.new();

	const rungs = parser.parse(tokens);

	const analyzerErrors = logixAnalyzer.analyze(rungs);

	const time = w.elapsed();

	if (parser.errors) {
		console.log("parser errors: ", parser.errors);
	}

	// display after time

	console.log("");
	console.log(highlight.terminal(tokens));
	console.log("");

	// console.log("");
	// console.log(JSON.stringify(tokens, null, 2));
	// console.log("");

	// console.log("");
	// console.log(JSON.stringify(rungs, null, 2));
	// console.log("");

	if (analyzerErrors) {
		for (const error of analyzerErrors) {
			console.log(logixAnalyzer.formatObservation(error));
		}
	}

	console.log(`Done in ${time}ms`);
}

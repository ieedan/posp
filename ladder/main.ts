import * as s from "./src/scanner/index.ts";
import * as p from "./src/parser/index.ts";
import * as logixAnalyzer from "./src/analyzers/instruction-analyzer.ts";
import * as highlight from "./src/highlight/index.ts";
import { watch } from "./src/utils/watch.ts";

if (import.meta.main) {
	const w = watch();

	w.start();

	const scanner = s.new();

	const fileText = await Deno.readTextFileSync("./test.txt");

	const code = fileText;

	const [tokens, errors] = scanner.scan(code);

	if (errors != null) {
		console.log(errors);
		Deno.exit(1);
	}

	const parser = p.new();

	const rungs = parser.parse(tokens);

	const analyzerErrors = logixAnalyzer.analyze(rungs);

	const time = w.elapsed();

	// display after time

	console.log("");
	console.log(highlight.terminal(tokens));
	console.log("");

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

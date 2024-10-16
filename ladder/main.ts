import * as s from "./src/scanner/index.ts";
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
}

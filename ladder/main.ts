import * as s from "./src/scanner/index.ts";
import * as highlight from "./src/highlight/index.ts";

if (import.meta.main) {
	const scanner = s.new();

	const code =
		"EQU('twenty','four')EQU(MainSeq,0)[MOV(-10,MainSeq),OTL(GetCycleTime)];   ";

	const [tokens, errors] = scanner.scan(code);

	if (errors != null) {
		console.log(errors);
		Deno.exit(1);
	}

	console.log("");
	console.log(highlight.terminal(tokens));
	console.log("");
}

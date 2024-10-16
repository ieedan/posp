import * as s from "./src/scanner/index.ts";
import * as highlight from "./src/highlight/index.ts";

if (import.meta.main) {
	const scanner = s.new();

	const code =
		"[GSV(Module,WAGO,EntryStatus,stsComm[0]),DIV(stsComm[0],4095,stsCommResult[0]),EQU(stsCommResult[0],4)OTE(stsEnetOk.0)];   ";

	const [tokens, errors] = scanner.scan(code);

	if (errors != null) {
		console.log(errors);
		Deno.exit(1);
	}

	console.log("");
	console.log(highlight.terminal(tokens));
	console.log("");
}

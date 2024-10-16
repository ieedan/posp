import * as s from "./src/scanner/index.ts";
import * as highlight from "./src/highlight/index.ts";

if (import.meta.main) {
	const scanner = s.new();

	const code =
		"[MOV(\\Barcode.str_BuildCode,WeintekBuildCode[0]),MOV(\\Barcode.str_SerialNumber,WeintekSerialNumber[0])];   ";

	const [tokens, errors] = scanner.scan(code);

	if (errors != null) {
		console.log(errors);
		Deno.exit(1);
	}

	console.log("");
	console.log(highlight.terminal(tokens));
	console.log("");
}

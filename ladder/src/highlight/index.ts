import { EXPRESSION_KEYWORDS, type Token } from "../scanner/tokens.ts";
import color from "chalk";

const terminal = (tokens: Token[]): string => {
	let result = "";

	for (const token of tokens) {
		switch (token.typ) {
			case "string":
				result += color.green(token.lexeme);
				break;
			case "number":
				result += color.yellow(token.lexeme);
				break;
			case "instruction":
				result += color.blueBright(token.lexeme);
				break;
			case "tag":
				result += color.blue(token.lexeme);
				break;
			case "(":
				result += color.yellowBright(token.lexeme);
				break;
			case ")":
				result += color.yellowBright(token.lexeme);
				break;
			case ";":
				result += color.gray(token.lexeme) + "\n";
				break;
			default:
				// @ts-ignore we must do this check
				if (EXPRESSION_KEYWORDS.includes(token.typ)) {
					result += color.blueBright(token.lexeme);
				} else {
					result += color.gray(token.lexeme);
				}

				break;
		}
	}

	return result;
};

export { terminal };

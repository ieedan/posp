import type { Token } from "../scanner/tokens.ts";

type Parser = {
	parse: (tokens: Token[]) => any;
};

const newParser = (): Parser => {
	const parse = () => {};

	return {
		parse,
	};
};

export { newParser as new };

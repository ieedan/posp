import type { Token } from "../tokens/index.ts";

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

export const is_digit = (char: string) => char >= '0' && char <= '9';

export const is_alpha = (char: string) =>
	(char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');

export const is_alphanumeric = (char: string) => is_alpha(char) || is_digit(char) || char == "_";
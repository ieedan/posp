const isNumber = (num: unknown): boolean => {
	if (typeof num === "number") {
		return num - num === 0;
	}
	if (typeof num === "string" && num.trim() !== "") {
		return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
	}
	return false;
};

const ALPHA_REGEX = /[a-z]/i;

/** Tests if a string is a letter
 *
 * 	```ts
 * 	/[a-z]/i.test(str)
 *  ```
 *
 * @param str
 * @returns
 */
const isAlpha = (str: string) => {
	return ALPHA_REGEX.test(str);
};

const ALPHA_NUMERIC = /[a-z0-9]/i;

/** Tests if a string is a letter
 *
 * 	```ts
 * 	/[a-z]/i.test(str)
 *  ```
 *
 * @param str
 * @returns
 */
const isAlphaNumeric = (str: string) => {
	return ALPHA_NUMERIC.test(str);
};

const TAG_BODY_REGEX = /[a-z_0-9.\[\]:]/i;

const isValidForTagBody = (str: string) => {
	return TAG_BODY_REGEX.test(str);
};

const IDENTIFIER_BODY_REGEX = /[a-z_0-9.\[\]]/i;

const isValidForIdentifierBody = (str: string) => {
	return IDENTIFIER_BODY_REGEX.test(str);
};

export {
	isAlpha,
	isAlphaNumeric,
	isNumber,
	isValidForIdentifierBody,
	isValidForTagBody,
};

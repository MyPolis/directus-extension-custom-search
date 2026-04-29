import type {JSONValue} from "../types/index.js";

function replacePlaceholders(value: string, searchTerm: string): JSONValue {
	if (value === "-1") {
		const result = +searchTerm;
		return isNaN(result) ? value : result;
	}

	if (
		!value.includes("$SEARCH_WILDCARD") &&
		!value.includes("$SEARCH_UPPERCASE") &&
		!value.includes("$SEARCH_LOWERCASE") &&
		!value.includes("$SEARCH")
	) {
		return value;
	}

	const wildcardVal = searchTerm ? `*${searchTerm}*` : "";

	let result = value;
	result = result.replaceAll("$SEARCH_WILDCARD", wildcardVal);
	result = result.replaceAll("$SEARCH_UPPERCASE", searchTerm.toUpperCase());
	result = result.replaceAll("$SEARCH_LOWERCASE", searchTerm.toLowerCase());
	result = result.replaceAll("$SEARCH", searchTerm);

	return result;
}

export function recursivelyReplaceString(
	value: JSONValue,
	searchTerm: string
): JSONValue {
	if (value === null || value === undefined) return value;

	if (Array.isArray(value)) {
		return value.map((item) => recursivelyReplaceString(item, searchTerm));
	}

	if (typeof value === "object") {
		const result: Record<string, JSONValue> = {};
		for (const key in value) {
			result[key] = recursivelyReplaceString(
				(value as Record<string, JSONValue>)[key],
				searchTerm
			);
		}
		return result;
	}

	if (typeof value === "string") {
		return replacePlaceholders(value, searchTerm);
	}

	return value;
}

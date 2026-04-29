import type {JSONValue} from "../types/index.js";

const OPERATOR_NEGATION_MAP: Record<string, string> = {
	_contains: "_ncontains",
	_icontains: "_nicontains",
	_eq: "_neq",
	_in: "_nin",
	_starts_with: "_nstarts_with",
	_istarts_with: "_nistarts_with",
	_ends_with: "_nends_with",
	_iends_with: "_niends_with",
};

export function flipContainsOperators(filter: JSONValue): JSONValue {
	if (filter === null || filter === undefined) return filter;

	if (Array.isArray(filter)) {
		return filter.map(flipContainsOperators);
	}

	if (typeof filter === "object") {
		const obj = filter as Record<string, unknown>;
		const result: Record<string, unknown> = {};

		for (const key in obj) {
			const negatedKey = OPERATOR_NEGATION_MAP[key] ?? key;
			const val = obj[key];

			if (typeof val === "object" && val !== null) {
				result[negatedKey] = flipContainsOperators(val as JSONValue);
			} else {
				result[negatedKey] = val;
			}
		}

		return result as JSONValue;
	}

	return filter;
}

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

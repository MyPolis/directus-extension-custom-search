import type { JSONValue, ReplaceFunction } from "../types/index.js";

export function recursivelyReplaceString(
  value: JSONValue,
  replaceFunc: ReplaceFunction,
): JSONValue {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => recursivelyReplaceString(item, replaceFunc));
  }

  if (typeof value === "object") {
    const result: Record<string, JSONValue> = {};
    for (const key in value) {
      result[key] = recursivelyReplaceString(
        (value as Record<string, JSONValue>)[key],
        replaceFunc,
      );
    }
    return result;
  }

  if (typeof value === "string") {
    if (value === "$SEARCH") return replaceFunc(value);
    if (value === "$SEARCH_LOWERCASE") return replaceFunc(value).toLowerCase();
    if (value === "$SEARCH_UPPERCASE") return replaceFunc(value).toUpperCase();
    if (value === "$SEARCH_WILDCARD") {
      const searchVal = replaceFunc("$SEARCH");
      return searchVal ? `*${searchVal}*` : "";
    }
    if (value === "-1") {
      const result = +replaceFunc("$SEARCH");
      return isNaN(result) ? value : result;
    }
  }

  return value;
}

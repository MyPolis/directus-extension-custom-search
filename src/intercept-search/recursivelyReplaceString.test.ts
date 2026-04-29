import {describe, test} from "node:test";
import assert from "node:assert";
import {
	flipContainsOperators,
	recursivelyReplaceString
} from "./recursivelyReplaceString.js";

describe("recursivelyReplaceString", () => {
	test("returns null and undefined unchanged", () => {
		assert.strictEqual(recursivelyReplaceString(null, "test"), null);
		assert.strictEqual(recursivelyReplaceString(undefined, "test"), undefined);
	});

	test("recursively processes arrays", () => {
		const result = recursivelyReplaceString(["$SEARCH", "hello"], "world");
		assert.deepStrictEqual(result, ["world", "hello"]);
	});

	test("recursively processes nested objects", () => {
		const input = {field: "$SEARCH", nested: {field: "$SEARCH_LOWERCASE"}};
		const result = recursivelyReplaceString(input, "Test");
		assert.deepStrictEqual(result, {
			field: "Test",
			nested: {field: "test"}
		});
	});

	test("replaces $SEARCH", () => {
		const result = recursivelyReplaceString("$SEARCH", "hello");
		assert.strictEqual(result, "hello");
	});

	test("replaces $SEARCH_LOWERCASE", () => {
		const result = recursivelyReplaceString("$SEARCH_LOWERCASE", "HELLO");
		assert.strictEqual(result, "hello");
	});

	test("replaces $SEARCH_UPPERCASE", () => {
		const result = recursivelyReplaceString("$SEARCH_UPPERCASE", "hello");
		assert.strictEqual(result, "HELLO");
	});

	test("replaces $SEARCH_WILDCARD", () => {
		const result = recursivelyReplaceString("$SEARCH_WILDCARD", "test");
		assert.strictEqual(result, "*test*");
	});

	test("returns empty string when $SEARCH_WILDCARD gets empty value", () => {
		const result = recursivelyReplaceString("$SEARCH_WILDCARD", "");
		assert.strictEqual(result, "");
	});

	test("converts -1 to number when replaced value is numeric", () => {
		const result = recursivelyReplaceString("-1", "123");
		assert.strictEqual(result, 123);
	});

	test("keeps -1 as string when replaced value is not numeric", () => {
		const result = recursivelyReplaceString("-1", "abc");
		assert.strictEqual(result, "-1");
	});

	test("passes through values that are not placeholders", () => {
		assert.strictEqual(recursivelyReplaceString("hello", "ignored"), "hello");
		assert.strictEqual(recursivelyReplaceString(42, "ignored"), 42);
		assert.strictEqual(recursivelyReplaceString(true, "ignored"), true);
	});

	test("replaces $SEARCH embedded wtesthin a larger string", () => {
		const result = recursivelyReplaceString("prefix_$SEARCH_suffix", "hello");
		assert.strictEqual(result, "prefix_hello_suffix");
	});

	test("replaces multiple $SEARCH occurrences in one string", () => {
		const result = recursivelyReplaceString("$SEARCH and $SEARCH", "hi");
		assert.strictEqual(result, "hi and hi");
	});

	test("replaces $SEARCH_LOWERCASE embedded in a string", () => {
		const result = recursivelyReplaceString(
			"email_$SEARCH_LOWERCASE@test.com",
			"USER"
		);
		assert.strictEqual(result, "email_user@test.com");
	});

	test("replaces $SEARCH_UPPERCASE embedded in a string", () => {
		const result = recursivelyReplaceString(
			"code_$SEARCH_UPPERCASE_prefix",
			"abc"
		);
		assert.strictEqual(result, "code_ABC_prefix");
	});

	test("replaces $SEARCH_WILDCARD embedded in a string", () => {
		const result = recursivelyReplaceString("like %$SEARCH_WILDCARD%", "foo");
		assert.strictEqual(result, "like %*foo*%");
	});

	test("mixes multiple placeholder types in one string", () => {
		const result = recursivelyReplaceString(
			"$SEARCH / $SEARCH_LOWERCASE / $SEARCH_UPPERCASE",
			"Hi"
		);
		assert.strictEqual(result, "Hi / hi / HI");
	});

	test("passes through strings without placeholders (no unnecessary processing)", () => {
		const result = recursivelyReplaceString("regular_field_value", "test");
		assert.strictEqual(result, "regular_field_value");
	});
});

describe("flipContainsOperators", () => {
	test("returns null and undefined unchanged", () => {
		assert.strictEqual(flipContainsOperators(null), null);
		assert.strictEqual(flipContainsOperators(undefined), undefined);
	});

	test("passes through numbers, booleans, strings", () => {
		assert.strictEqual(flipContainsOperators(42), 42);
		assert.strictEqual(flipContainsOperators(true), true);
		assert.strictEqual(flipContainsOperators("hello"), "hello");
	});

	test("flips _contains to _ncontains", () => {
		const input = {title: {_contains: "draft"}};
		assert.deepStrictEqual(flipContainsOperators(input), {
			title: {_ncontains: "draft"}
		});
	});

	test("flips _icontains to _nicontains", () => {
		const input = {slug: {_icontains: "spam"}};
		assert.deepStrictEqual(flipContainsOperators(input), {
			slug: {_nicontains: "spam"}
		});
	});

	test("flips _eq to _neq", () => {
		const input = {status: {_eq: "draft"}};
		assert.deepStrictEqual(flipContainsOperators(input), {
			status: {_neq: "draft"}
		});
	});

	test("flips _in to _nin", () => {
		const input = {category: {_in: ["a", "b"]}};
		assert.deepStrictEqual(flipContainsOperators(input), {
			category: {_nin: ["a", "b"]}
		});
	});

	test("recursively flips operators in nested structures", () => {
		const input = {
			_and: [{title: {_contains: "x"}}, {status: {_eq: "published"}}]
		};
		assert.deepStrictEqual(flipContainsOperators(input), {
			_and: [{title: {_ncontains: "x"}}, {status: {_neq: "published"}}]
		});
	});

	test("leaves non-operator keys unchanged", () => {
		const input = {title: "hello", nested: {value: 42}};
		assert.deepStrictEqual(flipContainsOperators(input), {
			title: "hello",
			nested: {value: 42}
		});
	});

	test("recursively processes arrays", () => {
		const input = [{_contains: "a"}, {_contains: "b"}];
		assert.deepStrictEqual(flipContainsOperators(input), [
			{_ncontains: "a"},
			{_ncontains: "b"}
		]);
	});
});

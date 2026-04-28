import { describe, it } from "node:test";
import assert from "node:assert";
import { recursivelyReplaceString } from "./recursivelyReplaceString.js";

describe("recursivelyReplaceString", () => {
  it("returns null and undefined unchanged", () => {
    assert.strictEqual(
      recursivelyReplaceString(null, () => "test"),
      null,
    );
    assert.strictEqual(
      recursivelyReplaceString(undefined, () => "test"),
      undefined,
    );
  });

  it("recursively processes arrays", () => {
    const result = recursivelyReplaceString(["$SEARCH", "hello"], (str) =>
      str.replace("$SEARCH", "world"),
    );
    assert.deepStrictEqual(result, ["world", "hello"]);
  });

  it("recursively processes nested objects", () => {
    const input = { field: "$SEARCH", nested: { field: "$SEARCH_LOWERCASE" } };
    const result = recursivelyReplaceString(input, (str) =>
      str.replace("$SEARCH", "Test"),
    );
    assert.deepStrictEqual(result, {
      field: "Test",
      nested: { field: "test_lowercase" },
    });
  });

  it("replaces $SEARCH", () => {
    const result = recursivelyReplaceString("$SEARCH", () => "hello");
    assert.strictEqual(result, "hello");
  });

  it("replaces $SEARCH_LOWERCASE", () => {
    const result = recursivelyReplaceString("$SEARCH_LOWERCASE", () => "HELLO");
    assert.strictEqual(result, "hello");
  });

  it("replaces $SEARCH_UPPERCASE", () => {
    const result = recursivelyReplaceString("$SEARCH_UPPERCASE", () => "hello");
    assert.strictEqual(result, "HELLO");
  });

  it("replaces $SEARCH_WILDCARD", () => {
    const result = recursivelyReplaceString("$SEARCH_WILDCARD", () => "test");
    assert.strictEqual(result, "*test*");
  });

  it("returns empty string when $SEARCH_WILDCARD gets empty value", () => {
    const result = recursivelyReplaceString("$SEARCH_WILDCARD", () => "");
    assert.strictEqual(result, "");
  });

  it("converts -1 to number when replaced value is numeric", () => {
    const result = recursivelyReplaceString("-1", () => "123");
    assert.strictEqual(result, 123);
  });

  it("keeps -1 as string when replaced value is not numeric", () => {
    const result = recursivelyReplaceString("-1", () => "abc");
    assert.strictEqual(result, "-1");
  });

  it("passes through values that are not placeholders", () => {
    assert.strictEqual(
      recursivelyReplaceString("hello", () => "ignored"),
      "hello",
    );
    assert.strictEqual(
      recursivelyReplaceString(42, () => "ignored"),
      42,
    );
    assert.strictEqual(
      recursivelyReplaceString(true, () => "ignored"),
      true,
    );
  });
});

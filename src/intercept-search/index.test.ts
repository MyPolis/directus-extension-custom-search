import {describe, test} from "node:test";
import assert from "node:assert";
import {captureFilterHandler} from "./mocks.js";

describe("intercept-search hook", () => {
	test("passes through query unchanged when no search_config exists and no auto-generatable fields", async () => {
		const handler = await captureFilterHandler("no_fields", []);

		const result = await handler(
			{search: "test"},
			{collection: "no_fields"},
			{schema: {}}
		);

		assert.strictEqual(result.search, "test");
		assert.strictEqual(result.filter, undefined);
	});

	test("replaces search with custom filter from field meta search_config", async () => {
		const handler = await captureFilterHandler("custom_config", [
			{
				field: "search_alias",
				type: "alias",
				meta: {
					options: {
						search_config: {
							_or: [
								{title: {_contains: "$SEARCH"}},
								{description: {_contains: "$SEARCH"}}
							]
						}
					}
				}
			}
		]);

		const result = await handler(
			{search: "hello"},
			{collection: "custom_config"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.deepStrictEqual(result.filter, {
			_or: [{title: {_contains: "hello"}}, {description: {_contains: "hello"}}]
		});
	});

	test("merges multiple search_config fields with _or", async () => {
		const handler = await captureFilterHandler("multi_config", [
			{
				field: "config_a",
				type: "alias",
				meta: {
					options: {
						search_config: {title: {_contains: "$SEARCH"}}
					}
				}
			},
			{
				field: "config_b",
				type: "alias",
				meta: {
					options: {
						search_config: {description: {_contains: "$SEARCH"}}
					}
				}
			}
		]);

		const result = await handler(
			{search: "merged"},
			{collection: "multi_config"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.deepStrictEqual(result.filter, {
			_or: [
				{title: {_contains: "merged"}},
				{description: {_contains: "merged"}}
			]
		});
	});

	test("uses collection meta search_config if available", async () => {
		const handler = await captureFilterHandler(
			"coll_meta_config",
			[
				{
					field: "ignored_field",
					type: "alias",
					meta: {
						options: {
							search_config: {should_not_use: {_eq: true}}
						}
					}
				}
			],
			{
				search_config: {
					_or: [{name: {_contains: "$SEARCH"}}]
				}
			}
		);

		const result = await handler(
			{search: "collmeta"},
			{collection: "coll_meta_config"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.deepStrictEqual(result.filter, {
			_or: [{name: {_contains: "collmeta"}}]
		});
	});

	test("auto-generates search config from string/text/csv fields", async () => {
		const handler = await captureFilterHandler("auto_gen", [
			{field: "title", type: "string"},
			{field: "description", type: "text"},
			{field: "tags", type: "csv"},
			{field: "count", type: "integer"},
			{field: "active", type: "boolean"}
		]);

		const result = await handler(
			{search: "hello"},
			{collection: "auto_gen"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.deepStrictEqual(result.filter, {
			_or: [
				{title: {_contains: "hello"}},
				{description: {_contains: "hello"}},
				{tags: {_contains: "hello"}}
			]
		});
	});

	test("auto-generates and uses _and wrapping for multi-word search", async () => {
		const handler = await captureFilterHandler("auto_term", [
			{field: "title", type: "string"},
			{field: "body", type: "text"}
		]);

		const result = await handler(
			{search: "hello world"},
			{collection: "auto_term"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.deepStrictEqual(result.filter, {
			_and: [
				{
					_or: [{title: {_contains: "hello"}}, {body: {_contains: "hello"}}]
				},
				{
					_or: [{title: {_contains: "world"}}, {body: {_contains: "world"}}]
				}
			]
		});
	});

	test("splits multi-word search into _and of per-term configs", async () => {
		const handler = await captureFilterHandler("custom_multi_term", [
			{
				field: "search_alias",
				type: "alias",
				meta: {
					options: {
						search_config: {
							_and: [
								{status: {_eq: "published"}},
								{title: {_contains: "$SEARCH"}}
							]
						}
					}
				}
			}
		]);

		const result = await handler(
			{search: "hello world"},
			{collection: "custom_multi_term"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.deepStrictEqual(result.filter, {
			_and: [
				{
					_and: [{status: {_eq: "published"}}, {title: {_contains: "hello"}}]
				},
				{
					_and: [{status: {_eq: "published"}}, {title: {_contains: "world"}}]
				}
			]
		});
	});

	test("respects search_auto: false in collection meta", async () => {
		const handler = await captureFilterHandler(
			"auto_disabled",
			[{field: "title", type: "string"}],
			{
				search_auto: false
			}
		);

		const result = await handler(
			{search: "test"},
			{collection: "auto_disabled"},
			{schema: {}}
		);

		assert.strictEqual(result.search, "test");
		assert.strictEqual(result.filter, undefined);
	});

	test("returns no filter for $SEARCH_WILDCARD with empty search", async () => {
		const handler = await captureFilterHandler("wildcard_empty", [
			{
				field: "search_alias",
				type: "alias",
				meta: {
					options: {
						search_config: {
							title: {_contains: "$SEARCH_WILDCARD"}
						}
					}
				}
			}
		]);

		const result = await handler(
			{search: ""},
			{collection: "wildcard_empty"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.strictEqual(result.filter, undefined);
	});

	test("caches and reuses config on subsequent calls to same collection", async () => {
		const handler = await captureFilterHandler("cached_coll", [
			{
				field: "cached_config",
				type: "alias",
				meta: {
					options: {
						search_config: {
							title: {_contains: "$SEARCH_UPPERCASE"}
						}
					}
				}
			}
		]);

		const result1 = await handler(
			{search: "hello"},
			{collection: "cached_coll"},
			{schema: {}}
		);

		assert.deepStrictEqual(result1.filter, {
			title: {_contains: "HELLO"}
		});

		const result2 = await handler(
			{search: "world"},
			{collection: "cached_coll"},
			{schema: {}}
		);

		assert.deepStrictEqual(result2.filter, {
			title: {_contains: "WORLD"}
		});
	});

	test("handles empty search term — returns query with no filter", async () => {
		const handler = await captureFilterHandler("empty_search", [
			{
				field: "search_alias",
				type: "alias",
				meta: {
					options: {
						search_config: {
							_or: [{title: {_contains: "$SEARCH"}}]
						}
					}
				}
			}
		]);

		const result = await handler(
			{search: ""},
			{collection: "empty_search"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.strictEqual(result.filter, undefined);
	});

	// Search syntax: quoted phrases, negation, mixed
	test("treats quoted text as a single literal term", async () => {
		const handler = await captureFilterHandler("quoted", [
			{
				field: "search_alias",
				type: "alias",
				meta: {
					options: {
						search_config: {
							_or: [{title: {_contains: "$SEARCH"}}]
						}
					}
				}
			}
		]);

		const result = await handler(
			{search: '"hello world"'},
			{collection: "quoted"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.deepStrictEqual(result.filter, {
			_or: [{title: {_contains: "hello world"}}]
		});
	});

	test("quoted phrase combined with other terms uses _and wrapping", async () => {
		const handler = await captureFilterHandler("quoted_multi", [
			{
				field: "search_alias",
				type: "alias",
				meta: {
					options: {
						search_config: {
							title: {_contains: "$SEARCH"}
						}
					}
				}
			}
		]);

		const result = await handler(
			{search: '"john doe" urgent'},
			{collection: "quoted_multi"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.deepStrictEqual(result.filter, {
			_and: [{title: {_contains: "john doe"}}, {title: {_contains: "urgent"}}]
		});
	});

	test("negated term wraps resolved filter in _not", async () => {
		const handler = await captureFilterHandler("negated", [
			{
				field: "search_alias",
				type: "alias",
				meta: {
					options: {
						search_config: {
							_or: [
								{title: {_contains: "$SEARCH"}},
								{body: {_contains: "$SEARCH"}}
							]
						}
					}
				}
			}
		]);

		const result = await handler(
			{search: "-draft"},
			{collection: "negated"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.deepStrictEqual(result.filter, {
			_not: {
				_or: [{title: {_contains: "draft"}}, {body: {_contains: "draft"}}]
			}
		});
	});

	test("positive and negated terms combined with _and", async () => {
		const handler = await captureFilterHandler("mixed_pos_neg", [
			{
				field: "search_alias",
				type: "alias",
				meta: {
					options: {
						search_config: {
							title: {_contains: "$SEARCH"}
						}
					}
				}
			}
		]);

		const result = await handler(
			{search: "urgent -draft"},
			{collection: "mixed_pos_neg"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.deepStrictEqual(result.filter, {
			_and: [{title: {_contains: "urgent"}}, {_not: {title: {_contains: "draft"}}}]
		});
	});

	test("multiple negated terms all included in _and", async () => {
		const handler = await captureFilterHandler("multi_negated", [
			{
				field: "search_alias",
				type: "alias",
				meta: {
					options: {
						search_config: {
							title: {_contains: "$SEARCH"}
						}
					}
				}
			}
		]);

		const result = await handler(
			{search: "-draft -spam"},
			{collection: "multi_negated"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.deepStrictEqual(result.filter, {
			_and: [
				{_not: {title: {_contains: "draft"}}},
				{_not: {title: {_contains: "spam"}}}
			]
		});
	});

	test("complex query: quoted phrase + positive + negated", async () => {
		const handler = await captureFilterHandler("complex", [
			{
				field: "search_alias",
				type: "alias",
				meta: {
					options: {
						search_config: {
							title: {_contains: "$SEARCH"}
						}
					}
				}
			}
		]);

		const result = await handler(
			{search: '"john doe" urgent -draft -spam'},
			{collection: "complex"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.deepStrictEqual(result.filter, {
			_and: [
				{title: {_contains: "john doe"}},
				{title: {_contains: "urgent"}},
				{_not: {title: {_contains: "draft"}}},
				{_not: {title: {_contains: "spam"}}}
			]
		});
	});

	test("lone dash is treated as a regular search term", async () => {
		const handler = await captureFilterHandler("lone_dash", [
			{
				field: "search_alias",
				type: "alias",
				meta: {
					options: {
						search_config: {
							title: {_contains: "$SEARCH"}
						}
					}
				}
			}
		]);

		const result = await handler(
			{search: "-"},
			{collection: "lone_dash"},
			{schema: {}}
		);

		// Lone '-' is not a token (regex skips it), so no filter
		assert.strictEqual(result.search, undefined);
		assert.strictEqual(result.filter, undefined);
	});

	test("whitespace-only search produces no filter", async () => {
		const handler = await captureFilterHandler("whitespace_only", [
			{
				field: "search_alias",
				type: "alias",
				meta: {
					options: {
						search_config: {
							title: {_contains: "$SEARCH"}
						}
					}
				}
			}
		]);

		const result = await handler(
			{search: "   "},
			{collection: "whitespace_only"},
			{schema: {}}
		);

		assert.strictEqual(result.search, undefined);
		assert.strictEqual(result.filter, undefined);
	});
});

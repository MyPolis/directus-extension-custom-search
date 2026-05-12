# Custom Search for Directus

> **Acknowledgement:** This extension is inspired by and based on [cmiteam/directus-extension-custom-search](https://github.com/cmiteam/directus-extension-custom-search). The original MIT license is retained in [LICENSE](./LICENSE).

Overrides the built-in Directus search system with configurable filters per collection. Supports AND/OR groups, case variants, wildcard matching, relational/nested field search, and a search syntax with quoted phrases, and automatic AND-based term splitting.

## Search Syntax

The search box supports a simple syntax for precise queries:

| Syntax           | Example      | Behavior                                      |
| ---------------- | ------------ | --------------------------------------------- |
| `word`           | `hello`      | Matches the term                              |
| `"exact phrase"` | `"john doe"` | Treats quoted text as a literal, unsplit term |

Multiple terms are **ANDed** together — all must match for a result to appear.

For a config:

```json
{
	"search_config": {
		"_or": [
			{"title": {"_contains": "$SEARCH"}},
			{"description": {"_contains": "$SEARCH"}}
		]
	}
}
```

Searching `"john doe" urgent` generates:

```json
{
	"_and": [
		{
			"_or": [
				{"title": {"_contains": "john doe"}},
				{"description": {"_contains": "john doe"}}
			]
		},
		{
			"_or": [
				{"title": {"_contains": "urgent"}},
				{"description": {"_contains": "urgent"}}
			]
		}
	]
}
```

## Quick Start

1. Add an **alias** field to your collection (Data Model → your collection → Create Field → type: `alias`).
2. Assign the **Configure Search** interface to that field.
3. Build your filter using the filter builder. Use placeholders where the user's search term should go.
4. Save and search from the collection's content page or API.

No alias field needed if you store the `search_config` in the **collection's meta** (see Collection Meta below).

## Placeholders

Placeholders can be used as **standalone values** or **embedded within larger strings** (e.g. `"prefix_$SEARCH_suffix"`). When multiple placeholders appear in the same string, they are resolved independently.

| Placeholder         | Behavior                   | Search `"Hi"` produces |
| ------------------- | -------------------------- | ---------------------- |
| `$SEARCH`           | Raw search term, verbatim  | `Hi`                   |
| `$SEARCH_LOWERCASE` | Lowercased search term     | `hi`                   |
| `$SEARCH_UPPERCASE` | Uppercased search term     | `HI`                   |
| `$SEARCH_WILDCARD`  | Wrapped with `*` wildcards | `*Hi*`                 |

`$SEARCH_WILDCARD` returns `""` (empty string) when the search is empty, so filters like `{ "_contains": "$SEARCH_WILDCARD" }` safely match nothing.

## Example Configurations

### Basic full-text search with status filter

```json
{
	"search_config": {
		"_and": [
			{"status": {"_eq": "published"}},
			{
				"_or": [
					{"title": {"_contains": "$SEARCH"}},
					{"body": {"_contains": "$SEARCH"}},
					{"slug": {"_icontains": "$SEARCH_LOWERCASE"}}
				]
			}
		]
	}
}
```

### Search across a relational (M2O) field

```json
{
	"search_config": {
		"_or": [
			{"title": {"_contains": "$SEARCH"}},
			{
				"category": {
					"name": {"_contains": "$SEARCH"}
				}
			}
		]
	}
}
```

### Exact match on a code field + wildcard on names

```json
{
	"search_config": {
		"_or": [
			{"code": {"_eq": "$SEARCH_UPPERCASE"}},
			{"display_name": {"_contains": "$SEARCH_WILDCARD"}}
		]
	}
}
```

## Collection Meta (Alternative Setup)

Instead of creating an alias field, you can store the `search_config` directly on the collection's **meta** object. The extension reads `collection.meta.search_config` first, falling back to field `meta.options.search_config` if not set.

Place this in the collection's meta JSON (via Directus settings or database):

```json
{
	"search_config": {
		"_or": [
			{"title": {"_contains": "$SEARCH"}},
			{"description": {"_contains": "$SEARCH"}}
		]
	}
}
```

## Automatic Fallback

If **no** `search_config` is found (neither in collection meta nor on any field), the extension **auto-generates** a `_or` filter across all `string`, `text`, and `csv` fields in the collection.

This means collections get multi-word search **without any setup**.

To **opt-out** of auto-generation for a collection, set on the collection meta:

```json
{"search_auto": false}
```

When `search_auto` is `false`, the collection's built-in Directus search is left intact (query passes through unchanged).

## Multiple Search Configs

You can place the `Configure Search` interface on **multiple alias fields** in the same collection. All found configs are merged with `_or`, so each config acts as an independent search scope.

## Caching

Per-collection search configs are cached in memory for 5 minutes to avoid repeated schema reads on every API request. The cache is invalidated on server restart or after the TTL expires.

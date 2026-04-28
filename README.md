# Search Configuration for Directus

Provides a way to configure the Directus search filters for a collection. This allows you to supercharge your Directus `search` field with AND/OR groups, strict equality, case-insensitive searches, and nested relational searches - fully under your control.

# Usage

## Basic Setup

1. Add a new field in the collection you wish to add search configuration for.

2. Assign the `Configure Search` interface to the field.

3. Configure your filter using the `system-filter` interface options.

## Placeholders

The following placeholders are supported in your search filter configuration:

| Placeholder         | Description            | Example               |
| ------------------- | ---------------------- | --------------------- |
| `$SEARCH`           | Raw search term        | `widget` → `widget`   |
| `$SEARCH_LOWERCASE` | Lowercased search term | `Widget` → `widget`   |
| `$SEARCH_UPPERCASE` | Uppercased search term | `widget` → `WIDGET`   |
| `$SEARCH_WILDCARD`  | Wrapped with wildcards | `widget` → `*widget*` |

## Example Configuration

```json
{
  "search_config": {
    "_and": [
      { "status": { "_eq": "published" } },
      { "deleted_at": { "_null": true } }
    ]
  }
}
```

Search the collection. Both app and API searches will now use the filter pattern you've specified. You can use nested relational fields for the search.

![](./assets/screenshots/search-config.png)
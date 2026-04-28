import type {
  JSONValue,
  Preset,
  SearchConfig,
  FieldMeta,
  SchemaContext,
  Services,
  ReplaceFunction,
  QueryParams,
} from "../types/index.js";

function recursivelyReplaceString(
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

function applyPresets(
  queryFilter: Record<string, unknown> | undefined,
  presetFilters: Record<string, unknown>[],
): Record<string, unknown> {
  if (!presetFilters.length) return queryFilter ?? {};

  const andConditions = queryFilter
    ? [queryFilter, ...presetFilters]
    : presetFilters;

  return { _and: andConditions };
}

type FilterHandler = (
  query: {
    search?: string;
    filter?: Record<string, unknown>;
    filters?: string;
  },
  context: { collection: string },
  extra: SchemaContext,
) => Promise<QueryParams>;

export default (
  { filter }: { filter: (event: string, handler: FilterHandler) => void },
  { services }: { services: Services },
) => {
  filter(
    "items.query",
    async (
      query: {
        search?: string;
        filter?: Record<string, unknown>;
        filters?: string;
      },
      { collection }: { collection: string },
      context: SchemaContext,
    ) => {
      const fieldsService = new services.FieldsService({
        schema: context?.schema,
        accountability: { admin: true, roles: [] },
      });

      let searchConfig: SearchConfig | null = null;

      try {
        const collectionMeta = await fieldsService.readAll(collection, {
          limit: -1,
          fields: ["field", "meta.options"],
        });

        const searchConfigField = collectionMeta.find(
          (f: FieldMeta) =>
            f.meta &&
            f.meta.options &&
            typeof f.meta.options === "object" &&
            "search_config" in f.meta.options &&
            f.meta.options.search_config,
        );

        if (searchConfigField?.meta?.options) {
          searchConfig = searchConfigField.meta.options as SearchConfig;
        }
      } catch {
        return query;
      }

      if (!searchConfig) return query;

      const presetSlugs = query.filters
        ? query.filters.split(",").map((s) => s.trim())
        : [];

      const presetFilters = presetSlugs
        .map((slug) => {
          const preset = searchConfig!.presets?.find(
            (p: Preset) => p.slug === slug,
          );
          return preset?.filter;
        })
        .filter((f): f is Record<string, unknown> => f !== undefined);

      const searchFilter = recursivelyReplaceString(
        searchConfig.search_config as JSONValue,
        (entry) => entry.replace("$SEARCH", query.search || ""),
      );

      const { search: _search, ...restParams } = query;
      const modifiedQuery: QueryParams = { ...restParams };

      if (presetFilters.length) {
        const baseFilter = searchFilter ? { _and: [searchFilter] } : {};
        modifiedQuery.filter = applyPresets(baseFilter, presetFilters);
      } else if (searchFilter) {
        modifiedQuery.filter = searchFilter as Record<string, unknown>;
      }

      return modifiedQuery;
    },
  );
};

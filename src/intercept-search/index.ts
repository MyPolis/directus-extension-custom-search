import type {
  FieldMeta,
  JSONValue,
  QueryParams,
  SchemaContext,
  SearchConfig,
  Services,
} from "../types/index.js";
import { recursivelyReplaceString } from "./recursivelyReplaceString.js";

type FilterHandler = (
  query: {
    search?: string;
    filter?: Record<string, unknown>;
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

      const searchFilter = recursivelyReplaceString(
        searchConfig.search_config as JSONValue,
        (entry) => entry.replace("$SEARCH", query.search || ""),
      );

      const { search: _search, ...restParams } = query;
      const modifiedQuery: QueryParams = { ...restParams };

      if (searchFilter) {
        modifiedQuery.filter = searchFilter as Record<string, unknown>;
      }

      return modifiedQuery;
    },
  );
};

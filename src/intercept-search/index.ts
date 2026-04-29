import type {SandboxHookRegisterContext} from "directus:api";
import type {
	CollectionMeta,
	FieldMeta,
	JSONValue,
	QueryParams,
	SchemaContext,
	SearchConfig,
	Services
} from "../types/index.js";
import {recursivelyReplaceString} from "./recursivelyReplaceString.js";

const SEARCH_STRING_TYPES = new Set(["string", "text", "csv"]);

interface CacheEntry {
	config: SearchConfig | null;
	generatedAt: number;
}

const searchConfigCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

function getCachedConfig(collection: string): SearchConfig | null | undefined {
	const entry = searchConfigCache.get(collection);
	if (entry) {
		if (Date.now() - entry.generatedAt < CACHE_TTL) {
			return entry.config;
		}
		searchConfigCache.delete(collection);
	}
	return undefined;
}

function setCachedConfig(
	collection: string,
	config: SearchConfig | null
): void {
	searchConfigCache.set(collection, {config, generatedAt: Date.now()});
}

function isSearchConfigField(
	f: FieldMeta
): f is FieldMeta & {meta: {options: SearchConfig}} {
	return !!(
		f.meta &&
		f.meta.options &&
		typeof f.meta.options === "object" &&
		"search_config" in f.meta.options &&
		f.meta.options.search_config
	);
}

function isSearchAutoDisabled(meta: CollectionMeta): boolean {
	return meta.meta?.search_auto === false;
}

function hasCollectionSearchConfig(meta: CollectionMeta): boolean {
	return !!meta.meta?.search_config;
}

function generateAutoSearchConfig(fields: FieldMeta[]): SearchConfig | null {
	const stringFields = fields.filter(
		(f) => f.field && f.type && SEARCH_STRING_TYPES.has(f.type)
	);

	if (stringFields.length === 0) return null;

	return {
		search_config: {
			_or: stringFields.map((f) => ({
				[f.field!]: {_contains: "$SEARCH"}
			}))
		}
	};
}

interface ConfigResult {
	config: SearchConfig | null;
	autoDisabled: boolean;
}

async function findSearchConfig(
	services: Services,
	collection: string,
	context: SchemaContext
): Promise<ConfigResult> {
	const collectionsService = new services.CollectionsService({
		schema: context?.schema,
		accountability: {admin: true, roles: []}
	});

	const fieldsService = new services.FieldsService({
		schema: context?.schema,
		accountability: {admin: true, roles: []}
	});

	let autoDisabled = false;

	try {
		const collectionMeta = await collectionsService.readOne(collection);

		if (isSearchAutoDisabled(collectionMeta)) {
			autoDisabled = true;
		}

		if (
			hasCollectionSearchConfig(collectionMeta) &&
			collectionMeta.meta?.search_config
		) {
			return {
				config: {
					search_config: collectionMeta.meta.search_config as Record<
						string,
						unknown
					>
				},
				autoDisabled
			};
		}
	} catch {
		// CollectionsService not available or collection not found
		// Fall through to field-based config
	}

	try {
		const collectionMeta = await fieldsService.readAll(collection, {
			limit: -1,
			fields: ["field", "type", "meta.options"]
		});

		const searchConfigFields = collectionMeta.filter(isSearchConfigField);

		if (searchConfigFields.length === 1 && searchConfigFields[0]) {
			return {
				config: searchConfigFields[0].meta.options as SearchConfig,
				autoDisabled
			};
		}

		if (searchConfigFields.length > 1) {
			const merged = {
				_or: searchConfigFields.map(
					(f) => (f.meta.options as SearchConfig).search_config
				)
			};
			return {config: {search_config: merged}, autoDisabled};
		}
	} catch {
		// Schema read failure — can't determine config
		return {config: null, autoDisabled};
	}

	return {config: null, autoDisabled};
}

async function resolveSearchConfig(
	services: Services,
	collection: string,
	context: SchemaContext
): Promise<SearchConfig | null> {
	const cached = getCachedConfig(collection);
	if (cached !== undefined) return cached;

	const {config, autoDisabled} = await findSearchConfig(
		services,
		collection,
		context
	);

	if (config) {
		setCachedConfig(collection, config);
		return config;
	}

	if (autoDisabled) {
		setCachedConfig(collection, null);
		return null;
	}

	try {
		const fieldsService = new services.FieldsService({
			schema: context?.schema,
			accountability: {admin: true, roles: []}
		});

		const allFields = await fieldsService.readAll(collection, {
			limit: -1,
			fields: ["field", "type"]
		});

		const autoConfig = generateAutoSearchConfig(allFields);
		setCachedConfig(collection, autoConfig);
		return autoConfig;
	} catch {
		setCachedConfig(collection, null);
		return null;
	}
}

function tokenizeSearch(input: string): string[] {
	const tokens: string[] = [];

	const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(input)) !== null) {
		const token = match[1] ?? match[2] ?? match[3];
		if (token) tokens.push(token);
	}

	return tokens;
}

export default (
	{filter}: SandboxHookRegisterContext,
	{services}: {services: Services}
) => {
	filter(
		"items.query",
		async (
			query: {
				search?: string;
				filter?: Record<string, unknown>;
			},
			{collection}: {collection: string},
			context: SchemaContext
		) => {
			const searchConfig = await resolveSearchConfig(
				services,
				collection,
				context
			);

			if (!searchConfig) return query;

			const searchTerm = (query.search || "").trim();
			const terms = tokenizeSearch(searchTerm);

			const {search: _search, ...restParams} = query;
			const modifiedQuery: QueryParams = {...restParams};

			if (terms.length === 0) {
				return modifiedQuery;
			}

			const allFilters: Record<string, unknown>[] = [];

			for (const term of terms) {
				const filter = recursivelyReplaceString(
					searchConfig.search_config as JSONValue,
					term
				);
				if (filter) {
					allFilters.push(filter as Record<string, unknown>);
				}
			}

			if (allFilters.length === 1 && allFilters[0]) {
				modifiedQuery.filter = allFilters[0];
			} else if (allFilters.length > 1) {
				modifiedQuery.filter = {_and: allFilters};
			}

			return modifiedQuery;
		}
	);
};

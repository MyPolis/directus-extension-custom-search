type FilterHandler = (
	query: {search?: string; filter?: Record<string, unknown>},
	meta: {collection: string},
	context: {schema?: Record<string, unknown>}
) => Promise<{search?: string; filter?: Record<string, unknown>}>;

type FilterFn = (event: string, handler: FilterHandler) => void;

interface MockFieldMeta {
	field: string;
	type: string;
	meta?: {
		options?: {
			search_config?: Record<string, unknown>;
		};
	};
}

export function createMockFieldsService(fields: MockFieldMeta[]) {
	return class MockFieldsService {
		schema: unknown;
		accountability: {admin: true; roles: readonly string[]};
		private fields: MockFieldMeta[];

		constructor(options: {
			schema: unknown;
			accountability: {admin: true; roles: readonly string[]};
		}) {
			this.schema = options.schema;
			this.accountability = options.accountability;
			this.fields = fields;
		}

		async readAll() {
			return this.fields;
		}

		async readOne() {
			return this.fields[0];
		}
	};
}

export function createMockCollectionsService(meta?: Record<string, unknown>) {
	return class MockCollectionsService {
		schema: unknown;
		accountability: {admin: true; roles: readonly string[]};
		private meta: Record<string, unknown>;

		constructor(options: {
			schema: unknown;
			accountability: {admin: true; roles: readonly string[]};
		}) {
			this.schema = options.schema;
			this.accountability = options.accountability;
			this.meta = meta ?? {};
		}

		async readOne(_collection: string) {
			return {
				collection: _collection,
				meta: this.meta
			};
		}
	};
}

export async function captureFilterHandler(
	_collection: string,
	fields: MockFieldMeta[],
	collectionMeta?: Record<string, unknown>
): Promise<FilterHandler> {
	let capturedHandler: FilterHandler | undefined;

	const mockFilter: FilterFn = (_event, handler) => {
		capturedHandler = handler;
	};

	const mockServices = {
		FieldsService: createMockFieldsService(fields),
		CollectionsService: createMockCollectionsService(collectionMeta)
	};

	const hookModule = await import("./index.js");
	hookModule.default(
		{filter: mockFilter, action: () => {}},
		{
			services: mockServices as Parameters<
				typeof hookModule.default
			>[1]["services"]
		}
	);

	return capturedHandler!;
}

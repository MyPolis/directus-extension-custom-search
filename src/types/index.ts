export type JSONValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JSONValue[]
  | { [key: string]: JSONValue }

export interface SearchConfig {
  search_config: Record<string, unknown>
}

export interface FieldMeta {
  id?: number
  collection?: string
  field?: string
  meta?: {
    options?: SearchConfig | null
    interface?: string
    note?: string
  }
}

export interface SchemaContext {
  schema?: {
    collections?: Array<{
      collection: string
      fields?: Array<{ field: string; type: string }>
    }>
  }
}

export interface Services {
  FieldsService: new (options: {
    schema: SchemaContext['schema']
    accountability: { admin: true; roles: readonly string[] }
  }) => {
    readAll(
      collection: string,
      options?: { limit?: number; fields?: string[] },
    ): Promise<FieldMeta[]>
    readOne(collection: string, field: string): Promise<FieldMeta>
  }
}

export type ReplaceFunction = (placeholder: string) => string

export type RecursiveReplaceable = JSONValue

export interface QueryParams {
  search?: string
  filter?: Record<string, unknown>
  limit?: number
  offset?: number
}

export interface InterfaceField {
  field: string
  name: string
  type: string
  meta?: {
    interface?: string
    options?: Record<string, unknown>
    note?: string
  }
}
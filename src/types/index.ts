export type JSONValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JSONValue[]
  | { [key: string]: JSONValue }

export interface Preset {
  slug: string
  name: string
  icon: string
  filter: Record<string, unknown>
}

export interface SearchConfig {
  search_config: Record<string, unknown>
  presets?: Preset[]
  config_field?: string
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
  filters?: string
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

export type IconValue = (typeof ICON_OPTIONS)[number]['value']

export const ICON_OPTIONS = [
  { text: 'Check', value: 'check' },
  { text: 'X (Close)', value: 'x' },
  { text: 'Star', value: 'star' },
  { text: 'Heart', value: 'heart' },
  { text: 'Flag', value: 'flag' },
  { text: 'Bookmark', value: 'bookmark' },
  { text: 'Calendar', value: 'calendar' },
  { text: 'Clock', value: 'clock' },
  { text: 'User', value: 'user' },
  { text: 'Users', value: 'users' },
  { text: 'Folder', value: 'folder' },
  { text: 'File', value: 'file' },
  { text: 'Search', value: 'search' },
  { text: 'Filter', value: 'filter' },
  { text: 'Settings', value: 'settings' },
  { text: 'Info', value: 'info' },
  { text: 'Alert', value: 'alert' },
  { text: 'Published', value: 'published' },
  { text: 'Draft', value: 'draft' },
  { text: 'Archived', value: 'archive' },
  { text: 'Link', value: 'link' },
  { text: 'Unlink', value: 'unlink' },
  { text: 'Lock', value: 'lock' },
  { text: 'Unlock', value: 'unlock' },
] as const
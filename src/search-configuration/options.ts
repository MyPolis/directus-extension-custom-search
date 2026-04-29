interface ExtensionOptionsContext {
  collection: string | undefined;
  editing: string;
  field: Record<string, unknown>;
}

export const searchConfigurationOptions = (ctx: ExtensionOptionsContext) => {
  return [
    {
      field: "search_config",
      type: "json" as const,
      name: "Search Config",
      meta: {
        interface: "system-filter",
        width: "full" as const,
        options: {
          collectionName: ctx.collection ?? "",
          collectionRequired: true,
        },
        note: "$SEARCH, $SEARCH_LOWERCASE, $SEARCH_UPPERCASE, $SEARCH_WILDCARD placeholders supported",
      },
    },
  ];
};

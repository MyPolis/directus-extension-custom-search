export const searchConfigurationOptions = [
	{
		field: 'search_config',
		type: 'json',
		name: 'Search Config',
		meta: {
			interface: 'system-filter',
			width: 'full',
			options: {
				collectionName: '{{collection}}',
				collectionRequired: true,
			},
		},
	},
];
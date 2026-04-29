import { defineInterface } from "@directus/extensions-sdk";
import { searchConfigurationOptions } from "./options.ts";

export default defineInterface({
	id: "search-configuration",
	name: "Configure Search",
	icon: "search",
	description:
		"Override the Directus search system with custom filters and placeholders.",
	component: () => null,
	options: searchConfigurationOptions,
	hideLabel: true,
	hideLoader: true,
	types: ["alias"],
	localTypes: ["presentation"],
	group: "presentation",
});

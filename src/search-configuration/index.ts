import { defineInterface } from '@directus/extensions-sdk'
import OptionsComponent from './options.vue'

export default defineInterface({
  id: 'search-configuration',
  name: 'Configure Search',
  icon: 'search',
  description:
    'Override the Directus search system with custom filters, placeholders, and named filter presets for the relationship picker.',
  component: () => null,
  options: OptionsComponent as any,
  hideLabel: true,
  hideLoader: true,
  types: ['alias'],
  localTypes: ['presentation'],
  group: 'presentation',
})

<template>
  <div class="search-config">
    <v-form
      :modelValue="value"
      @update:modelValue="emit('input', $event)"
      :fields="searchConfigFields"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SearchConfig, InterfaceField } from '../types/index.js'

interface SearchConfigValue {
  search_config?: Record<string, unknown>
}

const props = defineProps<{ value?: SearchConfigValue }>()
const emit = defineEmits<{
  input: [value: SearchConfigValue]
}>()

const searchConfigFields = computed<InterfaceField[]>(() => [
  {
    field: 'search_config',
    name: 'Search Config',
    type: 'json',
    meta: {
      interface: 'system-filter',
      note: '$SEARCH, $SEARCH_LOWERCASE, $SEARCH_UPPERCASE, $SEARCH_WILDCARD placeholders supported',
    },
  },
])
</script>

<style scoped>
.search-config {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
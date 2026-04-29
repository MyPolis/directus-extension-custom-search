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

const props = defineProps<{
  value?: SearchConfigValue
  collection?: string
}>()
const emit = defineEmits<{
  input: [value: SearchConfigValue]
}>()

const collectionName = computed(() => props.collection ?? '')

const searchConfigFields = computed<InterfaceField[]>(() => [
  {
    field: 'search_config',
    name: 'Search Config',
    type: 'json',
    meta: {
      interface: 'system-filter',
      note: '$SEARCH, $SEARCH_LOWERCASE, $SEARCH_UPPERCASE, $SEARCH_WILDCARD placeholders supported',
      options: {
        collectionName: collectionName.value,
				collectionRequired: true
      },
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

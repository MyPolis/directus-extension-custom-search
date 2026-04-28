<template>
  <div class="search-config">
    <div class="config-section">
      <label class="section-label">Search Filter</label>
      <p class="section-note">
        Define the filter pattern to apply when searching. Use
        <code>$SEARCH</code> as a placeholder for the user's search term.
      </p>

      <div class="editor-wrapper">
        <textarea
          v-model="filterJson"
          class="json-editor"
          :class="{ 'has-error': jsonError }"
          placeholder='{ "_and": [{ "field": { "_contains": "$SEARCH" } }] }'
          spellcheck="false"
          @input="onInput"
        />
        <div v-if="jsonError" class="error-message">{{ jsonError }}</div>
      </div>

      <div class="helper-section">
        <div class="helper-title">Available Placeholders</div>
        <div class="placeholders">
          <code>$SEARCH</code> - Raw search term
          <code>$SEARCH_LOWERCASE</code> - Lowercased
          <code>$SEARCH_UPPERCASE</code> - Uppercased
          <code>$SEARCH_WILDCARD</code> - Wildcards (*term*)
        </div>
      </div>

      <div class="actions">
        <v-button @click="resetToTemplate" secondary small>
          Reset to Template
        </v-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface SearchConfigValue {
  search_config?: Record<string, unknown>
}

const props = defineProps<{
  value?: SearchConfigValue
}>()

const emit = defineEmits<{
  input: [value: SearchConfigValue]
}>()

const DEFAULT_TEMPLATE = {
  _and: [
    { title: { _contains: '$SEARCH' } }
  ]
}

const filterJson = ref('')
const jsonError = ref<string | null>(null)

const parsedFilter = computed<Record<string, unknown> | null>(() => {
  if (!filterJson.value.trim()) return null
  try {
    return JSON.parse(filterJson.value)
  } catch {
    return null
  }
})

watch(
  () => props.value?.search_config,
  (newConfig) => {
    if (newConfig) {
      filterJson.value = JSON.stringify(newConfig, null, 2)
      jsonError.value = null
    } else {
      filterJson.value = ''
      jsonError.value = null
    }
  },
  { immediate: true }
)

function onInput() {
  if (!filterJson.value.trim()) {
    jsonError.value = null
    emit('input', {})
    return
  }

  try {
    JSON.parse(filterJson.value)
    jsonError.value = null
    emit('input', { search_config: JSON.parse(filterJson.value) })
  } catch (e) {
    jsonError.value = e instanceof Error ? e.message : 'Invalid JSON'
  }
}

function resetToTemplate() {
  filterJson.value = JSON.stringify(DEFAULT_TEMPLATE, null, 2)
  jsonError.value = null
  emit('input', { search_config: DEFAULT_TEMPLATE })
}
</script>

<style scoped>
.search-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground-normal);
}

.section-note {
  font-size: 12px;
  color: var(--foreground-subdued);
  margin: 0;
  line-height: 1.5;
}

.section-note code {
  background: var(--background-normal);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
}

.editor-wrapper {
  position: relative;
}

.json-editor {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
  background: var(--background-normal);
  border: 2px solid var(--border-normal);
  border-radius: 6px;
  color: var(--foreground-normal);
  resize: vertical;
  tab-size: 2;
}

.json-editor:focus {
  outline: none;
  border-color: var(--primary);
}

.json-editor.has-error {
  border-color: var(--danger);
}

.error-message {
  font-size: 12px;
  color: var(--danger);
  margin-top: 6px;
}

.helper-section {
  background: var(--background-subdued);
  border-radius: 6px;
  padding: 12px;
}

.helper-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--foreground-normal);
}

.placeholders {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--foreground-subdued);
}

.placeholders code {
  background: var(--background-normal);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  margin-right: 8px;
}

.actions {
  display: flex;
  gap: 8px;
}
</style>
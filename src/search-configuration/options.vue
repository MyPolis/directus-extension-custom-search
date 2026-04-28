<template>
  <div class="search-config">
    <v-form
      :modelValue="value"
      @update:modelValue="emit('input', $event)"
      :fields="searchConfigFields"
    />

    <div class="presets-section">
      <div class="presets-header">
        <h3>Filter Presets</h3>
        <v-button @click="addPreset" small>
          <v-icon name="add" />
          Add Preset
        </v-button>
      </div>

      <p class="presets-description">
        Define named filters that can be activated via the <code>filters</code> query parameter.
      </p>

      <div v-if="!presets.length" class="no-presets">
        No presets defined. Click "Add Preset" to create one.
      </div>

      <div v-for="(preset, index) in presets" :key="index" class="preset-item">
        <div class="preset-header">
          <span class="preset-index">{{ index + 1 }}</span>
          <v-icon :name="preset.icon || 'filter'" class="preset-icon" />
          <v-input
            v-model="preset.name"
            placeholder="Preset name"
            @update:modelValue="updatePreset(index, 'name', $event)"
          />
          <v-button
            class="delete-btn"
            @click="removePreset(index)"
            icon
            rounded
            size="small"
          >
            <v-icon name="delete" />
          </v-button>
        </div>

        <div class="preset-fields">
          <div class="field-row">
            <label>Slug</label>
            <v-input
              v-model="preset.slug"
              placeholder="e.g., active, this-week"
              @update:modelValue="updatePreset(index, 'slug', $event)"
            />
          </div>

          <div class="field-row">
            <label>Icon</label>
            <v-select
              :modelValue="preset.icon"
              :items="iconOptions"
              @update:modelValue="updatePreset(index, 'icon', $event)"
              placeholder="Select icon"
            />
          </div>

          <div class="field-row">
            <label>Filter</label>
            <v-fancy-list>
              <v-form
                :modelValue="preset.filter"
                @update:modelValue="updatePresetFilter(index, $event)"
                :fields="filterFields"
              />
            </v-fancy-list>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Preset, SearchConfig, InterfaceField } from '../types/index.js'
import { ICON_OPTIONS, type IconValue } from '../types/index.js'

interface SearchConfigValue {
  search_config?: Record<string, unknown>
  presets?: Preset[]
  config_field?: string
}

const props = defineProps<{ value: SearchConfigValue; collection: string }>()
const emit = defineEmits<{
  input: [value: SearchConfigValue]
}>()

const iconOptions = ICON_OPTIONS

const presets = computed<Preset[]>({
  get: () => {
    const value = props.value?.presets
    return value ? JSON.parse(JSON.stringify(value)) : []
  },
  set: (val: Preset[]) => {
    emit('input', { ...props.value, presets: val })
  },
})

const searchConfigFields = computed<InterfaceField[]>(() => [
  {
    field: 'search_config',
    name: 'Search Config',
    type: 'json',
    meta: {
      interface: 'system-filter',
      note: '$SEARCH, $SEARCH_LOWERCASE, $SEARCH_UPPERCASE, $SEARCH_WILDCARD placeholders supported',
      options: {
        collectionName: props.collection,
        collectionRequired: true,
      },
    },
  },
  {
    field: 'config_field',
    name: 'Config Field Name',
    type: 'string',
    meta: {
      interface: 'input',
      note: 'Field name that stores search config (default: _search_config)',
      options: {
        placeholder: '_search_config',
      },
    },
  },
])

const filterFields = computed<InterfaceField[]>(() => [
  {
    field: 'filter',
    name: 'Filter',
    type: 'json',
    meta: {
      interface: 'system-filter',
      options: {
        collectionName: props.collection,
        collectionRequired: true,
      },
    },
  },
])

function updatePreset(index: number, key: keyof Preset, value: string) {
  const newPresets = [...presets.value]
  newPresets[index] = { ...newPresets[index], [key]: value }
  emit('input', { ...props.value, presets: newPresets })
}

function updatePresetFilter(index: number, filter: Record<string, unknown>) {
  const newPresets = [...presets.value]
  newPresets[index] = { ...newPresets[index], filter }
  emit('input', { ...props.value, presets: newPresets })
}

function addPreset(): void {
  const newPresets = [
    ...presets.value,
    { slug: '', name: '', icon: 'filter', filter: {} },
  ]
  emit('input', { ...props.value, presets: newPresets })
}

function removePreset(index: number): void {
  const newPresets = presets.value.filter((_: Preset, i: number) => i !== index)
  emit('input', { ...props.value, presets: newPresets })
}
</script>

<style scoped>
.search-config {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.presets-section {
  border: 1px solid var(--border-normal);
  border-radius: 8px;
  padding: 16px;
  background: var(--background-subdued);
}

.presets-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.presets-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.presets-description {
  color: var(--foreground-subdued);
  font-size: 12px;
  margin: 0 0 16px 0;
}

.presets-description code {
  background: var(--background-normal);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.no-presets {
  color: var(--foreground-subdued);
  font-style: italic;
  text-align: center;
  padding: 16px;
}

.preset-item {
  background: var(--background-normal);
  border: 1px solid var(--border-normal);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.preset-item:last-child {
  margin-bottom: 0;
}

.preset-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.preset-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.preset-icon {
  color: var(--foreground-subdued);
}

.preset-header .v-input {
  flex: 1;
}

.delete-btn {
  color: var(--danger);
}

.preset-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-row label {
  font-size: 12px;
  font-weight: 500;
  color: var(--foreground-subdued);
}
</style>
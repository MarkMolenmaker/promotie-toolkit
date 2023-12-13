<template>
  <v-text-field v-model="searchQuery" density="compact" :disabled="searchLoading" :hint="searchHint"
                label="Zoeken" clearable persistent-hint @update:model-value="handleSearchRequest">
    <template v-slot:append-inner>
      <v-btn v-if="searchLoading" icon="mdi-loading mdi-spin" variant="plain" />
      <v-btn v-else icon="mdi-magnify" variant="plain" @click="handleSearchRequest" />
    </template>
  </v-text-field>
</template>

<script lang="ts">
export default {
  name: 'SearchBar',
  emits: ['submitSearch'],
  data () {
    return {
      searchQuery: '' as string
    }
  },
  props: {
    searchLoading: {
      type: Boolean,
      default: false
    },
    searchHint: {
      type: String,
      default: 'Zoek naar een product'
    }
  },
  methods: {
    handleSearchRequest () {
      this.$emit('submitSearch', this.searchQuery)
    }
  }
}
</script>

<style scoped lang="scss">
:deep(.v-messages__message) { text-align: right; }
</style>

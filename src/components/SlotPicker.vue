<template>
  <v-btn-toggle v-model="slot" class="flex-column h-auto" color="primary" mandatory @update:model-value="$emit('update:modelValue', slot)">
    <div v-if="rows" v-for="r in rows" :key="r">
      <v-btn v-for="c in cols" class="pa-2 bg-grey-lighten-3" :key="c" :value="(r - 1) * rows + c">
        <v-icon>{{ content[((r - 1) * rows + c) - 1] === null ? 'mdi-vanish' : 'mdi-format-align-justify' }}</v-icon>
      </v-btn>
    </div>
  </v-btn-toggle>
</template>

<script lang="ts">
import {mapStores} from "pinia";
import {useDocumentStore} from "@/store/document";

export default {
  name: 'SlotPicker',
  computed: {
    ...mapStores(useDocumentStore),
    content (): string[] {
      return this.documentStore.content
    }
  },
  props: {
    rows: Number,
    cols: Number
  },
  data () {
    return {
      slot: 1
    }
  },
}
</script>

<style lang="scss" scoped>

</style>

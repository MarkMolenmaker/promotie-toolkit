<template>
  <v-btn-toggle v-model="slot" class="flex-column h-auto" color="primary" mandatory @update:model-value="$emit('update:modelValue', slot)">
    <v-row v-if="rows" v-for="r in rows" :key="r" no-gutters>
      <v-col v-if="cols" v-for="c in cols" :cols="12 / cols" :key="c" no-gutters>
        <v-btn class="bg-grey-lighten-3 slot-btn" size="48" :value="(r - 1) * rows + c - 1" :ref="`slot-btn-${((r - 1) * rows + c - 1)}`" :title="`Vakje ${((r - 1) * rows + c - 1) + 1}`">
          <v-icon>{{ content[((r - 1) * rows + c - 1)] === null ? 'mdi-vanish' : 'mdi-format-align-justify' }}</v-icon>
        </v-btn>
      </v-col>
    </v-row>
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
      slot: 0
    }
  },
}
</script>

<style lang="scss" scoped>
.slot-btn { aspect-ratio: 1/1; }
</style>

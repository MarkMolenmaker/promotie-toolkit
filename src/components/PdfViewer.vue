<template>
  <v-card class="bg-grey-lighten-2" :disabled="!pdfDataUri">
    <v-toolbar>
      <v-toolbar-title>{{ pdfFormatTitle }}</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-printer" title="Print document" @click="$emit('printDocument')" />
      <v-btn icon="mdi-download" title="Download document" @click="$emit('downloadDocument')" />
      <v-btn icon="mdi-refresh" title="Weergave vernieuwen" @click="$emit('refreshDocument')" />
      <v-btn icon="mdi-dots-vertical" title="Overige instellingen" disabled />
    </v-toolbar>
    <v-card-item v-if="pdfDataUri" ref="pdf-preview-container">
      <vue-pdf-embed class="bg-grey-lighten-2 d-flex justify-center" ref="pdf-preview" :source="pdfDataUri"
                     :height="pdfPreviewSize[1]" :width="pdfPreviewSize[0]" />
    </v-card-item>
    <v-card-item v-else>
      <v-container>
        <span>Selecteer een formaat...</span>
      </v-container>
    </v-card-item>
  </v-card>
</template>

<script lang="ts">
import VuePdfEmbed from 'vue-pdf-embed';

export default {
  name: 'PdfViewer',
  emits: ['printDocument', 'downloadDocument', 'refreshDocument'],
  components: { VuePdfEmbed },
  computed: {
    pdfFormatTitle (): string {
      return this.pdfFormat ? this.pdfFormat.name : 'Geen formaat geselecteerd'
    },
    pdfPreviewSize() {
      if (!this.pdfFormat) return [0, 0]
      const maxHeight = window.innerHeight - 128
      // @ts-ignore
      const maxWidth = this.$refs['pdf-preview-container']?.$el.clientWidth
      const scaleFactor = Math.min(maxWidth / this.pdfFormat.width, maxHeight / this.pdfFormat.height)
      return [this.pdfFormat.width * scaleFactor, this.pdfFormat.height * scaleFactor]
    }
  },
  props: {
    pdfFormat: Object,
    pdfDataUri: String
  },
}
</script>

<style scoped lang="scss">

</style>

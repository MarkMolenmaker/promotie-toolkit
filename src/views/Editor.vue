<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card class="bg-grey-lighten-2">
          <v-toolbar>
            <v-toolbar-title>A3 4x4 - Voorbeeld</v-toolbar-title>
            <v-spacer />
            <v-btn icon="mdi-printer" title="Print document" :disabled="!pdfDataUri" @click="handlePrintDocument" />
            <v-btn icon="mdi-download" title="Download document" :disabled="!pdfDataUri" @click="handleDownloadDocument" />
            <v-btn icon="mdi-refresh" title="Weergave vernieuwen" :disabled="!pdfDataUri" @click="handleRefreshDocument" />
            <v-btn icon="mdi-dots-vertical" title="Overige instellingen" disabled />
          </v-toolbar>
          <v-card-item ref="pdf-preview-container">
            <vue-pdf-embed v-if="pdfDataUri" class="bg-grey-lighten-2 d-flex justify-center" ref="pdf-preview"
                           :source="pdfDataUri" :height="pdfPreviewSize[1]" :width="pdfPreviewSize[0]" />
            <v-container v-else>
              <span>Selecteer een formaat...</span>
            </v-container>
          </v-card-item>
        </v-card>
      </v-col>
      <v-col>
        <v-card>
          <v-toolbar>
            <v-toolbar-title>Gegevens aanpassen</v-toolbar-title>
            <v-spacer />
            <v-select v-model="formatStore.selectedFormatId" class="bg-white my-auto" density="compact" :items="formatStore.availableFormats" label="Formaat"
                      variant="outlined" hide-details @update:model-value="handleSelectFormatChange" />
            <v-btn icon="mdi-dots-vertical" disabled />
          </v-toolbar>
          <v-card-item v-if="format">
            <div class="d-flex ga-2">
              <slot-picker v-model="selectedSlot" :rows="format.body.rows" :cols="format.body.columns" />
                <v-text-field v-model="searchQuery" class="search-bar" append-icon="mdi-magnify" density="compact"
                              label="Zoeken" clearable hide-details @update:model-value="handleSearchRequest" />
            </div>
          </v-card-item>
          <v-card-item>
            <v-form ref="form" :disabled="!format" @submit.prevent="handleCopyInputToNext" @input="handleInsertInput">
              <v-textarea v-model="title" label="Hoofdtekst" max-rows="2" rows="1" auto-grow clearable counter />
              <v-textarea v-model="subtitle" label="Subtekst" max-rows="2" rows="1" auto-grow clearable counter />
              <v-text-field v-model="salePrice" label="Actie Prijs" type="number" clearable></v-text-field>
            </v-form>
          </v-card-item>
          <v-card-item>
            <v-btn color="error" prepend-icon="mdi-delete" text="Verwijderen" :disabled="!format" @click="handleClearSlot" />
            <v-btn class="ml-4" color="primary" prepend-icon="mdi-content-copy" text="Kopieren" :disabled="!format" @click="handleCopyInputToNext"/>
          </v-card-item>
        </v-card>
        <v-container v-if="searchResults.length > 0">
          <v-carousel :continuous="false" hide-delimiters>
            <v-carousel-item v-for="item in searchResults" :key="item.sku">
              <v-card>
                <v-card-title class="bg-grey-lighten-3">{{ item.name }}</v-card-title>
                <v-card-item>
                  <v-row>
                    <v-col cols="6">
                      <v-img :src="item.images[0].effectiveUrl" max-width="200" />
                    </v-col>
                    <v-col cols="6">
                      <v-card-title>Inhoud</v-card-title>
                      <v-card-text>{{ item.attributes.filter((attr: any) => attr.name === 'Inhoud')[0].value }}</v-card-text>
                      <v-card-title>Actie Prijs</v-card-title>
                      <v-card-text>{{ item.salePrice.value }}</v-card-text>
                      <v-card-title>Normale Prijs</v-card-title>
                      <v-card-text>{{ item.listPrice.value }}</v-card-text>
                      <v-btn color="success" text="insert" prepend-icon="mdi-plus" @click="handleInsertResult(
                        item.name,
                        item.attributes.filter((attr: any) => attr.name === 'Inhoud')[0].value,
                        item.salePrice.value)"/>
                    </v-col>
                  </v-row>
                </v-card-item>
              </v-card>
            </v-carousel-item>
          </v-carousel>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import VuePdfEmbed from 'vue-pdf-embed'
import SlotPicker from "@/components/SlotPicker.vue";
import {mapStores} from "pinia";
import {useFormatStore} from "@/store/format";
import {useDocumentStore} from "@/store/document";

export default {
  name: 'Editor',
  components: {SlotPicker, VuePdfEmbed },
  computed: {
    ...mapStores(useDocumentStore, useFormatStore),
    format() { return this.formatStore.format },
    pdfDataUri() { return this.documentStore.pdfDataUri },
    pdfPreviewSize() {
      const maxHeight = window.innerHeight - 128
      // @ts-ignore
      const maxWidth = this.$refs['pdf-preview-container']?.$el.clientWidth
      const format = this.formatStore.format
      if (format === undefined) return [0, 0]
      else {
        const scaleFactor = Math.min(maxWidth / format.width, maxHeight / format.height)
        return [format.width * scaleFactor, format.height * scaleFactor]
      }
    }
  },
  data() {
    return {
      selectedSlot: 1 as number,

      searchQuery: '' as string,
      searchResults: [] as any[],

      title: '' as string,
      subtitle: '' as string,
      salePrice: '' as number | string
    }
  },
  methods: {
    handlePrintDocument() {
      this.documentStore.createDocument()
        .then(() => this.documentStore.drawDocument()
          .finally(() => {
            const document = this.documentStore.document
            document.autoPrint({ variant: 'non-conform' })
            document.output('dataurlnewwindow')
          }))
    },
    handleDownloadDocument() {
      this.documentStore.createDocument()
        .then(() => this.documentStore.drawDocument()
          .finally(() => {
            const document = this.documentStore.document
            document.save('poster.pdf')
          }))
    },
    handleRefreshDocument() {
      this.documentStore.createDocument(true)
      this.documentStore.drawDocument()
    },
    handleSelectFormatChange() {
      this.documentStore.createDocument(true)
      this.documentStore.resetContent()
    },
    handleInsertInput() {
      this.documentStore.insertContent(this.selectedSlot - 1, {
        title: this.title,
        subtitle: this.subtitle,
        salePrice: this.salePrice
      }).finally(() => this.handleRefreshDocument())
    },
    handleCopyInputToNext() {
      this.documentStore.copyContent(this.selectedSlot - 1, this.selectedSlot)
        .finally(() => {
          this.handleRefreshDocument()
          this.selectedSlot++
        })
    },
    handleClearSlot() {
      this.documentStore.removeContent(this.selectedSlot - 1)
        .finally(() => {
          this.title = ''
          this.subtitle = ''
          this.salePrice = ''
          this.handleRefreshDocument()
        })
    },
    handleInsertResult(title: string, subtitle: string, salePrice: number) {
      this.title = title
      this.subtitle = subtitle
      this.salePrice = salePrice
      this.handleInsertInput()
    },
    handleSearchRequest() {
      this.searchResults = []
      fetch(`https://api.coop.nl/INTERSHOP/rest/WFS/COOP-3645-Site/-;loc=nl_NL;cur=EUR/culios/products?searchTerm=${this.searchQuery}&amount=20&attrs=salePrice,listPrice,image,promotions,sticker,Inhoud&attributeGroup=PRODUCT_LIST_DETAIL_ATTRIBUTES&productFilter=fallback_searchquerydefinition&offset=0&_date=2023-12-12`, {
        "headers": {
          "accept": "application/json",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          "sec-ch-ua": "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site"
        },
        "referrer": "https://www.coop.nl/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "omit"
      })
        .then(response => response.json())
        .then(data => this.searchResults = data.elements)
    }
  },
  watch: {
    selectedSlot(value) {
      const content = this.documentStore.content[value - 1]
      this.title = content?.title ?? ''
      this.subtitle = content?.subtitle ?? ''
      this.salePrice = content?.salePrice ?? ''
    }
  }
}
</script>

<style lang="scss" scoped>
.search-bar {
  height: 1rem;
}
</style>

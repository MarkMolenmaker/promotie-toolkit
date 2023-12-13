<template>
  <product-details-dialog v-model="showProductDetailsDialog" :sku="showProductDetailsSku" @add-product="(data) => handleAddProduct(data)" />
  <v-container>
    <v-row>
      <v-col cols="6">
        <pdf-viewer :pdf-format="format" :pdf-data-uri="pdfDataUri" @print-document="handlePrintDocument"
                    @download-document="handleDownloadDocument" @refresh-document="handleRefreshDocument" />
      </v-col>
      <v-col cols="6">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-toolbar>
                <v-toolbar-title>Gegevens aanpassen</v-toolbar-title>
                <v-spacer />
                <v-select v-model="formatStore.selectedFormatId" class="bg-white my-auto" density="compact"
                          :items="formatStore.availableFormats" label="Formaat" variant="outlined" hide-details
                          @update:model-value="handleSelectFormatChange" />
                <v-btn icon="mdi-dots-vertical" disabled />
              </v-toolbar>
              <v-card-item v-if="format">
                <v-row>
                  <v-col cols="auto">
                    <slot-picker v-model="selectedSlot" :rows="format.body.rows" :cols="format.body.columns" ref="slot-picker" />
                  </v-col>
                  <v-col cols="true">
                    <v-row>
                      <v-col>
                        <search-bar :search-hint="searchResultsHint" :search-loading="searchLoading"
                                    @submit-search="handleSearchRequest" ref="search-bar" />
                      </v-col>
                    </v-row>
                    <v-row v-if="searchResults.length > 0" no-gutters>
                      <v-col>
                        <v-virtual-scroll height="122" item-height="48" :items="searchResults">
                          <template v-slot:default="{ item }">
                            <v-list-item :title="`${item.name}`"
                                         :subtitle="`${item.attributes.filter((attr: any) => attr.name === 'Inhoud')[0].value}`" >
                              <template v-slot:prepend>
                                <v-avatar :image="item.images.length > 0 ? item.images[0].effectiveUrl : 'https://placehold.co/20?text=404'" />
                              </template>
                              <template v-slot:append>
                                <v-btn class="ml-4" icon="mdi-eye" size="x-small" variant="flat" @click="handleShowProductDetails(item.sku)"/>
                              </template>
                            </v-list-item>
                          </template>
                        </v-virtual-scroll>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-card-item>
              <v-card-item>
                <v-form ref="form" :disabled="!format" @submit.prevent="handleCopyInputToNext" @input="handleInsertInput">
                  <v-textarea v-model="title" label="Hoofdtekst" max-rows="2" rows="1" ref="form-title-input" auto-grow clearable counter />
                  <v-textarea v-model="subtitle" label="Subtekst" max-rows="2" rows="1" auto-grow clearable counter />
                  <v-text-field v-model="salePrice" label="Actie Prijs" type="number" clearable></v-text-field>
                </v-form>
              </v-card-item>
              <v-card-item>
                <v-btn color="error" prepend-icon="mdi-delete" text="Verwijderen" :disabled="!format"
                       @click="handleClearSlot" title="Verwijder de inhoud en ga terug naar het vorige vakje" />
                <v-btn class="ml-4" color="primary" prepend-icon="mdi-content-duplicate" text="Dupliceren" :disabled="!format"
                       @click="handleCopyInputToNext" title="Dupliceer de inhoud naar het volgende vakje" />
                <v-btn class="ml-4" color="primary" prepend-icon="mdi-content-copy" text="Kopiëren"
                       @click="handleCopyInputToNext" disabled/>
              </v-card-item>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-card>
              <v-card-title>Instructies</v-card-title>
              <v-card-text>
                <v-icon icon="mdi-keyboard"/> <b>Sneltoetsen:</b><br/>
                <v-icon icon="mdi-minus"/> ALT + 1: Focus op hoofdtekst <br/>
                <v-icon icon="mdi-minus"/> ALT + 2: Focus op zoekbalk <br/>
                <v-divider />
                <v-icon icon="mdi-minus"/> ALT + <v-icon icon="mdi-chevron-right" />: Focus op volgende vakje <br/>
                <v-icon icon="mdi-minus"/> ALT + <v-icon icon="mdi-chevron-left" />: Focus op vorige vakje <br/>
                <v-icon icon="mdi-minus"/> ALT + <v-icon icon="mdi-chevron-up" />: Focus op vakje boven <br/>
                <v-icon icon="mdi-minus"/> ALT + <v-icon icon="mdi-chevron-down" />: Focus op vakje onder <br/>
                <v-divider />
                <v-icon icon="mdi-minus"/> CTRL + D: Dupliceer inhoud naar volgende vakje <br/>
                <v-icon icon="mdi-minus"/> CTRL + R: Verwijder inhoud en ga terug naar vorige vakje <br/>
                <v-icon icon="mdi-minus"/> CTRL + S: Vernieuw weergave <br/>
                <v-icon icon="mdi-minus"/> CTRL + P: Print document <br/>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
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
import SearchBar from "@/components/SearchBar.vue";
import PdfViewer from "@/components/PdfViewer.vue";
import ProductDetailsDialog from "@/components/ProductDetailsDialog.vue";

// Debounce function
function debounce(func: any, wait: number) {
  let timeout: any;
  return function () {
    // @ts-ignore
    const context = this;
    const args = arguments;

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

export default {
  name: 'Editor',
  components: {ProductDetailsDialog, PdfViewer, SearchBar, SlotPicker, VuePdfEmbed },
  computed: {
    ...mapStores(useDocumentStore, useFormatStore),
    format() { return this.formatStore.format },
    pdfDataUri() { return this.documentStore.pdfDataUri },
    searchResultsHint() { return `${this.searchResults.length} / ${this.searchTotalResultsCount} resultaten` }
  },
  data() {
    return {
      selectedSlot: 0 as number,
      focussedSlot: null as number | null,

      searchLoading: false as boolean,
      searchResults: [] as any[],
      searchTotalResultsCount: 0 as number,

      title: '' as string,
      subtitle: '' as string,
      salePrice: '' as number | string,

      showProductDetailsDialog: false as boolean,
      showProductDetailsSku: '' as string
    }
  },
  methods: {
    handleShowProductDetails(sku: string) {
      this.showProductDetailsSku = sku
      this.showProductDetailsDialog = true
    },
    handleAddProduct(data: any) {
      this.showProductDetailsDialog = false
      this.documentStore.insertContent(this.selectedSlot, {
        title: data.product.name,
        subtitle: (data.sale.amount == 1 ? 'per' : data.sale.amount) + ' stuk à ' + data.product.attributes.filter((attr: any) => attr.name === 'Inhoud')[0].value,
        salePrice: data.sale.value,
        listPrice: data.product.listPrice.value
      }).finally(() => this.handleRefreshDocument())
      this.selectedSlot++
    },
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
    handleInsertInput: debounce(function () {
      // @ts-ignore
      this.documentStore.insertContent(this.selectedSlot, {
        // @ts-ignore
        title: this.title, subtitle: this.subtitle, salePrice: this.salePrice
      // @ts-ignore
      }).finally(() => this.handleRefreshDocument())
    }, 500),
    handleCopyInputToNext() {
      this.documentStore.copyContent(this.selectedSlot, this.selectedSlot + 1)
        .finally(() => {
          this.handleRefreshDocument()
          if (this.format && this.selectedSlot < this.format.body.rows * this.format.body.columns - 1) this.selectedSlot++
        })
    },
    handleClearSlot() {
      this.documentStore.removeContent(this.selectedSlot)
        .finally(() => {
          this.title = ''
          this.subtitle = ''
          this.salePrice = ''
          this.handleRefreshDocument()
          if (this.selectedSlot > 0 ) this.selectedSlot--
        })
    },
    handleInsertResult(title: string, subtitle: string, salePrice: number) {
      this.title = title
      this.subtitle = subtitle
      this.salePrice = salePrice
      this.handleInsertInput()
    },
    handleSearchRequest: debounce(function (searchQuery: string) {
      // @ts-ignore
      this.searchResults = []
      // @ts-ignore
      this.searchTotalResultsCount = 0
      // @ts-ignore
      this.searchLoading = true
      // @ts-ignore
      fetch(`https://api.coop.nl/INTERSHOP/rest/WFS/COOP-3645-Site/-;loc=nl_NL;cur=EUR/culios/products?searchTerm=${searchQuery}&amount=20&attrs=salePrice,listPrice,image,promotions,sticker,Inhoud&attributeGroup=PRODUCT_LIST_DETAIL_ATTRIBUTES&productFilter=fallback_searchquerydefinition&offset=0&_date=2023-12-12`, {
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
        .then(data => {
          // @ts-ignore
          this.searchResults = data.elements
          // @ts-ignore
          this.searchTotalResultsCount = data.total
        })
        // @ts-ignore
        .finally(() => this.searchLoading = false)
    }, 500)
  },
  mounted () {
    document.addEventListener('keydown', (event) => {

      // ALT + ArrowLeft
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        if (!this.focussedSlot) this.focussedSlot = this.selectedSlot
        if (this.format && this.focussedSlot > 0) {
          this.$refs['slot-picker']?.$refs[`slot-btn-${--this.focussedSlot}`][0].$el.focus()
        }
      }

      // ALT + ArrowRight
      else if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault()
        if (!this.focussedSlot) this.focussedSlot = this.selectedSlot
        if (this.format && this.focussedSlot < this.format.body.rows * this.format.body.columns - 1) {
          this.$refs['slot-picker']?.$refs[`slot-btn-${++this.focussedSlot}`][0].$el.focus()
        }
      }

      // ALT + ArrowUp
      else if (event.altKey && event.key === 'ArrowUp') {
        event.preventDefault()
        if (!this.focussedSlot) this.focussedSlot = this.selectedSlot
        if (this.format && this.focussedSlot >= this.format.body.columns) {
          this.$refs['slot-picker']?.$refs[`slot-btn-${this.focussedSlot -= this.format.body.columns}`][0].$el.focus()
        }
      }

      // ALT + ArrowDown
      else if (event.altKey && event.key === 'ArrowDown') {
        event.preventDefault()
        if (!this.focussedSlot) this.focussedSlot = this.selectedSlot
        if (this.format && this.focussedSlot < this.format.body.rows * this.format.body.columns - this.format.body.columns) {
          this.$refs['slot-picker']?.$refs[`slot-btn-${this.focussedSlot += this.format.body.columns}`][0].$el.focus()
        }
      }

      // Duplicate
      else if (event.ctrlKey && event.key === 'd') {
        event.preventDefault()
        this.handleCopyInputToNext()
      }

      // Remove
      else if (event.ctrlKey && event.key === 'r') {
        event.preventDefault()
        this.handleClearSlot()
      }

      // Refresh
      else if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        this.handleRefreshDocument()
      }

      // Print
      else if (event.ctrlKey && event.key === 'p') {
        event.preventDefault()
        this.handlePrintDocument()
      }

      // ALT + 1
      else if (event.altKey && event.key === '1') {
        event.preventDefault()
        this.$refs['form-title-input'].$el.querySelector('textarea').focus()
      }

      // ALT + 2
      else if (event.altKey && event.key === '2') {
        event.preventDefault()
        this.$refs['search-bar'].$el.querySelector('input').focus()
      }

    })
  },
  watch: {
    selectedSlot(value) {
      const content = this.documentStore.content[value]
      this.title = content?.title ?? ''
      this.subtitle = content?.subtitle ?? ''
      this.salePrice = content?.salePrice ?? ''
      this.focussedSlot = null
      this.$refs['form-title-input'].$el.querySelector('textarea').focus()
    }
  }
}
</script>

<style lang="scss" scoped>
.search-bar {
  height: 1rem;
}
</style>

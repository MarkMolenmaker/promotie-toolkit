<template>
  <v-dialog v-model="show" width="auto">
    <v-card v-if="!loading && product">
      <v-card-item>
        <v-row>
          <v-col cols="auto">
            <v-img class="align-end" :width="100" :height="100" :src="product.images ? product.images[0].effectiveUrl : 'https://placehold.co/150?text=No Image'" />
          </v-col>
          <v-col cols="true">
            <v-card-title>{{ product.name }}</v-card-title>
            <v-card-subtitle>
              {{ product.sku }}<br/>
              {{ product.attributes.filter((attr: any) => attr.name === 'Inhoud')[0].value }}<br/>
              Prijs: {{ product.listPrice.value }}
            </v-card-subtitle>
          </v-col>
        </v-row>
        <v-row v-if="product.attributes.filter((attr: any) => attr.name === 'inOfferFULL').length > 0">
          <v-col>
            <v-chip class="font-weight-bold" color="error" label>{{ product.attributes.filter((attr: any) => attr.name === 'stickerFULL')[0].value }}</v-chip><br/>
            <span>Actie: {{ parseProductSalePrice(product) }}</span>
          </v-col>
        </v-row>
      </v-card-item>
      <v-card-actions>
        <v-btn color="error" @click="handleCloseDialog">Sluiten</v-btn>
        <v-spacer />
        <v-btn color="success" @click="handleAddProduct">Toevoegen</v-btn>
      </v-card-actions>
    </v-card>
    <v-card v-else>
      <v-card-item>
        <v-progress-circular indeterminate size="64" />
      </v-card-item>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
export default {
  name: 'ProductDetailsDialog',
  emits: ['addProduct'],
  props: {
    sku: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      show: false as boolean,
      product: null as any,
      loading: false as boolean
    }
  },
  methods: {
    handleCloseDialog () {
      // @ts-ignore
      this.$emit('update:modelValue', false)
    },
    handleAddProduct () {
      this.$emit('addProduct', {product: this.product, sale: this.parseProductSalePrice(this.product)})
    },
    fetchProductDetails () {
      this.product = null
      this.loading = true
      fetch(`https://api.coop.nl/INTERSHOP/rest/WFS/COOP-3645-Site/-;loc=nl_NL;cur=EUR/products/${this.sku}?_date=2023-12-13`, {
        "headers": {
          "accept": "application/json",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
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
        .then(data => this.product = data)
        .finally(() => this.loading = false)
    },
    parseProductSalePrice(product: any) {
      const listPrice = product.listPrice.value
      let sticker = product.attributes.filter((attr: any) => attr.name === 'stickerFULL')
      sticker = sticker[0] ? sticker[0].value : ''

      sticker = sticker.toLowerCase()
      const n4x_pattern = /^(\d+)\svoor\s(\d+\.\d+)$/gm
      const o4x_pattern = /^nu\svoor\s(\d+\.\d+)$/gm
      const xp_pattern = /^(\d+)%\skorting$/gm
      const hv_pattern = /^2e\shalve\sprijs$/gm
      const xax_pattern = /^(\d+)\+(\d+)\sgratis$/gm
      const n4g_pattern = /^per\s(\d+)\sgram\s(\d+\.\d+)$/gm

      // 2 voor 2.99
      if (sticker.match(n4x_pattern)) {
        const attrs = n4x_pattern.exec(sticker)
        // @ts-ignore
        return {amount: Number(attrs[1]), value: Number(attrs[2])}
      }

      // Nu voor 1.00
      else if (sticker.match(o4x_pattern)) {
        const attrs = o4x_pattern.exec(sticker)
        // @ts-ignore
        return {amount: 1, value: Number(attrs[1])}
      }

      // 50% korting
      else if (sticker.match(xp_pattern)) {
        const attrs = xp_pattern.exec(sticker)
        // @ts-ignore
        return {amount: 1, value: Math.round(listPrice * (1 - Number(attrs[1]) / 100) * 100) / 100}
      }

      // 2e halve prijs
      else if (sticker.match(hv_pattern)) {
        return {amount: 2, value: Math.round(2 * listPrice * (1 - 25 / 100) * 100) / 100}
      }

      // 2+1 gratis
      else if (sticker.match(xax_pattern)) {
        const attrs = xax_pattern.exec(sticker)
        // @ts-ignore
        return {amount: Number(attrs[1]) + Number(attrs[2]), value: Math.round(Number(attrs[1]) * listPrice * 100) / 100}
      }

      // per 100 gram 1.00
      else if (sticker.match(n4g_pattern)) {
        const attrs = n4g_pattern.exec(sticker)
        // @ts-ignore
        return {amount: Number(attrs[1]), value: Number(attrs[2])}
      }

      return {amount: 1, value: listPrice}
    }
  },
  watch: {
    sku: {
      immediate: true,
      handler (val) {
        if (val) {
          this.fetchProductDetails()
        }
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>

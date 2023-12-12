// Utilities
import { defineStore } from 'pinia'
import {jsPDF} from "jspdf";
import {useFormatStore} from "./format";

function currency(value: number): string[] {
  const integerValue = Math.floor(value);
  const decimalValue = value - integerValue;

  const formattedInteger = integerValue === 0 ? "0" : integerValue.toString();
  const formattedDecimal = decimalValue === 0 ? "-" : decimalValue.toFixed(2).slice(2);

  return [formattedInteger, formattedDecimal]
}

function getStringWidth(str: string, font: string = 'GunplaySkewed', fontSize: number = 18): number {
  const doc = new jsPDF()
  doc.setFont(font, 'normal')
  doc.setFontSize(fontSize)
  return doc.getStringUnitWidth(str) * fontSize / doc.internal.scaleFactor
}

export const useDocumentStore = defineStore('document', {
  state: () => ({
    _document: null as any,
    _content: [] as any[],
  }),
  getters: {
    document: (state) => state._document,
    content: (state) => state._content,
    pdfDataUri: (state) => state._document?.output('datauristring')
  },
  actions: {
    insertContent(slot: number, content: any): Promise<void> {
      // Replace the content at the specified slot
      this._content[slot] = content
      return Promise.resolve()
    },
    copyContent(from: number, to: number): Promise<void> {
      // Copy the content from one slot to another
      this._content[to] = this._content[from]
      return Promise.resolve()
    },
    removeContent(slot: number): Promise<void> {
      // Remove the content at the specified slot
      this._content[slot] = null
      return Promise.resolve()
    },
    createDocument(preview: boolean = false): Promise<void> {
      // Use the format store to get the current format
      const formatStore = useFormatStore()
      const format = formatStore.format
      if (!format) return Promise.resolve()

      // Replace the current document with a new instance and add the header image
      this._document = new jsPDF({ orientation: format.orientation, unit: format.unit, format: format.format })
      if (preview) this._document.addImage(formatStore.headerImage, 'JPEG', format.margin, format.margin,
        format.width - 2 * format.margin, format.headerHeight)
      return Promise.resolve()
    },
    drawDocument(): Promise<void> {
      // Use the format store to get the current format
      const formatStore = useFormatStore()
      const format = formatStore.format
      if (!format) return Promise.resolve()

      // Loop through all the content elements
      for (const [index, slot] of this._content.entries()) {
        if (slot == null) continue

        const X_OFFSET = format.margin
        const Y_OFFSET = format.margin + format.headerHeight

        const SLOT_WIDTH = (format.width - 2 * format.margin - 2 * format.body.margin) / format.body.columns
        const SLOT_HEIGHT = (format.height - 2 * format.margin - format.headerHeight - 2 * format.body.margin) / format.body.rows

        // Calculate x and y coordinates of the content
        const x = X_OFFSET + (index % format.body.columns) * SLOT_WIDTH
        const y = Y_OFFSET + Math.floor(index / format.body.rows) * SLOT_HEIGHT

        // Write the title
        this._document.setTextColor(0, 0, 0)
        this._document.setFontSize(format.body.titleFontSize)
        this._document.setFont('Museo', 'normal', 700)
        this._document.text(slot.title, x + format.body.margin, y + format.body.margin)

        // Get the amount of lines in the title
        const tLines = slot.title.split('\n').length

        // Write subtitle
        this._document.setTextColor(0, 0, 0)
        this._document.setFontSize(format.body.subTitleFontSize)
        this._document.setFont('Museo', 'normal', 300)
        this._document.text(slot.subtitle, x + format.body.margin, y + format.body.margin + format.body.lineHeight * tLines)

        // This is the amount of title lines + subtitle lines. Must be at least 2
        const stLines = slot.subtitle.split('\n').length
        const ttLines = Math.max(tLines + stLines, 2)

        // Draw the 8deg skewed box
        this._document.setFillColor(0, 0, 0)
        this._document.triangle(
          x + SLOT_WIDTH - format.body.skewedBoxMargin,
          y + format.body.lineHeight * ttLines + format.body.skewedBoxYOffset,
          x + format.body.skewedBoxMargin,
          y + format.body.lineHeight * ttLines + format.body.skewedBoxYOffset + format.body.skewedBoxAngle,
          x + SLOT_WIDTH - format.body.skewedBoxMargin,
          y + format.body.lineHeight * ttLines + format.body.skewedBoxYOffset + format.body.skewedBoxHeight,
          'F'
        )
        this._document.triangle(
          x + format.body.skewedBoxMargin,
          y + format.body.lineHeight * ttLines + format.body.skewedBoxYOffset + format.body.skewedBoxAngle,
          x + SLOT_WIDTH - format.body.skewedBoxMargin,
          y + format.body.lineHeight * ttLines + format.body.skewedBoxYOffset + format.body.skewedBoxHeight,
          x + format.body.skewedBoxMargin,
          y + format.body.lineHeight * ttLines + format.body.skewedBoxYOffset + format.body.skewedBoxHeight + format.body.skewedBoxAngle,
          'F'
        )

        const text = currency(slot.salePrice)
        const part1 = text[0]
        const part2 = text[1]
        const part1Width = getStringWidth(part1, 'Gunplay-Skewed', format.body.salePriceFontSize)
        const part2Width = getStringWidth(part2, 'Gunplay-Skewed', format.body.salePriceFontSize / 2)
        const totalWidth = part1Width + part2Width

        // Write part1 of the sale price (middle of the skewed box)
        this._document.setTextColor(255, 255, 255)
        this._document.setFontSize(format.body.salePriceFontSize)
        this._document.setFont('Gunplay-Skewed', 'normal')
        this._document.text(
          part1 + '.',
          x + SLOT_WIDTH / 2 - totalWidth / 2,
          y + format.body.lineHeight * ttLines + format.body.skewedBoxYOffset + format.body.skewedBoxHeight / 2 + 6,
          { align: 'left', angle: 8, baseline: 'middle', rotationDirection: 1 }
        )

        // Write part2 of the sale price (right of the skewed box)
        if (part2 == '-') {
          this._document.setTextColor(255, 255, 255)
          this._document.setFontSize(format.body.salePriceFontSize)
          this._document.setFont('Gunplay-Skewed', 'normal')
          this._document.text(
            part2,
            x + SLOT_WIDTH / 2 - totalWidth / 2 + part1Width + 2,
            y + format.body.lineHeight * ttLines + format.body.skewedBoxYOffset + format.body.skewedBoxHeight / 2,
            { align: 'left', angle: 8, baseline: 'middle', rotationDirection: 1 }
          )
        }
        else {
          this._document.setTextColor(255, 255, 255)
          this._document.setFontSize(format.body.salePriceFontSize / 2)
          this._document.setFont('Gunplay-Skewed', 'normal')
          this._document.text(
            part2,
            x + SLOT_WIDTH / 2 - totalWidth / 2 + part1Width,
            y + format.body.lineHeight * ttLines + format.body.skewedBoxYOffset + format.body.skewedBoxHeight / 2 + 4,
            { align: 'left', angle: 8, baseline: 'bottom', rotationDirection: 1 }
          )
        }
      }
      return Promise.resolve()
    },
    resetContent() {
      // Use the format store to get the current format
      const formatStore = useFormatStore()
      const format = formatStore.format
      if (!format) return

      // Replace the content array with an array of nulls
      this._content = Array(format.body.rows * format.body.columns).fill(null)
    }
  },
})

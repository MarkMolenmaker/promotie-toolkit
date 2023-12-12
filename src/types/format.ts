export interface Format {
  id: string;
  name: string;
  orientation?: "p" | "portrait" | "l" | "landscape";
  unit?: "pt" | "px" | "in" | "mm" | "cm" | "ex" | "em" | "pc",
  format?: string | number[],
  width: number;
  height: number;
  headerHeight: number;
  margin: number;
  body: {
    margin: number;
    rows: number;
    columns: number;
    titleFontSize: number;
    subTitleFontSize: number;
    salePriceFontSize: number;
    priceFontSize: number;
    lineHeight: number;
    skewedBoxMargin: number;
    skewedBoxAngle: number;
    skewedBoxHeight: number;
    skewedBoxYOffset: number;
  }
}

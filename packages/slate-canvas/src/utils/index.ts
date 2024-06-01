import { CanvasOptionsType, defaultCanvasOptions } from './options';
export * from './options';

let accuracy: number = 1;

export let dpr: number = 2;
/**
 * set canvas accuracy
 * @param num
 * @param acy
 */
export function setAccuracy(num: number, acy?: number): number {
  accuracy = acy || accuracy;
  const devicePixelRatio = window.devicePixelRatio || 2;
  dpr = devicePixelRatio * accuracy;

  return num * dpr;
}

let fontStyleDefault: string = defaultCanvasOptions.fontStyle;
let fontVariantDefault: string = defaultCanvasOptions.fontVariant;
let fontWeightDefault: string = defaultCanvasOptions.fontWeight;
let fontSizeDefault: number = defaultCanvasOptions.fontSize;
let lineHeightDefault: string | number = defaultCanvasOptions.lineHeight;
let fontFamilyDefault: string = defaultCanvasOptions.fontFamily;

export function initCreateFontValue(
  handledCanvasOptions: CanvasOptionsType,
): string {
  fontStyleDefault = handledCanvasOptions.fontStyle || fontStyleDefault;
  fontVariantDefault = handledCanvasOptions.fontVariant || fontVariantDefault;
  fontWeightDefault = handledCanvasOptions.fontWeight || fontWeightDefault;
  fontSizeDefault = handledCanvasOptions.fontSize || fontSizeDefault;
  lineHeightDefault = handledCanvasOptions.lineHeight || lineHeightDefault;
  fontFamilyDefault = handledCanvasOptions.fontFamily || fontFamilyDefault;

  return `${fontStyleDefault} ${fontVariantDefault} ${fontWeightDefault} ${fontSizeDefault}px/${lineHeightDefault} ${fontFamilyDefault}`;
}

export function createFontValue(
  handledCanvasOptions: Partial<CanvasOptionsType>,
): string {
  const {
    fontStyle = fontStyleDefault,
    fontVariant = fontVariantDefault,
    fontWeight = fontWeightDefault,
    fontSize = fontSizeDefault,
    fontFamily = fontFamilyDefault,
  } = handledCanvasOptions;

  return `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px ${fontFamily}`;
}

export function findClosestIndex<T>(
  arr: T[],
  key: keyof T,
  value: number,
): number {
  let index = -1;
  for (let i = 0; i < arr.length; i++) {
    // @ts-ignore
    if (arr[i][key] <= value) {
      index = i;
    } else {
      break;
    }
  }
  return index;
}

import { CanvasOptionsType } from '@/utils';

export * from './options';

let accuracy: number = 1;
/**
 * set canvas accuracy
 * @param num
 * @param acy
 */
export function setAccuracy(num: number, acy?: number): number {
  accuracy = acy || accuracy;
  const devicePixelRatio = window.devicePixelRatio || 2;
  const dpr = devicePixelRatio * accuracy;

  return num * dpr;
}

export function createFontValue(
  handledCanvasOptions: CanvasOptionsType,
): string {
  const {
    fontStyle,
    fontVariant,
    fontWeight,
    fontSize,
    lineHeight,
    fontFamily,
  } = handledCanvasOptions;

  return `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px/${lineHeight} ${fontFamily}`;
}

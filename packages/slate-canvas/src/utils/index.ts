import { CanvasOptionsType, defaultCanvasOptions } from './options';
import { CanvasEditor } from '../plugin/canvas-editor';
import { DPR, ACCURACY, FONT_DEFAULT } from '../utils/weak-maps';

export * from './options';

export function getAccuracy(editor: CanvasEditor): number {
  return ACCURACY.get(editor) || 1;
}

export function getDPR(editor: CanvasEditor): number {
  return DPR.get(editor) || 2;
}

/**
 * set canvas accuracy
 * @param editor
 * @param num
 * @param acy
 */
export function setAccuracy(
  editor: CanvasEditor,
  num: number,
  acy?: number,
): number {
  acy = acy || getAccuracy(editor);
  ACCURACY.set(editor, acy);
  const devicePixelRatio = window.devicePixelRatio || 2;
  const dpr = devicePixelRatio * acy;
  DPR.set(editor, dpr);

  return num * dpr;
}

export function initCreateFontValue(
  editor: CanvasEditor,
  handledCanvasOptions: CanvasOptionsType,
): string {
  const fontStyleDefault =
    handledCanvasOptions.fontStyle || defaultCanvasOptions.fontStyle;
  const fontVariantDefault =
    handledCanvasOptions.fontVariant || defaultCanvasOptions.fontVariant;
  const fontWeightDefault =
    handledCanvasOptions.fontWeight || defaultCanvasOptions.fontWeight;
  const fontSizeDefault =
    handledCanvasOptions.fontSize || defaultCanvasOptions.fontSize;
  const lineHeightDefault =
    handledCanvasOptions.lineHeight || defaultCanvasOptions.lineHeight;
  const fontFamilyDefault =
    handledCanvasOptions.fontFamily || defaultCanvasOptions.fontFamily;

  FONT_DEFAULT.set(editor, {
    fontStyleDefault,
    fontVariantDefault,
    fontWeightDefault,
    fontSizeDefault,
    lineHeightDefault,
    fontFamilyDefault,
  });

  return `${fontStyleDefault} ${fontVariantDefault} ${fontWeightDefault} ${fontSizeDefault}px/${lineHeightDefault} ${fontFamilyDefault}`;
}

export function createFontValue(
  editor: CanvasEditor,
  options: Partial<CanvasOptionsType>,
): string {
  const fontDefault = FONT_DEFAULT.get(editor);
  const {
    fontStyle = fontDefault?.fontStyleDefault,
    fontVariant = fontDefault?.fontVariantDefault,
    fontWeight = fontDefault?.fontWeightDefault,
    fontSize = fontDefault?.fontSizeDefault,
    fontFamily = fontDefault?.fontFamilyDefault,
  } = options;

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

type ThrottledFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => void;

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ThrottledFunction<T> {
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(
        function () {
          if (Date.now() - lastRan >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        },
        limit - (Date.now() - lastRan),
      );
    }
  };
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

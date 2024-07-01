import { FontOffsetType, TextItemType } from '../types';
import { createOffscreenCanvas } from '../components/create-canvas';
import { CanvasEditor } from '../plugin/canvas-editor';
import { CanvasOptionsType } from '../utils/options';
import { initCreateFontValue } from '../utils/index';

/**
 * find selection offset
 * @param editor
 * @param handledCanvasOptions
 * @param section
 * @param currentSectionClickX current section click x
 * @param isLast If you know that the current is the last element in the section, you can calculate the last without the previous steps.
 */
export default function findOffset(
  editor: CanvasEditor,
  handledCanvasOptions: CanvasOptionsType,
  section: TextItemType,
  currentSectionClickX: number,
  isLast: boolean = false,
): FontOffsetType {
  const { ctx } = createOffscreenCanvas(editor, handledCanvasOptions);
  let fontHeight = handledCanvasOptions.fontSize;
  ctx.font = initCreateFontValue(editor, handledCanvasOptions);

  const { text, font, x } = section;
  font && (ctx.font = font);

  let index = 1;
  let left = x;
  let ascentDescentRatio = 1;

  if (isLast) {
    const {
      width,
      actualBoundingBoxDescent,
      actualBoundingBoxAscent,
    }: TextMetrics = ctx.measureText(text);
    return {
      offset: text.length,
      left: width + x,
      fontHeight: actualBoundingBoxDescent + actualBoundingBoxAscent,
      ascentDescentRatio: actualBoundingBoxAscent / actualBoundingBoxDescent,
    };
  }

  while (index <= text.length) {
    const currentText = text.slice(index - 1, index);
    const {
      width: currentTextWidth,
      actualBoundingBoxDescent: currentTextActualBoundingBoxDescent,
      actualBoundingBoxAscent: currentTextActualBoundingBoxAscent,
    }: TextMetrics = ctx.measureText(currentText);
    if (index === 1) {
      ascentDescentRatio =
        currentTextActualBoundingBoxAscent /
        currentTextActualBoundingBoxDescent;
      fontHeight =
        currentTextActualBoundingBoxDescent +
        currentTextActualBoundingBoxAscent;
      if (currentSectionClickX < currentTextWidth / 2) {
        break;
      } else if (
        currentSectionClickX >= currentTextWidth / 2 &&
        currentSectionClickX < currentTextWidth
      ) {
        left = x + currentTextWidth;
        index++;
        break;
      }
    }

    const t = text.slice(0, index);
    const {
      width: textWidth,
      actualBoundingBoxDescent: textActualBoundingBoxDescent,
      actualBoundingBoxAscent: textActualBoundingBoxAscent,
    }: TextMetrics = ctx.measureText(t);
    if (currentSectionClickX < textWidth - currentTextWidth / 2) {
      break;
    } else if (
      currentSectionClickX >= textWidth - currentTextWidth / 2 &&
      currentSectionClickX < textWidth
    ) {
      left = x + textWidth;
      ascentDescentRatio =
        textActualBoundingBoxAscent / textActualBoundingBoxDescent;
      fontHeight = textActualBoundingBoxDescent + textActualBoundingBoxAscent;
      index++;
      break;
    }
    ascentDescentRatio =
      textActualBoundingBoxAscent / textActualBoundingBoxDescent;
    fontHeight = textActualBoundingBoxDescent + textActualBoundingBoxAscent;
    left = x + textWidth;
    index++;
  }
  return {
    offset: index - 1,
    left,
    fontHeight,
    ascentDescentRatio,
  };
}

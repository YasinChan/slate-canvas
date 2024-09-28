import { CanvasEditor } from '../plugin/canvas-editor';
import { initCreateFontValue, CanvasOptionsType, getDPR } from '../utils';

export type CreateCanvasReturnType = {
  canvasWrapper: HTMLDivElement;
  textarea: HTMLTextAreaElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
};

export function createCanvas(
  editor: CanvasEditor,
  handledCanvasOptions: CanvasOptionsType,
): CreateCanvasReturnType {
  const { width, height, styleWidth, styleHeight, fontSize } =
    handledCanvasOptions;
  const dpr = getDPR(editor);

  const canvasWrapper = document.createElement('div');
  canvasWrapper.style.position = 'relative';
  canvasWrapper.style.width = styleWidth + 'px';
  canvasWrapper.style.height = styleHeight + 'px';

  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvasWrapper.appendChild(canvas);
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = styleWidth + 'px';
  canvas.style.height = styleHeight + 'px';
  canvas.style.cursor = 'text';

  const textarea: HTMLTextAreaElement = document.createElement('textarea');
  textarea.style.position = 'absolute';
  textarea.style.display = 'block';
  textarea.style.width = '1px';
  textarea.style.height = fontSize / dpr + 'px';
  textarea.style.left = '10px';
  textarea.style.top = '10px';
  textarea.style.resize = 'none';
  textarea.style.background = 'transparent';
  textarea.style.outline = 'none';
  textarea.style.border = 'none';
  textarea.style.transform = 'scale(1.2)';

  canvasWrapper.appendChild(textarea);

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  // ctx.textBaseline = 'middle';

  ctx.font = initCreateFontValue(editor, handledCanvasOptions);

  ctx.save();

  return { canvasWrapper, textarea, canvas, ctx };
}

/**
 * create offscreen canvas
 * @param editor
 * @param handledCanvasOptions
 */
export function createOffscreenCanvas(
  editor: CanvasEditor,
  handledCanvasOptions: CanvasOptionsType,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const { width, height, styleWidth, styleHeight } = handledCanvasOptions;

  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = styleWidth + 'px';
  canvas.style.height = styleHeight + 'px';

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  return { canvas, ctx };
}

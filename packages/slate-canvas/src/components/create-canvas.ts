import { BaseEditor } from 'slate';
import { initCreateFontValue, CanvasOptionsType } from '../utils';

export type CreateCanvasReturnType = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
};

export const createCanvas = (
  editor: BaseEditor,
  handledCanvasOptions: CanvasOptionsType,
): CreateCanvasReturnType => {
  const { width, height, styleWidth, styleHeight } = handledCanvasOptions;

  const canvasWrapper = document.createElement('div');
  canvasWrapper.style.width = styleWidth + 'px';
  canvasWrapper.style.height = styleHeight + 'px';

  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvasWrapper.appendChild(canvas);
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = styleWidth + 'px';
  canvas.style.height = styleHeight + 'px';

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  // ctx.textBaseline = 'middle';

  ctx.font = initCreateFontValue(handledCanvasOptions);

  ctx.save();

  return { canvas, ctx };
};

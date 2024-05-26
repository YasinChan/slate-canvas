import { BaseEditor } from 'slate';
import { createFontValue, CanvasOptionsType } from '../utils';

export type CreateCanvasReturnType = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
};

export const createCanvas = (
  editor: BaseEditor,
  handledCanvasOptions: CanvasOptionsType,
): CreateCanvasReturnType => {
  const { width, height, styleWidth, styleHeight } = handledCanvasOptions;

  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = styleWidth + 'px';
  canvas.style.height = styleHeight + 'px';

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  ctx.textBaseline = 'middle';

  ctx.font = createFontValue(handledCanvasOptions);

  return { canvas, ctx };
};

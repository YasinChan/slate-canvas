import { BaseEditor } from 'slate';
import { setAccuracy, defaultCanvasOptions, CanvasOptionsType } from '@/utils';

export type CreateCanvasReturnType = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
};

export const createCanvas = (
  editor: BaseEditor,
  canvasOptions: Partial<CanvasOptionsType>,
): CreateCanvasReturnType => {
  const { width, height, fontFamily, fontSize } = Object.assign(
    defaultCanvasOptions,
    canvasOptions,
  );

  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = setAccuracy(width);
  canvas.height = setAccuracy(height);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  ctx.font = `${setAccuracy(fontSize)}px ${fontFamily}`;

  return { canvas, ctx };
};

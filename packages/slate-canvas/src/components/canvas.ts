export default (text: string): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 100 * devicePixelRatio;
  canvas.height = 100 * devicePixelRatio;
  canvas.style.width = '100px';
  canvas.style.height = '100px';
  canvas.style.border = '1px solid #000';
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.font = `${16 * devicePixelRatio}px serif`;
  ctx.fillText(text, 10, 50);
  return canvas;
};

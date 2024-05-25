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
  console.log('----------', 'accuracy', accuracy, '----------cyy log');
  return num * dpr;
}

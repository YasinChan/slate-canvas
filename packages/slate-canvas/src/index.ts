import canvas from './components/canvas';

export function CreateCanvas(text: string): void {
  document.body.append(canvas(text));
}

import { BaseText } from 'slate';
import { SlateCanvasTextType, SlateCanvasElementType } from 'slate-canvas';

declare module 'slate' {
  interface CustomTypes {
    Element: SlateCanvasElementType;
    Text: BaseText | SlateCanvasTextType;
  }
}

declare global {}

export {};

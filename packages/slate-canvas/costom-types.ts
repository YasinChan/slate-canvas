import { BaseText } from 'slate';
import { CanvasEditor } from './src/plugin/canvas-editor';
import { SlateCanvasElementType, SlateCanvasTextType } from './src/types';

declare module 'slate' {
  interface CustomTypes {
    Editor: CanvasEditor;
    Element: SlateCanvasElementType;
    Text: SlateCanvasTextType | BaseText;
  }
}

declare global {}

export {};

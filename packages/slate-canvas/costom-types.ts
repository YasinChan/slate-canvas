import { Descendant, BaseText } from 'slate';
import { CanvasEditor } from './src/plugin/canvas-editor';

type CustomElement = {
  type: string;
  id?: string | number;
  children: Descendant[];
};

type CustomText = {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  size?: number;
  text: string;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: CanvasEditor;
    Element: CustomElement;
    Text: CustomText | BaseText;
  }
}

declare global {}

export {};

import { BaseRange, BaseText } from 'slate';
import { CanvasEditor } from './plugin/canvas-editor';

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
    Text: CustomText | BaseText;
  }
}

declare global {}

export {};

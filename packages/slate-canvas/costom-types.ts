import { BaseEditor } from 'slate';
import { CanvasEditor } from './src';

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & CanvasEditor;
  }
}

declare global {}

export {};

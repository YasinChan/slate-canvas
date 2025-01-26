// This example is for an Editor with `ReactEditor` and `HistoryEditor`
import { BaseEditor, BaseText, BaseElement } from 'slate';
import { CanvasEditor } from 'slate-canvas';

type CustomElement = BaseElement & {
  type: 'paragraph';
  children: CustomText[];
};
type CustomText = BaseText & { bold?: true; size?: number };

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & CanvasEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

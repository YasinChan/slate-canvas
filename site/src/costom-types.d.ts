import { BaseText, Descendant } from 'slate';

interface CustomElement {
  type: string;
  url?: string;
  id?: string | number;
  children: Descendant[];
}

interface CustomText {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  size?: number;
  text: string;
}

declare module 'slate' {
  interface CustomTypes {
    Element: CustomElement;
    Text: BaseText | CustomText;
  }
}

declare global {}

export {}

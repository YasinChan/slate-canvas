import { Descendant } from 'slate';

export type SlateCanvasElementType = {
  type: string;
  id?: string | number;
  children: Descendant[];
};

export type SlateCanvasTextType = {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  size?: number;
  text: string;
};

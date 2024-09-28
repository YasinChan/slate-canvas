import { BaseText, Descendant } from 'slate';

export type CustomDescendant = SlateCanvasElementType | SlateCanvasTextType;
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

export type TextItemType = {
  text: string;
  font?: string;
  fontSize?: number;
  x: number;
  width: number;
  realPath: number[];
  index: number; // Since the canvas is rendered on a row-by-row basis,
  // the index at the beginning of the row that corresponds to this segment is recorded here.
};
export type LinesType = {
  baseLineY: number; // The relative vertical position of the calculated baseline based on `textBaseline: alphabetic` to the top of the canvas.
  topY: number; // The relative vertical position of this line top to the top of the canvas.
  height: number; // The height of this line
  items: TextItemType[];
  realPath: number[];
};
export type CursorLocationInfoType = {
  offset: number;
  line: number;
  section: TextItemType;
  left: number;
  fontHeight: number;
  ascentDescentRatio: number;
};

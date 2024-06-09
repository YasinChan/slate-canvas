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

export type TextItemType = {
  text: string;
  font?: string;
  fontSize?: number;
  x: number;
  realPath: number[];
  index: number;
};
export type LinesType = {
  baseLineY: number; // The relative vertical position of the calculated baseline based on `textBaseline: alphabetic` to the top of the canvas.
  topY: number; // The relative vertical position of this line top to the top of the canvas.
  height: number; // The height of this line
  items: TextItemType[];
  realPath: number[];
};
export type FontOffsetType = {
  offset: number;
  left: number;
  fontHeight: number;
  ascentDescentRatio: number;
};

export type PositionInfoType = {
  line: number;
  section: TextItemType;
  left: number;
  ascentDescentRatio: number;
};

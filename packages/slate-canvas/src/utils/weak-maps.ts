import { Editor, Point } from 'slate';
import { PositionInfoType } from '../types';

export const IS_FOCUSED: WeakMap<Editor, boolean> = new WeakMap();

export const POINT_TO_POSITION: WeakMap<Point, PositionInfoType> =
  new WeakMap();

export const ACCURACY: WeakMap<Editor, number> = new WeakMap();

export const DPR: WeakMap<Editor, number> = new WeakMap();

export const FONT_DEFAULT: WeakMap<
  Editor,
  {
    fontStyleDefault: string;
    fontVariantDefault: string;
    fontWeightDefault: string;
    fontSizeDefault: number;
    lineHeightDefault: string | number;
    fontFamilyDefault: string;
  }
> = new WeakMap();

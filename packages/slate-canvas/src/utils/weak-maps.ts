import { Editor, Operation } from 'slate';

export const IS_FOCUSED: WeakMap<Editor, boolean> = new WeakMap();

// a paragraph is being selected or not
export const IS_RANGING: WeakMap<Editor, boolean> = new WeakMap();

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

export const EDITOR_TO_ON_CHANGE = new WeakMap<
  Editor,
  (options?: { operation?: Operation }) => void
>()
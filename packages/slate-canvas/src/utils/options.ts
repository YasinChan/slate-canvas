import { type Descendant } from 'slate';

export type setAccuracyCanvasOptionKeys =
  | 'width'
  | 'height'
  | 'fontSize'
  | 'padding'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft';

export type setAccuracyCanvasOptions = {
  [key in setAccuracyCanvasOptionKeys]: number;
};

export type CanvasOptionsType = setAccuracyCanvasOptions & {
  styleWidth: number;
  styleHeight: number;
  accuracy: number;
  fontVariant: string;
  fontFamily: string;
  fontWeight: string;
  lineHeight: number | string; // 1.5 or '20px'
  fontStyle: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  color: string;
  backgroundColor: string;
  text: string;
};

export interface OptionsType {
  canvasOptions: Partial<CanvasOptionsType>;
  initialValue: Descendant[];
}

export const defaultCanvasOptions: CanvasOptionsType = {
  width: 200,
  height: 200,
  styleWidth: 100,
  styleHeight: 100,
  accuracy: 1,
  fontSize: 16,
  fontVariant: 'normal',
  fontFamily: 'sans-serif',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'center',
  textBaseline: 'middle',
  color: '#000',
  backgroundColor: '#fff',
  lineHeight: 1.5,
  text: '',
  padding: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
};

export const setAccuracyCanvasOptions: setAccuracyCanvasOptionKeys[] = [
  'width',
  'height',
  'fontSize',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
];

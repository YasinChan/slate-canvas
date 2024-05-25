import { Descendant } from 'slate';

export type CanvasOptionsType = {
  width: number;
  height: number;
  accuracy: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  color: string;
  backgroundColor: string;
  lineHeight: number;
  text: string;
  padding: number;
};

export interface OptionsType {
  canvasOptions?: Partial<CanvasOptionsType>;
  initialValue: Descendant[];
}

export const defaultCanvasOptions: CanvasOptionsType = {
  width: 100,
  height: 100,
  accuracy: 1,
  fontSize: 16,
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'center',
  textBaseline: 'middle',
  color: '#000',
  backgroundColor: '#fff',
  lineHeight: 1.5,
  text: '',
  padding: 20,
};

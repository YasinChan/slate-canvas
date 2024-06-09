import { Editor, Point } from 'slate';
import { PositionInfoType } from '../types';

export const IS_FOCUSED: WeakMap<Editor, boolean> = new WeakMap();

export const POINT_TO_POSITION: WeakMap<Point, PositionInfoType> =
  new WeakMap();

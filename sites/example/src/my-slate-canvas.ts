import SlateCanvas, { type OptionsType } from 'slate-canvas';
import { Editor } from 'slate';
import BoldComponent from './components/bold-component';
import SizeComponent from './components/size-component';

export class MySlateCanvas extends SlateCanvas {
  constructor(editor: Editor, options: OptionsType) {
    const components = [new BoldComponent(), new SizeComponent()];
    super(editor, options, components);
  }
}

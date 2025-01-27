import { type CanvasOptionsType, FontBase, setAccuracy } from 'slate-canvas';
import { BaseEditor, Descendant } from 'slate';

export default class SizeComponent extends FontBase {
  public readonly id = 'size';

  initialize(): void {
    // initialize
  }

  render(
    editor: BaseEditor,
    fontObj: Partial<CanvasOptionsType>,
    child: Descendant,
  ) {
    fontObj['fontSize'] = setAccuracy(editor, child.size);
    return fontObj;
  }
}

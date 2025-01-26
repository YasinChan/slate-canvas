import { type CanvasOptionsType, FontBase, setAccuracy } from 'slate-canvas';
import { BaseEditor, Descendant } from 'slate';

export default class SizeComponent extends FontBase {
  public readonly id = 'size';
  initialize(): void {
    // 实现初始化逻辑
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

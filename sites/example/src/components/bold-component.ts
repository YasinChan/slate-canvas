import { FontBase, type CanvasOptionsType } from 'slate-canvas';
import { BaseEditor } from 'slate';

export default class BoldComponent extends FontBase {
  public readonly id = 'bold';

  initialize(): void {
    // 实现初始化逻辑
  }

  render(_editor: BaseEditor, fontObj: Partial<CanvasOptionsType>) {
    fontObj['fontWeight'] = 'bold';
    return fontObj;
  }
}

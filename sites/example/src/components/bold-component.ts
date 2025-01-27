import { FontBase, type CanvasOptionsType, type PluginProviders } from 'slate-canvas';
import { BaseEditor, Editor } from 'slate';

export default class BoldComponent extends FontBase {
  public readonly id = 'bold';

  initialize(): void {}

  render(_editor: BaseEditor, fontObj: Partial<CanvasOptionsType>) {
    fontObj['fontWeight'] = 'bold';
    return fontObj;
  }
}

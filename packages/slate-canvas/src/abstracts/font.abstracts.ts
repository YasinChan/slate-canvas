import { BaseEditor, Descendant } from 'slate';
import { PluginProviders } from '@/types';
import { CanvasOptionsType } from '@/utils/options';

export default abstract class FontBase {
  public abstract readonly id: string;
  public type = 'font';

  public abstract initialize(providers: PluginProviders): Promise<void> | void;

  public abstract render(editor: BaseEditor, fontObj: Partial<CanvasOptionsType>, child: Descendant): Partial<CanvasOptionsType>;
}

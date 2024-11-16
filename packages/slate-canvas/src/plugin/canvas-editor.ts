import { BaseEditor } from 'slate';

import { IS_FOCUSED } from '../utils/weak-maps';

export interface CanvasEditor extends BaseEditor {}

export interface CanvasEditorInterface {
  /**
   * Focus the editor.
   */
  focus: (editor: CanvasEditor) => void;
  /**
   * Blur the editor.
   */
  blur: (editor: CanvasEditor) => void;
}

export const CanvasEditor: CanvasEditorInterface = {
  focus(editor: CanvasEditor) {
    // Return if already focused
    if (IS_FOCUSED.get(editor)) {
      return;
    }
    IS_FOCUSED.set(editor, true);
  },
  blur(editor: CanvasEditor) {
    IS_FOCUSED.set(editor, false);
  },
};

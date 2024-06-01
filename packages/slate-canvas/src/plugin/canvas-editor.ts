import { BaseEditor } from 'slate';

import { IS_FOCUSED } from '@/utils/weak-maps';

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
    console.log('----------', 'focus', 1, '----------cyy log');
    IS_FOCUSED.set(editor, true);
  },
  blur(editor: CanvasEditor) {
    console.log('----------', 'blur', 1, '----------cyy log');
    IS_FOCUSED.set(editor, false);
  },
  // toSlateRange([path]) {
  //   return {
  //     anchor: {
  //       path: [1, 0],
  //       offset: 4,
  //     },
  //     focus: {
  //       path: [1, 2],
  //       offset: 38,
  //     },
  //   };
  // },
};

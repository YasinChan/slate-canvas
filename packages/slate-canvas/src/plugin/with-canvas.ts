import { BaseEditor, Operation } from 'slate';
import { EDITOR_TO_ON_CHANGE } from '@/utils/weak-maps';

export const withCanvas = <T extends BaseEditor>(editor: T): T => {
  const { apply, onChange } = editor;
  editor.apply = (op: Operation) => {
    // todo
    apply(op);
  };

  editor.onChange = options => {
    const onContextChange = EDITOR_TO_ON_CHANGE.get(editor);

    if (onContextChange) {
      onContextChange(options)
    }

    onChange(options);
  }
  return editor;
};

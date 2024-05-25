import { BaseEditor, Operation } from 'slate';

export const withCanvas = <T extends BaseEditor>(editor: T): T => {
  const { apply } = editor;
  editor.apply = (op: Operation) => {
    // todo
    apply(op);
  };
  return editor;
};

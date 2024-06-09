import { BaseEditor, Operation } from 'slate';

export const withCanvas = <T extends BaseEditor>(editor: T): T => {
  const { apply, onChange } = editor;
  editor.apply = (op: Operation) => {
    // todo
    apply(op);
  };
  editor.onChange = (options) => {
    console.log('onChange');
    onChange(options);
  };
  return editor;
};

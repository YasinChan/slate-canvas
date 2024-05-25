import { Editor, Node, Scrubber, BaseEditor, Descendant } from 'slate';
import { createCanvas } from '@/components/create-canvas';

import {
  setAccuracy,
  defaultCanvasOptions,
  OptionsType,
  CanvasOptionsType,
} from '@/utils';

export class SlateCanvas {
  public canvasOptions: Partial<CanvasOptionsType>;
  public initialValue: Descendant[];
  private canvas: HTMLCanvasElement | undefined = undefined;
  private ctx: CanvasRenderingContext2D | undefined = undefined;

  constructor(
    public editor: BaseEditor,
    public options: OptionsType,
  ) {
    this.editor = editor;
    this.options = options;

    console.log('----------', 'editor', this.editor, '----------cyy log');
    console.log('----------', 'options', this.options, '----------cyy log');

    this.initialValue = options.initialValue;

    this.canvasOptions = Object.assign(
      defaultCanvasOptions,
      options.canvasOptions,
    );

    setAccuracy(1, this.canvasOptions.accuracy);

    this.check();
    this.init();
  }

  init() {
    const { canvas, ctx } = createCanvas(this.editor, this.canvasOptions);
    this.canvas = canvas;
    this.ctx = ctx;

    // this.initialValue.forEach(item => {
    //   if ('children' in item) {
    //     console.log(item.children); // 这里 TypeScript 知道 item 是 Element 类型
    //   } else {
    //     console.log(item.text); // 这里 TypeScript 知道 item 是 Text 类型
    //   }
    // });
    if ('children' in this.initialValue[0]) {
      if ('text' in this.initialValue[0].children[0]) {
        ctx.fillText(
          this.initialValue[0].children[0]?.text,
          setAccuracy(10),
          setAccuracy(50),
        );
      }
    }
  }

  check() {
    if (!Node.isNodeList(this.initialValue)) {
      throw new Error(
        `[Slate] initialValue is invalid! Expected a list of elements but got: ${Scrubber.stringify(
          this.initialValue,
        )}`,
      );
    }
    if (!Editor.isEditor(this.editor)) {
      throw new Error(
        `[Slate] editor is invalid! You passed: ${Scrubber.stringify(this.editor)}`,
      );
    }
  }

  getCanvas() {
    return this.canvas;
  }

  getCtx() {
    return this.ctx;
  }
}

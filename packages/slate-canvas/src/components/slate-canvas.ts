import { Editor, Node, Scrubber, BaseEditor, Descendant } from 'slate';
import { createCanvas } from '../components/create-canvas';

import {
  setAccuracy,
  defaultCanvasOptions,
  setAccuracyCanvasOptions,
  createFontValue,
  OptionsType,
  CanvasOptionsType,
} from '../utils';

export class SlateCanvas {
  public canvasOptions: Partial<CanvasOptionsType> = {};
  public initialValue: Descendant[];
  private canvas: HTMLCanvasElement | undefined = undefined;
  private ctx: CanvasRenderingContext2D | undefined = undefined;
  private handledCanvasOptions: CanvasOptionsType = defaultCanvasOptions; // Converts the values in `canvasOptions` in `options` by precision.
  private initialPosition: { x: number; y: number } = { x: 0, y: 0 }; // The position at which to initially start rendering the content
  private contentSize: { width: number; height: number } = {
    width: 0,
    height: 0,
  }; // Minus padding content size
  private currentRenderMiddlePosition: { x: number; y: number } = {
    x: 0,
    y: 0,
  }; // The middle position of the current rendering area
  private lines: any[] = []; // Record the rendering information of each line

  constructor(
    public editor: BaseEditor,
    public options: OptionsType,
  ) {
    this.editor = editor;
    this.options = options;

    console.log('----------', 'editor', this.editor, '----------cyy log');
    console.log('----------', 'options', this.options, '----------cyy log');

    this.initialValue = options.initialValue;

    this.check();
    this.optionsHandler();
    this.init();
  }

  /**
   * check initialValue and editor
   */
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

  /**
   * Numeric information in canvas settings requires accuracy conversion.
   */
  optionsHandler() {
    this.canvasOptions = Object.assign(
      defaultCanvasOptions,
      this.options.canvasOptions,
    );
    const accuracy = this.canvasOptions.accuracy;
    // Set canvas accuracy.
    setAccuracy(1, accuracy);

    setAccuracyCanvasOptions.forEach((key) => {
      if (this.canvasOptions[key] !== undefined) {
        if (key === 'width') {
          this.handledCanvasOptions['styleWidth'] = this.canvasOptions[
            key
          ] as number;
        }
        if (key === 'height') {
          this.handledCanvasOptions['styleHeight'] = this.canvasOptions[
            key
          ] as number;
        }
        this.handledCanvasOptions[key] = setAccuracy(
          this.canvasOptions[key] as number,
        );
      }
    });
  }

  init() {
    const { canvas, ctx } = createCanvas(
      this.editor,
      this.handledCanvasOptions,
    );
    this.canvas = canvas;
    this.ctx = ctx;

    this.render();
  }

  reset() {
    if (!this.ctx) {
      return;
    }
    this.ctx.font = createFontValue({});
  }

  render() {
    const paddingTop =
      this.handledCanvasOptions.paddingTop ||
      this.handledCanvasOptions.padding ||
      20;
    const paddingLeft =
      this.handledCanvasOptions.paddingLeft ||
      this.handledCanvasOptions.padding ||
      20;
    this.initialPosition = {
      x: paddingLeft,
      y: paddingTop,
    };
    this.contentSize = {
      width: this.handledCanvasOptions.width - paddingLeft * 2,
      height: this.handledCanvasOptions.height - paddingTop * 2,
    };

    this.initialValue.forEach((item) => {
      this.reset();
      if ('children' in item) {
        item.children.forEach((child) => {
          if ('bold' in child) {
            this.ctx!.font = createFontValue({
              fontWeight: 'bold',
            });
          }
          if ('text' in child) {
            this.calculateLines(child.text);
            // this.fillText(child.text);
          }
        });
      }
    });
    if ('children' in this.initialValue[0]) {
      if ('text' in this.initialValue[0].children[0]) {
        const t = this.initialValue[0].children[0]?.text;
        this.fillText(t);
      }
    }
  }

  calculateLines(text: string) {
    if (!this.ctx) {
      return;
    }
    const {
      width,
      actualBoundingBoxAscent,
      actualBoundingBoxDescent,
    }: TextMetrics = this.ctx.measureText(text);

    console.log(
      '----------',
      'this.ctx.measureText(text)',
      this.ctx.measureText(text),
      '----------cyy log',
    );

    const { width: contentWidth, height: contentHeight } = this.contentSize;

    // real text height, see https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
    const textHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
    let lineHeight = this.handledCanvasOptions.lineHeight;
    if (typeof lineHeight === 'number') {
      // like 1.5
      lineHeight = lineHeight * textHeight;
    }
    if (typeof lineHeight === 'string') {
      // like '20px'
      lineHeight = setAccuracy(Number(lineHeight.replace('px', '')));
    }

    const textPosition = {
      x: this.initialPosition.x,
      y: this.initialPosition.y + lineHeight / 2,
    };

    if (width <= contentWidth) {
      this.lines.push({
        text,
        textPosition,
      });
    } else {
      let splitLength = 0; // one line text length;
      const ratio = contentWidth / width;
      const textLength = text.length;
      const aboutLength = Math.round(textLength * ratio);

      const { width: beforeWidth } = this.ctx.measureText(
        text.substring(0, aboutLength),
      );

      if (beforeWidth <= contentWidth) {
        let w = beforeWidth;
        let i = aboutLength;
        while (w <= contentWidth) {
          const { width: newBeforeWidth } = this.ctx.measureText(
            text.substring(0, ++i),
          );
          w = newBeforeWidth;
        }
        splitLength = i - 1;
      } else {
        let w = beforeWidth;
        let i = aboutLength;
        while (w > contentWidth) {
          const { width: newBeforeWidth } = this.ctx.measureText(
            text.substring(0, --i),
          );
          w = newBeforeWidth;
        }
        splitLength = i + 1;
      }
      this.lines.push({
        text: text.substring(0, splitLength),
        textPosition,
      });
      this.lines.push({
        text: text.substring(splitLength),
        textPosition: {
          x: textPosition.x,
          y: textPosition.y + lineHeight,
        },
      });
    }
    this.lines.forEach((line) => {
      this.ctx!.fillText(line.text, line.textPosition.x, line.textPosition.y);
    });

    // this.ctx.save();
    // this.ctx.beginPath();
    // this.ctx.moveTo(
    //   this.initialPosition.x,
    //   this.initialPosition.y + lineHeight,
    // );
    // this.ctx.lineTo(
    //   this.initialPosition.x + width,
    //   this.initialPosition.y + lineHeight,
    // );
    // this.ctx.stroke();
    // this.ctx.restore();
  }

  fillText(text: string) {
    if (!this.ctx) {
      return;
    }
  }

  getCanvas() {
    return this.canvas;
  }

  getCtx() {
    return this.ctx;
  }
}

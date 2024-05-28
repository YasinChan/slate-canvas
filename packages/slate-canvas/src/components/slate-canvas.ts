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

type TextItemType = {
  text: string;
  font?: string;
  x: number;
};
type LinesType = {
  baseLineY: number; // The relative vertical position of the calculated baseline based on `textBaseline: alphabetic` to the top of the canvas.
  topY: number; // The relative vertical position of this line top to the top of the canvas.
  height: number; // The height of this line
  items: TextItemType[];
};

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
  private currentRenderingBaselineX: number = 0;
  private currentLineMaxBaseLineY: number = 0;
  private currentLineIndex: number = -1; // index of lines currently being rendered
  private lines: LinesType[] = []; // Record the rendering information of each line
  private isJustBreakLine: boolean = true; // this is a flag whether a line break has just been completed

  constructor(
    public editor: BaseEditor,
    public options: OptionsType,
  ) {
    this.editor = editor;
    this.options = options;

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
    this.ctx!.restore();
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
    this.currentRenderingBaselineX = paddingLeft;
    this.contentSize = {
      width: this.handledCanvasOptions.width - paddingLeft * 2,
      height: this.handledCanvasOptions.height - paddingTop * 2,
    };

    this.initialValue.forEach((item) => {
      this.reset();
      this.currentLineIndex++;
      this.isJustBreakLine = true;
      if ('children' in item) {
        item.children.forEach((child) => {
          this.reset();
          let font = '';
          if ('bold' in child) {
            this.ctx!.save();
            font = createFontValue({
              fontWeight: 'bold',
              fontSize: 60,
            });
            // this.ctx!.font = font;
          }
          if ('text' in child) {
            const info: { font?: string } = {};
            font && (info['font'] = font);
            this.calculateLines(child.text, info);
          }
        });
      }
    });

    console.log('----------', 'this.lines', this.lines, '----------cyy log');
    this.ctx!.restore();
    this.lines.forEach((line) => {
      line.items.forEach((lineItem: any) => {
        this.ctx!.restore();
        // this.ctx!.font = '';
        if (lineItem.font) {
          this.ctx!.save();
          this.ctx!.font = lineItem.font;
        }
        this.ctx!.fillText(lineItem.text, lineItem.x, line.baseLineY);
      });
    });

    if ('children' in this.initialValue[0]) {
      if ('text' in this.initialValue[0].children[0]) {
        const t = this.initialValue[0].children[0]?.text;
        this.fillText(t);
      }
    }
  }

  calculateLines(
    text: string,
    info: { font?: string } = {},
    recursive: boolean = false,
  ) {
    if (!this.ctx) {
      return;
    }
    info.font && (this.ctx.font = info.font);

    const {
      width,
      actualBoundingBoxAscent,
      actualBoundingBoxDescent,
    }: TextMetrics = this.ctx.measureText(text);

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

    // `textY` is the relative vertical position of the calculated baseline based on `textBaseline: alphabetic` in this line.
    const textY: number =
      (lineHeight - textHeight) / 2 + actualBoundingBoxAscent;

    this.currentLineMaxBaseLineY = Math.max(
      this.currentLineMaxBaseLineY,
      textY,
    );

    let baseLineY: number; // record the baseLineY of the current line
    if (this.currentLineIndex === 0) {
      baseLineY = this.initialPosition.y + this.currentLineMaxBaseLineY;
    } else {
      const lastLine = this.lines[this.currentLineIndex - 1];
      baseLineY =
        lastLine.topY + lastLine.height + this.currentLineMaxBaseLineY;
    }

    let splitLength: number;
    if (this.isJustBreakLine) {
      // New line, so rendering from the beginning of the line.
      this.isJustBreakLine = false;

      this.currentRenderingBaselineX = this.initialPosition.x;

      splitLength = this.getSplitLength(contentWidth, width, text);
    } else {
      // Keep rendering on this line.
      const leftWidth =
        contentWidth -
        (this.currentRenderingBaselineX - this.initialPosition.x);
      splitLength = this.getSplitLength(leftWidth, width, text);
    }

    this.lines[this.currentLineIndex] = this.lines[this.currentLineIndex] || {
      baseLineY: 0,
      topY: 0,
      height: 0,
      items: [],
    };

    this.lines[this.currentLineIndex].items.push(
      Object.assign(
        {
          text: text.substring(0, splitLength),
          x: this.currentRenderingBaselineX,
        },
        info,
      ),
    );

    // set current line baseLineY
    this.lines[this.currentLineIndex].baseLineY = Math.max(
      this.lines[this.currentLineIndex].baseLineY,
      baseLineY,
    );

    // set current line height
    this.lines[this.currentLineIndex].height = Math.max(
      this.lines[this.currentLineIndex].height,
      lineHeight,
    );

    // set current line topY
    if (this.currentLineIndex === 0) {
      this.lines[0].topY = this.initialPosition.y;
    } else {
      this.lines[this.currentLineIndex].topY =
        this.lines[this.currentLineIndex - 1].topY +
        this.lines[this.currentLineIndex - 1].height;
    }

    if (splitLength === text.length) {
      // this means the text can all be rendered in this line.
      this.currentRenderingBaselineX += width;
    } else {
      this.currentLineIndex++;
      this.isJustBreakLine = true;
      this.calculateLines(text.substring(splitLength), info, true);
    }

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

  /**
   * When the word width is greater than the content width,
   * an algorithm to derive how many length of characters can be rendered in a line
   * @param contentWidth
   * @param width
   * @param text
   */
  getSplitLength(contentWidth: number, width: number, text: string): number {
    if (!this.ctx) {
      return 0;
    }

    const textLength = text.length;

    if (width <= contentWidth) {
      return textLength;
    }

    let splitLength = 0; // one line text length;
    const ratio = contentWidth / width;
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
      splitLength = i;
    }
    return splitLength;
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

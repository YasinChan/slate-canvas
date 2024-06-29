import {
  Editor,
  Node,
  Path,
  Point,
  Scrubber,
  Transforms,
  BaseEditor,
  Descendant,
} from 'slate';
import { createCanvas, createOffscreenCanvas } from '../components/create-canvas';

import {
  setAccuracy,
  defaultCanvasOptions,
  setAccuracyCanvasOptions,
  createFontValue,
  initCreateFontValue,
  dpr,
  throttle,
  findClosestIndex,
  OptionsType,
  CanvasOptionsType,
} from '../utils';

import { IS_FOCUSED } from '../utils/weak-maps';

import { KEY_CODE_ENUM } from '../config/key';

import {
  TextItemType,
  LinesType,
  FontOffsetType,
  PositionInfoType,
} from '../types';

export class SlateCanvas {
  public canvasOptions: Partial<CanvasOptionsType> = {};
  public initialValue: Descendant[];
  private readonly canvasWrapper: HTMLDivElement;
  private readonly textarea: HTMLTextAreaElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  // for render word
  private readonly wordOffscreenCanvas: HTMLCanvasElement;
  private readonly wordOffscreenCtx: CanvasRenderingContext2D;

  // for render range
  private readonly rangeOffscreenCanvas: HTMLCanvasElement;
  private readonly rangeOffscreenCtx: CanvasRenderingContext2D;

  // Converts the values in `canvasOptions` in `options` by precision.
  private handledCanvasOptions: CanvasOptionsType = defaultCanvasOptions;
  // The position at which to initially start rendering the content
  private initialPosition: { x: number; y: number } = { x: 0, y: 0 };
  // Minus padding content size
  private contentSize: { width: number; height: number } = {
    width: 0,
    height: 0,
  };
  private currentRenderingBaselineX: number = 0;
  private currentLineMaxBaseLineY: number = 0;
  // index of lines currently being rendered
  private currentLineIndex: number = -1;

  // the rendering paragraph
  private currentParagraph: number = -1;
  // the rendering section in current paragraph
  private currentParagraphSection: number = -1;
  // In Slate, it’s necessary to track the `selection`, which corresponds to the paragraph index in the DOM.
  // Unlike DOM rendering, where text automatically wraps and maintains its position within a paragraph,
  // canvas rendering requires manual calculation of how much text fits on each line.
  // This means we need to keep track of the current content
  // being rendered on the canvas and map it to the correct paragraph index as it would appear in the DOM.
  // This ensures that selections and other text manipulations in Slate accurately reflect the text's position within the DOM structure.
  // These are for `realPath`.

  // Record the rendering information of each line
  private lines: LinesType[] = [];
  // this is a flag whether a line break has just been completed
  private isJustBreakLine: boolean = true;

  private isMouseDown: boolean = false;
  private cursorPosition: PositionInfoType | undefined = undefined;
  private selectionRange:
    | {
    start: PositionInfoType;
    end: PositionInfoType;
  }
    | undefined = undefined;

  // when mousedown, record current point.
  private currentAnchor: Point | undefined = undefined;

  constructor(
    public editor: BaseEditor,
    public options: OptionsType,
  ) {
    this.editor = editor;
    this.options = options;

    this.initialValue = options.initialValue;

    this.check();
    this.optionsHandler();

    const { canvasWrapper, textarea, canvas, ctx } = createCanvas(
      this.editor,
      this.handledCanvasOptions,
    );
    this.canvasWrapper = canvasWrapper;
    this.textarea = textarea;
    this.canvas = canvas;
    this.ctx = ctx;

    const { canvas: wordOffscreenCanvas, ctx: wordeOffscreenCtx } = createOffscreenCanvas(this.editor, this.handledCanvasOptions);
    this.wordOffscreenCanvas = wordOffscreenCanvas;
    this.wordOffscreenCtx = wordeOffscreenCtx;

    const { canvas: rangeOffscreenCanvas, ctx: rangeOffscreenCtx } = createOffscreenCanvas(this.editor, this.handledCanvasOptions);
    this.rangeOffscreenCanvas = rangeOffscreenCanvas;
    this.rangeOffscreenCtx = rangeOffscreenCtx;

    this.init();
    this.listen();
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
    this.editor.children = this.initialValue;
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
    this.render();

    this.onChange();
  }

  listen() {
    document.body.addEventListener('keydown', (e: KeyboardEvent) => {
      const isFocus = IS_FOCUSED.get(this.editor);
      if (!isFocus) {
        return;
      }
      if (e.code === KEY_CODE_ENUM['ARROW_LEFT']) {
        Transforms.move(this.editor, { distance: 1, reverse: true });
      }
      if (e.code === KEY_CODE_ENUM['ARROW_RIGHT']) {
        Transforms.move(this.editor, { distance: 1, reverse: false });
      }
    });

    this.textarea.addEventListener('blur', () => {
      IS_FOCUSED.delete(this.editor);
    });

    this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      this.isMouseDown = true;
      const { section, line, offsetInfo } = this.onMouseEvent(e);

      const { offset } = offsetInfo;

      this.currentAnchor = {
        path: section.realPath,
        offset: section.index + offset,
      };

      const selection = {
        anchor: this.currentAnchor,
        focus: this.currentAnchor,
      };

      Transforms.select(this.editor, selection);

      // this.cursorPosition = {
      //   line,
      //   section,
      //   left,
      //   ascentDescentRatio,
      // };
      // this.selectionRange = {
      //   start: {
      //     line,
      //     section,
      //     left,
      //     ascentDescentRatio,
      //   },
      //   end: {
      //     line,
      //     section,
      //     left,
      //     ascentDescentRatio,
      //   },
      // };
    });

    document.body.addEventListener(
      'mousemove',
      throttle((e: MouseEvent) => {
        if (!this.isMouseDown) {
          return;
        }

        if (e.target !== this.canvas) {
          return;
        }

        const { section, offsetInfo } = this.onMouseEvent(e);
        const { offset } = offsetInfo;

        const focus = {
          path: section.realPath,
          offset: section.index + offset,
        };

        Transforms.select(this.editor, {
          anchor: this.currentAnchor || focus,
          focus,
        });
      }, 100),
    );

    document.body.addEventListener('mouseup', (e: MouseEvent) => {
      this.isMouseDown = false;
      if (e.target !== this.canvas) {
        return;
      }
    });
  }

  onMouseEvent(e: MouseEvent) {
    const { offsetX, offsetY } = e;

    // find line
    let line = this.findLineByY(offsetY);

    const items = this.lines[line].items;
    const x = setAccuracy(offsetX);
    let section: TextItemType = items[0];
    let i;
    for (i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.x <= x) {
        section = item;
      } else {
        break;
      }
    }

    // x position of the current click in the section
    let currentSectionClickX = x - section.x;

    const currentFontSize =
      section.fontSize || this.handledCanvasOptions.fontSize;
    let offsetInfo: FontOffsetType;
    if (i > 1 && currentSectionClickX < currentFontSize / 2) {
      // As we can see, the height of the cursor is related to the fontsize of the current position.
      // If two adjacent sections do not have the same fontsize,
      // then the position between them should correspond to the previous fontsize.
      section = items[i - 2];
      offsetInfo = this.findOffset(section, section.x, true);
    } else {
      offsetInfo = this.findOffset(section, currentSectionClickX);
    }

    return { section, line, offsetInfo };

    // if (this.textarea) {
    //   const { baseLineY } = this.lines[line];
    //
    //   let fontHeight = section.fontSize
    //     ? section.fontSize
    //     : this.handledCanvasOptions.fontSize;
    //
    //   const descent = fontHeight / (ascentDescentRatio + 1);
    //
    //   // fontHeight = fontHeight * 1.1;
    //   const fontTopToTop = baseLineY - fontHeight;
    //
    //   this.textarea.style.left = `${left / dpr}px`;
    //   this.textarea.style.fontSize = `${fontHeight / dpr}px`;
    //   this.textarea.style.top = `${(fontTopToTop + descent) / dpr}px`;
    //   this.textarea.style.height = `${fontHeight / dpr}px`;
    //   this.textarea.style.lineHeight = `${fontHeight / dpr}px`;
    //   setTimeout(() => {
    //     this.textarea?.focus();
    //   });
    // }
  }

  /**
   * find line by offsetY
   * @param offsetY
   */
  findLineByY(offsetY: number) {
    // find line
    let line = -1;
    for (let i = 0; i < this.lines.length; i++) {
      if (this.lines[i]['topY'] <= setAccuracy(offsetY)) {
        line = i;
      } else {
        break;
      }
    }
    return line;
  }

  /**
   * find selection offset
   * @param section
   * @param currentSectionClickX current section click x
   * @param isLast If you know that the current is the last element in the section, you can calculate the last without the previous steps.
   */
  findOffset(
    section: TextItemType,
    currentSectionClickX: number,
    isLast: boolean = false,
  ): FontOffsetType {
    let fontHeight = this.handledCanvasOptions.fontSize;

    this.resetFont();
    const { text, font, x } = section;
    font && (this.ctx.font = font);

    let index = 1;
    let left = x;
    let ascentDescentRatio = 1;

    if (isLast) {
      const {
        width,
        actualBoundingBoxDescent,
        actualBoundingBoxAscent,
      }: TextMetrics = this.ctx.measureText(text);
      return {
        offset: text.length,
        left: width + x,
        fontHeight: actualBoundingBoxDescent + actualBoundingBoxAscent,
        ascentDescentRatio: actualBoundingBoxAscent / actualBoundingBoxDescent,
      };
    }

    while (index <= text.length) {
      const currentText = text.slice(index - 1, index);
      const {
        width: currentTextWidth,
        actualBoundingBoxDescent: currentTextActualBoundingBoxDescent,
        actualBoundingBoxAscent: currentTextActualBoundingBoxAscent,
      }: TextMetrics = this.ctx.measureText(currentText);
      if (index === 1) {
        ascentDescentRatio =
          currentTextActualBoundingBoxAscent /
          currentTextActualBoundingBoxDescent;
        fontHeight =
          currentTextActualBoundingBoxDescent +
          currentTextActualBoundingBoxAscent;
        if (currentSectionClickX < currentTextWidth / 2) {
          break;
        } else if (
          currentSectionClickX >= currentTextWidth / 2 &&
          currentSectionClickX < currentTextWidth
        ) {
          left = x + currentTextWidth;
          index++;
          break;
        }
      }

      const t = text.slice(0, index);
      const {
        width: textWidth,
        actualBoundingBoxDescent: textActualBoundingBoxDescent,
        actualBoundingBoxAscent: textActualBoundingBoxAscent,
      }: TextMetrics = this.ctx.measureText(t);
      if (currentSectionClickX < textWidth - currentTextWidth / 2) {
        break;
      } else if (
        currentSectionClickX >= textWidth - currentTextWidth / 2 &&
        currentSectionClickX < textWidth
      ) {
        left = x + textWidth;
        ascentDescentRatio =
          textActualBoundingBoxAscent / textActualBoundingBoxDescent;
        fontHeight = textActualBoundingBoxDescent + textActualBoundingBoxAscent;
        index++;
        break;
      }
      ascentDescentRatio =
        textActualBoundingBoxAscent / textActualBoundingBoxDescent;
      fontHeight = textActualBoundingBoxDescent + textActualBoundingBoxAscent;
      left = x + textWidth;
      index++;
    }
    return {
      offset: index - 1,
      left,
      fontHeight,
      ascentDescentRatio,
    };
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
      this.resetFont();
      this.currentLineIndex++;
      this.currentParagraph++;
      this.currentParagraphSection = -1;
      this.isJustBreakLine = true;
      if ('children' in item) {
        item.children.forEach((child) => {
          this.resetFont();
          this.currentParagraphSection++;

          let fontSize = this.handledCanvasOptions.fontSize;
          const fontObj: Partial<CanvasOptionsType> = {};
          if ('bold' in child) {
            fontObj['fontWeight'] = 'bold';
          }
          if ('size' in child) {
            fontSize = setAccuracy(child.size as number);
            fontObj['fontSize'] = fontSize;
          }
          let font = '';
          if (Object.keys(fontObj)?.length) {
            font = createFontValue(fontObj);
          }

          if ('text' in child) {
            const info: { font?: string; fontSize: number } = {
              fontSize: fontSize,
            };
            font && (info['font'] = font);
            this.calculateLines(child.text, info);
          }
        });
      }
    });

    console.log('----------', 'this.lines', this.lines, '----------cyy log');

    this.lines.forEach((line) => {
      line.items.forEach((lineItem: any) => {
        this.resetFont();
        if (lineItem.font) {
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

  onChange() {
    this.editor.onChange = (o) => {
      if (!o) {
        return;
      }
      const { operation } = o;
      if (!operation) {
        return;
      }

      switch (operation.type) {
        case 'set_selection':
          this.setSelectionOption(operation);
          break;
      }
    };
  }

  setSelectionOption(operation: any) {
    if (!operation.newProperties) {
      return;
    }
    const { focus } = operation.newProperties;
    console.log('----------', 'operation', operation, '----------cyy log');
    if (!focus) {
      return;
    }
    const [level1, level2] = focus.path;

    const cursorOffset = focus?.offset;

    let currentItem: TextItemType | undefined;
    let i;
    let isBreak = false;
    for (i = 0; i < this.lines.length; i++) {
      const info = this.lines[i];
      if (isBreak) {
        break;
      }
      if (info.realPath[0] === level1) {
        const { items } = info;
        for (let j = 0; j < items.length; j++) {
          const item = items[j];
          if (Path.equals(item.realPath, focus.path)) {
            const text = item.text;
            if (
              cursorOffset >= item.index &&
              cursorOffset <= item.index + text.length
            ) {
              currentItem = item;
              isBreak = true;
              break;
            }
          }
        }
      }
    }
    console.log('----------', 'currentItem', currentItem, '----------cyy log');
    this.drawTextarea(currentItem, cursorOffset, i);
    this.drawRange();
  }

  drawTextarea(
    currentItem: TextItemType | undefined,
    cursorOffset: number,
    i: number,
  ) {
    if (!currentItem) {
      return;
    }
    this.resetFont();
    currentItem.font && (this.ctx!.font = currentItem.font);
    const {
      width,
      actualBoundingBoxAscent,
      actualBoundingBoxDescent,
    }: TextMetrics = this.ctx!.measureText(
      currentItem.text.substring(0, cursorOffset - currentItem.index),
    );

    if (this.textarea) {
      const { baseLineY } = this.lines[i - 1];

      let fontHeight = currentItem.fontSize
        ? currentItem.fontSize
        : this.handledCanvasOptions.fontSize;

      const descent =
        fontHeight / (actualBoundingBoxAscent / actualBoundingBoxDescent + 1);

      // fontHeight = fontHeight * 1.1;
      const fontTopToTop = baseLineY - fontHeight;

      this.textarea.blur();
      this.textarea.style.left = `${(currentItem.x + width) / dpr}px`;
      this.textarea.style.fontSize = `${fontHeight / dpr}px`;
      this.textarea.style.top = `${(fontTopToTop + descent) / dpr}px`;
      this.textarea.style.height = `${fontHeight / dpr}px`;
      this.textarea.style.lineHeight = `${fontHeight / dpr}px`;
      setTimeout(() => {
        this.textarea?.focus();
        IS_FOCUSED.set(this.editor, true);
      });
    }
  }

  drawRange() {
    if (this.rangeOffscreenCtx) {
      const { width, height } = this.rangeOffscreenCanvas;
      this.rangeOffscreenCtx.clearRect(0, 0, width, height);
      this.rangeOffscreenCtx.globalAlpha = 0.5;
      this.rangeOffscreenCtx.fillStyle = 'red';
      this.rangeOffscreenCtx.fillRect(10, 10, 100, 100);
      this.ctx.drawImage(this.rangeOffscreenCanvas, 0, 0);
    }
  }

  drawMainCanvas() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(this.wordOffscreenCanvas, 0, 0)
  }

  calculateLines(
    text: string,
    info: { font?: string; fontSize: number },
    index: number = 0,
    recursive: boolean = false,
  ) {
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
      lineHeight = lineHeight * info.fontSize;
    }
    if (typeof lineHeight === 'string') {
      // like '20px'
      lineHeight = setAccuracy(Number(lineHeight.replace('px', '')));
    }

    // `textY` is the relative vertical position of the calculated baseline based on `textBaseline: alphabetic` in this line.
    const textY: number =
      (lineHeight - textHeight) / 2 + actualBoundingBoxAscent;

    let splitLength: number;
    if (this.isJustBreakLine) {
      // New line, so rendering from the beginning of the line.
      this.isJustBreakLine = false;

      this.currentLineMaxBaseLineY = textY;

      this.currentRenderingBaselineX = this.initialPosition.x;

      splitLength = this.getSplitLength(contentWidth, width, text);
    } else {
      // Keep rendering on this line.
      this.currentLineMaxBaseLineY = Math.max(
        this.currentLineMaxBaseLineY,
        textY,
      );

      const leftWidth =
        contentWidth -
        (this.currentRenderingBaselineX - this.initialPosition.x);
      splitLength = this.getSplitLength(leftWidth, width, text);
    }

    // record the baseLineY of the current line
    let baseLineY: number;
    if (this.currentLineIndex === 0) {
      baseLineY = this.initialPosition.y + this.currentLineMaxBaseLineY;
    } else {
      const lastLine = this.lines[this.currentLineIndex - 1];
      baseLineY =
        lastLine.topY + lastLine.height + this.currentLineMaxBaseLineY;
    }

    this.lines[this.currentLineIndex] = this.lines[this.currentLineIndex] || {
      baseLineY: 0,
      topY: 0,
      height: 0,
      items: [],
      realPath: [this.currentParagraph],
    };

    this.lines[this.currentLineIndex].items.push(
      Object.assign(
        {
          index,
          text: text.substring(0, splitLength),
          x: this.currentRenderingBaselineX,
          realPath: [this.currentParagraph, this.currentParagraphSection],
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
      this.calculateLines(
        text.substring(splitLength),
        info,
        index + splitLength,
      );
    }
  }

  /**
   * When the word width is greater than the content width,
   * an algorithm to derive how many length of characters can be rendered in a line
   * @param contentWidth
   * @param width
   * @param text
   */
  getSplitLength(contentWidth: number, width: number, text: string): number {
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

  resetFont() {
    this.ctx.font = initCreateFontValue(this.handledCanvasOptions);
  }

  fillText(text: string) {
  }

  getCanvasWrapper() {
    return this.canvasWrapper;
  }

  getCanvas() {
    return this.canvas;
  }

  getCtx() {
    return this.ctx;
  }
}

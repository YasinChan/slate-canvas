import {
  Editor,
  Node,
  Path,
  Point,
  Scrubber,
  Transforms,
  BaseEditor,
  Range,
  Operation,
  type Descendant,
} from 'slate';
import {
  createCanvas,
  createOffscreenCanvas,
} from '@/components/create-canvas';

import { cloneDeep, throttle, zip } from 'es-toolkit';

import mitt, { Emitter, EventType } from 'mitt';

import {
  setAccuracy,
  defaultCanvasOptions,
  setAccuracyCanvasOptions,
  createFontValue,
  initCreateFontValue,
  getDPR,
  OptionsType,
  CanvasOptionsType,
} from '@/utils';

import { IS_FOCUSED, IS_RANGING, EDITOR_TO_ON_CHANGE } from '@/utils/weak-maps';

import { KEY_CODE_ENUM } from '@/config/key';
import emitterMap from '@/config/emitterMap';

import { TextItemType, LinesType, CursorLocationInfoType } from '@/types';
import { FontBase } from '@/abstracts';
export default class SlateCanvas {
  public initialValue: Descendant[];
  #FontComponents: Record<string, FontBase> = {};
  #emitter: Emitter<Record<EventType, unknown>>;
  #canvasWrapper: HTMLDivElement;
  #textarea: HTMLTextAreaElement;
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D;

  #textMetricsOffscreenCanvas: HTMLCanvasElement;
  #textMetricsOffscreenCtx: CanvasRenderingContext2D;

  // for render word
  #wordOffscreenCanvas: HTMLCanvasElement;
  #wordOffscreenCtx: CanvasRenderingContext2D;

  // for render range
  #rangeOffscreenCanvas: HTMLCanvasElement;
  #rangeOffscreenCtx: CanvasRenderingContext2D;

  // Converts the values in `canvasOptions` in `options` by precision.
  #handledCanvasOptions: CanvasOptionsType = cloneDeep(defaultCanvasOptions);
  // The position at which to initially start rendering the content
  #initialPosition: { x: number; y: number } = { x: 0, y: 0 };
  // Minus padding content size
  #contentSize: { width: number; height: number } = {
    width: 0,
    height: 0,
  };
  #currentRenderingBaselineX: number = 0;
  #currentLineMaxBaseLineY: number = 0;
  // index of lines currently being rendered
  #currentLineIndex: number = -1;

  // the rendering paragraph
  #currentParagraph: number = -1;
  // the rendering section in current paragraph
  #currentParagraphSection: number = -1;
  // In Slate, it’s necessary to track the `selection`, which corresponds to the paragraph index in the DOM.
  // Unlike DOM rendering, where text automatically wraps and maintains its position within a paragraph,
  // canvas rendering requires manual calculation of how much text fits on each line.
  // This means we need to keep track of the current content
  // being rendered on the canvas and map it to the correct paragraph index as it would appear in the DOM.
  // This ensures that selections and other text manipulations in Slate accurately reflect the text's position within the DOM structure.
  // These are for `realPath`.

  // Record the rendering information of each line
  #lines: LinesType[] = [];
  // this is a flag whether a line break has just been completed
  #isJustBreakLine: boolean = true;

  #isMouseDown: boolean = false;
  #isMouseMoving: boolean = false;
  // All position information for the current cursor position
  #cursorLocationInfo: CursorLocationInfoType | undefined = undefined;
  selectionRange: {
    start: CursorLocationInfoType | undefined;
    end: CursorLocationInfoType | undefined;
  };

  // when mousedown, record current point.
  #currentAnchor: Point | undefined = undefined;

  #isComposing: boolean;

  constructor(
    public editor: BaseEditor,
    public options: OptionsType,
    public components: FontBase[],
  ) {
    this.#emitter = mitt();

    this.editor = editor;
    this.options = options;
    this.#isComposing = false;

    this.initialValue = options.initialValue;

    (components || []).forEach((component) => {
      if (component.type === 'font') {
        component.initialize({ editor: this.editor, emitter: this.#emitter });
        this.#FontComponents[component.id] = component;
      }
    });

    this.selectionRange = {
      start: undefined,
      end: undefined,
    };

    this.check();
    this.optionsHandler();

    const { canvasWrapper, textarea, canvas, ctx } = createCanvas(
      this.editor,
      this.#handledCanvasOptions,
    );
    this.#canvasWrapper = canvasWrapper;
    this.#textarea = textarea;
    this.#canvas = canvas;
    this.#ctx = ctx;

    // for calculate textMetrics
    const { canvas: textMetricsOffscreenCanvas, ctx: textMetricsOffscreenCtx } =
      createOffscreenCanvas(this.editor, this.#handledCanvasOptions);
    this.#textMetricsOffscreenCanvas = textMetricsOffscreenCanvas;
    this.#textMetricsOffscreenCtx = textMetricsOffscreenCtx;

    // for render word
    const { canvas: wordOffscreenCanvas, ctx: wordOffscreenCtx } =
      createOffscreenCanvas(this.editor, this.#handledCanvasOptions);
    this.#wordOffscreenCanvas = wordOffscreenCanvas;
    this.#wordOffscreenCtx = wordOffscreenCtx;

    // for render range
    const { canvas: rangeOffscreenCanvas, ctx: rangeOffscreenCtx } =
      createOffscreenCanvas(this.editor, this.#handledCanvasOptions);
    this.#rangeOffscreenCanvas = rangeOffscreenCanvas;
    this.#rangeOffscreenCtx = rangeOffscreenCtx;

    this.init();
    this.listen();

    return this;
  }

  get emitter() {
    return this.#emitter;
  }

  /**
   * check initialValue and editor
   */
  check() {
    if (!Node.isNodeList(this.initialValue)) {
      throw new Error(
        `[Slate] initialValue is invalid! Expected a list of elements but got: ${Scrubber.stringify(this.initialValue)}`,
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
    const canvasOptions = Object.assign(
      {},
      defaultCanvasOptions,
      this.options.canvasOptions,
    );
    this.#handledCanvasOptions = canvasOptions;

    const accuracy = canvasOptions.accuracy;
    // Set canvas accuracy.
    setAccuracy(this.editor, 1, accuracy);

    setAccuracyCanvasOptions.forEach((key) => {
      if (canvasOptions[key] !== undefined) {
        if (key === 'width') {
          this.#handledCanvasOptions['styleWidth'] = canvasOptions[
            key
          ] as number;
        }
        if (key === 'height') {
          this.#handledCanvasOptions['styleHeight'] = canvasOptions[
            key
          ] as number;
        }
        this.#handledCanvasOptions[key] = setAccuracy(
          this.editor,
          canvasOptions[key] as number,
        );
      }
    });
  }

  init() {
    this.render();
    // this.onChange();
    EDITOR_TO_ON_CHANGE.set(this.editor, this.onContextChange);
  }

  on(type: string, handler: (...args: any[]) => void) {
    this.#emitter.on(type, handler);
  }

  listen() {
    this.#textarea.addEventListener('compositionstart', (inputEvent: Event) => {
      // const e = inputEvent as InputEvent;
      this.#isComposing = true;
    });
    this.#textarea.addEventListener('compositionend', (inputEvent: Event) => {
      const e = inputEvent as InputEvent;
      this.#isComposing = false;
      Editor.insertText(this.editor, e.data ? e.data : '');
    });
    this.#textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      const isFocus = IS_FOCUSED.get(this.editor);
      if (!isFocus) {
        return;
      }
      if (e.code === KEY_CODE_ENUM['ARROW_LEFT']) {
        Transforms.collapse(this.editor, { edge: 'focus' });
        Transforms.move(this.editor, { distance: 1, reverse: true });
      }
      if (e.code === KEY_CODE_ENUM['ARROW_RIGHT']) {
        Transforms.collapse(this.editor, { edge: 'focus' });
        Transforms.move(this.editor, { distance: 1, reverse: false });
      }
      if (e.code === KEY_CODE_ENUM['BACKSPACE']) {
        Editor.deleteBackward(this.editor);
      }
    });

    this.#textarea.addEventListener('blur', () => {
      IS_FOCUSED.delete(this.editor);
    });
    this.#textarea.addEventListener('input', (inputEvent: Event) => {
      if (this.#isComposing) {
        return;
      }
      const e = inputEvent as InputEvent;
      Editor.insertText(this.editor, e.data ? e.data : '');
    });

    this.#canvas.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target !== this.#canvas) {
        return;
      }
      this.#isMouseDown = true;
      this.onMouseEvent(e);
      const { section, offset } = this
        .#cursorLocationInfo as CursorLocationInfoType;

      this.#currentAnchor = {
        path: section.realPath,
        offset: section.index + offset,
      };

      const selection = {
        anchor: this.#currentAnchor,
        focus: this.#currentAnchor,
      };

      Transforms.select(this.editor, selection);
    });

    document.body.addEventListener(
      'mousemove',
      throttle((e: MouseEvent) => {
        if (e.target !== this.#canvas) {
          return;
        }

        if (!this.#isMouseDown) {
          return;
        }

        this.#isMouseMoving = true;

        this.onMouseEvent(e);
        const { section, offset } = this
          .#cursorLocationInfo as CursorLocationInfoType;

        const focus = {
          path: section.realPath,
          offset: section.index + offset,
        };

        Transforms.select(this.editor, {
          anchor: this.#currentAnchor || focus,
          focus,
        });
      }, 100),
    );

    document.body.addEventListener('mouseup', (e: MouseEvent) => {
      // if (e.target !== this.canvas) {
      //   return;
      // }
      this.#isMouseDown = false;
      this.#isMouseMoving = false;
      if (e.target !== this.#canvas) {
        return;
      }
    });
  }

  onMouseEvent(e: MouseEvent) {
    const { offsetX, offsetY } = e;

    // find line
    let line = this.findLineByY(offsetY);

    const items = this.#lines[line].items;
    const x = setAccuracy(this.editor, offsetX);
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
      section.fontSize || this.#handledCanvasOptions.fontSize;
    if (i > 1 && currentSectionClickX < currentFontSize / 2) {
      // As we can see, the height of the cursor is related to the fontsize of the current position.
      // If two adjacent sections do not have the same fontsize,
      // then the position between them should correspond to the previous fontsize.
      section = items[i - 2];
      this.setCursorLocationInfo(line, section, section.x, true);
    } else {
      this.setCursorLocationInfo(line, section, currentSectionClickX);
    }
  }

  render() {
    if (this.#isComposing) {
      return;
    }
    this.clearWordCanvas();
    this.#lines = [];
    this.#currentRenderingBaselineX = 0;
    this.#currentLineMaxBaseLineY = 0;
    this.#currentLineIndex = -1;
    this.#currentParagraph = -1;
    this.#currentParagraphSection = -1;
    const paddingTop =
      this.#handledCanvasOptions.paddingTop ||
      this.#handledCanvasOptions.padding ||
      20;
    const paddingLeft =
      this.#handledCanvasOptions.paddingLeft ||
      this.#handledCanvasOptions.padding ||
      20;
    this.#initialPosition = {
      x: paddingLeft,
      y: paddingTop,
    };
    this.#currentRenderingBaselineX = paddingLeft;
    this.#contentSize = {
      width: this.#handledCanvasOptions.width - paddingLeft * 2,
      height: this.#handledCanvasOptions.height - paddingTop * 2,
    };

    this.editor.children.forEach((item) => {
      this.resetFont();
      this.#currentLineIndex++;
      this.#currentParagraph++;
      this.#currentParagraphSection = -1;
      this.#isJustBreakLine = true;
      if ('children' in item) {
        item.children.forEach((child) => {
          this.resetFont();
          this.#currentParagraphSection++;

          let fontSize = this.#handledCanvasOptions.fontSize;
          let fontObj: Partial<CanvasOptionsType> = {};
          Object.keys(child).forEach((key) => {
            if (this.#FontComponents[key]) {
              fontObj = this.#FontComponents[key].render(
                this.editor,
                cloneDeep(fontObj),
                child,
              );
            }
          });

          let font = '';
          if (Object.keys(fontObj)?.length) {
            font = createFontValue(this.editor, fontObj);
          }

          if ('text' in child) {
            const info: { font?: string; fontSize: number } = {
              fontSize: fontObj['fontSize'] || fontSize,
            };
            font && (info['font'] = font);
            this.calculateLines(child.text, info);
          }
        });
      }
    });

    this.#lines.forEach((line) => {
      line.items.forEach((lineItem: any) => {
        this.resetFont();
        if (lineItem.font) {
          this.#wordOffscreenCtx.font = lineItem.font;
        }
        this.#wordOffscreenCtx.fillText(
          lineItem.text,
          lineItem.x,
          line.baseLineY,
        );
      });
    });

    if ('children' in this.initialValue[0]) {
      if ('text' in this.initialValue[0].children[0]) {
        const t = this.initialValue[0].children[0]?.text;
        this.fillText(t);
      }
    }

    this.drawMainCanvas();
  }

  onContextChange: (o?: { operation?: Operation }) => void = (o) => {
    if (!o) {
      return;
    }

    const { operation } = o;
    if (!operation) {
      return;
    }
    switch (operation.type) {
      case 'set_selection':
        this.setSelection();

        this.emitter.emit(emitterMap.ON_SELECTION_CHANGE, this.editor.selection as Range)
        break;
      case 'insert_text':
      case 'remove_text':
      case 'set_node':
      case 'split_node':
        this.setText(operation);
        this.setSelection();

        this.emitter.emit(emitterMap.ON_VALUE_CHANGE, this.editor.children);
        break;
      default:
        this.emitter.emit(emitterMap.ON_VALUE_CHANGE, this.editor.children);
        break;
    }
  }

  setSelection() {
    if (this.#isComposing) {
      return;
    }
    const selection = this.editor.selection;

    if (!(selection && selection.focus)) {
      return;
    }
    const { focus, anchor } = selection;
    if (!focus) {
      return;
    }
    const [level1, level2] = focus.path;

    const cursorOffset = focus?.offset;

    let currentItem: TextItemType | undefined;
    let i;
    let isBreak = false;
    for (i = 0; i < this.#lines.length; i++) {
      const info = this.#lines[i];
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
    if (!currentItem) {
      return;
    }

    this.resetTextMetricsOffscreenFont();
    currentItem.font && (this.#textMetricsOffscreenCtx.font = currentItem.font);
    const textMetrics: TextMetrics = this.#textMetricsOffscreenCtx.measureText(
      currentItem.text.substring(0, cursorOffset - currentItem.index),
    );

    // const { baseLineY, topY, height } = this.lines[i - 1];

    const left1 = textMetrics.width;

    this.setCursorLocationInfo(i - 1, currentItem, left1, false, true);

    const { line, section, left, ascentDescentRatio } = this
      .#cursorLocationInfo as CursorLocationInfoType;
    const { baseLineY } = this.#lines[line];

    this.drawTextarea(section, ascentDescentRatio, baseLineY, left);

    if (this.#isMouseMoving) {
      const isExpanded = Range.isExpanded(selection);
      if (isExpanded) {
        IS_RANGING.set(this.editor, true);
        this.selectionRange.end = this.#cursorLocationInfo;
        this.clearRangeRect();
        this.drawRange();
      } else {
        this.clearRangeRect();
        this.drawMainCanvas();
      }
    } else {
      if (this.#isMouseDown) {
        this.selectionRange = {
          start: this.#cursorLocationInfo,
          end: undefined,
        };
      }
      const isRanging = IS_RANGING.get(this.editor);
      if (isRanging) {
        IS_RANGING.set(this.editor, false);
        this.clearRangeRect();
        this.drawMainCanvas();
      }
    }
  }
  setText(operation: any) {
    // if (!operation.text) {
    //   return;
    // }
    this.render();
  }

  drawTextarea(
    currentItem: TextItemType | undefined,
    ascentDescentRatio: number,
    baseLineY: number,
    left: number,
  ) {
    if (!currentItem) {
      return;
    }
    if (this.#textarea) {
      this.resetFont();
      currentItem.font && (this.#wordOffscreenCtx.font = currentItem.font);

      let fontHeight = currentItem.fontSize
        ? currentItem.fontSize
        : this.#handledCanvasOptions.fontSize;

      const descent = fontHeight / (ascentDescentRatio + 1);

      // fontHeight = fontHeight * 1.1;
      const fontTopToTop = baseLineY - fontHeight;

      const dpr = getDPR(this.editor);
      this.#textarea.blur();
      this.#textarea.style.left = `${left / dpr}px`;
      this.#textarea.style.fontSize = `${fontHeight / dpr}px`;
      this.#textarea.style.top = `${(fontTopToTop + descent) / dpr}px`;
      this.#textarea.style.height = `${fontHeight / dpr}px`;
      this.#textarea.style.lineHeight = `${fontHeight / dpr}px`;
      setTimeout(() => {
        this.#textarea?.focus();
        IS_FOCUSED.set(this.editor, true);
      });
    }
  }

  clearWordCanvas() {
    const { width, height } = this.#wordOffscreenCanvas;
    this.#wordOffscreenCtx.clearRect(0, 0, width, height);
  }

  clearRangeRect() {
    const { width, height } = this.#rangeOffscreenCanvas;
    this.#rangeOffscreenCtx.clearRect(0, 0, width, height);
  }

  drawRange() {
    const { selection } = this.editor;
    if (!selection) {
      return;
    }
    const isCollapsed = Range.isCollapsed(selection);

    if (isCollapsed) {
      return;
    }

    const sortRange = Object.values(this.selectionRange).sort((a, b) => {
      const aL = a?.line || 0;
      const bL = b?.line || 0;
      return aL - bL;
    });
    if (!sortRange[0] || !sortRange[1]) {
      return;
    }

    const renderLine = sortRange.map((s) => s?.line || 0);
    const isSameLine = renderLine[0] === renderLine[1];

    this.#rangeOffscreenCtx.globalAlpha = 0.5;
    this.#rangeOffscreenCtx.fillStyle = 'red';

    const { padding } = this.#handledCanvasOptions;
    if (isSameLine) {
      const line = this.#lines[renderLine[0]];
      const { left } = sortRange[0];
      const { topY, height } = line;
      const width = sortRange[1].left - sortRange[0].left;
      this.#rangeOffscreenCtx.fillRect(left, topY, width, height);
    } else {
      const selectedLines = this.#lines.slice(renderLine[0], renderLine[1] + 1);
      for (let i = 0; i < selectedLines.length; i++) {
        if (i === 0) {
          // first select line
          const { left } = sortRange[0];
          const { topY, height, items } = selectedLines[i];
          const width = items.reduce((a, b) => a + b.width, 0);

          this.#rangeOffscreenCtx.fillRect(
            left,
            topY,
            width + padding - left,
            height,
          );
        } else if (i === selectedLines.length - 1) {
          // last select line
          const { left } = sortRange[1];
          const { topY, height } = selectedLines[i];

          this.#rangeOffscreenCtx.fillRect(
            padding,
            topY,
            left - padding,
            height,
          );
        } else {
          // middle select line
          const { topY, height, items } = selectedLines[i];
          const width = items.reduce((a, b) => a + b.width, 0);

          this.#rangeOffscreenCtx.fillRect(padding, topY, width, height);
        }
      }
    }

    this.findLineRangeBySelection();

    const { anchor, focus } = selection as Range;

    if (!anchor || !focus) {
      return;
    }

    this.drawMainCanvas();
  }

  calculateLines(
    text: string,
    info: { font?: string; fontSize: number },
    index: number = 0,
    recursive: boolean = false,
  ) {
    info.font && (this.#wordOffscreenCtx.font = info.font);

    const {
      width,
      actualBoundingBoxAscent,
      actualBoundingBoxDescent,
    }: TextMetrics = this.#wordOffscreenCtx.measureText(text);

    const { width: contentWidth, height: contentHeight } = this.#contentSize;

    // real text height, see https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
    const textHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
    let lineHeight = this.#handledCanvasOptions.lineHeight;
    if (typeof lineHeight === 'number') {
      // like 1.5
      lineHeight = lineHeight * info.fontSize;
    }
    if (typeof lineHeight === 'string') {
      // like '20px'
      lineHeight = setAccuracy(
        this.editor,
        Number(lineHeight.replace('px', '')),
      );
    }

    // `textY` is the relative vertical position of the calculated baseline based on `textBaseline: alphabetic` in this line.
    const textY: number =
      (lineHeight - textHeight) / 2 + actualBoundingBoxAscent;

    let splitLengthAndWidth;
    if (this.#isJustBreakLine) {
      // New line, so rendering from the beginning of the line.
      this.#isJustBreakLine = false;

      this.#currentLineMaxBaseLineY = textY;

      this.#currentRenderingBaselineX = this.#initialPosition.x;

      splitLengthAndWidth = this.getSplitLengthAndWidth(
        contentWidth,
        width,
        text,
      );
    } else {
      // Keep rendering on this line.
      this.#currentLineMaxBaseLineY = Math.max(
        this.#currentLineMaxBaseLineY,
        textY,
      );

      const leftWidth =
        contentWidth -
        (this.#currentRenderingBaselineX - this.#initialPosition.x);
      splitLengthAndWidth = this.getSplitLengthAndWidth(leftWidth, width, text);
    }

    const { splitLength, splitWidth } = splitLengthAndWidth;

    // record the baseLineY of the current line
    let baseLineY: number;
    if (this.#currentLineIndex === 0) {
      baseLineY = this.#initialPosition.y + this.#currentLineMaxBaseLineY;
    } else {
      const lastLine = this.#lines[this.#currentLineIndex - 1];
      baseLineY =
        lastLine.topY + lastLine.height + this.#currentLineMaxBaseLineY;
    }

    this.#lines[this.#currentLineIndex] = this.#lines[
      this.#currentLineIndex
    ] || {
      baseLineY: 0,
      topY: 0,
      height: 0,
      items: [],
      realPath: [this.#currentParagraph, this.#currentParagraphSection],
    };

    this.#lines[this.#currentLineIndex].items.push(
      Object.assign(
        {
          index,
          text: text.substring(0, splitLength),
          x: this.#currentRenderingBaselineX,
          width: splitWidth,
          realPath: [this.#currentParagraph, this.#currentParagraphSection],
        },
        info,
      ),
    );

    // set current line baseLineY
    this.#lines[this.#currentLineIndex].baseLineY = Math.max(
      this.#lines[this.#currentLineIndex].baseLineY,
      baseLineY,
    );

    // set current line height
    this.#lines[this.#currentLineIndex].height = Math.max(
      this.#lines[this.#currentLineIndex].height,
      lineHeight,
    );

    // set current line topY
    if (this.#currentLineIndex === 0) {
      this.#lines[0].topY = this.#initialPosition.y;
    } else {
      this.#lines[this.#currentLineIndex].topY =
        this.#lines[this.#currentLineIndex - 1].topY +
        this.#lines[this.#currentLineIndex - 1].height;
    }

    if (splitLength === text.length) {
      // this means the text can all be rendered in this line.
      this.#currentRenderingBaselineX += width;
    } else {
      this.#currentLineIndex++;
      this.#isJustBreakLine = true;
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
  getSplitLengthAndWidth(
    contentWidth: number,
    width: number,
    text: string,
  ): {
    splitWidth: number;
    splitLength: number;
  } {
    const textLength = text.length;

    if (width <= contentWidth) {
      return { splitWidth: width, splitLength: textLength };
    }

    let splitLength: number; // one line text length;
    const ratio = contentWidth / width;
    const aboutLength = Math.round(textLength * ratio);

    const { width: beforeWidth } = this.#wordOffscreenCtx.measureText(
      text.substring(0, aboutLength),
    );

    if (beforeWidth <= contentWidth) {
      let w = beforeWidth;
      let i = aboutLength;
      while (w <= contentWidth) {
        const { width: newBeforeWidth } = this.#wordOffscreenCtx.measureText(
          text.substring(0, ++i),
        );
        w = newBeforeWidth;
      }
      splitLength = i - 1;
    } else {
      let w = beforeWidth;
      let i = aboutLength;
      while (w > contentWidth) {
        const { width: newBeforeWidth } = this.#wordOffscreenCtx.measureText(
          text.substring(0, --i),
        );
        w = newBeforeWidth;
      }
      splitLength = i;
    }
    const { width: allWidth } = this.#wordOffscreenCtx.measureText(
      text.substring(0, splitLength),
    );
    return {
      splitWidth: allWidth,
      splitLength,
    };
  }

  resetFont() {
    this.#wordOffscreenCtx.font = initCreateFontValue(
      this.editor,
      this.#handledCanvasOptions,
    );
  }

  resetTextMetricsOffscreenFont() {
    this.#textMetricsOffscreenCtx.font = initCreateFontValue(
      this.editor,
      this.#handledCanvasOptions,
    );
  }

  /**
   * find line by offsetY
   * @param offsetY
   */
  findLineByY(offsetY: number) {
    // find line
    let line = -1;
    for (let i = 0; i < this.#lines.length; i++) {
      if (this.#lines[i]['topY'] <= setAccuracy(this.editor, offsetY)) {
        line = i;
      } else {
        break;
      }
    }
    return line;
  }

  /**
   * set cursor location info
   * @param line
   * @param section
   * @param currentSectionClickX current section click x
   * @param isLast if you know that the current is the last element in the section, you can calculate the last without the previous steps.
   * @param isCurrentSectionClickXAccurate Whether the current clickX is accurate, if it is accurate, 'left' will return currentSectionClickX directly.
   */
  setCursorLocationInfo(
    line: number,
    section: TextItemType,
    currentSectionClickX: number,
    isLast: boolean = false,
    isCurrentSectionClickXAccurate: boolean = false,
  ) {
    let fontHeight = this.#handledCanvasOptions.fontSize;
    this.resetTextMetricsOffscreenFont();

    const { text, font, x } = section;
    font && (this.#textMetricsOffscreenCtx.font = font);

    let index = 1;
    let left = x;
    let ascentDescentRatio = 1;

    if (isLast) {
      const {
        width,
        actualBoundingBoxDescent,
        actualBoundingBoxAscent,
      }: TextMetrics = this.#textMetricsOffscreenCtx.measureText(text);
      this.#cursorLocationInfo = {
        offset: text.length,
        line,
        section,
        left: width + x,
        fontHeight: actualBoundingBoxDescent + actualBoundingBoxAscent,
        ascentDescentRatio: actualBoundingBoxAscent / actualBoundingBoxDescent,
      };
      return;
    }

    if (isCurrentSectionClickXAccurate) {
      const { actualBoundingBoxDescent, actualBoundingBoxAscent }: TextMetrics =
        this.#textMetricsOffscreenCtx.measureText(text);
      this.#cursorLocationInfo = {
        offset: text.length,
        line,
        section,
        left: currentSectionClickX,
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
      }: TextMetrics = this.#textMetricsOffscreenCtx.measureText(currentText);
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
      }: TextMetrics = this.#textMetricsOffscreenCtx.measureText(t);
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
    this.#cursorLocationInfo = {
      offset: index - 1,
      line,
      section,
      left,
      fontHeight,
      ascentDescentRatio,
    };
  }

  findLineRangeBySelection() {
    const { selection } = this.editor;
    if (!selection) {
      return;
    }
  }

  fillText(text: string) {}

  drawMainCanvas() {
    const { width, height } = this.#canvas;
    this.#ctx.clearRect(0, 0, width, height);
    this.#ctx.drawImage(this.#wordOffscreenCanvas, 0, 0);
    this.#ctx.drawImage(this.#rangeOffscreenCanvas, 0, 0);
  }

  setSlate(nodes: Descendant[]) {
    Transforms.select(this.editor, {
      anchor: Editor.start(this.editor, []),
      focus: Editor.end(this.editor, []),
    });
    setTimeout(() => {
      // Editor.deleteBackward(this.editor);
      // Editor.deleteFragment(this.editor, { direction: 'backward' });
      Transforms.insertFragment(this.editor, nodes);
    });
  }

  getCanvasWrapper() {
    return this.#canvasWrapper;
  }

  getCanvas() {
    return this.#canvas;
  }

  getCtx() {
    return this.#ctx;
  }

  getLinesInfo() {
    return this.#lines;
  }
}

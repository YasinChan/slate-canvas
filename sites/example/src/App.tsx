import { useRef, useState, useEffect } from 'react';
import { withCanvas } from 'slate-canvas';
import { createEditor, Editor } from 'slate';
import { MySlateCanvas } from './my-slate-canvas';
import BoldIcon from './assets/svg/bold.svg?react';
import AIcon from './assets/svg/a.svg?react';

export default function App() {
  const cvs = useRef<HTMLDivElement>(null);
  const cvsExample = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);

  const editorExample = useRef(withCanvas(createEditor()));
  // @ts-expect-error disable ts
  window.editorExample = editorExample.current;

  const isMarkActive = (format: string) => {
    const marks: any = Editor.marks(editorExample.current);
    return marks && marks[format];
  }

  const toggleMark = (format: string) => {
    const isActive = isMarkActive(format)
    if (isActive) {
      Editor.removeMark(editorExample.current, format)
    } else {
      if (format === 'size') {
        Editor.addMark(editorExample.current, format, 30)
      } else {
        Editor.addMark(editorExample.current, format, true)
      }
    }
  }

  useEffect(() => {
    // prevent duplicate creation
    if (cvs.current?.hasChildNodes() || cvsExample.current?.hasChildNodes()) {
      return;
    }

    const initialValue = [
      {
        type: 'paragraph',
        children: [
          { text: '那一天我二十一岁，', size: 30 },
          { text: '在我一生的黄金时代，我有好多奢望。', bold: true },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: '我想爱，想吃，',
          },
          { text: '还想在一瞬间变成天上半明半暗的云，', size: 30 },
          { text: '后来我才知道，生活就是个缓慢受锤的过程，', bold: true },
          {
            text: '人一天天老下去，奢望也一天天消逝，最后变得像挨了锤的牛一样。',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: '可是我过二十一岁生日时没有预见到这一点。我觉得自己会永远生猛下去，什么也锤不了我。',
          },
        ],
      },
    ];
    // @ts-expect-error disable ts
    window.initialValue = initialValue;

    console.log(
      '%cHi, you can try slate-canvas in the console!',
      'color: rgb(0,217,197); font-size: 16px;',
    );

    console.log(
      'You can use %csc.on("change", (o) => { console.log("change", o); }) %cto listen for changes in the editor.',
      'color: rgb(161, 194, 129);',
      '',
    );
    console.log(
      'Try %ceditor.children %chere to get slate children.',
      'color: rgb(161, 194, 129)',
      '',
    );
    console.log(
      'Then you can use %csc.setSlate(change then editor.children you get below) %chere to change the editor.',
      'color: rgb(161, 194, 129);',
      '',
    );

    const editor = withCanvas(createEditor());

    const sc = new MySlateCanvas(editor, {
      canvasOptions: {
        width: 500,
        height: 500,
        accuracy: 1,
        lineHeight: 2.5,
        padding: 20,
      },
      initialValue: initialValue,
    });
    const canvasWrapper = sc.getCanvasWrapper() as HTMLDivElement;
    const canvas = sc.getCanvas() as HTMLCanvasElement;
    canvas!.style.backgroundColor = 'rgb(184, 190, 196)';
    cvs.current?.appendChild(canvasWrapper);

    const scExample = new MySlateCanvas(editorExample.current, {
      canvasOptions: {
        width: 500,
        height: 500,
        accuracy: 1,
        lineHeight: 2.5,
        padding: 20,
      },
      initialValue: initialValue,
    });

    scExample.emitter.on('onSelectionChange', () => {
      const marks: any = Editor.marks(editorExample.current);
      setActiveTools(Object.keys(marks || {}));
    })

    // scExample.emitter.on('onValueChange', (value) => {
    //   console.log('onValueChange11', value);
    // })

    // @ts-expect-error disable ts
    window.sc = scExample;

    const canvasWrapper2 = scExample.getCanvasWrapper() as HTMLDivElement;
    const canvas2 = scExample.getCanvas() as HTMLCanvasElement;
    canvas2!.style.backgroundColor = 'rgb(184, 190, 196)';
    cvsExample.current?.appendChild(canvasWrapper2);
  }, [cvsExample]);

  return (
    <div className="slate-canvas">
      <h1>Slate Canvas</h1>
      <div>
        <a href="https://github.com/YasinChan/slate-canvas">Github</a>
      </div>
      <p>
        <b>Slate Canvas</b> is a rich text editor built on a canvas using Slate.
      </p>
      <div style={{ marginBottom: 40 }}>
        <h1>Let&apos;s try!</h1>
        <div className="slate-canvas__tools">
          <div className={`slate-canvas__tools-item ${activeTools.includes('bold') ? 'slate-canvas__tools-item--active' : ''}`}>
            <BoldIcon onMouseDown={(e) => {
              e.preventDefault();
              toggleMark('bold');
            }} />
          </div>
          <div className={`slate-canvas__tools-item ${activeTools.includes('size') ? 'slate-canvas__tools-item--active' : ''}`}>
            <AIcon onMouseDown={(e) => {
              e.preventDefault();
              toggleMark('size');
            }} />
          </div>
        </div>
        <div ref={cvsExample}></div>
        <p>
          You can try the input and select operations here, of course, you can
          also <strong style={{ color: '#00D9C5' }}>open the console</strong> to
          execute commands to control the editor above!
        </p>
      </div>

      <h1>Let&apos;s compare!</h1>
      <button onClick={() => setShow(!show)}>
        {show ? 'hide' : 'show'} Click here to compare with dom render context
      </button>
      <div style={{ display: 'flex' }}>
        <div className="slate-canvas__item">
          {show && (
            <div className="slate-canvas__item-compare">
              <div className="slate-canvas__item-title">Dom render context</div>
              <span style={{ fontSize: '30px' }}>那一天我二十一岁，</span>
              <span style={{ fontWeight: 'bold' }}>
                在我一生的黄金时代，我有好多奢望。
              </span>
              <p>
                我想爱，想吃，
                <span style={{ fontSize: '30px' }}>
                  还想在一瞬间变成天上半明半暗的云，
                </span>
                <span style={{ fontWeight: 'bold' }}>
                  后来我才知道，生活就是个缓慢受锤的过程，
                </span>
                人一天天老下去，奢望也一天天消逝，最后变得像挨了锤的牛一样。
              </p>
              <p>
                可是我过二十一岁生日时没有预见到这一点。我觉得自己会永远生猛下去，什么也锤不了我。
              </p>
            </div>
          )}
          <div ref={cvs}></div>
        </div>
      </div>
    </div>
  );
}

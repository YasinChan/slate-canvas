import { ref, onMounted, defineComponent, reactive, toRefs } from 'vue';
import { SlateCanvas, withCanvas } from 'slate-canvas';
import { createEditor, Descendant } from 'slate';

export default defineComponent({
  // 你好 Hello Привет Bonjour Ciao สวัสดี مرحبًا 안녕하세요 こんにちは.
  // Thai and Arabic are not supported at this time.
  setup() {
    const cvs = ref<HTMLElement>();
    const cvs2 = ref<HTMLElement>();
    const state = reactive({
      text1:
        '那aaa안녕하세요一天我二十一岁，在我一生的黄金时代，我有asdfasdf好多奢望。我想爱，想吃，还想在一瞬间变成天上半明半暗的云，后来我才知道，',
      text: '你好 Hello Привет Bonjour Ciao 안녕하세요 こんにちは',
      show: false,
    });

    const initialValue: Descendant[] = [
      {
        type: 'paragraph',
        children: [
          { text: '生活就是个缓慢受锤的过程，', size: 30 },
          { text: '人一天天老下去，奢望也一天天消逝，', bold: true },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: state.text1,
          },
          { text: '生活就是个缓慢受锤的过程，', size: 30 },
          { text: '人一天天老下去，奢望也一天天消逝，', bold: true },
          {
            text: '最后变得像挨了锤的牛一样。可是我过二十一岁生日时没有预见到这一点。我觉得自己会永远生猛下去，什么也锤不了我。',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: 'asdf哈哈',
          },
          {
            text: '哈哈asdfasdf',
            size: 28,
          },
          {
            text: '我觉得自己会永远生猛下去我觉得自己会永远生猛下去我觉得自己会永远生猛下去',
          },
        ],
      },
    ];

    onMounted(() => {
      const editor = withCanvas(createEditor());

      // @ts-ignore
      window.editor = editor;

      const sc = new SlateCanvas(editor, {
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
      cvs.value?.appendChild(canvasWrapper);

      const editor2 = withCanvas(createEditor());

      // @ts-ignore
      window.editor2 = editor2;

      const sc2 = new SlateCanvas(editor2, {
        canvasOptions: {
          width: 500,
          height: 500,
          accuracy: 1,
          lineHeight: 2.5,
          padding: 20,
        },
        initialValue: initialValue,
      });
      const canvasWrapper2 = sc2.getCanvasWrapper() as HTMLDivElement;
      const canvas2 = sc2.getCanvas() as HTMLCanvasElement;
      canvas2!.style.backgroundColor = 'rgb(184, 190, 196)';
      cvs2.value?.appendChild(canvasWrapper2);
    });

    return {
      cvs,
      cvs2,
      ...toRefs(state),
    };
  },
  render() {
    return (
      <>
        {this.show && (
          <div class="compare">
            {this.text1}
            <span style="font-size: 30px">生活就是个缓慢受锤的过程，</span>
            <span style="font-weight: bold">
              人一天天老下去，奢望也一天天消逝，
            </span>
            最后变得像挨了锤的牛一样。可是我过二十一岁生日时没有预见到这一点。我觉得自己会永远生猛下去，什么也锤不了我。
            <p>
              asdf哈哈<span style="font-size: 28px">哈哈asdfasdf</span>
              我觉得自己会永远生猛下去我觉得自己会永远生猛下去我觉得自己会永远生猛下去
            </p>
          </div>
        )}
        <div ref="cvs"></div>
        <div ref="cvs2"></div>
        <button onClick={() => (this.show = !this.show)}>
          {this.show ? 'hide' : 'show'} compare word
        </button>
      </>
    );
  },
});

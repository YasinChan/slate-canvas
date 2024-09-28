import { ref, onMounted, defineComponent, reactive, toRefs } from 'vue';
import { SlateCanvas, withCanvas } from 'slate-canvas';
import { createEditor } from 'slate';

export default defineComponent({
  // 你好 Hello Привет Bonjour Ciao สวัสดี مرحبًا 안녕하세요 こんにちは.
  // Thai and Arabic are not supported at this time.
  setup() {
    const scRef = ref();
    const cvs = ref<HTMLElement>();
    const cvs2 = ref<HTMLElement>();
    const state = reactive({
      show: false,
    });

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

    function setShow() {
      scRef.value.setSlate(initialValue);
      state.show = !state.show;
    }

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
      scRef.value = sc;

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
      setShow,
      ...toRefs(state),
    };
  },
  render() {
    return (
      <div class="slate-canvas">
        <h1>Slate Canvas</h1>
        <p>
          <b>Slate Canvas</b> is a rich text editor built on a canvas using
          Slate.
        </p>
        <div style="display: flex;">
          <div class="slate-canvas__item">
            {this.show && (
              <div class="slate-canvas__item-compare">
                <div class="slate-canvas__item-title">Dom render context</div>
                <span style="font-size: 30px">那一天我二十一岁，</span>
                <span style="font-weight: bold">
                  在我一生的黄金时代，我有好多奢望。
                </span>
                <p>
                  我想爱，想吃，
                  <span style="font-size: 30px">
                    还想在一瞬间变成天上半明半暗的云，
                  </span>
                  <span style="font-weight: bold">
                    后来我才知道，生活就是个缓慢受锤的过程，
                  </span>
                  人一天天老下去，奢望也一天天消逝，最后变得像挨了锤的牛一样。
                </p>
                <p>
                  可是我过二十一岁生日时没有预见到这一点。我觉得自己会永远生猛下去，什么也锤不了我。
                </p>
              </div>
            )}
            <div ref="cvs"></div>
          </div>
          <div style="margin-left: 20px;" ref="cvs2"></div>
        </div>
        <button onClick={() => this.setShow()}>
          {this.show ? 'hide' : 'show'} Click here to compare with dom render
          context
        </button>
        <div>
          <a href="https://github.com/YasinChan/slate-canvas">Github</a>
        </div>
      </div>
    );
  },
});

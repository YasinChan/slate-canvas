<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { SlateCanvas, withCanvas } from 'slate-canvas';
import { createEditor, Descendant } from 'slate';

const state = reactive({
  text1:
    '那aaa안녕하세요一天我二十一岁，在我一生的黄金时代，我有asdfasdf好多奢望。我想爱，想吃，还想在一瞬间变成天上半明半暗的云，后来我才知道，',
  text: '你好 Hello Привет Bonjour Ciao 안녕하세요 こんにちは',
  show: false,
});

// const initialValue = [
//   {
//     type: 'paragraph',
//     children: [
//       { text: 'This is editable ' },
//       { text: 'rich', bold: true },
//       { text: ' text, ' },
//       { text: 'much', italic: true },
//       { text: ' better than a <textarea>!' },
//     ],
//   },
//   {
//     type: 'paragraph',
//     children: [
//       {
//         text: "Since it's rich text, you can do things like turn a selection of text ",
//       },
//       { text: 'bold', bold: true },
//       {
//         text: ', or add a semantically rendered block quote in the middle of the page, like this:',
//       },
//     ],
//   },
// ];

// 你好 Hello Привет Bonjour Ciao สวัสดี مرحبًا 안녕하세요 こんにちは.
// Thai and Arabic are not supported at this time.
// TODO when using webstorm, as you can see there is a ts error here, instead in vscode, not.
const initialValue: Descendant[] = [
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
      },
      {
        text: '我觉得自己会永远生猛下去我觉得自己会永远生猛下去我觉得自己会永远生猛下去',
      },
    ],
  },
];

const cvs = ref<HTMLElement>();

onMounted(() => {
  const editor = withCanvas(createEditor());

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
  const canvas = sc.getCanvas();
  canvas!.style.backgroundColor = 'rgb(184, 190, 196)';
  cvs.value?.appendChild(canvas);
});
</script>

<template>
  <div v-if="state.show" class="compare">
    {{ state.text1
    }}<span style="font-size: 30px">生活就是个缓慢受锤的过程，</span
    ><span style="font-weight: bold">人一天天老下去，奢望也一天天消逝，</span
    >最后变得像挨了锤的牛一样。可是我过二十一岁生日时没有预见到这一点。我觉得自己会永远生猛下去，什么也锤不了我。
    <p>
      asdf哈哈<span style="font-size: 28px">哈哈asdfasdf</span
      >我觉得自己会永远生猛下去我觉得自己会永远生猛下去我觉得自己会永远生猛下去
    </p>
  </div>
  <div ref="cvs"></div>
  <button @click="state.show = !state.show">
    {{ state.show ? 'hide' : 'show' }} compare word
  </button>
</template>

<style scoped>
.compare {
  word-break: break-all;
  position: fixed;
  text-decoration: underline;
  top: 0;
  left: 0;
  padding: 20px;
  line-height: 2.5;
  width: 500px;
  height: 500px;
  background-color: rgb(144, 150, 156);
  opacity: 0.8;
}
</style>

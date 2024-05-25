<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { SlateCanvas, withCanvas } from 'slate-canvas';
import { createEditor } from 'slate';

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
const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: 'This is editable ' }],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: "Since it's rich text, you can do things like turn a selection of text ",
      },
    ],
  },
];

const cvs = ref<HTMLElement>();

const state = reactive({
  text: 'slate canvas',
});

onMounted(() => {
  const editor = withCanvas(createEditor());

  const sc = new SlateCanvas(editor, {
    canvasOptions: {
      width: 500,
      height: 500,
      accuracy: 1,
    },
    initialValue: initialValue,
  });
  const canvas = sc.getCanvas();
  canvas.style.backgroundColor = '#FAFCFD';
  cvs.value?.appendChild(canvas);
});
</script>

<template>
  <div>{{ state.text }}</div>
  <div ref="cvs"></div>
</template>

<style scoped></style>

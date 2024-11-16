# slate-canvas

[Slate Canvas](https://github.com/YasinChan/slate-canvas) is a rich text editor built on a canvas using Slate.

You can try it [here](https://git.yasinchan.com/slate-canvas/).

## Usage

```bash
pnpm install slate slate-canvas
```

```html
<div id="canvas"></div>
```

```ts
import { SlateCanvas, withCanvas } from 'slate-canvas';
import { createEditor } from 'slate';

const editor = withCanvas(createEditor());

const Dom = document.getElementById('canvas');

const initialValue = [
  {
    type: 'paragraph',
    children: [
      { text: 'size 30，', size: 30 },
      { text: 'bold', bold: true },
    ],
  },
];

const sc = new SlateCanvas(editor, {
  canvasOptions: {
    width: 500,
    height: 500,
    accuracy: 1,
    lineHeight: 2.5,
    padding: 20,
  },
  initialValue,
});

const canvasWrapper = sc.getCanvasWrapper();
const canvas = sc.getCanvas();

canvas.style.backgroundColor = 'rgb(184, 190, 196)';
Dom.appendChild(canvasWrapper);
```

## API

### getLinesInfo

Returns an array of line information objects.

```ts
sc.getLinesInfo();
```

### setSlate

Sets the value of the slate.

```ts
// value is like this:
// [
//   {
//     type: 'paragraph',
//     children: [
//       { text: 'Hello World', size: 30, bold: true },
//     ],
//    }
// ]
sc.setSlate(value);
```

## Events

### change

Fires when the value changes.

```ts
sc.on('change', (e: Operation) => {});
```

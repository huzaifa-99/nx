import { Canvas, Image, SKRSContext2D } from '@napi-rs/canvas';
import { ensureDir, readFile, writeFileSync } from 'fs-extra';
import { resolve } from 'path';

const documents: any[] = require('../../../docs/map.json')[0]['itemList'];
const targetFolder: string = resolve(
  __dirname,
  '../../../',
  `./nx-dev/nx-dev/public/images/open-graph`
);

const data: { title: string; content: string; filename: string }[] = [];
documents.map((category) => {
  category.itemList.map((item) =>
    data.push({
      title: category.name,
      content: item.name,
      filename: [category.id, item.id].join('-'),
    })
  );
});

function createOpenGraphImage(
  backgroundImagePath: string,
  targetFolder: string,
  title: string,
  content: string,
  filename: string
): Promise<void> {
  const addBackground = readFile(backgroundImagePath).then((content) => {
    const image = new Image();
    image.src = content;
    image.width = 1200;
    image.height = 630;

    return image;
  });

  return addBackground.then((image) => {
    const canvas = new Canvas(1200, 630);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, 1200, 630);

    context.font = 'bold 60px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillStyle = '#fff';
    context.fillText(title.toUpperCase(), 600, 220);

    context.font = 'bold 42px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillStyle = '#fff';

    const lines = splitLines(context, content, 1100);
    lines.forEach((line, index) => {
      context.fillText(line, 600, 310 + index * 55);
    });

    console.log('Generating: ' + resolve(targetFolder + `/${filename}.jpg`));

    return writeFileSync(
      resolve(targetFolder + `/${filename}.jpg`),
      canvas.toBuffer('image/jpeg')
    );
  });
}

function splitLines(
  context: SKRSContext2D,
  text: string,
  maxWidth: number
): string[] {
  // calculate line splits
  const words = text.split(' ');
  if (words.length <= 1) {
    return words;
  }
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const newLine = `${currentLine} ${word}`;
    if (context.measureText(newLine).width < maxWidth) {
      currentLine = newLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  return lines;
}

ensureDir(targetFolder).then(() =>
  data.map((item) =>
    createOpenGraphImage(
      resolve(__dirname, './media.jpg'),
      targetFolder,
      item.title,
      item.content,
      item.filename
    )
  )
);
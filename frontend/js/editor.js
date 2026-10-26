function createEditor(toolbar, canvas) {
  document.execCommand('defaultParagraphSeparator', false, 'p');

  function exec(command, value = null) {
    canvas.focus();
    document.execCommand(command, false, value);
  }

  const buttons = [
    { label: 'B', title: 'Bold', cmd: 'bold' },
    { label: 'I', title: 'Italic', cmd: 'italic' },
    { label: 'U', title: 'Underline', cmd: 'underline' },
    { label: 'S', title: 'Strikethrough', cmd: 'strikeThrough' }
  ];

  toolbar.innerHTML = '';
  buttons.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.label;
    button.title = item.title;
    button.addEventListener('mousedown', (event) => event.preventDefault());
    button.addEventListener('click', () => exec(item.cmd));
    toolbar.appendChild(button);
  });

  const fonts = ['Cormorant Garamond', 'Exo 2', 'Georgia', 'Arial', 'Courier New'];
  const fontSelect = document.createElement('select');
  fonts.forEach((font) => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font;
    fontSelect.appendChild(option);
  });
  fontSelect.addEventListener('change', () => exec('fontName', fontSelect.value));
  toolbar.appendChild(fontSelect);

  const sizeSelect = document.createElement('select');
  ['3', '4', '5', '6', '7'].forEach((size) => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = `Size ${size}`;
    sizeSelect.appendChild(option);
  });
  sizeSelect.value = '4';
  sizeSelect.addEventListener('change', () => exec('fontSize', sizeSelect.value));
  toolbar.appendChild(sizeSelect);

  const color = document.createElement('input');
  color.type = 'color';
  color.value = '#f4f1ff';
  color.title = 'Text color';
  color.addEventListener('input', () => exec('foreColor', color.value));
  toolbar.appendChild(color);

  const highlight = document.createElement('input');
  highlight.type = 'color';
  highlight.value = '#f5d76e';
  highlight.title = 'Highlight';
  highlight.addEventListener('input', () => {
    exec('hiliteColor', highlight.value);
    exec('backColor', highlight.value);
  });
  toolbar.appendChild(highlight);

  [
    ['justifyLeft', 'Left'],
    ['justifyCenter', 'Center'],
    ['justifyRight', 'Right'],
    ['justifyFull', 'Justify']
  ].forEach(([cmd, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('mousedown', (event) => event.preventDefault());
    button.addEventListener('click', () => exec(cmd));
    toolbar.appendChild(button);
  });

  const block = document.createElement('select');
  [['P', 'Paragraph'], ['H1', 'Heading 1'], ['H2', 'Heading 2']].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    block.appendChild(option);
  });
  block.addEventListener('change', () => exec('formatBlock', block.value));
  toolbar.appendChild(block);

  [['insertUnorderedList', 'Bullets'], ['insertOrderedList', 'Numbers']].forEach(([cmd, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('mousedown', (event) => event.preventDefault());
    button.addEventListener('click', () => exec(cmd));
    toolbar.appendChild(button);
  });

  const link = document.createElement('button');
  link.type = 'button';
  link.textContent = 'Link';
  link.addEventListener('mousedown', (event) => event.preventDefault());
  link.addEventListener('click', () => {
    const url = window.prompt('Link URL', 'https://');
    if (url) exec('createLink', url);
  });
  toolbar.appendChild(link);

  const undo = document.createElement('button');
  undo.type = 'button';
  undo.textContent = 'Undo';
  undo.addEventListener('mousedown', (event) => event.preventDefault());
  undo.addEventListener('click', () => exec('undo'));
  toolbar.appendChild(undo);

  const redo = document.createElement('button');
  redo.type = 'button';
  redo.textContent = 'Redo';
  redo.addEventListener('mousedown', (event) => event.preventDefault());
  redo.addEventListener('click', () => exec('redo'));
  toolbar.appendChild(redo);

  return {
    getHtml() { return canvas.innerHTML; },
    setHtml(html) { canvas.innerHTML = html || ''; }
  };
}

window.createEditor = createEditor;

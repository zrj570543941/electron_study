const {remote} = require('electron')
const marked = require('marked');
const {ipcRenderer} = require('electron')
const path = require('path');

// 用于缓存当前正在编辑的文件的路径和未编辑时的文本内容
let filePath = null;
let originalContent = '';
const currentWindow = remote.getCurrentWindow()

const mainProcess = remote.require('./main.js')
const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');
const renderMarkdownToHtml = (markdown) => {
  htmlView.innerHTML = marked(markdown, { sanitize: true });
};

// 基于当前编辑的文件更新window tile
const updateUserInterface = (isEdited) => {
  let title = 'Fire Sale';
  if (filePath) { title = `${path.basename(filePath)} - ${title}`; }
  if (isEdited) { title = `${title} (Edited)`; }
  currentWindow.setTitle(title);
  // 设置当前窗口的文档是否被编辑过了，用于后续在关闭窗口时获取一种状态————当前窗口是否编辑过
  currentWindow.setDocumentEdited(isEdited);
  saveMarkdownButton.disabled = !isEdited;
  revertButton.disabled = !isEdited;
};
const getDraggedFile = (event) => event.dataTransfer.items[0];
const getDroppedFile = (event) => event.dataTransfer.files[0];
const fileTypeIsSupported = (file) => {
  return ['text/plain', 'text/markdown'].includes(file.type);
};

const renderFile = (file, content) => {
  filePath = file;
  originalContent = content;
  markdownView.value = content;
  renderMarkdownToHtml(content);
  updateUserInterface(false);
};
const isDifferentContent = (content) => content !== markdownView.value;

markdownView.addEventListener('keyup', (event) => {
  const currentContent = event.target.value;
  renderMarkdownToHtml(currentContent);
  updateUserInterface(currentContent !== originalContent);
});

openFileButton.addEventListener('click', () => {  mainProcess.getFileFromUser(currentWindow);});

ipcRenderer.on('file-opened', (event, file, content) => {
  if (currentWindow.isDocumentEdited()) {
    const result = remote.dialog.showMessageBox(currentWindow, {
      type: 'warning',
      title: 'Overwrite Current Unsaved Changes?',
      message: 'Opening a new file in this window will overwrite your unsaved changes. Open this file anyway?',
      buttons: [
      'Yes',
      'Cancel',
    ],
      defaultId: 0,
      cancelId: 1
  });
    if (result === 1) { return; }
  }
  renderFile(file, content);
});

ipcRenderer.on('file-changed', (event, file, content) => {
  if (!isDifferentContent(content)) return;
  const result = remote.dialog.showMessageBox(currentWindow, {
    type: 'warning',
    title: 'Overwrite Current Unsaved Changes?',
    message: 'Another application has changed this file. Load changes?',
    buttons: [
      'Yes',
      'Cancel',
    ],
    defaultId: 0,
    cancelId: 1
  });
  if (result === 0) {
    renderFile(file, content);
  }
  
});

newFileButton.addEventListener('click', () => {
  mainProcess.createWindow();
});

saveHtmlButton.addEventListener('click', () => {
  mainProcess.saveHtml(currentWindow, htmlView.innerHTML);
});

saveMarkdownButton.addEventListener('click', () => {
  mainProcess.saveMarkdown(currentWindow, filePath, markdownView.value)
})

revertButton.addEventListener('click', () => {
  markdownView.value = originalContent;
  renderMarkdownToHtml(originalContent);
});

document.addEventListener('dragstart', event => event.preventDefault());
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('dragleave', event => event.preventDefault());
document.addEventListener('drop', event => event.preventDefault());

markdownView.addEventListener('dragover', (event) => {
  const file = getDraggedFile(event);
  
  if (fileTypeIsSupported(file)) {
    markdownView.classList.add('drag-over');
  } else {
    markdownView.classList.add('drag-error');
  }
});

markdownView.addEventListener('dragleave', () => {
  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');
});

markdownView.addEventListener('drop', (event) => {
  const file = getDroppedFile(event);
  
  if (fileTypeIsSupported(file)) {
    mainProcess.openFile(currentWindow, file.path);
  } else {
    alert('That file type is not supported');
  }
  
  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');
});

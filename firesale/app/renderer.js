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
  currentWindow.setDocumentEdited(isEdited);
  saveMarkdownButton.disabled = !isEdited;
  revertButton.disabled = !isEdited;
};
markdownView.addEventListener('keyup', (event) => {
  const currentContent = event.target.value;
  renderMarkdownToHtml(currentContent);
  updateUserInterface(currentContent !== originalContent);
});

openFileButton.addEventListener('click', () => {  mainProcess.getFileFromUser(currentWindow);});

ipcRenderer.on('file-opened', (event, file, content) => {
  filePath = file
  originalContent = content
  
  markdownView.value = content;
  renderMarkdownToHtml(content);
  updateUserInterface(false);
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

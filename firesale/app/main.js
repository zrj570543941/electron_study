const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs')

const windows = new Set();
let mainWindow = null;

const getFileFromUser = exports.getFileFromUser  = (targetWindow) => {
  const files = dialog.showOpenDialog(targetWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'Markdown Files', extensions: ['md', 'markdown'] }
    ]
  });
  if (!files) { return; }
  openFile(targetWindow, files[0])
};

const openFile = (targetWindow, file) => {
  const content = fs.readFileSync(file).toString();
  app.addRecentDocument(file);
  targetWindow.setRepresentedFilename(file);
  targetWindow.webContents.send('file-opened', file, content);
};

const createWindow = exports.createWindow = () => {
  let newWindow = new BrowserWindow({ show: false });
  newWindow.loadFile(`${__dirname}/index.html`);
  newWindow.once('ready-to-show', () => {
    newWindow.show();
  });
  newWindow.on('closed', () => {
    windows.delete(newWindow);
    newWindow = null;
  });
  windows.add(newWindow);
  return newWindow;
};

const saveHtml = exports.saveHtml = (targetWindow, content) => {
  const file = dialog.showSaveDialog(targetWindow, {
    title: 'Save HTML',
    defaultPath: app.getPath('documents'),
    filters: [
      { name: 'HTML Files', extensions: ['html', 'htm'] }
    ]
  });
  if (!file) return;
  fs.writeFileSync(file, content);
};


const saveMarkdown = exports.saveMarkdown = (targetWindow, file, content) => {
  if (!file) {
    file = dialog.showSaveDialog(targetWindow, {
      title: 'Save Markdown',
      defaultPath: app.getPath('documents'),
      filters: [
        { name: 'Markdown Files', extensions: ['md', 'markdown'] }
      ]
    });
  }
  
  if (!file) return;
  
  fs.writeFileSync(file, content);
  // 若没有打开文件，而直接新建后想保存，就在保存完后在window title上更新为相应的文件名
  openFile(targetWindow, file);
};

app.on('ready', () => {
  // mainWindow = new BrowserWindow({ show: false });
  // mainWindow.loadFile(`${__dirname}/index.html`);
  // mainWindow.once('ready-to-show', () => {
  //   mainWindow.show();
  // });
  // mainWindow.on('closed', () => {
  //   mainWindow = null;
  // });
  createWindow()
});

app.on('will-finish-launching', () => {
  app.on('open-file', (event, file) => {
    const win = createWindow();
    win.once('ready-to-show', () => {
      openFile(win, file);
    });
  });
});

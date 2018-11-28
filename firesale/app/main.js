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

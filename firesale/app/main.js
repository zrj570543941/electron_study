const { app, BrowserWindow, dialog, Menu } = require('electron');
const createApplicationMenu = require('./application-menu');
const fs = require('fs')

const windows = new Set();
const openFiles = new Map();
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
  startWatchingFile(targetWindow, file)
};

const createWindow = exports.createWindow = () => {
  let newWindow = new BrowserWindow({ show: false });
  newWindow.loadFile(`${__dirname}/index.html`);
  newWindow.once('ready-to-show', () => {
    newWindow.show();
  });
  newWindow.on('closed', () => {
    windows.delete(newWindow);
    stopWatchingFile(newWindow);
    newWindow = null;
  });
  newWindow.on('close', (event) => {
    if (newWindow.isDocumentEdited()) {
      event.preventDefault();
      const result = dialog.showMessageBox(newWindow, {
        type: 'warning',
        title: 'Quit with Unsaved Changes?',
        message: 'Your changes will be lost if you do not save.',
        buttons: [
          'Quit Anyway',
          'Cancel',
        ],
        defaultId: 0,
        cancelId: 1
      });
      if (result === 0) newWindow.destroy();
    }
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

const startWatchingFile = (targetWindow, file) => {
  stopWatchingFile(targetWindow);
  // const watcher = fs.watchFile(file, (cur, prev)=> {
  //   // console.log(event)
  //   // if (cur.mtimeMs !== prev.mtimeMs) {
  //     console.log(1)
  //     const content = fs.readFileSync(file).toString();
  //     targetWindow.webContents.send('file-changed', file, content);
  //   // }
  // });
  const watcher = fs.watch(file, (event)=> {
    if (event === 'change') {
      const content = fs.readFileSync(file).toString();
      targetWindow.webContents.send('file-changed', file, content);
    }
  });
  openFiles.set(targetWindow, watcher);
};
const stopWatchingFile = (targetWindow) => {
  if (openFiles.has(targetWindow)) {
    openFiles.get(targetWindow).stop();
    openFiles.delete(targetWindow);
  }
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
  createApplicationMenu();
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

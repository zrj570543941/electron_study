const path = require('path');
const {
  app,
  Menu,
  Tray,
} = require('electron');
let tray = null;
const clippings = [];

const updateMenu = () => {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Create New Clipping',
      click() { null; }
    },
    { type: 'separator' },
    ...clippings.map((clipping, index) => ({ label: clipping })),
    { type: 'separator' },
    {
      label: 'Quit',
      click() { app.quit(); },
    }
  ]);
  tray.setContextMenu(menu);
};
app.on('ready', () => {
  if (app.dock) app.dock.hide();
  tray = new Tray(path.join(__dirname, '/Icon.png'));
  if (process.platform === 'win32') {
    tray.on('click', tray.popUpContextMenu);
  }
  const menu = Menu.buildFromTemplate([
    {
      label: 'Quit',
      click() { app.quit(); }
    }
  ]);
  tray.setToolTip('Clipmaster');
  tray.setContextMenu(menu);
});

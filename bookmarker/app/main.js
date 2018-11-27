const {app, BrowserWindow} = require('electron')
// import {app, BrowserWindow} from 'electron'
let mainWindow = null

app.on('ready', () => {
  mainWindow = new BrowserWindow()
  mainWindow.webContents.loadFile(`${__dirname}/index.html`)
})

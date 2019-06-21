'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
// 添加一个imageWindow
let imageWindow
let aboutWindow

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })
  imageWindow = new BrowserWindow({
    width: 400,
    height: 400,
    parent: win,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  aboutWindow = new BrowserWindow({
    width: 500,
    height: 500,
    parent: win,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    imageWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '/#/image')
    aboutWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '/#/about')
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
  imageWindow.on('close', e => {
    e.preventDefault()
    imageWindow.hide()
  })
  aboutWindow.on('close', e => {
    e.preventDefault()
    aboutWindow.hide()
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
//ipcMain 模块有如下监听事件方法:
// 监听 组件@/compontents/ImageList.vue methods:openImage下的ipcRenderer.send("toggle-image", image)
// render 发送消息，main 接收消息
//
ipcMain.on('toggle-image', (event, arg) => {
  imageWindow.show()
  // 拿到消息后再发送给@/views/image.vue中的 ipcRenderer.on('image'...
  imageWindow.webContents.send('image', arg)
})

ipcMain.on('toggle-about', (event, arg) => {
  aboutWindow.show()
})

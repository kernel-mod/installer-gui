import IPCEvents from "@common/ipcevents";
import {BrowserWindow, ipcMain as IPC, app, dialog} from "electron";
import path from "path";

let win: BrowserWindow;
IPC.on(IPCEvents.CLOSE_WINDOW, () => {
    app.exit();
});

IPC.on(IPCEvents.MINIMIZE_WINDOW, () => {
    win?.minimize();
})

IPC.handle(IPCEvents.BROWSE_PATHS, (event, options) => {
    return dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
        ...options
    });
});

IPC.on(IPCEvents.CLOSE_APP, () => {
    win.destroy();
    app.exit(1);
});

app.once("ready", () => {
    console.log("App is ready!");
    console.log("Loading... isProduction=" + app.isPackaged);
    win = new BrowserWindow({
        height: 600,
        width: 600,
        title: "Kernel Installer",
        frame: false,
        darkTheme: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    if (app.isPackaged) {
        const file = path.resolve(__dirname, "index.html");
        win.loadFile(file);
    } else {
        win.webContents.openDevTools();
        win.loadURL("http://localhost:5670/index.html");
    }
});

app.on("window-all-closed", () => {
    app.exit();
});
import Preact, {Component} from "preact";
import AppContext from "../AppContext";
import FileInput from "../fileinput";
import "./install.scss";
import SuggestedApplications from "./suggested";
import path from "path";
import fs from "fs";
import NotificationsStore from "../notifications";
import Terminal from "../terminal";
import {ipcRenderer as IPC} from "electron";
import IPCEvents from "@common/ipcevents";
import Uninstaller from "../../modules/uninstaller";

export default class UninstallPage extends Component<{}, {
    files: string[],
    isBrowsing: boolean,
    kernelPath: string,
    uninstallDone: boolean;
}> {
    fileInputRef = Preact.createRef();
    terminalRef = Preact.createRef<Terminal>();

    state = {
        files: [],
        isBrowsing: true,
        kernelPath: "",
        uninstallDone: false
    };

    handleChange = (files: string[]): void => {
        for (let i = 0; i < files.length; i++) {
            if (this.state.files.includes(files[i])) {
                files.splice(i, 1);
                continue;
            }

            const location = path.resolve(files[i], "resources");
            if (!fs.existsSync(location)) {
                files.splice(i, 1);
                NotificationsStore.showNotification("An invalid directory was given!");
            }
        }

        this.setState({
            files: this.state.files.concat(files)
        });
    }

    handleKernelPath = () => {}

    get canInstall() {
        return this.state.files.length > 0;
    }

    renderBrowser() {
        return (
            <>
                <FileInput
                    title="Applications to uninstall kernel from"
                    name="Uninstall paths"
                    files={this.state.files}
                    onChange={(files) => this.handleChange(files)}
                    onRemove={(path) => {
                        this.setState(prev => {
                            prev.files.splice(prev.files.indexOf(path), 1);
                            return {...prev, files: prev.files};
                        });
                    }}
                />
                <SuggestedApplications
                    onSelect={app => {
                        this.handleChange([app]);
                    }}
                    files={this.state.files}
                />
            </>
        );
    }

    renderInstalling() {
        return (
            <div class="form">
                <div class="form-title">Uninstall Kernel</div>
                <Terminal ref={this.terminalRef} />
            </div>
        );
    }

    handleInstall() {
        Uninstaller.uninstall(this.state.files, message => {
            this.terminalRef.current?.send(message);
        }).then(() => {
            this.setState({uninstallDone: true});
        });
    }

    render(_, {isBrowsing, uninstallDone}) {
        return (
            <AppContext.Consumer>
                {App => (
                    <div class="installing">
                        <div class="scroller">
                            {isBrowsing ? this.renderBrowser() : this.renderInstalling()}
                            <div class="margin-bottom10" />
                        </div>
                        <div class="footer">
                            <button onClick={() => {
                                if (isBrowsing) App.reset();
                                else this.setState({isBrowsing: true});
                            }}>Back</button>
                            <button
                                disabled={!this.canInstall}
                                onClick={() => {
                                    if (!this.canInstall) return;

                                    if (uninstallDone) return IPC.send(IPCEvents.CLOSE_APP);
                                    if (!isBrowsing) {
                                        this.handleInstall();
                                    } else {
                                        this.setState({isBrowsing: false});
                                    }
                                }}
                            >
                                {isBrowsing ? "Continue" : uninstallDone ? "Close" : "Uninstall"}
                            </button>
                        </div>
                    </div>
                )}
            </AppContext.Consumer>
        );
    }
}
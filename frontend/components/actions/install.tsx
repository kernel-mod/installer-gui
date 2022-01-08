import Preact, {Component, toChildArray} from "preact";
import AppContext from "../AppContext";
import FileInput from "../fileinput";
import "./install.scss";
import SuggestedApplications from "./suggested";
import path from "path";
import fs from "fs";
import NotificationsStore from "../notifications";
import SwitchItem from "../switchitem";
import Terminal from "../terminal";
import Installer from "../../modules/installer";
import {ipcRenderer as IPC} from "electron";
import IPCEvents from "@common/ipcevents";

export default class InstallPage extends Component<{}, {
    files: string[],
    isBrowsing: boolean,
    kernelPath: string,
    shouldDownloadKernel: boolean;
    shouldCreatePackages: boolean;
    installationDone: boolean;
}> {
    fileInputRef = Preact.createRef();
    terminalRef = Preact.createRef<Terminal>();

    state = {
        files: [],
        isBrowsing: true,
        kernelPath: "",
        shouldDownloadKernel: true,
        shouldCreatePackages: true,
        installationDone: false
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
        return this.state.files.length > 0 && this.state.kernelPath !== "";
    }

    renderBrowser() {
        return (
            <>
                <FileInput
                    title="Applications to install kernel to"
                    name="Install paths"
                    files={this.state.files}
                    onChange={(files) => this.handleChange(files)}
                    onRemove={(path) => {
                        this.setState(prev => {
                            prev.files.splice(prev.files.indexOf(path), 1);
                            return {...prev, files: prev.files};
                        });
                    }}
                />
                <FileInput
                    title="Kernel path"
                    name="Kernel path"
                    onChange={([path]) => this.setState({kernelPath: path})}
                    files={[this.state.kernelPath].filter(Boolean)}
                    onRemove={() => {
                        this.setState({kernelPath: ""});
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
            <>
                <SwitchItem
                    title="Download kernel.asar"
                    value={this.state.shouldDownloadKernel}
                    onChange={value => {
                        this.setState({shouldDownloadKernel: value});
                    }}
                />
                <SwitchItem
                    title="Create packages folder"
                    value={this.state.shouldCreatePackages}
                    onChange={value => {
                        this.setState({shouldCreatePackages: value});
                    }}
                />
                <Terminal ref={this.terminalRef} />
            </>
        );
    }

    handleInstall() {
        Installer.install(this.state.files, {
            downloadASAR: this.state.shouldDownloadKernel,
            kernelPath: this.state.kernelPath,
            makePackagesFolder: this.state.shouldCreatePackages,
        }, message => {
            this.terminalRef.current?.send(message);
        }).then(() => {
            this.setState({installationDone: true});
        });
    }

    render(_, {isBrowsing, installationDone}) {
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

                                    if (installationDone) return IPC.send(IPCEvents.CLOSE_APP);
                                    if (!isBrowsing) {
                                        this.handleInstall();
                                    } else {
                                        this.setState({isBrowsing: false});
                                    }
                                }}
                            >
                                {isBrowsing ? "Continue" : installationDone ? "Close" : "Install"}
                            </button>
                        </div>
                    </div>
                )}
            </AppContext.Consumer>
        );
    }
}
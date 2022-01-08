import Preact, {Component} from "preact";
import AppContext from "../AppContext";
import Terminal from "../terminal";
import {ipcRenderer as IPC} from "electron";
import IPCEvents from "@common/ipcevents";
import FileInput from "../fileinput";
import Updater from "../../modules/updater";

export default class UpdatePage extends Component<{}, {
    isBrowsing: boolean;
    updateDone: boolean;
    kernelPath: string;
}> {
    terminalRef = Preact.createRef();

    state = {
        isBrowsing: true,
        updateDone: false,
        kernelPath: ""
    };

    renderUpdating() {
        return (
            <div class="form">
                <div class="form-title">Update Kernel</div>
                <Terminal ref={this.terminalRef} />
            </div>
        );
    }

    renderBrowser() {
        return (
            <FileInput
                title="Kernel path"
                name="Kernel path"
                onChange={([path]) => this.setState({kernelPath: path})}
                files={[this.state.kernelPath].filter(Boolean)}
                onRemove={() => {
                    this.setState({kernelPath: ""});
                }}
            />
        );
    }

    handleUpdate(): void {
        Updater.update(this.state.kernelPath, message => {
            this.terminalRef.current?.send(message);
        }).then(() => {
            this.setState({updateDone: true});
        });
    }

    render(_, {isBrowsing, updateDone}) {
        return (
            <AppContext.Consumer>
                {App => (
                    <div class="installing">
                        <div class="scroller">
                            {isBrowsing ? this.renderBrowser() : this.renderUpdating()}
                            <div class="margin-bottom10" />
                        </div>
                        <div class="footer">
                            <button onClick={() => {
                                if (isBrowsing) App.reset();
                                else this.setState({isBrowsing: true});
                            }}>Back</button>
                            <button
                                onClick={() => {
                                    if (updateDone) return IPC.send(IPCEvents.CLOSE_APP);
                                    if (!isBrowsing) {
                                        this.handleUpdate();
                                    } else {
                                        this.setState({isBrowsing: false});
                                    }
                                }}
                            >
                                {isBrowsing ? "Continue" : updateDone ? "Close" : "Update"}
                            </button>
                        </div>
                    </div>
                )}
            </AppContext.Consumer>
        );
    }
}
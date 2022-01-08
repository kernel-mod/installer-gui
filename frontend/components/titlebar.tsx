import Preact, {Component, Fragment} from "preact";
import Close from "./icons/close";
import Minimize from "./icons/minimize";
import "./titlebar.scss";
import {ipcRenderer as IPC} from "electron";
import IPCEvents from "@common/ipcevents";
import AppContext from "./AppContext";
import CaretRight from "./icons/caret_right";

class Application {
    static close() {IPC.send(IPCEvents.CLOSE_WINDOW);}

    static minimize() {IPC.send(IPCEvents.MINIMIZE_WINDOW);}
}

export default class TitleBar extends Component {
    render() {
        return (
            <AppContext.Consumer>
                {App => (
                    <div class="titlebar">
                        <div class="title">
                            <div class="app-title" onClick={App.reset}>Installer</div>
                            {App.currentPage.element ? (
                                <Fragment>
                                    <CaretRight class="caret" />
                                    <div class="subPage">{App.currentPage.title}</div>
                                </Fragment>
                            ) : null}
                        </div>
                        <div class="buttons">
                            <div class="button minimize" onClick={() => Application.minimize()}>
                                <Minimize width="16" height="16" />
                            </div>
                            <div class="button close" onClick={() => Application.close()}>
                                <Close width="16" height="16" />
                            </div>
                        </div>
                    </div>
                )}
            </AppContext.Consumer>
        );
    }
}
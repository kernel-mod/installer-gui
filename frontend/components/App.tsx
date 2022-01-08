import Preact, {Component} from "preact";
import InstallPage from "./actions/install";
import UninstallPage from "./actions/uninstall";
import UpdatePage from "./actions/update";
import AppContext from "./AppContext";
import Category from "./category";
import Install from "./icons/install";
import Uninstall from "./icons/uninstall";
import Update from "./icons/update";
import {Notifications} from "./notifications";
import TitleBar from "./titlebar";

export default class App extends Component {
    state = {navigator: {}}

    handleSetPage({element, title}): void {
        this.setState({
            navigator: {element, title}
        });
    }

    handleReset(): void {
        this.setState({navigator: {}});
    }

    renderHome() {
        return (
            <div class="form">
                <div class="form-title">Actions</div>
                <Category title="Install" icon={Install} note="Install kernel to an application you choose.">
                    <InstallPage />
                </Category>
                <Category title="Uninstall" icon={Uninstall} note="Uninstall kernel from an application you choose.">
                    <UninstallPage />
                </Category>
                <Category title="Update" icon={Update} note="Update the kernel.asar to the latest release.">
                    <UpdatePage />
                </Category>
            </div>
        );
    }

    render(_, {navigator}) {
        const context = {
            currentPage: navigator,
            setPage: this.handleSetPage.bind(this),
            reset: this.handleReset.bind(this)
        };

        return (
            <AppContext.Provider value={context}>
                <div id="app-mount">
                    <TitleBar />
                    <div class="app">
                        {navigator.element ? navigator.element : this.renderHome()}
                    </div>
                    <Notifications />
                </div>
            </AppContext.Provider>
        );
    }
}
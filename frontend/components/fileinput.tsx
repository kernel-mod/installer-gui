import Preact, {Component} from "preact";
import "./fileinput.scss";
import {ipcRenderer as IPC} from "electron";
import IPCEvents from "@common/ipcevents";
import CaretRight from "./icons/caret_right";
import CaretDown from "./icons/caret_down";
import fs from "fs";
import Close from "./icons/close";

class FileBrowser {
    static async openPath(title: string): Promise<string[]> {
        const result = await IPC.invoke(IPCEvents.BROWSE_PATHS, {
            title: title,
            properties: ["openDirectory", "multiSelections"]
        });
        return result.filePaths;
    }
}

export default class FileInput extends Component<{
    onChange: (paths: string[]) => void;
    title: string;
    name: string;
    files: string[];
    onRemove(path: string): void;
}, {
    expanded: boolean;
}> {
    state = {files: [], expanded: true};

    handleBrowse = (event: MouseEvent): void => {
        event.preventDefault();
        event.stopPropagation();
        FileBrowser.openPath(this.props.title).then((paths) => {
            const files = [...new Set(this.props.files.concat(paths))];
            this.props.onChange(files);
        });
    }

    renderFile = (path: string, index: number) => {
        return (
            <div class="file" key={path}>
                <div class="filename">{path}</div>
                <button class="inline" onClick={() => this.props.onRemove(path)}>
                    <Close width="16" height="16" />
                </button>
            </div>
        );
    }

    handleExpandChange = (): void => {
        if (!this.props.files.length) return;

        this.setState(prev => ({expanded: !prev.expanded}));
    }

    render({name, title, files}, {expanded}) {
        return (
            <div class="form">
                <div class="form-title">{title}</div>
                <div class="file-picker">
                    <div class="header">
                        <div class="name">{name}</div>
                        <button
                            class="browse-file"
                            onClick={this.handleBrowse}
                        >Browse</button>
                        <button class="inline expandButton" onClick={this.handleExpandChange} disabled={!files.length}>
                            {(files.length && expanded) ? <CaretDown /> : <CaretRight />}
                        </button>
                    </div>
                    {expanded && files.map(this.renderFile)}
                </div>
            </div>
        );
    }
}
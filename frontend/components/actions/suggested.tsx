import Preact, {Component} from "preact";
import path from "path";
import fs from "fs";
import Add from "../icons/add";
import "./suggested.scss";

const validateDirectory = (path: string) => fs.existsSync(path) && fs.statSync(path).isDirectory();
const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1);
const sum = (...numbers) => numbers.reduce((full, num) => full += Number(num));
const extractVersion = (str: string) => sum(...str.slice("app-".length).split("."));

const AppData = process.env.LOCALAPPDATA ?? path.join(process.env.USERPROFILE ?? "/", "AppData", "Local");
const ProgramData = process.env.ProgramData ?? path.join("C:", "ProgramData");

const makeDiscordPath = (type: "canary" | "stable" | "ptb" | "development") => ({
    id: type === "stable" ? "Discord" : `Discord${capitalize(type)}`,
    name: `Discord${type === "stable" ? "" : capitalize(type)}`,
    get icon() {
        if (this._icon) return this._icon;
        let location = path.resolve(AppData, this.id, "app.ico");
        if (!fs.existsSync(location)) location = path.resolve(ProgramData, this.id, "app.ico");
        if (!fs.existsSync(location)) return "";
        return this._icon = ("data:image/x-icon;base64," + fs.readFileSync(location).toString("base64"));
    },
    get path() {
        if (this._path) return this._path;

        let location = path.resolve(AppData ?? "", this.id);
        
        if (!validateDirectory(location)) location = path.resolve(ProgramData, this.id);
        if (!validateDirectory(location)) return "";

        const appFolder = fs.readdirSync(location, "utf8")
            .filter(e => e.startsWith("app-") && validateDirectory(path.resolve(location, e)))
            .sort((a, b) => extractVersion(b) - extractVersion(a))[0];
        
        return this._path = path.resolve(location, appFolder);
    }
});

const knownApplications = {
    Discord: makeDiscordPath("stable"),
    DiscordPTB: makeDiscordPath("ptb"),
    DiscordCanary: makeDiscordPath("canary"),
    DiscordDevelopment: makeDiscordPath("development")
};

export default class SuggestedApplications extends Component<{onSelect(app: string): void, files: string[]}> {
    renderApplication = (app: typeof knownApplications[keyof typeof knownApplications]) => {
        if (!app.path) return null;

        return (
            <div class={`application${this.props.files.includes(app.path) ? " disabled" : ""}`} key={app.name}>
                <img src={app.icon} class="app-icon" />
                <div class="app-container">
                    <div class="app-name">{app.name}</div>
                    <div class="app-path">{app.path}</div>
                </div>
                <button class="inline app-add" onClick={this.props.onSelect.bind(null, app.path)}>
                    <Add />
                </button>
            </div>
        );
    }

    render() {
        return (
            <div class="form">
                <div class="form-title">Suggested Appplications</div>
                {Object.values(knownApplications).map(this.renderApplication)}
            </div>
        )
    }
}
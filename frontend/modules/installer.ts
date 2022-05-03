import {promises as fs, createWriteStream} from "original-fs";
import path from "path";
import https from "https";

const headers = {
    "User-Agent": "Kernel-Mod GUI Installer (https://github.com/kernel-mod)"
};

export type LogFn = (message: string) => void;

export type AppType = "ASAR" | "DEFAULT" | "UNKNOWN";

export type GithubResponse = {
    url: string;
    assets_url: string;
    upload_url: string;
    html_url: string;
    id: number;
    author: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
    };
    node_id: string;
    tag_name: string;
    target_commitish: string;
    name: string;
    created_at: string;
    published_at: string;
    assets: {
        url: string;
        id: number;
        node_id: string;
        name: string;
        label: string;
        uploader: {
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
        };
        content_type: string;
        state: string;
        size: number;
        download_count: number;
        created_at: string;
        updated_at: string;
        browser_download_url: string;
    }[];
    tarball_url: string;
    zipball_url: string;
    body: string;
};

const files = [
    {
        name: "index.js",
        content() {
            return `const path=require("path");require(path.join(require(path.join(__dirname,"package.json")).location,"kernel.asar"))?.default?.({startOriginal: true});`;
        }
    },
    {
        name: "package.json",
        content({kernelPath}) {
            return JSON.stringify({
                main: "index.js",
                location: kernelPath
            }, null, 4);
        }
    }
];

export default class Installer {
    static async hasAccess(path: string): Promise<[boolean, Error]> {
        return fs.access(path).then(
            () => [true, null],
            error => [false, error]
        );
    }

    static async exists(path: string): Promise<boolean> {
        return fs.access(path).then(
            () => true,
            () => false
        );
    }

    static async getAppType(appPath: string): Promise<AppType> {
        const hasAppAsar = await this.exists(path.resolve(appPath, "resources", "app.asar"));
        const hasOriginalAsar = await this.exists(path.resolve(appPath, "resources", "app-original.asar"));
        if (hasAppAsar || hasOriginalAsar) return "ASAR";

        const hasAppFolder = await this.exists(path.resolve(appPath, "resources", "app"));
        const hasOriginalFolder= await this.exists(path.resolve(appPath, "resources", "app-original"));

        return (hasAppFolder || hasOriginalFolder) ? "DEFAULT" : "UNKNOWN";
    }

    static async hasInjection(resourcesFolder: string, type: AppType): Promise<boolean> {
        switch (type) {
            case "DEFAULT": {
                return await this.exists(path.resolve(resourcesFolder, "app-original"));
            };
            
            case "ASAR": {
                return await this.exists(path.resolve(resourcesFolder, "app-original.asar"));
            };
                
            default: return null;
        }
    }

    static async downloadKernelASAR(onLog: LogFn, asarPath: string) {
        try {
            const releases = await fetch("https://api.github.com/repos/kernel-mod/electron/releases/latest", {headers}).then(res => res.json() as unknown as GithubResponse);
            if (!releases) throw "Releases is void!";
            const kernelAsar = releases.assets.find(e => e.name === "kernel.asar");
            if (!kernelAsar) throw "Release file not found.";
            const [hasAccess, error] = await this.hasAccess(asarPath);
            if (!hasAccess) {
                onLog(`❌ No write permissions for ${asarPath}`);
                throw error;
            }
            
            const res = await new Promise<any>(resolve => {
                const fetchUrl = function (url: string) {
                    https.get(url, {
                        headers: {
                            ...headers,
                            "Accept": kernelAsar.content_type
                        }
                    }, res => {
                        // Make it follow redirects
                        if (res.statusCode === 301 || res.statusCode === 302) {
                            return fetchUrl(res.headers.location);
                        }

                        resolve(res);
                    });
                };

                fetchUrl(kernelAsar.url);
            });

            res.pipe(createWriteStream(asarPath));
            await new Promise((resolve, reject) => {
                res.on("error", reject);
                res.on("end", resolve);
            });

            return false;
        } catch (error) {
            onLog(`❌ Failed to download kernel.asar file.`);
            console.error(error);

            return true;
        } 
    }

    static async install(applications: string[], {kernelPath, downloadASAR, makePackagesFolder}, onLog: LogFn): Promise<void> {
        let hasFailed = false;

        for (let i = 0; i < applications.length; i++) {
            const [hasAccess, error] = await this.hasAccess(applications[i]);
            if (!hasAccess) {
                onLog(`❌ Unable to access ${applications[i]}: ${error}`);
                hasFailed = true;
                continue;
            }
            const type = await this.getAppType(applications[i]);
            if (type === "UNKNOWN") {
                onLog(`❌ Unknown App type ${applications[i]}`);
                hasFailed = true;
                continue;
            }
            const hasInjection = this.hasInjection(path.resolve(applications[i], "resources"), type);
            if (!hasInjection) {
                onLog(`❌ Already installed ${applications[i]}`);
                hasFailed = true;
                continue;
            }
        }

        if (hasFailed) return;
        const [hasAccess, error] = await this.hasAccess(kernelPath);

        if (!hasAccess) return onLog(`❌ Unable to access ${kernelPath}: ${error}`);

        onLog("✅ Successfully validated all directories");
        let asarLocation = path.resolve(kernelPath, "kernel.asar"); 
        if (!downloadASAR) {
            const [hasAccess] = await this.hasAccess(asarLocation);
            if (!hasAccess) {
                hasFailed = true;
                onLog(`❌ File does not exist: ${asarLocation}`);
            }
        }
        if (hasFailed) return;

        hasFailed = await this.downloadKernelASAR(onLog, asarLocation);

        if (hasFailed) return;

        onLog(`✅ Successfully downloaded kernel.asar`);

        if (makePackagesFolder) {
            try {
                const folder = path.resolve(kernelPath, "packages");
                console.log({folder, p: await this.exists(folder)});
                const packagesFolderExists = await this.exists(folder);
                if (packagesFolderExists) {
                    onLog(`⚠️ Packages folder already exists!`);
                } else {
                    await fs.mkdir(folder);
                    onLog(`✅ Successfully created packages folder.`);
                }
            } catch (error) {
                hasFailed = true;
            }
        }

        for (let i = 0; i < applications.length; i++) {
            try {
                const resourcesFolder = path.resolve(applications[i], "resources");
                const [canAccessResources, error] = await this.hasAccess(resourcesFolder);
                if (!canAccessResources) {
                    onLog(`❌ Unable to access ${resourcesFolder}`);
                    throw error;
                }
                const appPath = path.resolve(resourcesFolder, "app");

                try {
                    await fs.mkdir(appPath);
                } catch (error) {
                    onLog(`❌ Unable to create app folder`);
                    throw error;
                }

                for (let i = 0; i < files.length; i++) {
                    const location = path.resolve(appPath, files[i].name);

                    try {
                        await fs.writeFile(location, files[i].content({kernelPath}));
                    } catch (error) {
                        onLog(`❌ Unable to create ${files[i].name} file`);
                        throw error;
                    }
                }

                let ext = "";
                try {
                    const type = await this.getAppType(path.resolve(resourcesFolder, ".."));
                    if (type === "ASAR") ext = ".asar";

                    const oldPath = path.resolve(resourcesFolder, "app" + ext);
                    const newPath = path.resolve(resourcesFolder, "app-original" + ext);
                    await fs.rename(oldPath, newPath);
                } catch (error) {
                    onLog(`❌ Unable to rename core folder from app${ext} -> app-original${ext}`);
                    hasFailed = true;
                }

                onLog(`✅ Successfully created injection to ${applications[i]}`);
            } catch (error) {
                console.error(error);
                hasFailed = true;
            }
        }

        if (hasFailed) return;

        onLog(`✅ Installation successful. Please restart the application${applications.length > 1 ? "s" : ""} to make changes take affect.`);
    }
}
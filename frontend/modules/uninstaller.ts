import {promises as fs} from "original-fs";
import path from "path";

export type AppType = "ASAR" | "DEFAULT" | "UNKNOWN";
export type LogFn = (message: string) => void;

export default class Uninstaller {
    static async hasAccess(path: string): Promise<[boolean, Error]> {
        try {
            await fs.access(path);
        } catch (error) {
            return [false, error];
        } finally {
            return [true, null];
        }
    }

    static async exists(path: string): Promise<boolean> {
        try {
            await fs.access(path);
            return true;   
        } catch {
            return false;
        }
    } 

    static async emptyDirectory(folder: string): Promise<void> {
        const files = await fs.readdir(folder);

        for (let i = 0; i < files.length; i++) {
            const file = path.resolve(folder, files[i]);

            await fs.unlink(file);
        }
    }

    static async getAppType(appPath: string): Promise<AppType> {
        const hasOriginalAsar = await this.exists(path.resolve(appPath, "resources", "app-original.asar"));
        if (hasOriginalAsar) return "ASAR";

        const hasOriginalFolder = await this.exists(path.resolve(appPath, "resources", "app-original"));

        return hasOriginalFolder ? "DEFAULT" : "UNKNOWN";
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

    static async uninstall(applications: string[], onLog: LogFn): Promise<void> {
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
                onLog(`❌ No injection visible for ${applications[i]}`);
                hasFailed = true;
                continue;
            }
        }

        if (hasFailed) return;

        onLog("✅ Successfully validated all directories");

        for (let i = 0; i < applications.length; i++) {
            try {
                const resourcesFolder = path.resolve(applications[i], "resources");
                const [canAccessResources, error] = await this.hasAccess(resourcesFolder);
                if (!canAccessResources) {
                    onLog(`❌ Unable to access ${resourcesFolder}`);
                    throw error;
                }
                const type = await this.getAppType(path.resolve(resourcesFolder, ".."));
                const extension = type === "ASAR" ? ".asar" : "";
                const appPath = path.resolve(resourcesFolder, "app");

                try {
                    await this.emptyDirectory(appPath);
                    await fs.rmdir(appPath);
                } catch (error) {
                    onLog(`❌ Unable clear create app folder`);
                    throw error;
                }

                try {
                    const oldPath = path.resolve(resourcesFolder, "app-original" + extension);
                    const newPath = path.resolve(resourcesFolder, "app" + extension);
                    await fs.rename(oldPath, newPath);
                } catch (error) {
                    onLog(`❌ Unable to rename core from app-original${extension} -> app${extension}`);
                    hasFailed = true;
                }

                onLog(`✅ Successfully removed injection to ${applications[i]}`);
            } catch (error) {
                console.error(error);
                hasFailed = true;
            }
        }

        if (hasFailed) return;

        onLog(`✅ Uninstall successful. Please restart the application${applications.length > 1 ? "s" : ""} to make changes take affect.`);
    }
}
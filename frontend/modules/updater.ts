import {promises as fs, createWriteStream} from "original-fs";
import path from "path";
import https from "https";

export type LogFn = (message: string) => void;

export default class Updater {
    static async hasAccess(path: string): Promise<[boolean, Error]> {
        try {
            await fs.access(path);
        } catch (error) {
            return [false, error];
        } finally {
            return [true, null];
        }
    }

    static async downloadKernelASAR(onLog: LogFn, asarPath: string) {
        try {
            const releases = await fetch("https://api.github.com/repos/kernel-mod/electron/releases/latest").then(res => res.json());
            if (!releases) throw "Releases is void!";
            onLog(`🕓 Latest release: ${new Date(releases.created_at).toLocaleString()}`);
            const kernelAsar = releases.assets.find(e => e.name === "kernel.asar");
            if (!kernelAsar) throw "Release file not found.";
            const [hasAccess, error] = await this.hasAccess(asarPath);
            if (!hasAccess) {
                onLog(`❌ No write permissions for ${asarPath}`);
                throw error;
            }
            
            const res = await new Promise<any>(resolve => https.get(kernelAsar.url, resolve));
            res.pipe(createWriteStream(asarPath));
            await new Promise((resolve, reject) => {
                res.on("error", reject);
                res.on("end", resolve);
            });
        } catch (error) {
            onLog(`❌ Failed to download kernel.asar file.`);
            console.error(error);
            return true;
        } finally {
            return false;
        }
    }

    static async update(kernelPath: string, onLog: LogFn): Promise<void> {
        const [hasAccess, error] = await this.hasAccess(kernelPath);

        if (!hasAccess) return onLog(`❌ Unable to access ${kernelPath}: ${error}`);
        const asarPath = path.resolve(kernelPath, "kernel.asar");

        let hasFailed = await this.downloadKernelASAR(onLog, asarPath);

        if (hasFailed) return;

        onLog("✅ Update successful. Please restart the application to make changes take affect.");
    }
}
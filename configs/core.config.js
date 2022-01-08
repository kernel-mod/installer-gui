import alias from "@rollup/plugin-alias";
import path from "path";
import {defineConfig} from "rollup"
import resolve from "@rollup/plugin-node-resolve";
import swc from "rollup-plugin-swc";

const root = path.resolve(__dirname);

export default args => {
    return defineConfig({
        input: path.resolve(root, "core", "index.ts"),
        output: {
            format: "cjs",
            file: "dist/core.js"
        },
        external: ["electron", "electron-acrylic-window"],
        plugins: [
            alias({
                entries: [
                    {find: "@common", replacement: path.resolve(root, "common")}
                ]
            }),
            resolve({
                extensions: [".tsx", ".ts", ".json", ".scss"]
            }),
            swc({
                jsc: {
                    target: "es2020",
                    parser: {
                        syntax: "typescript"
                    }
                }
            })
        ]
    });
}
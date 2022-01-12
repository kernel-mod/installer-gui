import swc from "rollup-plugin-swc";
import resolve from "@rollup/plugin-node-resolve";
import {defineConfig} from "rollup";
import html from "@rollup/plugin-html";
import path from "path";
import alias from "@rollup/plugin-alias";
import serve from "rollup-plugin-serve";
import scss from "rollup-plugin-scss";

const root = path.resolve(__dirname);

export default args => {
    return defineConfig({
        input: path.resolve(root, "frontend", "index.ts"),
        external: ["preact", "electron"],
        output: {
            format: "commonjs",
            file: "dist/frontend.js"
        },
        plugins: [
            scss({
                output: path.resolve(root, "dist", "style.css"),
                runtime: require("sass")
            }),
            (args.w ?? args.watch) && serve({
                contentBase: ["dist", "public"],
                port: 5670
            }),
            html({
                title: "Kernel Installer",
                attributes: {
                    script: {type: "module"}
                }
            }),
            resolve({
                extensions: [".tsx", ".ts", ".json", ".scss"]
            }),
            alias({
                entries: [
                    {find: "react", replacement: "preact/compat"},
                    {find: "react-dom", replacement: "preact/compat"},
                    {find: "@common", replacement: path.resolve(root, "common")}
                ]
            }),
            swc({
                jsc: {
                    target: "es2020",
                    parser: {
                        tsx: true,
                        syntax: "typescript",
                        decorators: true
                    },
                    transform: {
                        react: {
                            pragma: "Preact.h",
                            pragmaFrag: "Preact.Fragment"
                        }
                    }
                }
            })
        ].filter(Boolean)
    });
}
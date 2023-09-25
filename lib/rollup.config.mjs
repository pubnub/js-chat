import pkg from "./package.json" assert { type: 'json' };
import replace from "@rollup/plugin-replace"
import ts from "rollup-plugin-ts"
import terser from '@rollup/plugin-terser';

export default [
    {
    input: "./src/index.ts",
    external: ["pubnub"],
    output: [
        {
            file: pkg.main,
            format: "cjs",
        },
        {
            file: pkg.module,
            format: "esm",
        },
    ],
    plugins: [
        replace({
            preventAssignment: true,
            __PLATFORM__: "RCC",
            __VERSION__: pkg.version,
        }),
        ts(),
        terser(),
    ],
}]

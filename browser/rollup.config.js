import typescript from '@rollup/plugin-typescript'

/** @type {import('rollup').RollupOptions} */
const options = {
    input: 'src/main.ts',
    output: {
        dir: 'build',
        format: 'iife',
    },
    plugins: [typescript()],
}

export default options

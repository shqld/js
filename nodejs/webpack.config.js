/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path')
// const assert = require('assert/strict')

const PATH_PROJECT_ROOT = __dirname

const { BUILD_ENV = 'production' } = process.env

const __DEV__ = BUILD_ENV === 'development'

/** @type {import('webpack').Configuration} */
const config = {
    mode: !__DEV__ ? 'production' : 'development',
    target: 'node',
    entry: path.join(PATH_PROJECT_ROOT, 'src/main.ts'),
    output: {
        path: path.join(PATH_PROJECT_ROOT, 'build'),
        // FIXME: esmodule
        libraryTarget: 'commonjs',
        clean: true,
        assetModuleFilename: __DEV__
            ? '.[path][name][ext]'
            : '.[path][name].[contenthash:8][ext]',
    },
    devtool: __DEV__ ? 'eval-cheap-module-source-map' : 'source-map',
    optimization: {
        splitChunks: false,
    },
    cache: __DEV__,
    experiments: {
        topLevelAwait: true,
    },
    externalsPresets: { node: true },
    externals: [
        require('webpack-node-externals')({
            modulesDir: path.join(PATH_PROJECT_ROOT, 'node_modules'),
            allowlist: [/\.css$/],
        }),
    ],
    resolve: {
        extensions: ['.ts', '.tsx'],
    },
    plugins: [
        new (require('webpack-manifest-plugin').WebpackManifestPlugin)({}),
        __DEV__ &&
            new (require('nodemon-webpack-plugin'))({
                script: path.join(PATH_PROJECT_ROOT, 'build/main.js'),
                watch: path.join(PATH_PROJECT_ROOT, 'build/main.js'),
                ext: 'js,jsx,ts,tsx,json',
                nodeArgs: ['--inspect=9222'],
                env: {
                    APP_ENV: 'development',
                },
            }),
        !__DEV__ &&
            new (require('webpack').DefinePlugin)({
                BUILD_ENV: JSON.stringify(
                    __DEV__ ? 'development' : 'production'
                ),
            }),
        !__DEV__ &&
            new (require('compression-webpack-plugin'))({
                exclude: /\.js$/,
                filename: '[path][base].gz',
                algorithm: 'gzip',
            }),
        !__DEV__ &&
            new (require('compression-webpack-plugin'))({
                exclude: /\.js$/,
                filename: '[path][base].br',
                algorithm: 'brotliCompress',
                compressionOptions: {
                    params: {
                        [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11,
                    },
                },
            }),
    ].filter(Boolean),
    module: {
        rules: [
            {
                test: /\.(js|ts)x?$/,
                use: [{ loader: 'babel-loader' }],
            },
            {
                test: (filePath) =>
                    path.resolve(filePath).includes(path.resolve('assets')),
                type: 'asset/resource',
                // NOTE: Any options like enabling symlink instead of copying would improve build performance
            },
        ],
    },
}

module.exports = config

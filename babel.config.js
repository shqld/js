module.exports = (api) => {
    const isNode = api.caller((caller) => {
        if (caller) {
            return caller.name === 'babel-jest' || caller.target === 'node'
        }
    })

    api.cache.using(() => isNode)

    return {
        presets: [
            [
                '@babel/env',
                {
                    targets: isNode && { node: 'current' },
                },
            ],
            ['@babel/typescript', { jsxPragma: 'h' }],
        ],
        plugins: [
            '@babel/proposal-nullish-coalescing-operator',
            '@babel/proposal-optional-chaining',
        ],
        sourceMaps: true,
        comments: false,
    }
}

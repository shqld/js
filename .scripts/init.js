/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path')
const { existsSync } = require('fs')
const fs = require('fs/promises')
const { promisify } = require('util')
const prompts = require('prompts')
const arg = require('arg')

const exec = promisify(require('child_process').exec)

main().catch((err) => {
    console.error(err)
    process.exit(1)
})

async function main() {
    const debug = require('debug')('boilerplate')

    const args = arg({
        '--help': Boolean,
        '--debug': Boolean,
    })

    debug.enabled = args['--debug']

    debug('args:', args)

    const available_envs = [
        'browser/blank',
        'browser/preact',
        'browser/react',
        'nodejs/blank',
        'nodejs/cli',
        'nodejs/server',
        'nodejs/server+ssr',
        // 'worker/blank',
    ]

    const available_env_names = Array.from(
        new Set(available_envs.map((env) => env.split('/')[0]))
    )

    /** @type {{ value: number }} */
    const { value: selected_env_index } = await prompts({
        type: 'select',
        name: 'value',
        choices: available_envs,
        message: 'Which environment do you use?',
    })

    if (typeof selected_env_index !== 'number') {
        throw new Error('No environment selected')
    }

    debug('started')

    const selected_env = available_envs[selected_env_index]
    const [selected_env_name, selected_env_option] = selected_env.split('/')

    debug('selected:', selected_env)

    const root_dir = path.join(__dirname, '..')

    const unwanted_env_names = available_env_names.filter(
        (env_name) => selected_env_name !== env_name
    )

    debug('removing ...', unwanted_env_names)

    await Promise.all(
        unwanted_env_names.map((env_name) =>
            fs.rm(path.join(root_dir, env_name), { recursive: true })
        )
    )

    debug('removing ... done')

    const selected_env_dir = path.join(root_dir, selected_env_name)

    const entries = await fs.readdir(selected_env_dir)

    const moving_locations = entries
        .map((entry_name) => {
            const from = path.join(selected_env_dir, entry_name)
            const to = path.join(root_dir, entry_name)

            return { name: entry_name, from, to }
        })
        .filter(Boolean)

    if (debug.enabled) {
        debug(
            'moving_locations:',
            moving_locations.map(
                ({ from, to }) =>
                    path.relative(root_dir, from) +
                    ' -> ' +
                    path.relative(root_dir, to)
            )
        )
    }

    debug('removing empty dirs in root dir ...')

    await Promise.all(
        (
            await fs.readdir(root_dir)
        ).map(async (entry_name) => {
            try {
                await fs.rmdir(entry_name)
            } catch (err) {
                if (err.code !== 'ENOTEMPTY' && err.code !== 'ENOTDIR') {
                    throw err
                }
            }
        })
    )

    debug('moving files to root dir ...')

    await Promise.all(
        moving_locations.map(async ({ name, from, to }) => {
            if (existsSync(to) && name !== 'package.json') {
                // dotfiles are just extending the ones in root_dir so we
                // don't want to overwrite them
                debug('file exists ... skipped:', to)
            } else {
                await fs.rename(from, to)
            }
        })
    )

    debug('moving files to root dir ... done')

    debug('removing env dir ...')

    await fs.rm(selected_env_dir, { recursive: true })

    debug('removing env dir ... done')

    debug("running 'npm install' ...")

    await exec('npm install', { cwd: root_dir })

    debug("running 'npm install' ... done")

    debug('done')
}

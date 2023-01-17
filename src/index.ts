import path from 'node:path'
import {
  type Plugin,
  type ResolvedConfig,
  type UserConfig,
  build as viteBuild,
  createServer,
  loadConfigFromFile,
  mergeConfig,
} from 'vite'

export interface OptionItem {
  /**
   * Human friendly name of your entry point.
   */
  name: string
  /**
   * Vite config file path.
   */
  config: string
}

export default function multiple(
  options: OptionItem[],
  args: {
    /**
     * Called when all builds are complete.
     */
    callback?: (command: ResolvedConfig['command']) => void,
  } = {},
): Plugin {
  let config: ResolvedConfig

  return {
    name: 'vite-plugin-multiple',
    config(config) {
      config.clearScreen ??= false
    },
    async configResolved(_config) {
      config = _config
    },
    configureServer(server) {
      if (server.httpServer) {
        server.httpServer.once('listening', () => serve(config, options).then(() => args.callback?.('serve')))
      } else {
        serve(config, options).then(() => args.callback?.('serve'))
      }
    },
    async closeBundle() {
      if (config.command === 'build') {
        await build(config, options)
        args.callback?.(config.command)
      }
    },
  }
}

export async function resolveConfig(config: ResolvedConfig, option: OptionItem): Promise<UserConfig> {
  const { config: userConfig } = (await loadConfigFromFile({
    command: config.command,
    mode: config.mode,
    ssrBuild: !!config.build?.ssr,
  }, option.config)) ?? { path: '', config: {}, dependencies: [] };
  const defaultConfig: UserConfig = {
    root: config.root,
    mode: config.mode,
    build: {
      outDir: !userConfig.root || config.root === userConfig.root
        ? path.posix.join(config.build.outDir, option.name)
        : undefined,
    },
    clearScreen: false,
  }
  return mergeConfig(defaultConfig, userConfig);
}

export async function build(config: ResolvedConfig, options: OptionItem[]) {
  for (const option of options) {
    const userConfig = await resolveConfig(config, option)
    await viteBuild({
      // 🚧 Avoid recursive build caused by load default config file.
      configFile: false,
      ...userConfig,
    })
  }
}

export async function serve(config: ResolvedConfig, options: OptionItem[]) {
  let port = 5174 // The port of main App is 5173
  for (const option of options) {
    const userConfig = await resolveConfig(config, option)

    userConfig.server ??= {}
    userConfig.server.port ??= port++

    const viteDevServer = await createServer({
      configFile: false,
      ...userConfig,
    })
    await viteDevServer.listen()
    viteDevServer.printUrls()
  }
}

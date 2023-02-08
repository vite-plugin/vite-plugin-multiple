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

export type AppConfig = Parameters<typeof multiple>[0][number]

export default function multiple(
  apps: {
    /**
     * Human friendly name of your entry point.
     */
    name: string
    /**
     * Vite config file path.
     */
    config: string
  }[],
  options: {
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
        server.httpServer.once('listening', () => serve(config, apps).then(() => options.callback?.('serve')))
      } else {
        serve(config, apps).then(() => options.callback?.('serve'))
      }
    },
    async closeBundle() {
      if (config.command === 'build') {
        await build(config, apps)
        options.callback?.(config.command)
      }
    },
  }
}

export async function resolveConfig(config: ResolvedConfig, app: AppConfig): Promise<UserConfig> {
  const { config: userConfig } = (await loadConfigFromFile({
    command: config.command,
    mode: config.mode,
    ssrBuild: !!config.build?.ssr,
  }, app.config)) ?? { path: '', config: {}, dependencies: [] };
  const defaultConfig: UserConfig = {
    root: config.root,
    mode: config.mode,
    build: {
      outDir: !userConfig.root || userConfig.root === /* conflict */config.root
        ? path.posix.join(config.build.outDir, app.name)
        : undefined,
    },
    clearScreen: false,
  }
  return mergeConfig(defaultConfig, userConfig);
}

export async function build(config: ResolvedConfig, apps: AppConfig[]) {
  for (const app of apps) {
    const userConfig = await resolveConfig(config, app)
    await viteBuild({
      // 🚧 Avoid recursive build caused by load default config file.
      configFile: false,
      ...userConfig,
    })
  }
}

export async function serve(config: ResolvedConfig, apps: AppConfig[]) {
  let port = 5174 // The port of main App is 5173
  for (const app of apps) {
    const userConfig = await resolveConfig(config, app)

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

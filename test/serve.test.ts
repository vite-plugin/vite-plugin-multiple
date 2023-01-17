import path from 'node:path'
import {
  type ViteDevServer,
  createServer,
} from 'vite'
import {
  beforeAll,
  afterAll,
  expect,
  test,
} from 'vitest'
import fetch from 'node-fetch'
import multiple from '../src'

const root = path.join(__dirname, 'fixtures')
const servers: ViteDevServer[] = []

beforeAll(async () => new Promise(async resolve => {
  const server = await createServer({
    configFile: path.join(root, 'vite.config.mjs'),
    plugins: [multiple([
      {
        name: 'foo',
        config: path.join(root, 'foo/vite.config.mjs'),
      },
      {
        name: 'bar',
        config: path.join(root, 'bar/vite.config.mjs'),
      },
    ], {
      callback(command) {
        resolve()
      },
    })],
  })
  await server.listen()
}))

test('serve', async () => {
  const mainHTML = await (await fetch('http://localhost:5173')).text()
  const fooHTML = await (await fetch('http://localhost:5174')).text()
  const barHTML = await (await fetch('http://localhost:5175')).text()

  expect(mainHTML).includes('<h1>main</h1>')
  expect(fooHTML).includes('<h1>foo</h1>')
  expect(barHTML).includes('<h1>bar</h1>')
})

afterAll(async () => {
  for (const server of servers) {
    await server.close()
  }
  servers.length = 0
})

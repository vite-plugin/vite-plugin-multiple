import fs from 'node:fs'
import path from 'node:path'
import { build as viteBuild } from 'vite'
import {
  beforeAll,
  afterAll,
  expect,
  test,
} from 'vitest'
import multiple from '../src'

const root = path.join(__dirname, 'fixtures')

beforeAll(async () => {
  await viteBuild({
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
    ])],
  })
})

test('build', async () => {
  const { message: main } = await import('./fixtures/dist/main'!)
  const { message: foo } = await import('./fixtures/foo/dist/main'!)
  const { message: bar } = await import('./fixtures/bar/dist/main'!)
  expect(main).eq('main')
  expect(foo).eq('foo')
  expect(bar).eq('bar')
})

afterAll(() => {
  fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true })
  fs.rmSync(path.join(root, 'foo/dist'), { recursive: true, force: true })
  fs.rmSync(path.join(root, 'bar/dist'), { recursive: true, force: true })
})

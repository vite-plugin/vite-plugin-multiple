# vite-plugin-multiple

Allow multiple Vite to run simultaneously.

[![NPM version](https://img.shields.io/npm/v/vite-plugin-multiple.svg)](https://npmjs.com/package/vite-plugin-multiple)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-multiple.svg)](https://npmjs.com/package/vite-plugin-multiple)

## Install

```sh
npm i -D vite-plugin-multiple
```

## Usage

```js
import multiple from 'vite-plugin-multiple'

export default {
  plugins: [
    multiple([
      {
        name: 'foo',
        config: 'vite.foo.config.mjs',
      },
      {
        name: 'bar',
        config: 'vite.bar.config.mjs',
      },
    ]),
  ],
}
```

**`vite serve`**

- `http://localhost:5173` access to the **main** app
- `http://localhost:5174` access to the **foo** app
- `http://localhost:5175` access to the **bar** app

**`vite build`**

- `dist` **main** app
- `dist/foo` **foo** app
- `dist/bar` **bar** app

## API <sub><sup>(Define)</sup></sub>

```ts
multiple(
  apps: {
    /**
     * Human friendly name of your entry point.
     */
    name: string
    /**
     * Vite config file path.
     */
    config: string
    /**
     * Explicitly specify the run command.
     */
    command?: 'build' | 'serve'
  }[],
  options: {
    /**
     * Called when all builds are complete.
     */
    callback?: () => void,
  } = {},
)
```

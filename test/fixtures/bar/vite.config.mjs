import { defineConfig } from 'vite'

export default defineConfig(({ command }) => {
  return command === 'build'
    ? {
      build: {
        lib: {
          entry: 'main.ts',
          formats: ['es'],
          fileName: () => '[name].js',
        }
      },
      root: __dirname,
    }
    : {
      root: __dirname,
    }
})

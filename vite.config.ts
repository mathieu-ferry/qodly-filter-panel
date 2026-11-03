import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react-swc';
import importMetaUrlPlugin from '@ws-ui/vite-plugins/dist/esbuild-plugin-import-meta-url';
import standaloneEditorPlugin from '@ws-ui/vite-plugins/dist/standalone-editor-plugin';
import monacoEditorPlugin from '@ws-ui/vite-plugins/dist/vite-plugin-monaco-editor';
import type { PluginOption } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { app_id, dependencies as deps } from './package.json';
import { initProxy } from './proxy.config';

const exposes = {
  './components': './src/components/index.tsx',
};

const isDevEnv = process.env.NODE_ENV === 'development';

const redirect = (opts: { from: string; to: string }): PluginOption => {
  return {
    name: 'redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith(opts.from)) {
          res.statusCode = 307;
          res.setHeader('Location', opts.to);
          res.setHeader('Content-Length', '0');
          return res.end();
        }

        return next();
      });
    },
  };
};

const getBuildPlugins = () => {
  if (isDevEnv) {
    return [monacoEditorPlugin(), standaloneEditorPlugin()];
  }

  return [
    federation({
      name: app_id,
      filename: 'components.js',
      exposes,
      library: { type: 'var' },
      shared: (() => {
        const shared: Record<string, unknown> = {};
        for (const key of ['react', 'react-dom', 'react/jsx-runtime']) {
          shared[key] = {
            requiredVersion: deps[key],
            singleton: true,
            eager: true,
          };
        }
        for (const key of [
          // @ws-ui
          '@ws-ui/webform-editor',
          '@ws-ui/craftjs-core',
          '@ws-ui/craftjs-layers',
          '@ws-ui/craftjs-utils',
          '@ws-ui/shared',
        ]) {
          shared[key] = {
            singleton: true,
            eager: true,
          };
        }
        return shared;
      })(),
    }),
  ];
};

// https://vitejs.dev/config/
export default defineConfig(({ mode = 'local' }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const port = env.PORT || 5001;
  const host = env.HOST || '0.0.0.0';

  const proxy = initProxy(env);

  return {
    plugins: [
      react(),
      redirect({
        from: '/studio/',
        to: '/',
      }),
      cssInjectedByJsPlugin({
        topExecutionPriority: false,
        jsAssetsFilterFunction: (outputChunk) => {
          if (outputChunk.name === 'components') {
            return true;
          }

          return false;
        },
      }),
      ...getBuildPlugins(),
    ],
    define: {
      'process.env': {},
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: isDevEnv ? [importMetaUrlPlugin] : [],
      },
    },
    server: {
      host,
      proxy,
      port: +port,
    },
    build: {
      rollupOptions: {
        external: ['@ws-ui/code-editor'],
        output: {},
      },
      modulePreload: false,
      target: 'esnext',
      minify: false,
      cssCodeSplit: false,
    },
  };
});

import { bindings, defineConfig } from 'cf/config';

export default defineConfig({
  accountId: 'fefde25e1098c58957811b86022ba583',
  worker: {
    name: 'international-tax-comments',
    entrypoint: './src/index.js',
    compatibilityDate: '2026-11-16',
    workersDev: true,
    env: {
      DB: bindings.d1({ id: '693558d1-3105-4177-aabf-df167e76c56f' }),
      ADMIN_TOKEN_HASH: bindings.secret(),
      ALLOWED_ORIGINS: bindings.text('https://international-tax.github.io,http://localhost:8000,http://127.0.0.1:8000'),
    },
  },
});

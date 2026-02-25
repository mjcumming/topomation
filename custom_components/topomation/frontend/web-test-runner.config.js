const { chromeLauncher } = require('@web/test-runner-chrome');
const { esbuildPlugin } = require('@web/dev-server-esbuild');

module.exports = {
  // Only run this package's tests (avoid pulling in node_modules test suites)
  files: ['*.test.ts'],
  nodeResolve: true,
  plugins: [
    esbuildPlugin({
      ts: true,
      target: 'es2020',
      tsconfig: 'tsconfig-wtr.json',
    }),
  ],
  exclude: ['**/node_modules/**', '**/coverage/**', '**/.storybook/**'],
  browsers: [
    chromeLauncher({
      launchOptions: {
        executablePath: process.env.CHROME_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      },
    }),
  ],
  coverage: true,
  coverageConfig: {
    threshold: {
      // Current suite focuses on panel + tree smoke/contract tests.
      // Raise these thresholds as we add dialog/flow coverage.
      statements: 50,
      branches: 40,
      functions: 35,
      lines: 50,
    },
    // Keep coverage focused on core panel + tree for now.
    // (Dialogs, mocks, stories, build configs are exercised in harness/manual testing.)
    exclude: [
      '**/node_modules/**',
      '**/test/**',
      '**/*.test.ts',
      '**/*.stories.ts',
      '**/mock-*.ts',
      '**/styles.ts',
      '**/types.ts',
      '**/vite.config.ts',
      '**/ht-*-dialog.ts',
      '**/ht-location-inspector.ts',
    ],
  },
  testFramework: {
    config: {
      timeout: 5000,
    },
  },
};


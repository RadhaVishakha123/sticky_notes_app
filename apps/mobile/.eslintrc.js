/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['@repo/eslint-config/react-native'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  env: {
    browser: true,
  },
  overrides: [
    {
      files: ['*.js'],
      parserOptions: {
        project: null,
      },
    },
  ],
};

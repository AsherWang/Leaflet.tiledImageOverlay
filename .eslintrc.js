module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    window: 'readonly',
    L: 'readonly',
    define: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    "func-names": [0],
    "global-require": [0],
    "import/no-unresolved": [0],
    "no-console": [0],
  },
};

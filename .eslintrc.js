module.exports = {
    env: {
      browser: true,
      es2021: true
    },
    extends: 'standard-with-typescript',
    overrides: [{
      files: ['./**/*.ts'],
      rules: {
        '@typescript-eslint/strict-boolean-expressions': 'off',
        '@typescript-eslint/quotes': 'off'
      }
    }],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: ['./tsconfig.json']
    },
    rules: {
      indent: [
          "error",
          "tab"
      ],
      "linebreak-style": [
          "error",
          "windows"
      ],
      quotes: [
          "error",
          "single"
      ],
      semi: [
          "error",
          "always"
      ]
  }
  }
  
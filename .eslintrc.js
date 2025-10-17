module.exports = {
  root: true,
  env: { es2020: true, node: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:jsdoc/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'jsdoc'],
  rules: {
    'jsdoc/require-jsdoc': 'error',
    'jsdoc/require-param-description': 'warn',
    'jsdoc/require-returns-description': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn'
  },
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        'jsdoc/require-jsdoc': 'error'
      }
    }
  ]
};

import jsdoc from 'eslint-plugin-jsdoc';
import tsParser from '@typescript-eslint/parser';
import ts from '@typescript-eslint/eslint-plugin';

export default ts.configs.recommended,
  jsdoc.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' }
    },
    plugins: { jsdoc, '@typescript-eslint': ts },
    rules: {
      'jsdoc/require-jsdoc': ['error', { require: { FunctionDeclaration: true, MethodDefinition: true, ClassDeclaration: false } }],
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns-description': 'warn',
      'jsdoc/require-example': 'off',
      'jsdoc/require-see': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'warn',
      'max-lines-per-function': ['warn', 100]
    }
  }
];

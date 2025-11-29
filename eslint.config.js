import tsParser from '@typescript-eslint/parser';
import ts from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' }
    },
    plugins: { '@typescript-eslint': ts },
    rules: {
      ...ts.configs.recommended.rules,
      // Relax rules for faster development - tighten before production release
      '@typescript-eslint/no-explicit-any': 'off', // TODO: Enable and fix before v1.0
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-console': 'off', // Needed for debugging during development
      'max-lines-per-function': 'off'
    }
  },
  {
    // Ignore test files from strict rules
    files: ['**/__tests__/**/*.ts', '**/tests/**/*.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/ban-ts-comment': 'off'
    }
  }
];

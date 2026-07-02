import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

/**
 * LynxKit 共享 ESLint flat config
 *
 * 用法（在 app/package 的 eslint.config.js 中）：
 *   import lynxEslint from '@lynxkit/config/eslint';
 *   export default [
 *     ...lynxEslint,
 *     // 额外规则
 *   ];
 */
const ignores = ['**/dist/**', '**/.next/**', '**/.turbo/**', '**/node_modules/**'];

const lynxConfig = [
  {
    ignores,
  },
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];

export default lynxConfig;

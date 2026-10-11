import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const uiModules = ['react', 'react-native', 'react-native-*', 'expo', 'expo-*', '@expo/*'];

export default tseslint.config(
  { ignores: ['node_modules', 'coverage', 'sim-output', 'dist'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      'no-warning-comments': [
        'error',
        { terms: ['todo', 'fixme', 'xxx', 'hack'], location: 'anywhere' },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: uiModules, message: 'The engine must stay free of UI and platform code.' },
            {
              group: ['@/ui/*', '@/store/*', '@/platform/*', '@/app/*'],
              message: 'The engine must not depend on app layers.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: 'The engine must be deterministic; use the game calendar.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded RNG in src/engine/rng.ts.' },
      ],
    },
  },
  {
    files: ['**/*.test.ts', 'src/test/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },
);

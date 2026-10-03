import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

/**
 * Flat config. A regra que realmente importa aqui e a de hooks do React:
 * cada cena cria GSAP e ScrollTrigger dentro de `useEffect`, e um efeito sem
 * limpeza deixa o gatilho vivo depois que a cena sai da árvore. O `react-hooks`
 * em modo recommended pega o caso comum disso.
 *
 * Os `scripts/` ficam de fora do lint porque nao fazem parte do site que
 * embarca: sao as ferramentas de auditoria que rodam no Chromium.
 */
export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'public'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Este projeto formata a si mesmo com Prettier. Ligar `indent` e
      // `quotes` aqui só criaria conflito entre as duas ferramentas.
      indent: 'off',
      quotes: 'off',
      semi: 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-undef': 'off',
    },
  },
)

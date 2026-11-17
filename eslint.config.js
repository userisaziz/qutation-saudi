import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/**
 * The dependency direction README › Architecture describes is enforced here,
 * not left to review:
 *
 *   domain  →  data  →  state  →  components  →  screens  →  App
 *
 * Each layer may import downward only. A violation fails `npm run lint`.
 *
 * Flat config merges by override, not by append, so every block that sets
 * `no-restricted-imports` must restate the patterns it wants to keep.
 *
 * Barrels are banned through `paths`, which compares the specifier verbatim.
 * A `group` pattern follows gitignore rules, where `@/domain` would also
 * catch `@/domain/pricing` and take the whole codebase with it.
 */
const BARREL_MESSAGE =
  'Import the concrete module (for example @/domain/pricing). A directory barrel pulls its whole subtree into every chunk that touches it.';

const BARREL_PATHS = ['@/domain', '@/state', '@/components/app', '@/lib'].flatMap((name) => [
  { name, message: BARREL_MESSAGE },
  { name: `${name}/index`, message: BARREL_MESSAGE },
]);

const UI_LAYER = ['@/components/**', '@/screens/**', '@/hooks/**', '@/config/**'];

/** `no-restricted-imports` options: the barrel ban plus one upward layer ban. */
const restrict = (group, message) => ({
  paths: BARREL_PATHS,
  patterns: group.map((g) => ({ group: [g], message })),
});

export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', '.vercel/', 'coverage/'],
  },

  // 1 — Language and React rules for all application source.
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      'no-restricted-imports': ['error', { paths: BARREL_PATHS }],
    },
  },

  // 2 — domain/, data/ and state/ are framework-free: no React UI, no screens.
  {
    files: ['src/domain/**/*.{ts,tsx}', 'src/data/**/*.ts', 'src/state/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        restrict(
          UI_LAYER,
          'This layer is framework-free and unit-testable. Keep UI, hooks and config out of it.',
        ),
      ],
    },
  },

  // 3 — components/ may not reach up into screens.
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        restrict(
          ['@/screens/**'],
          'Components sit below screens in the dependency order. Lift the screen into a prop instead.',
        ),
      ],
    },
  },

  // 4 — Presentation files resolve colour and type through the tokens in
  //     src/index.css; a literal hex in a screen is a design-system breach.
  {
    files: ['src/screens/**/*.{ts,tsx}', 'src/components/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/(#[0-9a-fA-F]{3,8}|rgb\\(|hsl\\()/]',
          message: 'Use a token colour class from src/index.css, never a literal colour.',
        },
        {
          selector: 'TemplateElement[value.raw=/(#[0-9a-fA-F]{3,8}|rgb\\(|hsl\\()/]',
          message: 'Use a token colour class from src/index.css, never a literal colour.',
        },
      ],
    },
  },

  // 5 — The store is a hook module, not a component module: exporting
  //     usePortal alongside its provider is the point of the file.
  {
    files: ['src/state/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // 6 — src/components/ui is shadcn's own output, kept pristine so that
  //     `npx shadcn add` can refresh it. Its files export variant maps next to
  //     the component, which is the pattern react-refresh warns about.
  {
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // 7 — Tooling outside src runs in Node.
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
);

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default [
	// Ignore patterns
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/build/**',
			'**/.output/**',
			'**/coverage/**'
		]
	},

	// Base JS rules
	js.configs.all,

	// TypeScript recommended rules (non-type-aware)
	...tseslint.configs.all,

	// Project-specific overrides
	{
		files: ['**/*.{ts,tsx,cts,mts}'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: {
			'no-undef': 'off' // TS handles this
		}
	},

	// Must be last: disables formatting-related ESLint rules
	prettier
];

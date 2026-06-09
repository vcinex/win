import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals' // 1. 引入 globals

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', '.vscode/**', 'public/**']
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginVue.configs['flat/recommended'],

  {
    // 将其应用到所有 ts、js 和 vue 文件
    files: ['**/*.vue', '**/*.ts', '**/*.js'],
    languageOptions: {
      // 2. 显式声明浏览器和 Node.js 的全局变量
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module'
      }
    },
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  },

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },

  eslintConfigPrettier
)
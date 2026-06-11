import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'
import vueParser from 'vue-eslint-parser'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'], // 使用更严格的推荐配置提升代码质量
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    }
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module'
      }
    }
  },
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'error',
      'vue/multi-word-component-names': 'off', // 允许单单词组件名 (视项目风格决定)
      'vue/no-v-html': 'warn', // 警惕 v-html 的 XSS 风险
      'vue/require-default-prop': 'off', // 结合 TS 定义时可关闭
      '@typescript-eslint/no-explicit-any': 'warn', // 限制 any 的使用
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // 允许下划线开头的未使用参数
      'no-console': 'warn'
    }
  },
  prettierConfig
)

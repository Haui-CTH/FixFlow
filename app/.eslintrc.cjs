// SPDX-License-Identifier: Apache-2.0
// ESLint cho frontend (GĐ 10 / V10.3). `npm run lint` chạy với --max-warnings 0.
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'],
  ignorePatterns: ['dist', 'node_modules', 'scripts', 'coverage'],
  rules: {
    // Component file có thể export thêm hằng/hàm tiện ích (ví dụ pageList, groupByDay)
    'react-refresh/only-export-components': 'off',
    // tsc đã kiểm noUnusedLocals/noUnusedParameters
    '@typescript-eslint/no-unused-vars': 'off',
  },
};

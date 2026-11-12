const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  // admin/ has its own ESLint config; Edge Functions are Deno code.
  globalIgnores(['.expo/*', 'coverage/*', 'dist/*', 'admin/**', 'supabase/functions/**']),
  expoConfig,
  prettierConfig,
]);

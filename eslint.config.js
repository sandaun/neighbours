const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  // The web backoffice in admin/ has its own ESLint config.
  globalIgnores(['.expo/*', 'coverage/*', 'dist/*', 'admin/**']),
  expoConfig,
  prettierConfig,
]);

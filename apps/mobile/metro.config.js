const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, '../..');
const designTokensPath = path.resolve(workspaceRoot, 'packages/design-tokens');

config.resolver.disableHierarchicalLookup = true;
config.resolver.unstable_enableSymlinks = true;
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.watchFolders = [
  ...(config.watchFolders || []),
  workspaceRoot,
  designTokensPath,
];

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@smn/design-tokens': designTokensPath,
  'react-native-screens': path.resolve(__dirname, 'node_modules/react-native-screens'),
  'react-native-safe-area-context': path.resolve(__dirname, 'node_modules/react-native-safe-area-context'),
};

module.exports = config;

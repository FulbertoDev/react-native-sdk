const path = require('path');
const escape = require('escape-string-regexp');
const { getDefaultConfig } = require('@expo/metro-config');
const pak = require('../package.json');

const root = path.resolve(__dirname, '..');

const modules = Object.keys({
  ...pak.peerDependencies,
});

const defaultConfig = getDefaultConfig(__dirname);

// Helper function to get blacklist/exclusionList function safely
const getExclusionList = () => {
  try {
    // Try new metro-config v0.76+ approach
    const { exclusionList } = require('metro-config');
    if (typeof exclusionList === 'function') {
      return exclusionList;
    }
  } catch (e) {
    // Fall through to old approach
  }

  try {
    // Try old metro-config approach
    return require('metro-config/src/defaults/exclusionList');
  } catch (e) {
    // Last resort: create our own exclusionList function
    return (patterns) => {
      const regex = new RegExp(patterns.map((p) => p.source).join('|'));
      return regex;
    };
  }
};

const exclusionList = getExclusionList();

module.exports = {
  ...defaultConfig,

  projectRoot: __dirname,
  watchFolders: [root],

  // We need to make sure that only one version is loaded for peerDependencies
  // So we block them at the root, and alias them to the versions in example's node_modules
  resolver: {
    ...defaultConfig.resolver,

    blacklistRE: exclusionList(
      modules.map(
        (m) =>
          new RegExp(`^${escape(path.join(root, 'node_modules', m))}\\/.*$`)
      )
    ),

    extraNodeModules: modules.reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name);
      return acc;
    }, {}),
  },
};

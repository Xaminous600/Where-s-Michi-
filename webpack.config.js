const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          // Ensure that all packages starting with @tensorflow are
          // transpiled.
          '@tensorflow',
        ],
      },
    },
    argv);
  
    config.resolve.alias['react-native-maps'] = '@teovilla/react-native-web-maps';
  
    return config;
  };
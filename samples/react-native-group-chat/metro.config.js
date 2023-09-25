// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require("expo/metro-config")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path")

// Find the project and workspace directories
const projectRoot = __dirname
// This can be replaced with `find-yarn-workspace-root`
const workspaceRoot = path.resolve(projectRoot, "../..")

module.exports = (() => {
  const config = getDefaultConfig(projectRoot)

  const { transformer, resolver } = config

  // 1. Watch all files within the monorepo
  config.watchFolders = [workspaceRoot]

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  }
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
    nodeModulesPaths: [
      path.resolve(projectRoot, "node_modules"),
      path.resolve(workspaceRoot, "node_modules"),
    ],
    disableHierarchicalLookup: true,
  }

  return config
})()

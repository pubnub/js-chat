module.exports = function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    env: {
      production: {
        plugins: ["react-native-paper/babel"],
      },
    },
    plugins: ["@babel/plugin-proposal-export-namespace-from", "react-native-reanimated/plugin"],
  }
}

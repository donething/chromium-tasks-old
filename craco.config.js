module.exports = {
  webpack: {
    configure: (webpackConfig, {env, paths}) => {
      return {
        ...webpackConfig,
        entry: {
          main: [env === 'development' &&
          require.resolve('react-dev-utils/webpackHotDevClient'), paths.appIndexJs].filter(Boolean),
          // 此例中打包源文件"./src/background/service_worker.ts"，输出名为"build/static/js/service_worker.js"，每行一个
          service_worker: './src/background/service_worker.ts',
          // 单独打包依赖库
          // libs: ["jsdom"]
        },
        output: {
          ...webpackConfig.output,
          filename: 'static/js/[name].js',
        },
        optimization: {
          ...webpackConfig.optimization,
          // <---- 禁用 uglify 代码压缩混淆
          minimize: false,
          runtimeChunk: false,
          // 将依赖提取到引用它的脚本中
          splitChunks: {}
        }
      };
    },
  }
};
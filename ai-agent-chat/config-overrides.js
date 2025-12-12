const webpack = require('webpack');

module.exports = function override(config, env) {
  // 忽略 Node.js 内置模块
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "async_hooks": false,
    "fs": false,
    "net": false,
    "tls": false,
    "crypto": false,
    "stream": false,
    "url": false,
    "zlib": false,
    "http": false,
    "https": false,
    "assert": false,
    "os": false,
    "path": false,
  };

  // 忽略 node: 协议的模块
  config.plugins = [
    ...config.plugins,
    new webpack.NormalModuleReplacementPlugin(
      /^node:/,
      (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
      }
    ),
  ];

  return config;
};



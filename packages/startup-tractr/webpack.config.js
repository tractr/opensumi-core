const { createWebpackConfig } = require('@opensumi/ide-dev-tool/src/webpack');

const HOST = process.env.HOST || '0.0.0.0';

module.exports = createWebpackConfig(__dirname, require('path').join(__dirname, 'entry/web/app.tsx'), {
  devServer: {
    proxy: [
      {
        context: ['/cloud-proxy', '/wopi'],
        target: `http://${HOST}:8000`,
        changeOrigin: true,
      },
    ],
  },
});

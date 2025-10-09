// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 启用静态导出
  // 如果部署在 https://<your-username>.github.io/<repo-name>/，需要设置 basePath
  // basePath: '/<repo-name>', 
  // images: { unoptimized: true } // 如果使用 Next/Image
}
module.exports = nextConfig

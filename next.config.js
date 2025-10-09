// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', 
  trailingSlash: true, 
  
  // 关键修复：设置资源前缀和基路径
  // 根据您的 URL superavatar888.github.io/monadsweeper/，仓库名是 monadsweeper
  basePath: '/monadsweeper',
  assetPrefix: '/monadsweeper/',
};

module.exports = nextConfig;

// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true, // 确保静态链接正确
  
  // 关键修复：设置资源前缀和基路径
  // 假设您的仓库名称是 monadsweeper (根据您截图中的 URL)
  basePath: '/monadsweeper', 
  assetPrefix: '/monadsweeper/',
};

module.exports = nextConfig;

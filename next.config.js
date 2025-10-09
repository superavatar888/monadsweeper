// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 保持静态导出模式
  trailingSlash: true, 
  
  // 关键修复：设置资源前缀，确保浏览器能找到 CSS 和 JS
  basePath: '/monadsweeper',
  assetPrefix: '/monadsweeper/',
};

module.exports = nextConfig;

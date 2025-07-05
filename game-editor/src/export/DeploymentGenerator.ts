import type { BuildConfig } from './BuildConfig';

/**
 * 部署配置生成器
 */
export class DeploymentGenerator {
  
  /**
   * 生成Vercel配置
   */
  static generateVercelConfig(buildConfig: BuildConfig): string {
    return JSON.stringify({
      version: 2,
      name: buildConfig.projectName,
      builds: [
        {
          src: "**/*",
          use: "@vercel/static"
        }
      ],
      routes: [
        {
          src: "/(.*)",
          dest: "/index.html"
        }
      ],
      headers: [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable"
            }
          ]
        }
      ]
    }, null, 2);
  }
  
  /**
   * 生成Netlify配置
   */
  static generateNetlifyConfig(buildConfig: BuildConfig): string {
    return `# Netlify配置文件
[build]
  publish = "."
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  
[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    
[[headers]]
  for = "*.js"
  [headers.values]
    Content-Type = "application/javascript; charset=utf-8"
    
[[headers]]
  for = "*.css"
  [headers.values]
    Content-Type = "text/css; charset=utf-8"`;
  }
  
  /**
   * 生成GitHub Pages配置
   */
  static generateGitHubPagesWorkflow(buildConfig: BuildConfig): string {
    return `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
        cname: ${buildConfig.projectName}.github.io`;
  }
  
  /**
   * 生成Docker配置
   */
  static generateDockerfile(buildConfig: BuildConfig): string {
    return `FROM nginx:alpine

# 复制游戏文件
COPY . /usr/share/nginx/html/

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`;
  }
  
  /**
   * 生成Nginx配置
   */
  static generateNginxConfig(buildConfig: BuildConfig): string {
    return `events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    gzip on;
    gzip_types
        text/plain
        text/css
        text/js
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # 缓存静态资源
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # SPA路由支持
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # 安全头
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }
}`;
  }
  
  /**
   * 生成部署说明文档
   */
  static generateDeploymentGuide(buildConfig: BuildConfig): string {
    return `# ${buildConfig.gameTitle} 部署指南

## 快速部署选项

### 1. Vercel (推荐)
\`\`\`bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
\`\`\`

### 2. Netlify
1. 将项目文件拖拽到 [Netlify Drop](https://app.netlify.com/drop)
2. 或使用Netlify CLI：
\`\`\`bash
npm i -g netlify-cli
netlify deploy --prod --dir .
\`\`\`

### 3. GitHub Pages
1. 将代码推送到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择源分支为 \`main\`

### 4. 本地HTTP服务器
\`\`\`bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
\`\`\`

## Docker部署

### 构建镜像
\`\`\`bash
docker build -t ${buildConfig.projectName} .
\`\`\`

### 运行容器
\`\`\`bash
docker run -p 8080:80 ${buildConfig.projectName}
\`\`\`

## 性能优化建议

1. **启用Gzip压缩**
2. **设置适当的缓存头**
3. **使用CDN加速**
4. **启用HTTP/2**
5. **压缩图片资源**

## 注意事项

- 游戏必须通过HTTP(S)协议访问，不能直接打开HTML文件
- 确保服务器支持正确的MIME类型
- 移动端建议启用HTTPS以获得最佳体验
- 考虑添加SSL证书以支持PWA功能

## 监控和分析

建议集成以下服务：
- Google Analytics
- Sentry错误监控
- New Relic性能监控

生成时间: ${new Date().toLocaleString()}
`;
  }
}

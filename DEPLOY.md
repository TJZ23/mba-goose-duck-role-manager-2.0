# 部署指南

本指南说明如何在不同平台上部署《鹅鸭杀控制台》Socket.io 版本。

## 目录

- [本地开发](#本地开发)
- [在 Linux / macOS 上部署](#在-linux--macos-上部署)
- [在 Windows 上部署](#在-windows-上部署)
- [使用 Docker 部署](#使用-docker-部署)
- [在云平台部署](#在云平台部署)
- [反向代理配置](#反向代理配置)

---

## 本地开发

### 前置需求

- Node.js >= 16.0.0
- npm 或 yarn

### 安装和运行

```bash
# 1. 进入项目目录
cd goose-duck-role-manager

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器
# 访问 http://localhost:3000
```

---

## 在 Linux / macOS 上部署

### 1. 安装 Node.js（如果未安装）

```bash
# macOS (使用 Homebrew)
brew install node

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 克隆或上传项目

```bash
# 如果使用 Git
git clone <your-repo-url> goose-duck-role-manager
cd goose-duck-role-manager

# 或者上传文件到服务器
scp -r ./goose-duck-role-manager user@server:/path/to/
```

### 3. 安装依赖

```bash
npm install
```

### 4. 启动服务器（前台）

```bash
npm start
```

或者使用 PM2 进程管理（推荐生产环境）：

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "goose-duck"

# 设置自动启动
pm2 startup
pm2 save

# 查看进程
pm2 list

# 查看日志
pm2 logs goose-duck
```

### 5. 配置 Nginx 反向代理（推荐）

```bash
# 安装 Nginx
sudo apt-get install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/goose-duck
```

```nginx
upstream nodejs {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://nodejs;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Socket.io 特定配置
  location /socket.io {
    proxy_pass http://nodejs;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/goose-duck /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 6. 配置 SSL/TLS（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期将被配置
sudo systemctl enable certbot.timer
```

修改后的 Nginx 配置将自动使用 HTTPS。

---

## 在 Windows 上部署

### 1. 安装 Node.js

- 从 https://nodejs.org 下载 LTS 版本
- 按照安装向导完成安装
- 重启命令行或 PowerShell

### 2. 上传项目文件

- 将 `goose-duck-role-manager` 文件夹上传到服务器

### 3. 安装依赖和启动

```powershell
# 进入项目目录
cd C:\path\to\goose-duck-role-manager

# 安装依赖
npm install

# 启动服务器
npm start
```

### 4. 使用 NSSM 作为 Windows 服务（推荐）

```powershell
# 下载 NSSM
# 从 https://nssm.cc 下载并解压

# 以管理员身份打开 PowerShell
cd path\to\nssm\win64

# 安装服务
.\nssm.exe install goose-duck-service "C:\nodejs\node.exe" "C:\path\to\goose-duck-role-manager\server.js"

# 启动服务
.\nssm.exe start goose-duck-service

# 查看服务状态
.\nssm.exe status goose-duck-service
```

### 5. 配置 IIS 反向代理（可选）

使用 Application Request Routing (ARR) 反向代理到 Node.js 应用。

---

## 使用 Docker 部署

### 1. 创建 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
```

### 2. 创建 .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
README.md
DEPLOY.md
.env
.DS_Store
```

### 3. 构建和运行 Docker 镜像

```bash
# 构建镜像
docker build -t goose-duck:latest .

# 运行容器
docker run -d \
  --name goose-duck \
  -p 3000:3000 \
  -e NODE_ENV=production \
  goose-duck:latest

# 查看日志
docker logs -f goose-duck

# 停止容器
docker stop goose-duck
```

### 4. 使用 Docker Compose（推荐）

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: always
    volumes:
      - ./logs:/app/logs
```

```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 查看日志
docker-compose logs -f
```

---

## 在云平台部署

### Heroku

```bash
# 1. 安装 Heroku CLI
# 下载: https://devcenter.heroku.com/articles/heroku-cli

# 2. 登录
heroku login

# 3. 创建应用
heroku create goose-duck-app

# 4. 部署
git push heroku main

# 5. 查看日志
heroku logs --tail

# 6. 打开应用
heroku open
```

创建 `Procfile` 在项目根目录：

```
web: node server.js
```

### AWS EC2

```bash
# 1. 启动 EC2 实例（推荐 Amazon Linux 2 或 Ubuntu）

# 2. 连接到实例
ssh -i your-key.pem ec2-user@your-instance-ip

# 3. 安装 Node.js
curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 4. 克隆项目
git clone <your-repo-url>
cd goose-duck-role-manager
npm install

# 5. 使用 PM2
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

### 阿里云 / 腾讯云

步骤类似于 AWS EC2，购买云服务器后：

1. SSH 连接到服务器
2. 安装 Node.js
3. 上传项目文件
4. 安装依赖并启动

---

## 反向代理配置

### Apache

```apache
<VirtualHost *:80>
  ServerName your-domain.com

  ProxyPreserveHost On
  ProxyPass / http://127.0.0.1:3000/
  ProxyPassReverse / http://127.0.0.1:3000/

  # Socket.io 特定配置
  ProxyPass /socket.io http://127.0.0.1:3000/socket.io upgrade=websocket

  ErrorLog ${APACHE_LOG_DIR}/error.log
  CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

启用需要的模块：

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Caddy

创建 `Caddyfile`：

```
your-domain.com {
  reverse_proxy localhost:3000 {
    header_up Connection {http.request.header.Connection}
    header_up Upgrade {http.request.header.Upgrade}
  }
}
```

```bash
# 运行
caddy run
```

---

## 监控和日志

### 使用 PM2 不仅可以管理进程，还可以监控

```bash
# 实时监控
pm2 monit

# 生成报告
pm2 report

# 保存日志到文件
pm2 save
pm2 logs > /var/log/goose-duck.log
```

### 使用 systemd 日志（Linux）

```bash
# 查看日志
journalctl -u goose-duck -f
```

---

## 性能调优

### Node.js 进程数（使用 PM2 集群模式）

```bash
# 启动 4 个进程
pm2 start server.js -i 4

# 启动 CPU 核心数量相同的进程
pm2 start server.js -i max
```

### 内存限制

```bash
# 限制每个进程的内存
pm2 start server.js --max-memory-restart 1G
```

### 负载均衡

使用 Nginx 或 HAProxy 在多个 Node.js 实例之间负载均衡。

---

## 故障排除

### 端口被占用

```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 权限问题

```bash
# Linux
sudo chown -R user:user /path/to/goose-duck-role-manager
chmod -R 755 /path/to/goose-duck-role-manager
```

### 环境变量问题

创建 `.env` 文件：

```
NODE_ENV=production
PORT=3000
```

---

## 安全建议

1. ✅ 使用 HTTPS/WSS（不要在公网用 HTTP）
2. ✅ 限制 CORS 来源
3. ✅ 添加房间密密政策
4. ✅ 定期更新 Node.js 和依赖
5. ✅ 使用防火墙限制端口访问
6. ✅ 监控日志和异常流量
7. ✅ 定期备份重要数据

---

更多信息请参考主 README.md 文件。

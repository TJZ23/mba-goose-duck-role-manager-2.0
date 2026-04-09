# Vercel 部署指南

欢迎！本指南将帮助您将《鹅鸭杀控制台》Socket.io 版本部署到 Vercel，让世界各地的人都能访问。

## 📋 部署步骤

### 1️⃣ 访问 Vercel 官网

前往 [https://vercel.com](https://vercel.com)

### 2️⃣ 登录或注册

- 如果已有账户，点击"Log In"
- 如果没有账户，点击"Sign Up"
- 推荐用 GitHub 账户登录（验证会更简单）

### 3️⃣ 导入 GitHub 项目

1. 登录 Vercel 后，点击"New Project"或"Add New..." → "Project"
2. 在"Import Git Repository"部分，选择"GitHub"
3. 授权 Vercel 访问你的 GitHub 账户
4. 搜索项目：`mba-goose-duck-role-manager-2.0`
5. 点击项目名称导入

### 4️⃣ 配置项目

在导入项目的配置页面：

**项目名称：** 保持默认或自定义

**Framework：** 选择 `Node.js`

**环境变量（可选）：**
```
NODE_ENV = production
PORT = 3000
```

### 5️⃣ 部署

1. 点击"Deploy"按钮
2. 等待部署完成（通常 1-3 分钟）
3. 部署完成后会显示你的项目 URL（如 `https://your-project.vercel.app`）

### 6️⃣ 访问应用

在部署完成的页面，点击"Visit"或直接访问生成的 URL

---

## 🔄 自动部署

部署完成后，Vercel 会自动监控你的 GitHub 仓库。只要你向 `main` 分支推送代码，Vercel 就会**自动重新部署**。

**做法：**
```bash
# 在本地修改代码后
git add .
git commit -m "更新内容"
git push origin main

# Vercel 会自动检测到推送并重新部署
```

---

## 📊 项目信息

| 项 | 值 |
|------|-----|
| **GitHub 地址** | https://github.com/TJZ23/mba-goose-duck-role-manager-2.0 |
| **框架** | Node.js + Express + Socket.io |
| **运行时** | Node.js 18.x |
| **端口** | 3000 |

---

## 🔗 部署后的使用

### 分享应用链接

部署完成后，你会获得一个大概这样的 URL：
```
https://your-project-name.vercel.app
```

在这个 URL 上，所有功能都一样，但现在可以对外分享！

### 邀请朋友使用

1. 分享你的 Vercel 项目 URL
2. 朋友在浏览器中打开 URL
3. 就像本地版本一样使用（创建房间、加入房间、实时同步）

### 示例使用流程

```
你（房主）：访问 https://your-project-name.vercel.app
          房间号：123456

朋友（客户端）：访问同一个 URL
                点击"🔗 加入房间"
                输入房间号：123456
                点击"🚀 直接加入"

结果：你们可以在不同地方实时同步游戏状态！
```

---

## 🛠️ 常见问题

### Q: 部署失败怎么办？

**A:** 检查以下几点：

1. **GitHub 授权**
   - 确保 Vercel 有权访问你的 GitHub 仓库
   - 访问 https://github.com/settings/applications 检查授权

2. **Node.js 版本**
   - 确保 package.json 中的 Node.js 版本配置正确
   - 最低版本：Node.js 16.x

3. **依赖问题**
   - 本地运行 `npm install` 和 `npm start` 验证代码可用
   - 推送到 GitHub 后重试部署

4. **查看部署日志**
   - 在 Vercel 项目页面，点击最近的 Deployment
   - 查看 "Logs" 标签找出错误信息

### Q: Socket.io 在 Vercel 上能正常工作吗？

**A:** 可以！我们已经配置了：
- WebSocket 支持（推荐）
- 轮询作为备选方案（网络限制时自动降级）

### Q: 我想自定义项目 URL 怎么办？

**A:** 在 Vercel 项目的"Settings"：

1. 点击"Project Settings"
2. 选择"Domains"
3. 添加自定义域名（需要有自己的域名）

### Q: 如何查看 Vercel 上的服务器日志？

**A:**
1. 在 Vercel 项目页面，选择最新的 Deployment
2. 点击"Logs"标签
3. 可以看到实时的服务器日志

### Q: Vercel 免费计划有什么限制？

**A:** 免费计划：
- ✅ 无限个项目部署
- ✅ 每月 100 GB 带宽
- ✅ 无限 HTTP 请求
- ⚠️ 无服务器函数有 10 秒执行时限
- ⚠️ 部署后 15 分钟无活动会休眠

对于本应用来说，免费计划足够！

---

## 🚀 高级配置

### 自定义域名（非必需）

如果你想使用自己的域名（如 `goose-duck.com`）：

1. **购买域名**
   - 访问 GoDaddy、Namecheap 等域名商购买

2. **在 Vercel 中添加**
   - 项目 Settings → Domains
   - 输入域名并按照指示配置 DNS

3. **配置 DNS**
   - 在域名商的管理面板修改 DNS 指向 Vercel

详见 Vercel 官方文档：https://vercel.com/docs/concepts/projects/custom-domains

### 环境变量配置

如果需要添加敏感信息（如 API 密钥）：

1. 项目 Settings → Environment Variables
2. 添加变量（如 `SOCKET_IO_SECRET=xxxxx`）
3. 部署会自动使用这些变量

### 与 GitHub 同步

Vercel 已默认与你的 GitHub 仓库同步：

- 每次推送到 `main` 分支自动重新部署
- 可以在 Deployments 页面查看所有部署历史

---

## 📞 部署问题排查

| 问题 | 解决方案 |
|------|---------|
| "Cannot find module" | 运行 `npm install` 确保依赖安装完整 |
| CORS 错误 | 检查 server.js 中的 CORS 配置 |
| Socket.io 连接失败 | 检查浏览器控制台，可能需要启用轮询 |
| 部署超时 | 检查代码是否有无限循环，简化部署步骤 |

---

## 📚 更多资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Node.js 部署指南](https://vercel.com/docs/runtimes/nodejs)
- [Socket.io 部署](https://socket.io/docs/v4/deployment/)
- [项目主 README](./README.md)
- [本地部署指南](./DEPLOY.md)

---

## ✨ 下一步

部署完成后，你可以：

1. ✅ 分享项目 URL 给朋友
2. ✅ 测试多地点的实时同步功能
3. ✅ 根据需要添加自定义域名
4. ✅ 监控项目的性能和日志

---

**恭喜！你的《鹅鸭杀控制台》现在已经上线，可以被全世界访问！** 🎉

有问题？查看 Vercel 项目页面的 Logs，或参考项目 README 的故障排除部分。

Happy deploying! 🚀

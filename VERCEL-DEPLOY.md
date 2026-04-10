# Vercel 部署指南 - 3 步完成

## 📋 前置条件

- GitHub 账号（Vercel 用它登录）
- 这个项目文件（已准备好）

## 🚀 第 1 步：上传代码到 GitHub

1. 在 GitHub 创建新仓库：`goose-duck-game`
2. 上传这个项目的所有文件：
   ```bash
   git init
   git add .
   git commit -m "初始提交"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/goose-duck-game.git
   git push -u origin main
   ```

## 🔗 第 2 步：部署到 Vercel

1. 访问 https://vercel.com
2. 点击 **"New Project"**
3. 选择 **"Import Git Repository"**
4. 连接您的 GitHub 账号
5. 选择 `goose-duck-game` 仓库
6. 点击 **"Import"**

**Vercel 会自动识别 `vercel.json` 配置，无需手动设置。**

## ✅ 第 3 步：验证部署

1. 等待部署完成（约 1-2 分钟）
2. Vercel 会分配一个 URL，例如：
   ```
   https://goose-duck-game.vercel.app
   ```
3. 点击链接查看您的应用

## 🧪 测试

用两个浏览器窗口（或设备）验证：

1. **窗口 A**：打开 `https://goose-duck-game.vercel.app`
   - 自动获得房间号（如：123456）

2. **窗口 B**：打开同一 URL
   - 点击"加入房间"
   - 输入窗口 A 的房间号
   - 两个窗口状态实时同步 ✅

## 📱 分享给朋友

只需发送您的 Vercel URL：
```
https://goose-duck-game.vercel.app
```

朋友打开即可加入！无论在世界的哪个角落，都能实时同步。

## ⚙️ 更新代码

修改代码后，Vercel 会自动部署：

```bash
git add .
git commit -m "更新说明"
git push origin main
# Vercel 自动部署新版本
```

## 🔧 配置说明

- **vercel.json** - 告诉 Vercel 如何运行这个项目
- **server.js** - Socket.io 服务器（处理房间和实时同步）
- **index.html** - 前端应用（自动连接到您的 Vercel 域名）

## 常见问题

### Q: 为什么显示"离线中"？

**A:** 检查以下几点：

1. 确认部署成功
   - Vercel Dashboard 应显示 ✓ 绿色勾选

2. 刷新页面
   - 有时连接需要几秒钟建立

3. 打开浏览器控制台（F12 > Console）
   - 应该看不到红色错误
   - 应该看到"Socket connected"消息

### Q: 创建新房间时没有房间号

**A:** 这个不会发生，因为：
- 房间号在浏览器加载时就生成了
- 即使离线，localStorage 也会保留房间号

### Q: 两个用户看不到彼此的操作

**A:** 可能是：
1. 房间号输入错误 → 检查输入
2. Socket 连接断开 → 等待重连（自动，最多 10 尝试）
3. 刷新页面后重试

### Q: 可以在本地测试吗？

**A:** 可以！同时运行：

```bash
# 终端 1
npm start

# 然后在浏览器打开两个窗口
# 都访问 http://localhost:3000
```

## 成本和限制

- **Vercel** 免费版：  
  - ✅ 无流量限制
  - ✅ 无并发用户限制
  - ⚠️ 30 秒无活动自动休眠（Pro 版本才 24/7）

- **Duration** 每月免费额度：  
  - 500 小时（足够个人使用）

## 进阶配置

### 添加自定义域名

1. 在 Vercel Dashboard 中的 **Settings > Domains**
2. 添加您的域名
3. 按照指示修改 DNS 记录

### 环境变量

如需添加，在 Vercel Dashboard：
- **Settings > Environment Variables**
- 修改后自动部署

## 监控应用

在 Vercel Dashboard 的 **Analytics** 查看：
- 流量统计
- 错误日志
- 性能指标

---

## 总结

| 步骤 | 耗时 | 难度 |
|------|------|------|
| 上传到 GitHub | 5 分钟 | 简单 |
| 部署到 Vercel | 2 分钟 | 简单 |
| 测试应用 | 5 分钟 | 简单 |
| **总计** | **12 分钟** | **简单** |

完成后，您和朋友都能通过一个网址访问，实时同步，无需任何本地部署！🎉

---

需要帮助？查看 Vercel 官方文档：https://vercel.com/docs

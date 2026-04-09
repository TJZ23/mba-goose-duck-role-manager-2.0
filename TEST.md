# 测试指南 - Socket.io 实时同步

本指南说明如何在本地测试《鹅鸭杀控制台》的 Socket.io 实时同步功能。

## 快速测试

### 步骤 1: 启动服务器

```bash
cd goose-duck-role-manager
npm install
npm start
```

输出应显示：
```
[服务器] 《鹅鸭杀控制台》服务器运行在 http://localhost:3000
[Socket.io] 已启用实时同步
[房间] 支持无限房间数量
```

### 步骤 2: 打开两个浏览器窗口

在两个浏览器窗口或标签页中打开：
```
http://localhost:3000
```

### 步骤 3: 加入同一房间

**窗口 1（房主）：**
- 自动生成房间号，显示在"房间："后面（如 `123456`）
- 这是您的个人房间号

**窗口 2（客户端）：**
- 点击"🔗 加入房间"按钮
- 在弹窗中输入窗口 1 的房间号
- 点击"🚀 直接加入"

### 步骤 4: 测试实时同步

#### 测试场景 1：添加玩家和任务

1. **在窗口 1（房主）中：**
   - 转到"⚙️ 游戏配置"标签
   - 在"队伍配置"中填入队伍人数（如：5、3、4、2 等）
   - 点击"🔄 应用队伍配置并进入下一步 →"

2. **观察窗口 2（客户端）：**
   - 队伍配置会在 0-500ms 内自动同步显示
   - 验证是否显示相同的配置

#### 测试场景 2：角色配置

1. **在窗口 1 中：**
   - 设置各个角色的数量（普信鹅、法师鹅等）
   - 点击"下一步：分配身份 →"

2. **在窗口 2 中：**
   - 验证角色数量是否同步显示

#### 测试场景 3：身份分配

1. **在窗口 1 中：**
   - 点击"🎲 随机分配身份"
   - 观察每个玩家旁边显示的角色

2. **在窗口 2 中：**
   - 验证是否显示相同的身份分配

#### 测试场景 4：修改玩家信息

1. **在窗口 1 中：**
   - 点击任一玩家卡片（在"🏮 修行者"标签中）
   - 点击"✅ +1 完成任务"
   - 观察任务数增加

2. **在窗口 2 中：**
   - 验证该玩家的任务数是否同步增加
   - 顶部的"全场任务总进度"是否同步更新

#### 测试场景 5：投票系统

1. **在窗口 1 中：**
   - 转到"🏛️ 大本营"标签
   - 点击"🔔 开始会议"
   - 在投票区修改票数

2. **在窗口 2 中：**
   - 验证投票数是否实时同步

#### 测试场景 6：临时任务

1. **在窗口 1 中：**
   - 转到"🦆 破坏"标签
   - 输入任务描述（如："大殿灯火熄灭"）
   - 点击"🚨 触发破坏"

2. **在窗口 2 中：**
   - 顶部警告横幅应立即显示
   - 倒计时应实时同步

### 步骤 5: 测试独立操作意识

**关键特性验证**：

1. **在窗口 2（客户端）中操作：**
   - 点击任意游戏操作按钮
   - 你的 UI 应**立即响应**（不延迟）
   - 不要等待服务器确认

2. **验证结果：**
   - 几百毫秒内，窗口 1 应显示相同的更新
   - 这证明客户端有**独立的操作意识**

3. **反向测试：**
   - 在窗口 1 操作，窗口 2 应立即看到更新
   - 两个窗口都有各自独立的操作能力

---

## 高级测试

### 多客户端测试

打开 3 个或更多窗口，加入同一房间：

```
窗口 1: 房主（自动房间）
窗口 2: 客户端（加入窗口 1 的房间）
窗口 3: 客户端（加入窗口 1 的房间）
```

在任一窗口中修改，验证其他所有窗口是否同步。

### 网络延迟模拟（Chrome DevTools）

1. 打开 Chrome DevTools（F12）
2. 转到 Network 标签
3. 点击"No throttling"，选择"Slow 3G"
4. 在高延迟情况下测试同步（应仍正常工作）

### 断网重连测试

1. 打开两个窗口并加入同一房间
2. 在浏览器 DevTools 中选择 Network 标签
3. 点击"Offline"断网
4. 验证 UI 显示"离线"状态
5. 点击"Online"恢复连接
6. 验证是否自动重新同步最新状态

### 浏览器不同步测试

1. 在 Chrome 中打开窗口 1
2. 在 Firefox 中打开窗口 2
3. 加入同一房间
4. 验证跨浏览器是否同步

---

## 观察 Socket.io 事件

### 在浏览器控制台查看事件日志

窗口 2（客户端）操作时，在浏览器控制台（F12 > Console）观察：

```javascript
[Socket.io] 已连接到服务器
[Socket.io] 房间加入: 123456
[Socket.io] 收到事件: user-joined
[Socket.io] 收到初始状态同步
[Socket.io] 收到事件: state-updated
```

### 使用网络分析工具

在 DevTools > Network 标签中，过滤 WebSocket：

1. 可以看到 `/socket.io/?...` 的 WebSocket 连接
2. 每个操作都会产生 WebSocket 消息
3. 观察消息的频率和大小

---

## 性能监控

### 测试延迟

1. 打开 DevTools > Network 标签
2. 在一个窗口中修改数据
3. 观察另一窗口更新的延迟时间
4. 正常情况应在 **50-500ms** 内完成

### 测试通信数据量

1. 打开 DevTools > Network > WebSocket 消息
2. 执行一次完整的游戏流程
3. 观察总消息数和数据量
4. 可用于评估带宽使用

### 本地性能

1. 打开 DevTools > Performance 标签
2. 记录一段游戏操作
3. 观察卡顿情况
4. 正常情况应保持 60 FPS（每帧 16.7ms）

---

## 常见问题

### Q: 加入房间失败提示"连接异常"

**A:**
1. 检查服务器是否运行（`npm start`）
2. 检查浏览器地址是否为 `http://localhost:3000`（不是 `https`）
3. 清除 localStorage：`localStorage.clear()`
4. 刷新页面重试

### Q: 窗口 2 中的操作不反应

**A:**
1. 确认窗口 2 已成功加入房间（查看"房间："是否显示房间号）
2. 检查浏览器控制台是否有错误信息
3. 刷新两个窗口重试

### Q: 数据未同步

**A:**
1. 网络延迟可能较大，耐心等待 1-2 秒
2. 检查浏览器控制台是否有 Socket 错误
3. 在 DevTools 中检查 WebSocket 连接是否正常
4. 刷新页面强制重新同步

### Q: 房间号无法保存

**A:**
1. 检查浏览器是否允许使用 localStorage
2. 专用 / 隐私模式可能不支持 localStorage
3. 使用正常浏览模式重试

---

## 自动化测试脚本

创建文件 `test.js` 进行自动化测试：

```javascript
const io = require('socket.io-client');

const socket1 = io('http://localhost:3000');
const socket2 = io('http://localhost:3000');

socket1.on('connect', () => {
  console.log('✓ 客户端 1 已连接');
  socket1.emit('join-room', { roomId: 'test-room', userId: 'user1' });
});

socket2.on('connect', () => {
  console.log('✓ 客户端 2 已连接');
  socket2.emit('join-room', { roomId: 'test-room', userId: 'user2' });
});

socket2.on('user-joined', (data) => {
  console.log('✓ 用户加入事件received:', data);
  // 发送测试状态
  socket1.emit('update-state', {
    roomId: 'test-room',
    state: { test: true, timestamp: Date.now() }
  });
});

socket2.on('state-updated', (data) => {
  console.log('✓ 状态同步成功:', data);
  console.log('✓ 同步延迟:', Date.now() - data.state.timestamp, 'ms');
  process.exit(0);
});

setTimeout(() => {
  console.log('✗ 测试超时');
  process.exit(1);
}, 5000);
```

运行：
```bash
node test.js
```

---

## 压力测试

### 同时加入大量客户端

修改为使用多个客户端实例：

```javascript
const io = require('socket.io-client');

const numClients = 50;
let connectedCount = 0;

for (let i = 0; i < numClients; i++) {
  const socket = io('http://localhost:3000');
  socket.on('connect', () => {
    connectedCount++;
    socket.emit('join-room', { roomId: 'stress-test', userId: `user${i}` });
    console.log(`✓ 已连接: ${connectedCount}/${numClients}`);
    
    if (connectedCount === numClients) {
      console.log('✓ 所有客户端已连接');
      // 开始发送消息
      setInterval(() => {
        socket.emit('user-action', {
          roomId: 'stress-test',
          action: 'test',
          payload: { timestamp: Date.now() }
        });
      }, 5000);
    }
  });
}
```

---

## 更多资源

- [Socket.io 官方测试工具](https://socket.io/docs/)
- [主 README](./README.md)
- [部署指南](./DEPLOY.md)

祝测试愉快! 🚀

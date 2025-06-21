# 焓湿图计算工具

一个基于Python FastAPI和React的交互式焓湿图计算工具，支持多状态点绘制、过程线分析和参数计算。

## ✨ 功能特性

- 🔢 **智能计算**: 输入任意两个湿空气参数，自动计算其他所有参数
- 📊 **交互式图表**: 在焓湿图上绘制多个状态点和过程线
- 🎨 **自定义样式**: 支持自定义点的颜色、标记样式和线的样式
- 📱 **响应式界面**: 现代化的Web界面，支持桌面和移动设备
- 🔄 **实时更新**: 参数修改后图表实时更新
- 📋 **数据管理**: 支持添加、编辑、删除状态点和过程线
- 📖 **详细文档**: 完整的API文档和使用说明

## 🚀 快速开始

### 方法一：一键启动（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd psychro

# 一键启动
./deploy.sh start
```

### 方法二：快速开发

```bash
# 快速启动开发环境
./quick-start.sh
```

### 方法三：手动启动

```bash
# 安装依赖
pip3 install -r requirements.txt
cd frontend && npm install && cd ..

# 启动后端
cd backend && python3 main_app.py &

# 启动前端
cd frontend && npm start &
```

## 🌐 访问地址

- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:7000
- **API文档**: http://localhost:7000/docs

## 📖 使用说明

### 1. 添加状态点

1. 点击"添加点"按钮
2. 输入点名称和选择颜色
3. 选择任意两个参数输入值：
   - 干球温度 (°C)
   - 湿球温度 (°C)
   - 相对湿度 (%)
   - 含湿量 (g/kg)
   - 焓值 (kJ/kg)
   - 露点温度 (°C)
4. 点击"添加"完成

### 2. 绘制过程线

1. 确保至少有两个状态点
2. 点击"添加线"按钮
3. 选择起始点和终点
4. 自定义线的标签、颜色、样式
5. 点击"添加"完成

### 3. 生成图表

1. 添加状态点和过程线后
2. 点击"生成焓湿图"按钮
3. 查看生成的交互式图表

### 4. 查看详情

- 点击状态点表格中的"查看详情"按钮查看完整参数
- 点击过程线表格中的"查看详情"按钮查看过程信息

## 🛠️ 技术栈

### 后端
- **Python 3.8+**: 主要编程语言
- **FastAPI**: 现代化Web框架
- **CoolProp**: 热力学属性计算库
- **Matplotlib**: 图表生成
- **Uvicorn**: ASGI服务器

### 前端
- **React 18**: 用户界面框架
- **Ant Design**: UI组件库
- **Axios**: HTTP客户端
- **Create React App**: 开发工具链

## 📁 项目结构

```
psychro/
├── backend/                 # 后端代码
│   ├── main_app.py         # FastAPI主应用
│   └── calculator.py       # 计算核心模块
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── App.js         # 主应用组件
│   │   └── App.css        # 样式文件
│   └── package.json       # 前端依赖
├── deploy.sh              # 一键部署脚本
├── quick-start.sh         # 快速启动脚本
├── requirements.txt       # Python依赖
├── DEPLOYMENT.md          # 详细部署文档
└── README.md             # 项目说明
```

## 🔧 部署脚本

### 完整部署脚本 (`deploy.sh`)

```bash
# 启动所有服务
./deploy.sh start

# 查看服务状态
./deploy.sh status

# 停止所有服务
./deploy.sh stop

# 重启服务
./deploy.sh restart

# 仅安装依赖
./deploy.sh install

# 清理环境
./deploy.sh clean

# 查看帮助
./deploy.sh help
```

### 快速启动脚本 (`quick-start.sh`)

```bash
# 快速启动开发环境
./quick-start.sh
```

## 📊 API接口

### 计算单个状态点
```http
POST /calculate
Content-Type: application/json

{
  "P": 101325.0,
  "T": 298.15,
  "R": 0.6
}
```

### 计算多个状态点
```http
POST /calculate-multiple
Content-Type: application/json

{
  "pressure": 101325.0,
  "points": [
    {
      "name": "点A",
      "inputs": {"T": 298.15, "R": 0.6},
      "color": "blue"
    }
  ]
}
```

### 生成焓湿图
```http
POST /generate-chart
Content-Type: application/json

{
  "pressure": 101325.0,
  "points": [...],
  "process_lines": [...]
}
```

## 🔍 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   ./deploy.sh restart
   ```

2. **依赖安装失败**
   ```bash
   ./deploy.sh install
   ```

3. **服务启动失败**
   ```bash
   # 查看日志
   tail -f backend.log
   tail -f frontend.log
   ```

4. **字体显示问题（Linux）**
   ```bash
   sudo apt install -y fonts-wqy-zenhei
   ```

### 获取帮助

- 查看详细部署文档: [DEPLOYMENT.md](DEPLOYMENT.md)
- 查看API文档: http://localhost:7000/docs
- 检查日志文件: `backend.log`, `frontend.log`

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [CoolProp](http://www.coolprop.org/) - 热力学属性计算库
- [FastAPI](https://fastapi.tiangolo.com/) - 现代化Python Web框架
- [React](https://reactjs.org/) - 用户界面库
- [Ant Design](https://ant.design/) - 企业级UI设计语言

## 📞 联系方式

- 项目主页: [GitHub Repository]
- 问题反馈: [GitHub Issues]
- 邮箱: [your-email@example.com]

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！ 
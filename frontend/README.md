# 焓湿图计算工具 - 前端

这是一个基于React的湿空气状态参数计算工具前端应用。

## 功能特性

- 🧮 专业的湿空气参数计算
- 📱 响应式设计，支持移动端
- 🎨 现代化UI界面
- ⚡ 实时计算反馈
- 🔄 表单重置功能
- 📊 清晰的结果展示

## 技术栈

- React 18
- Ant Design 5
- Axios
- CSS3

## 安装和运行

### 开发环境

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm start
```

应用将在 http://localhost:3000 启动

### 生产构建

1. 构建生产版本：
```bash
npm run build
```

2. 构建文件将生成在 `dist` 目录中

## 项目结构

```
frontend/
├── public/                 # 静态资源
│   ├── index.html         # HTML模板
│   └── manifest.json      # PWA清单
├── src/                   # 源代码
│   ├── App.js            # 主应用组件
│   ├── App.css           # 应用样式
│   ├── index.js          # 应用入口
│   ├── index.css         # 全局样式
│   └── reportWebVitals.js # 性能监控
├── package.json          # 项目配置
└── README.md            # 项目文档
```

## API接口

前端通过以下接口与后端通信：

- `POST /calculate` - 计算湿空气参数

### 请求参数

```json
{
  "P": 101325.0,        // 大气压力 (Pa)
  "T": 298.15,          // 干球温度 (K) - 可选
  "B": 293.15,          // 湿球温度 (K) - 可选
  "R": 0.6,             // 相对湿度 (0-1) - 可选
  "W": 0.01,            // 含湿量 (kg/kg) - 可选
  "H": 50000.0,         // 焓值 (J/kg) - 可选
  "D": 290.15           // 露点温度 (K) - 可选
}
```

### 响应格式

```json
{
  "tdb": "25.00",       // 干球温度 (°C)
  "twb": "20.00",       // 湿球温度 (°C)
  "rh": "60.00",        // 相对湿度 (%)
  "w": "12.500",        // 含湿量 (g/kg)
  "h": "50.00",         // 焓值 (kJ/kg)
  "tdp": "17.00",       // 露点温度 (°C)
  "success": true       // 计算状态
}
```

## 部署说明

1. 确保后端服务运行在 http://localhost:7000
2. 构建前端应用：`npm run build`
3. 将 `dist` 目录内容复制到后端的静态文件目录
4. 重启后端服务

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 许可证

MIT License 
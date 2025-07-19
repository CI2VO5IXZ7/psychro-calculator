# 焓湿图计算工具 - 腾讯云 Serverless 版

> 🚀 **全新 Serverless 架构** - 零运维、按需付费、自动扩容

[![Serverless](https://img.shields.io/badge/Serverless-Framework-orange)](https://serverless.com/)
[![Tencent Cloud](https://img.shields.io/badge/Tencent-Cloud-blue)](https://cloud.tencent.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-green)](https://python.org/)
[![React](https://img.shields.io/badge/React-18+-blue)](https://reactjs.org/)

## 📋 项目概述

**焓湿图计算工具 v3.0** 采用腾讯云 Serverless 架构，提供专业的湿空气热力学参数计算和交互式焓湿图绘制功能。

### ✨ 核心功能

- 🔢 **智能计算**: 输入任意两个湿空气参数，自动计算其他所有参数
- 📊 **交互式图表**: 在焓湿图上绘制多个状态点和过程线
- 🎨 **自定义样式**: 支持自定义点的颜色、标记样式和线的样式
- 📱 **响应式界面**: 现代化的Web界面，支持桌面和移动设备
- 🔄 **实时更新**: 参数修改后图表实时更新
- 📋 **数据管理**: 支持添加、编辑、删除状态点和过程线

### 🏗️ Serverless 架构优势

- 🔥 **零运维**: 无需管理服务器，专注业务逻辑
- 💰 **按需付费**: 仅为实际使用的计算资源付费（月成本¥13-110）
- ⚡ **自动扩容**: 根据请求量自动调整资源
- 🛡️ **高可用**: 多地域容灾，99.9% 可用性
- 🌍 **全球加速**: CDN 加速，毫秒级响应

## 🛠️ 技术栈

### 后端 (Serverless)
- **腾讯云函数 SCF**: 按需执行的计算服务
- **FastAPI**: 现代化Web框架
- **CoolProp**: 热力学属性计算库
- **Matplotlib**: 图表生成（Serverless优化）
- **API 网关**: 统一API入口

### 前端 (静态托管)
- **React 18**: 用户界面框架
- **Ant Design**: UI组件库
- **Recharts**: 交互式图表库
- **Zustand**: 状态管理
- **腾讯云 COS**: 静态网站托管

## 🚀 快速开始

### 环境要求

- **Node.js**: 14.x 或更高版本
- **Python**: 3.8 或更高版本
- **腾讯云账号**: 需要 API 密钥
- **Serverless Framework**: 将自动安装

### 步骤 1: 克隆项目

```bash
# 从 GitHub 克隆项目
git clone https://github.com/your-username/psychro-calculator.git
cd psychro-calculator
```

### 步骤 2: 配置腾讯云凭证

#### 方法一：环境变量（推荐）

```bash
export TENCENT_SECRET_ID=your_secret_id
export TENCENT_SECRET_KEY=your_secret_key
```

#### 方法二：配置文件

```bash
# 复制配置模板
cp config.example.js config.js

# 编辑配置文件，填入实际的腾讯云凭证
vim config.js
```

### 步骤 3: 手动部署

#### 完整部署

```bash
# 赋予脚本执行权限
chmod +x deploy-serverless.sh

# 一键部署
./deploy-serverless.sh deploy
```

#### 分步部署

```bash
# 仅部署后端 API
./deploy-serverless.sh backend

# 仅部署前端静态网站
./deploy-serverless.sh frontend
```

#### 手动逐步部署

```bash
# 1. 安装 Serverless Framework
npm install -g serverless

# 2. 部署后端云函数
cd backend
pip install -r requirements-serverless.txt
serverless deploy

# 3. 更新前端 API 配置（使用部署后的 API 地址）
# 编辑 frontend/src/config/api.js 文件

# 4. 部署前端静态网站
cd ../frontend
npm install
npm run build:prod
serverless deploy
```

## 🌐 访问应用

部署完成后，您将看到类似输出：

```
=== 焓湿图计算工具 Serverless 部署完成 ===

部署结果:
✓ 后端 API: https://service-xxx.gz.apigw.tencentcs.com/release
  - API 文档: https://service-xxx.gz.apigw.tencentcs.com/release/docs
  - 健康检查: https://service-xxx.gz.apigw.tencentcs.com/release/health

✓ 前端网站: https://psychro-calculator-prod-1234567890.cos-website.ap-guangzhou.myqcloud.com
```

## 📖 API 接口

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

### 生成焓湿图数据
```http
POST /generate-chart
Content-Type: application/json

{
  "pressure": 101325.0,
  "points": [...],
  "process_lines": [...]
}
```

### 混风处理
```http
POST /mixing
Content-Type: application/json

{
  "pressure": 101325.0,
  "point1": {"tdb": 25, "w": 10},
  "point2": {"tdb": 15, "w": 5},
  "ratio": 0.6
}
```

## 🔧 管理命令

```bash
# 查看部署状态
./deploy-serverless.sh status

# 查看帮助信息
./deploy-serverless.sh help

# 移除部署
./deploy-serverless.sh remove

# 查看后端状态
cd backend && serverless info

# 查看前端状态
cd frontend && serverless info

# 查看实时日志
cd backend && serverless logs -f api -t
```

## 📁 项目结构

```
psychro-calculator/
├── backend/                    # 后端云函数
│   ├── serverless.yml         # 云函数配置
│   ├── main_app.py            # FastAPI 应用（Serverless 优化）
│   ├── calculator.py          # 计算核心模块（性能优化）
│   ├── performance.py         # 性能优化模块
│   └── requirements-serverless.txt # Serverless 依赖
├── frontend/                   # 前端静态网站
│   ├── serverless.yml         # 静态网站托管配置
│   ├── src/
│   │   ├── config/api.js      # API 配置管理
│   │   ├── App.js             # 主应用组件
│   │   └── components/        # React 组件
│   └── package.json           # 前端依赖
├── deploy-serverless.sh        # 一键部署脚本
├── config.example.js           # 配置示例
├── serverless.yml             # 统一部署配置
└── README.md                  # 项目说明
```

## ⚡ 性能优化

项目已集成多项 Serverless 优化：

- **冷启动优化**: 依赖预热、结果缓存、内存管理
- **计算缓存**: 结果缓存 10 分钟，减少重复计算
- **图表优化**: 降低 DPI，减少内存使用
- **CDN 加速**: 全球边缘节点分发
- **预置并发**: 可选配置减少冷启动时间

## 💰 成本分析

### 按需付费模型

| 服务 | 计费方式 | 预估成本（月） |
|------|----------|----------------|
| **云函数 SCF** | 执行次数 + 执行时长 | ¥5-50 |
| **对象存储 COS** | 存储空间 + 请求次数 | ¥1-10 |
| **API 网关** | API 调用次数 | ¥2-20 |
| **CDN 加速** | 流量使用量 | ¥5-30 |
| **总计** | - | **¥13-110** |

### 成本优势

- **比传统服务器节省 70%+**: 从 ¥200+/月 降至 ¥13-110/月
- **零运维成本**: 无需专门的运维人员
- **弹性计费**: 低使用量时成本极低

## 🔧 故障排除

### 常见问题

#### 1. 部署失败

```bash
# 检查 Serverless Framework
npm install -g serverless@latest

# 检查腾讯云权限
serverless info
```

#### 2. API 调用失败

```bash
# 检查后端状态
cd backend && serverless info

# 查看函数日志
serverless logs -f api

# 测试健康检查
curl https://your-api-url/health
```

#### 3. 前端无法访问 API

检查 `frontend/src/config/api.js` 中的 API 地址是否正确更新为部署后的实际地址。

### 获取帮助

- **腾讯云文档**: [Serverless 应用中心](https://cloud.tencent.com/document/product/1154)
- **技术支持**: 通过腾讯云工单系统
- **项目 Issues**: [GitHub Issues](https://github.com/your-username/psychro-calculator/issues)

## 🔐 安全与合规

- **HTTPS 强制**: 所有通信强制 HTTPS 加密
- **CORS 配置**: 合理的跨域访问控制
- **访问日志**: 完整的访问和操作日志
- **权限管理**: 基于腾讯云 IAM 的精细权限控制

## 🚧 开发指南

### 本地开发

```bash
# 启动后端本地开发
cd backend
pip install -r requirements-serverless.txt
python main_app.py

# 启动前端本地开发
cd frontend
npm install
npm start
```

### 环境变量

开发环境会自动使用 `localhost:7000` 作为 API 地址，生产环境使用部署后的实际地址。

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
- [腾讯云 Serverless](https://cloud.tencent.com/product/sls) - Serverless 计算平台
- [FastAPI](https://fastapi.tiangolo.com/) - 现代化Python Web框架
- [React](https://reactjs.org/) - 用户界面库

---

⭐ **如果这个项目对您有帮助，请给我们一个星标！**

🚀 **立即开始您的 Serverless 之旅：**

```bash
git clone https://github.com/your-username/psychro-calculator.git
cd psychro-calculator
./deploy-serverless.sh deploy
``` 
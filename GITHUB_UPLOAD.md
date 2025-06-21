# GitHub 上传指导

## 方法一：使用压缩包上传

### 1. 下载压缩包
项目压缩包已创建：`psychro-calculator.tar.gz` (约68MB)

### 2. 上传到GitHub
1. 访问 [GitHub](https://github.com)
2. 点击右上角 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - Repository name: `psychro-calculator`
   - Description: `焓湿图计算工具 - 基于FastAPI和React的湿空气参数计算与可视化工具`
   - 选择 Public 或 Private
   - 不要勾选 "Add a README file"
4. 点击 "Create repository"

### 3. 上传文件
1. 在新建的仓库页面，点击 "uploading an existing file"
2. 将 `psychro-calculator.tar.gz` 拖拽到上传区域
3. 添加提交信息：`Initial commit: 焓湿图计算工具完整代码`
4. 点击 "Commit changes"

## 方法二：使用Git命令行上传

### 1. 初始化Git仓库
```bash
# 解压项目文件
tar -xzf psychro-calculator.tar.gz
cd psychro-calculator

# 初始化Git仓库
git init
git add .
git commit -m "Initial commit: 焓湿图计算工具"
```

### 2. 连接到GitHub
```bash
# 添加远程仓库（替换YOUR_USERNAME为您的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/psychro-calculator.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

## 项目结构说明

```
psychro-calculator/
├── backend/                 # 后端代码
│   ├── calculator.py       # 核心计算模块
│   └── main_app.py         # FastAPI应用
├── frontend/               # 前端代码
│   ├── public/            # 静态资源
│   ├── src/               # React源码
│   │   ├── App.js         # 主应用组件
│   │   ├── App.css        # 样式文件
│   │   └── index.js       # 入口文件
│   └── package.json       # 前端依赖
├── deploy.sh              # 一键部署脚本
├── quick-start.sh         # 快速启动脚本
├── requirements.txt       # Python依赖
├── README.md              # 项目说明
├── DEPLOYMENT.md          # 部署文档
├── USAGE_EXAMPLES.md      # 使用示例
└── GITHUB_UPLOAD.md       # 本文件
```

## 功能特性

### 🧮 核心功能
- **参数计算**：输入任意两个参数，计算其他所有参数
- **状态点管理**：添加、编辑、删除状态点
- **过程线绘制**：连接状态点生成过程线
- **混风处理**：计算两个状态点的混合结果
- **焓湿图生成**：可视化显示状态点和过程线

### 🎨 界面特性
- **响应式设计**：支持桌面端和移动端
- **直观操作**：分离计算和图表显示
- **实时反馈**：计算结果即时显示
- **交互友好**：点击查看详情，拖拽操作

### 🚀 技术栈
- **后端**：FastAPI + CoolProp + Matplotlib
- **前端**：React + Ant Design + Axios
- **部署**：一键部署脚本，支持虚拟环境

## 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/YOUR_USERNAME/psychro-calculator.git
cd psychro-calculator
```

### 2. 一键部署
```bash
chmod +x deploy.sh
./deploy.sh start
```

### 3. 访问应用
- 前端界面：http://localhost:3000
- API文档：http://localhost:7000/docs

## 许可证

建议使用 MIT 许可证，允许他人自由使用和修改。

## 贡献指南

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建 Pull Request

## 联系方式

如有问题或建议，请通过以下方式联系：
- 创建 GitHub Issue
- 发送邮件至：[您的邮箱]

---

**注意**：上传前请确保：
1. 没有包含敏感信息（API密钥、密码等）
2. 虚拟环境文件夹已排除（psychro_env）
3. node_modules 文件夹已排除
4. 日志文件已排除 
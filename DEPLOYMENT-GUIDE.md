# 从 GitHub 手动部署指南

> 🚀 **腾讯云 Serverless 手动部署流程**

## 📋 前提条件

- **腾讯云账号** 已开通
- **API 密钥** 已创建
- **Node.js** 14+ 已安装
- **Python** 3.8+ 已安装

## 🔧 部署步骤

### 1. 从 GitHub 克隆项目

```bash
# 克隆项目到本地
git clone https://github.com/your-username/psychro-calculator.git
cd psychro-calculator
```

### 2. 配置腾讯云凭证

```bash
# 方法一：设置环境变量（推荐）
export TENCENT_SECRET_ID=your_secret_id
export TENCENT_SECRET_KEY=your_secret_key

# 方法二：创建配置文件
cp config.example.js config.js
# 编辑 config.js 填入实际凭证
```

### 3. 安装 Serverless Framework

```bash
npm install -g serverless
```

### 4. 手动部署

#### 选项 A: 一键部署

```bash
chmod +x deploy-serverless.sh
./deploy-serverless.sh deploy
```

#### 选项 B: 逐步部署

```bash
# 步骤 1: 部署后端 API
cd backend
pip install -r requirements-serverless.txt
serverless deploy

# 记录返回的 API 网关地址
# 例如: https://service-xxx.gz.apigw.tencentcs.com/release

# 步骤 2: 更新前端配置
cd ../frontend/src/config
# 编辑 api.js，将 baseURL 替换为实际的 API 地址

# 步骤 3: 部署前端
cd ../../
npm install
npm run build:prod
serverless deploy
```

### 5. 验证部署

```bash
# 检查后端状态
cd backend && serverless info

# 检查前端状态  
cd ../frontend && serverless info

# 测试 API
curl https://your-api-url/health
```

## 🔄 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新部署
./deploy-serverless.sh deploy
```

## 🗑️ 清理资源

```bash
# 移除所有部署
./deploy-serverless.sh remove
```

## 📞 获取支持

- **问题反馈**: [GitHub Issues](https://github.com/your-username/psychro-calculator/issues)
- **腾讯云文档**: [Serverless 应用中心](https://cloud.tencent.com/document/product/1154) 
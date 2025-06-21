# 焓湿图计算工具部署文档

## 项目简介

这是一个基于Python FastAPI和React的焓湿图计算工具，支持：
- 输入任意两个湿空气参数，自动计算其他参数
- 在焓湿图上绘制多个状态点
- 自定义过程线和状态变化
- 交互式图表显示和参数查看

## 系统要求

### 最低要求
- **操作系统**: Linux (Ubuntu 18.04+ / CentOS 7+) 或 macOS 10.14+
- **Python**: 3.8+
- **Node.js**: 16+
- **npm**: 8+
- **内存**: 2GB RAM
- **存储**: 1GB 可用空间

### 推荐配置
- **操作系统**: Ubuntu 20.04+ / CentOS 8+
- **Python**: 3.9+
- **Node.js**: 18+
- **npm**: 9+
- **内存**: 4GB RAM
- **存储**: 2GB 可用空间

## 快速部署

### 方法一：一键部署脚本（推荐）

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd psychro
   ```

2. **给脚本执行权限**
   ```bash
   chmod +x deploy.sh
   ```

3. **一键启动**
   ```bash
   ./deploy.sh start
   ```

4. **访问应用**
   - 前端界面: http://localhost:3000
   - 后端API: http://localhost:7000
   - API文档: http://localhost:7000/docs

### 方法二：手动部署

#### 1. 环境准备

**Ubuntu/Debian:**
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Python3和pip
sudo apt install -y python3 python3-pip python3-venv

# 安装Node.js和npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装构建工具
sudo apt install -y build-essential
```

**CentOS/RHEL:**
```bash
# 更新系统
sudo yum update -y

# 安装Python3
sudo yum install -y python3 python3-pip

# 安装Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 安装构建工具
sudo yum groupinstall -y "Development Tools"
```

**macOS:**
```bash
# 安装Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装Python3
brew install python3

# 安装Node.js
brew install node
```

#### 2. 安装依赖

```bash
# 安装Python依赖
pip3 install -r requirements.txt

# 安装前端依赖
cd frontend
npm install
cd ..
```

#### 3. 启动服务

**启动后端:**
```bash
cd backend
python3 main_app.py
```

**启动前端（新终端）:**
```bash
cd frontend
npm start
```

## 部署脚本使用说明

### 脚本功能

`deploy.sh` 脚本提供以下功能：

| 命令 | 功能 | 说明 |
|------|------|------|
| `./deploy.sh start` | 启动所有服务 | 检查环境 → 安装依赖 → 启动服务 |
| `./deploy.sh stop` | 停止所有服务 | 安全停止后端和前端服务 |
| `./deploy.sh restart` | 重启所有服务 | 停止 → 等待 → 重新启动 |
| `./deploy.sh status` | 查看服务状态 | 显示服务运行状态和访问地址 |
| `./deploy.sh install` | 仅安装依赖 | 不启动服务，仅安装Python和Node.js依赖 |
| `./deploy.sh clean` | 清理环境 | 停止服务并清理日志文件 |
| `./deploy.sh help` | 显示帮助 | 显示所有可用命令 |

### 使用示例

```bash
# 首次部署
./deploy.sh start

# 查看服务状态
./deploy.sh status

# 重启服务
./deploy.sh restart

# 停止服务
./deploy.sh stop

# 清理环境
./deploy.sh clean
```

## 服务配置

### 端口配置

- **前端服务**: 3000端口
- **后端服务**: 7000端口

如需修改端口，请编辑以下文件：

**前端端口修改:**
```bash
# 编辑 frontend/package.json
# 在 "scripts" 部分修改 "start" 命令
"start": "PORT=3001 react-scripts start"
```

**后端端口修改:**
```bash
# 编辑 backend/main_app.py
# 修改 uvicorn.run 的 port 参数
uvicorn.run("main_app:app", host="0.0.0.0", port=7001, reload=True)
```

### 环境变量

可以设置以下环境变量来自定义配置：

```bash
# 后端配置
export PSYCHRO_BACKEND_PORT=7000
export PSYCHRO_BACKEND_HOST=0.0.0.0
export PSYCHRO_LOG_LEVEL=INFO

# 前端配置
export REACT_APP_API_URL=http://localhost:7000
export PORT=3000
```

## 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 查看端口占用
lsof -i :3000
lsof -i :7000

# 停止占用进程
sudo kill -9 <PID>

# 或使用脚本自动处理
./deploy.sh restart
```

#### 2. Python依赖安装失败
```bash
# 升级pip
pip3 install --upgrade pip

# 清理缓存
pip3 cache purge

# 重新安装
pip3 install -r requirements.txt --force-reinstall
```

#### 3. Node.js依赖安装失败
```bash
# 清理npm缓存
npm cache clean --force

# 删除node_modules
rm -rf frontend/node_modules

# 重新安装
cd frontend && npm install
```

#### 4. 服务启动失败
```bash
# 查看日志
tail -f backend.log
tail -f frontend.log

# 检查系统资源
free -h
df -h
```

#### 5. 字体显示问题（Linux）
```bash
# 安装中文字体
sudo apt install -y fonts-wqy-zenhei  # Ubuntu/Debian
sudo yum install -y wqy-zenhei-fonts  # CentOS/RHEL
```

### 日志文件

- **后端日志**: `backend.log`
- **前端日志**: `frontend.log`
- **PID文件**: `backend.pid`, `frontend.pid`

### 性能优化

#### 生产环境部署

1. **使用生产构建**
   ```bash
   cd frontend
   npm run build
   ```

2. **使用Gunicorn启动后端**
   ```bash
   pip3 install gunicorn
   cd backend
   gunicorn main_app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:7000
   ```

3. **使用Nginx反向代理**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /api/ {
           proxy_pass http://localhost:7000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 安全考虑

### 生产环境安全配置

1. **防火墙设置**
   ```bash
   # 只开放必要端口
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **HTTPS配置**
   ```bash
   # 使用Let's Encrypt获取SSL证书
   sudo apt install certbot
   sudo certbot --nginx -d your-domain.com
   ```

3. **用户权限**
   ```bash
   # 创建专用用户
   sudo useradd -r -s /bin/false psychro
   sudo chown -R psychro:psychro /path/to/psychro
   ```

## 监控和维护

### 服务监控

```bash
# 查看服务状态
./deploy.sh status

# 监控资源使用
htop
iotop

# 监控日志
tail -f backend.log | grep ERROR
```

### 备份和恢复

```bash
# 备份配置和数据
tar -czf psychro-backup-$(date +%Y%m%d).tar.gz \
    backend/ \
    frontend/ \
    requirements.txt \
    deploy.sh

# 恢复备份
tar -xzf psychro-backup-20231201.tar.gz
```

## 更新和升级

### 更新代码
```bash
# 拉取最新代码
git pull origin main

# 重新安装依赖
./deploy.sh install

# 重启服务
./deploy.sh restart
```

### 升级依赖
```bash
# 升级Python依赖
pip3 install --upgrade -r requirements.txt

# 升级Node.js依赖
cd frontend
npm update
cd ..
```

## 技术支持

### 获取帮助

1. **查看日志**: 检查 `backend.log` 和 `frontend.log`
2. **查看状态**: 运行 `./deploy.sh status`
3. **重启服务**: 运行 `./deploy.sh restart`
4. **清理环境**: 运行 `./deploy.sh clean`

### 联系支持

- **GitHub Issues**: 提交问题报告
- **文档**: 查看项目README和API文档
- **社区**: 参与项目讨论

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。 
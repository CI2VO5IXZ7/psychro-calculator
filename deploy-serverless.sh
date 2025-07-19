#!/bin/bash

# 焓湿图计算工具 - 腾讯云 Serverless 一键部署脚本
# 版本: 3.0.0 - Serverless 版本

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 版本信息
VERSION="3.0.0"
FEATURES="腾讯云 Serverless | 云函数 SCF | 静态网站托管 | API 网关"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查系统要求
check_system_requirements() {
    log_info "检查 Serverless 部署环境..."
    
    # 检查 Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js 版本: $NODE_VERSION"
    else
        log_error "未找到 Node.js，请先安装 Node.js"
        exit 1
    fi
    
    # 检查 npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        log_success "npm 版本: $NPM_VERSION"
    else
        log_error "未找到 npm，请先安装 npm"
        exit 1
    fi
    
    # 检查 Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        log_success "Python 版本: $PYTHON_VERSION"
    else
        log_error "未找到 Python3，请先安装 Python3"
        exit 1
    fi
    
    # 检查 Serverless Framework
    if command -v serverless &> /dev/null; then
        SLS_VERSION=$(serverless --version | head -n 1)
        log_success "Serverless Framework: $SLS_VERSION"
    else
        log_warning "未找到 Serverless Framework，正在安装..."
        npm install -g serverless
        log_success "Serverless Framework 安装完成"
    fi
}

# 安装后端依赖
install_backend_dependencies() {
    log_info "安装后端 Serverless 依赖..."
    
    cd backend
    
    # 检查是否有 requirements-serverless.txt
    if [[ -f "requirements-serverless.txt" ]]; then
        log_info "使用 Serverless 优化的依赖配置..."
        
        # 创建虚拟环境（如果不存在）
        if [[ ! -d "venv" ]]; then
            python3 -m venv venv
        fi
        
        # 激活虚拟环境
        source venv/bin/activate
        
        # 安装依赖
        pip install --upgrade pip
        pip install -r requirements-serverless.txt
        
        log_success "后端依赖安装完成"
    else
        log_warning "未找到 requirements-serverless.txt，使用标准依赖..."
        pip install -r requirements.txt
    fi
    
    cd ..
}

# 安装前端依赖并构建
install_frontend_dependencies() {
    log_info "安装前端依赖并构建..."
    
    cd frontend
    
    # 安装依赖
    npm install
    
    # 构建生产版本
    log_info "构建 React 生产版本..."
    npm run build:prod
    
    if [[ -d "build" ]]; then
        log_success "前端构建完成"
    else
        log_error "前端构建失败"
        exit 1
    fi
    
    cd ..
}

# 配置环境变量
configure_environment() {
    log_info "配置 Serverless 环境..."
    
    # 检查是否有配置文件
    if [[ ! -f "config.js" ]] && [[ -f "config.example.js" ]]; then
        log_warning "未找到配置文件，请先复制 config.example.js 为 config.js 并填入配置"
        log_info "可以运行: cp config.example.js config.js"
        
        # 询问是否继续
        read -p "是否使用默认配置继续部署? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "请配置后重新运行部署脚本"
            exit 1
        fi
    fi
    
    # 检查腾讯云凭证
    if [[ -z "$TENCENT_SECRET_ID" ]] || [[ -z "$TENCENT_SECRET_KEY" ]]; then
        log_warning "未检测到腾讯云环境变量，请确保已配置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY"
        log_info "或者可以通过扫码登录进行授权"
    fi
}

# 部署后端
deploy_backend() {
    log_info "部署后端云函数..."
    
    cd backend
    
    # 使用 Serverless Framework 部署
    if [[ -f "serverless.yml" ]]; then
        log_info "使用 Serverless Framework 部署后端..."
        
        # 部署
        serverless deploy --verbose
        
        # 获取部署结果
        if serverless info &> /dev/null; then
            BACKEND_URL=$(serverless info | grep "url:" | awk '{print $2}' | head -n 1)
            if [[ -n "$BACKEND_URL" ]]; then
                log_success "后端部署成功"
                log_info "API 地址: $BACKEND_URL"
                echo "$BACKEND_URL" > ../backend_url.txt
            else
                log_warning "无法获取后端 URL，请手动检查部署状态"
            fi
        fi
    else
        log_error "未找到 backend/serverless.yml 配置文件"
        exit 1
    fi
    
    cd ..
}

# 更新前端API配置
update_frontend_api_config() {
    log_info "更新前端 API 配置..."
    
    if [[ -f "backend_url.txt" ]]; then
        BACKEND_URL=$(cat backend_url.txt)
        log_info "更新前端配置中的 API 地址: $BACKEND_URL"
        
        # 更新 API 配置文件
        if [[ -f "frontend/src/config/api.js" ]]; then
            # 使用 sed 替换 API 地址
            sed -i.bak "s|https://your-api-gateway-id.apigw.tencentcloudapi.com/release|$BACKEND_URL|g" frontend/src/config/api.js
            
            log_success "前端 API 配置已更新"
            
            # 重新构建前端
            log_info "重新构建前端..."
            cd frontend
            npm run build:prod
            cd ..
        else
            log_warning "未找到前端 API 配置文件"
        fi
    else
        log_warning "未找到后端 URL，跳过前端配置更新"
    fi
}

# 部署前端
deploy_frontend() {
    log_info "部署前端静态网站..."
    
    cd frontend
    
    # 使用 Serverless Framework 部署
    if [[ -f "serverless.yml" ]]; then
        log_info "使用 Serverless Framework 部署前端..."
        
        # 部署
        serverless deploy --verbose
        
        # 获取部署结果
        if serverless info &> /dev/null; then
            FRONTEND_URL=$(serverless info | grep "url:" | awk '{print $2}')
            if [[ -n "$FRONTEND_URL" ]]; then
                log_success "前端部署成功"
                log_info "网站地址: $FRONTEND_URL"
                echo "$FRONTEND_URL" > ../frontend_url.txt
            else
                log_warning "无法获取前端 URL，请手动检查部署状态"
            fi
        fi
    else
        log_error "未找到 frontend/serverless.yml 配置文件"
        exit 1
    fi
    
    cd ..
}

# 显示部署结果
show_deployment_result() {
    log_info "=== 焓湿图计算工具 Serverless 部署完成 v$VERSION ==="
    log_info "功能特性: $FEATURES"
    echo ""
    
    log_info "部署结果:"
    
    # 显示后端信息
    if [[ -f "backend_url.txt" ]]; then
        BACKEND_URL=$(cat backend_url.txt)
        log_success "后端 API: $BACKEND_URL"
        echo "  - API 文档: ${BACKEND_URL}/docs"
        echo "  - 健康检查: ${BACKEND_URL}/health"
    else
        log_error "后端部署信息不可用"
    fi
    
    # 显示前端信息
    if [[ -f "frontend_url.txt" ]]; then
        FRONTEND_URL=$(cat frontend_url.txt)
        log_success "前端网站: $FRONTEND_URL"
    else
        log_error "前端部署信息不可用"
    fi
    
    echo ""
    log_info "Serverless 特性:"
    echo "  ✓ 按需付费 - 只为实际使用付费"
    echo "  ✓ 自动扩容 - 根据请求量自动调整"
    echo "  ✓ 零运维 - 无需管理服务器"
    echo "  ✓ 高可用 - 多地域容灾备份"
    echo ""
    
    log_info "管理命令:"
    echo "  查看后端状态: cd backend && serverless info"
    echo "  查看前端状态: cd frontend && serverless info"
    echo "  移除部署: ./deploy-serverless.sh remove"
}

# 移除部署
remove_deployment() {
    log_info "移除 Serverless 部署..."
    
    # 移除前端
    if [[ -d "frontend" ]]; then
        cd frontend
        if [[ -f "serverless.yml" ]]; then
            log_info "移除前端静态网站..."
            serverless remove --verbose
        fi
        cd ..
    fi
    
    # 移除后端
    if [[ -d "backend" ]]; then
        cd backend
        if [[ -f "serverless.yml" ]]; then
            log_info "移除后端云函数..."
            serverless remove --verbose
        fi
        cd ..
    fi
    
    # 清理临时文件
    rm -f backend_url.txt frontend_url.txt
    
    log_success "Serverless 部署已移除"
}

# 显示帮助信息
show_help() {
    echo "焓湿图计算工具 Serverless 部署脚本 v$VERSION"
    echo "功能特性: $FEATURES"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  deploy     完整部署 (默认)"
    echo "  backend    仅部署后端"
    echo "  frontend   仅部署前端"
    echo "  remove     移除部署"
    echo "  status     查看部署状态"
    echo "  help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 deploy     # 完整部署"
    echo "  $0 backend    # 仅部署后端"
    echo "  $0 remove     # 移除部署"
    echo ""
    echo "环境要求:"
    echo "  - Node.js 14+"
    echo "  - Python 3.8+"
    echo "  - Serverless Framework"
    echo "  - 腾讯云账号和 API 密钥"
    echo ""
    echo "配置文件:"
    echo "  - 复制 config.example.js 为 config.js"
    echo "  - 配置腾讯云 SecretId 和 SecretKey"
    echo "  - 设置环境变量或使用扫码登录"
}

# 查看部署状态
show_status() {
    log_info "检查 Serverless 部署状态..."
    
    # 检查后端状态
    if [[ -d "backend" ]]; then
        cd backend
        if [[ -f "serverless.yml" ]]; then
            log_info "后端状态:"
            serverless info || log_warning "后端未部署或状态异常"
        fi
        cd ..
    fi
    
    # 检查前端状态  
    if [[ -d "frontend" ]]; then
        cd frontend
        if [[ -f "serverless.yml" ]]; then
            log_info "前端状态:"
            serverless info || log_warning "前端未部署或状态异常"
        fi
        cd ..
    fi
}

# 主函数
main() {
    case "${1:-deploy}" in
        "deploy")
            log_info "开始 Serverless 部署 v$VERSION..."
            log_info "功能特性: $FEATURES"
            echo ""
            
            check_system_requirements
            configure_environment
            install_backend_dependencies
            install_frontend_dependencies
            deploy_backend
            update_frontend_api_config
            deploy_frontend
            show_deployment_result
            
            log_success "Serverless 部署完成！"
            ;;
        "backend")
            log_info "仅部署后端..."
            check_system_requirements
            configure_environment
            install_backend_dependencies
            deploy_backend
            log_success "后端部署完成！"
            ;;
        "frontend")
            log_info "仅部署前端..."
            check_system_requirements
            install_frontend_dependencies
            deploy_frontend
            log_success "前端部署完成！"
            ;;
        "remove")
            remove_deployment
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 捕获中断信号
trap 'log_info "收到中断信号，正在清理..."; exit 0' INT TERM

# 执行主函数
main "$@" 
#!/bin/bash

# 焓湿图计算工具一键部署脚本
# 作者: AI Assistant
# 版本: 2.0.0 - 支持交互式焓湿图

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 虚拟环境配置
VENV_NAME="psychro_env"
VENV_PATH="./$VENV_NAME"

# 版本信息
VERSION="2.0.0"
FEATURES="交互式焓湿图 | Zustand状态管理 | Recharts图表库"

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
    log_info "检查系统要求..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_success "操作系统: Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        log_success "操作系统: macOS"
    else
        log_warning "未知操作系统: $OSTYPE"
    fi
    
    # 检查Python版本
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
        log_success "Python版本: $PYTHON_VERSION"
    else
        log_error "未找到Python3，请先安装Python3"
        exit 1
    fi
    
    # 检查Node.js版本
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js版本: $NODE_VERSION"
    else
        log_error "未找到Node.js，请先安装Node.js"
        exit 1
    fi
    
    # 检查npm版本
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        log_success "npm版本: $NPM_VERSION"
    else
        log_error "未找到npm，请先安装npm"
        exit 1
    fi
    
    # 检查关键前端依赖
    if [[ -d "frontend" ]] && [[ -f "frontend/package.json" ]]; then
        log_info "检查前端关键依赖..."
        cd frontend
        
        # 检查zustand
        if grep -q "zustand" package.json; then
            log_success "Zustand状态管理库已配置"
        else
            log_warning "Zustand未在package.json中找到，将在安装时添加"
        fi
        
        # 检查recharts
        if grep -q "recharts" package.json; then
            log_success "Recharts图表库已配置"
        else
            log_warning "Recharts未在package.json中找到，将在安装时添加"
        fi
        
        cd ..
    fi
}

# 创建虚拟环境
create_virtual_environment() {
    log_info "创建Python虚拟环境..."
    
    # 检查是否已存在虚拟环境
    if [[ -d "$VENV_PATH" ]]; then
        log_warning "虚拟环境已存在: $VENV_PATH"
        return 0
    fi
    
    # 检查python3-venv是否安装
    if ! python3 -c "import venv" 2>/dev/null; then
        log_info "安装python3-venv..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            apt update && apt install -y python3-venv python3-pip
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install python3
        fi
    fi
    
    # 创建虚拟环境
    log_info "创建虚拟环境: $VENV_PATH"
    python3 -m venv "$VENV_PATH"
    
    if [[ -d "$VENV_PATH" ]]; then
        log_success "虚拟环境创建成功"
    else
        log_error "虚拟环境创建失败"
        exit 1
    fi
}

# 激活虚拟环境
activate_virtual_environment() {
    if [[ -f "$VENV_PATH/bin/activate" ]]; then
        source "$VENV_PATH/bin/activate"
        log_success "虚拟环境已激活: $VENV_PATH"
    else
        log_error "虚拟环境激活失败"
        exit 1
    fi
}

# 安装Python依赖
install_python_dependencies() {
    log_info "安装Python依赖..."
    
    # 激活虚拟环境
    activate_virtual_environment
    
    # 升级pip
    pip install --upgrade pip
    
    # 安装Python依赖
    if [[ -f "requirements.txt" ]]; then
        log_info "从requirements.txt安装依赖..."
        # 优先使用预编译的wheel包
        pip install --only-binary=all -r requirements.txt
    else
        log_info "安装基础依赖..."
        pip install --only-binary=all fastapi uvicorn coolprop matplotlib numpy pydantic
    fi
    
    log_success "Python依赖安装完成"
}

# 安装Node.js依赖
install_node_dependencies() {
    log_info "安装Node.js依赖..."
    
    if [[ -d "frontend" ]]; then
        cd frontend
        
        # 检查package.json
        if [[ -f "package.json" ]]; then
            log_info "安装前端依赖..."
            npm install
            
            # 确保关键依赖已安装
            log_info "检查并安装关键依赖..."
            if ! npm list zustand > /dev/null 2>&1; then
                log_info "安装Zustand状态管理库..."
                npm install zustand
            fi
            
            if ! npm list recharts > /dev/null 2>&1; then
                log_info "安装Recharts图表库..."
                npm install recharts
            fi
            
            log_success "前端依赖安装完成"
        else
            log_error "未找到package.json文件"
            exit 1
        fi
        
        cd ..
    else
        log_error "未找到frontend目录"
        exit 1
    fi
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用..."
    
    # 检查后端端口7000
    if lsof -Pi :7000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口7000已被占用，尝试关闭..."
        pkill -f "main_app.py" || true
        sleep 2
    fi
    
    # 检查前端端口3000
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口3000已被占用，尝试关闭..."
        pkill -f "react-scripts" || true
        sleep 2
    fi
    
    log_success "端口检查完成"
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    
    if [[ -d "backend" ]]; then
        cd backend
        
        # 检查main_app.py是否存在
        if [[ -f "main_app.py" ]]; then
            log_info "启动FastAPI后端服务 (端口: 7000)..."
            
            # 激活虚拟环境并启动服务
            source "../$VENV_PATH/bin/activate"
            nohup python main_app.py > ../backend.log 2>&1 &
            BACKEND_PID=$!
            echo $BACKEND_PID > ../backend.pid
            
            # 等待服务启动
            sleep 5
            
            # 检查服务是否启动成功
            if curl -s http://localhost:7000/health > /dev/null 2>&1; then
                log_success "后端服务启动成功"
            else
                log_error "后端服务启动失败，请检查backend.log"
                exit 1
            fi
        else
            log_error "未找到main_app.py文件"
            exit 1
        fi
        
        cd ..
    else
        log_error "未找到backend目录"
        exit 1
    fi
}

# 启动前端服务
start_frontend() {
    log_info "启动前端服务..."
    
    if [[ -d "frontend" ]]; then
        cd frontend
        
        # 检查package.json
        if [[ -f "package.json" ]]; then
            log_info "启动React前端服务 (端口: 3000)..."
            nohup npm start > ../frontend.log 2>&1 &
            FRONTEND_PID=$!
            echo $FRONTEND_PID > ../frontend.pid
            
            # 等待服务启动
            sleep 10
            
            # 检查服务是否启动成功
            if curl -s http://localhost:3000 > /dev/null 2>&1; then
                log_success "前端服务启动成功"
            else
                log_warning "前端服务可能还在启动中，请稍后访问"
            fi
        else
            log_error "未找到package.json文件"
            exit 1
        fi
        
        cd ..
    else
        log_error "未找到frontend目录"
        exit 1
    fi
}

# 显示服务状态
show_status() {
    log_info "=== 焓湿图计算工具 v$VERSION ==="
    log_info "功能特性: $FEATURES"
    echo ""
    
    log_info "服务状态:"
    
    # 检查后端服务
    if [[ -f "backend.pid" ]]; then
        BACKEND_PID=$(cat backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            log_success "后端服务运行中 (PID: $BACKEND_PID)"
        else
            log_error "后端服务未运行"
        fi
    else
        log_error "后端服务未运行"
    fi
    
    # 检查前端服务
    if [[ -f "frontend.pid" ]]; then
        FRONTEND_PID=$(cat frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            log_success "前端服务运行中 (PID: $FRONTEND_PID)"
        else
            log_error "前端服务未运行"
        fi
    else
        log_error "前端服务未运行"
    fi
    
    echo ""
    log_info "访问地址:"
    echo "  前端界面: http://localhost:3000"
    echo "  后端API: http://localhost:7000"
    echo "  API文档: http://localhost:7000/docs"
    echo ""
    log_info "日志文件:"
    echo "  后端日志: backend.log"
    echo "  前端日志: frontend.log"
    echo ""
    log_info "虚拟环境:"
    echo "  路径: $VENV_PATH"
    echo "  激活: source $VENV_PATH/bin/activate"
    echo ""
    log_info "新功能说明:"
    echo "  ✓ 交互式焓湿图 (Recharts渲染)"
    echo "  ✓ 状态管理优化 (Zustand)"
    echo "  ✓ 自定义状态点名称"
    echo "  ✓ 混风处理功能"
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    
    # 停止后端服务
    if [[ -f "backend.pid" ]]; then
        BACKEND_PID=$(cat backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill $BACKEND_PID
            log_success "后端服务已停止"
        fi
        rm -f backend.pid
    fi
    
    # 停止前端服务
    if [[ -f "frontend.pid" ]]; then
        FRONTEND_PID=$(cat frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill $FRONTEND_PID
            log_success "前端服务已停止"
        fi
        rm -f frontend.pid
    fi
    
    # 清理进程
    pkill -f "main_app.py" || true
    pkill -f "react-scripts" || true
    
    log_success "所有服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    stop_services
    sleep 2
    start_backend
    start_frontend
    show_status
}

# 清理环境
cleanup() {
    log_info "清理环境..."
    
    # 停止服务
    stop_services
    
    # 删除日志文件
    rm -f backend.log frontend.log
    
    # 删除PID文件
    rm -f backend.pid frontend.pid
    
    # 询问是否删除虚拟环境
    read -p "是否删除虚拟环境 $VENV_PATH? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$VENV_PATH"
        log_success "虚拟环境已删除"
    fi
    
    log_success "环境清理完成"
}

# 显示帮助信息
show_help() {
    echo "焓湿图计算工具部署脚本 v$VERSION"
    echo "功能特性: $FEATURES"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  start     启动所有服务 (默认)"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  status    显示服务状态"
    echo "  install   仅安装依赖"
    echo "  clean     清理环境"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start    # 启动服务"
    echo "  $0 stop     # 停止服务"
    echo "  $0 status   # 查看状态"
    echo ""
    echo "新功能:"
    echo "  ✓ 交互式焓湿图 (支持缩放、悬浮提示)"
    echo "  ✓ 状态管理优化 (Zustand)"
    echo "  ✓ 自定义状态点名称"
    echo "  ✓ 混风处理功能"
    echo ""
    echo "虚拟环境:"
    echo "  路径: $VENV_PATH"
    echo "  激活: source $VENV_PATH/bin/activate"
    echo "  退出: deactivate"
}

# 主函数
main() {
    case "${1:-start}" in
        "start")
            log_info "开始部署焓湿图计算工具 v$VERSION..."
            log_info "功能特性: $FEATURES"
            echo ""
            check_system_requirements
            create_virtual_environment
            install_python_dependencies
            install_node_dependencies
            check_ports
            start_backend
            start_frontend
            show_status
            log_success "部署完成！"
            log_info "新功能已启用：交互式焓湿图、状态管理优化、自定义状态点名称"
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "status")
            show_status
            ;;
        "install")
            check_system_requirements
            create_virtual_environment
            install_python_dependencies
            install_node_dependencies
            log_success "依赖安装完成"
            ;;
        "clean")
            cleanup
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
trap 'log_info "收到中断信号，正在停止服务..."; stop_services; exit 0' INT TERM

# 执行主函数
main "$@" 
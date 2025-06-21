#!/bin/bash

# 焓湿图计算工具快速启动脚本
# 用于快速启动开发环境

# 虚拟环境配置
VENV_NAME="psychro_env"
VENV_PATH="./$VENV_NAME"

echo "🚀 启动焓湿图计算工具..."

# 检查并创建虚拟环境
echo "📦 检查Python虚拟环境..."
if [ ! -d "$VENV_PATH" ]; then
    echo "⚠️  虚拟环境不存在，正在创建..."
    python3 -m venv "$VENV_PATH"
    echo "✅ 虚拟环境创建完成"
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source "$VENV_PATH/bin/activate"

# 检查Python依赖
echo "📦 检查Python依赖..."
if ! python -c "import fastapi, uvicorn, coolprop" 2>/dev/null; then
    echo "⚠️  缺少Python依赖，正在安装..."
    pip install fastapi uvicorn coolprop matplotlib numpy pydantic
fi

# 检查Node.js依赖
echo "📦 检查Node.js依赖..."
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  缺少Node.js依赖，正在安装..."
    cd frontend && npm install && cd ..
fi

# 启动后端
echo "🔧 启动后端服务..."
cd backend
source "../$VENV_PATH/bin/activate"
python main_app.py &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端
echo "🎨 启动前端服务..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 服务启动完成！"
echo ""
echo "🌐 访问地址:"
echo "   前端界面: http://localhost:3000"
echo "   后端API: http://localhost:7000"
echo "   API文档: http://localhost:7000/docs"
echo ""
echo "🔧 虚拟环境:"
echo "   路径: $VENV_PATH"
echo "   激活: source $VENV_PATH/bin/activate"
echo "   退出: deactivate"
echo ""
echo "💡 按 Ctrl+C 停止所有服务"

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

wait 
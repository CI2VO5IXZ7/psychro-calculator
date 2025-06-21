#!/bin/bash

# 焓湿图计算工具 - 快速启动脚本
echo "🚀 启动焓湿图计算工具..."

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到Python3"
    exit 1
fi

# 安装系统依赖
echo "🔧 安装系统依赖..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y python3-venv python3-pip fonts-wqy-zenhei
elif command -v yum &> /dev/null; then
    sudo yum install -y python3-venv python3-pip wqy-zenhei-fonts
else
    echo "⚠️ 无法自动安装系统依赖，请手动安装python3-venv"
fi

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "🔧 创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 升级pip
echo "📦 升级pip..."
pip install --upgrade pip setuptools wheel

# 安装基础依赖
echo "📦 安装基础依赖..."
pip install fastapi uvicorn numpy matplotlib pydantic

# 尝试安装CoolProp（简化版）
echo "📦 尝试安装CoolProp..."
pip install --only-binary=all coolprop 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ CoolProp安装成功"
else
    echo "⚠️ CoolProp安装失败，使用模拟数据"
    # 创建模拟数据模块
    cat > mock_coolprop.py << 'MOCK_EOF'
# 模拟CoolProp数据，用于网页调试
import numpy as np

def HAPropsSI(output, input1, value1, input2, value2, input3=None, value3=None):
    """模拟CoolProp函数，返回合理的测试数据"""
    
    # 基础参数转换
    if input1 == 'T':
        tdb = value1 - 273.15  # K to °C
    elif input1 == 'B':
        twb = value1 - 273.15
    elif input1 == 'R':
        rh = value1 * 100  # 0-1 to %
    elif input1 == 'W':
        w = value1 * 1000  # kg/kg to g/kg
    elif input1 == 'H':
        h = value1 / 1000  # J/kg to kJ/kg
    elif input1 == 'D':
        tdp = value1 - 273.15
    elif input1 == 'P':
        p = value1
    
    if input2 == 'T':
        tdb = value2 - 273.15
    elif input2 == 'B':
        twb = value2 - 273.15
    elif input2 == 'R':
        rh = value2 * 100
    elif input2 == 'W':
        w = value2 * 1000
    elif input2 == 'H':
        h = value2 / 1000
    elif input2 == 'D':
        tdp = value2 - 273.15
    elif input2 == 'P':
        p = value2
    
    # 返回模拟数据
    if output == 'T':
        return 298.15  # 25°C
    elif output == 'B':
        return 293.15  # 20°C
    elif output == 'R':
        return 0.6     # 60%
    elif output == 'W':
        return 0.012   # 12 g/kg
    elif output == 'H':
        return 50000   # 50 kJ/kg
    elif output == 'D':
        return 290.15  # 17°C
    
    return 0.0

# 创建模块别名
import sys
sys.modules['CoolProp.HumidAirProp'] = type('MockModule', (), {'HAPropsSI': HAPropsSI})()
MOCK_EOF
fi

# 启动服务
echo "🚀 启动服务..."
echo "🌐 访问地址: http://localhost:7000"
echo "📚 API文档: http://localhost:7000/docs"
echo "💡 按 Ctrl+C 停止服务"
echo ""

python main_app.py

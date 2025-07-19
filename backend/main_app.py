# backend/main_app.py
import uvicorn
import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Serverless 环境优化
import sys
if '/var/task' not in sys.path:
    sys.path.append('/var/task')

# matplotlib 配置 - Serverless 环境优化
import matplotlib
matplotlib.use('Agg')  # 使用非交互式后端
import matplotlib.pyplot as plt
plt.ioff()  # 关闭交互模式

# 字体配置 - Serverless 环境
import matplotlib.font_manager as fm
try:
    # 尝试设置中文字体
    plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans', 'Arial Unicode MS']
    plt.rcParams['axes.unicode_minus'] = False
except Exception as e:
    print(f"字体配置警告: {e}")

# 从我们的核心模块中导入计算函数
try:
    from calculator import calculate_properties, create_psych_chart, calculate_multiple_points
except ImportError:
    # 如果calculator模块不存在，创建模拟函数
    def calculate_properties(props_to_send: dict):
        """模拟计算函数，用于调试"""
        return {
            "tdb": 25.00,
            "twb": 20.00, 
            "rh": 60.00,
            "w": 12.500,
            "h": 50.00,
            "tdp": 17.00,
            "success": True
        }
    
    def create_psych_chart(pressure_pa, points=None, process_lines=None):
        """模拟图表生成函数"""
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    def calculate_multiple_points(points_data, pressure_pa):
        """模拟多点计算函数"""
        return [calculate_properties({'P': pressure_pa, 'T': 298.15, 'R': 0.6})]

# 初始化 FastAPI 应用
app = FastAPI(
    title="湿空气状态参数计算服务",
    description="一个统一的服务，提供 API 计算并托管前端应用。",
    version="2.0.0",
)

# --- 配置 CORS (跨域资源共享) ---
# Serverless 环境下的 CORS 配置
origins = [
    "*",  # Serverless 环境允许所有来源
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API 数据模型 ---

class PsychroInputs(BaseModel):
    P: float = Field(..., description="大气压力 (Pa)", example=101325.0)
    T: Optional[float] = Field(None, description="干球温度 (K)", example=298.15)
    B: Optional[float] = Field(None, description="湿球温度 (K)", example=293.15)
    R: Optional[float] = Field(None, description="相对湿度 (0-1)", example=0.6)
    W: Optional[float] = Field(None, description="含湿量 (kg/kg)", example=0.01)
    H: Optional[float] = Field(None, description="焓值 (J/kg)", example=50000.0)
    D: Optional[float] = Field(None, description="露点温度 (K)", example=290.15)

class PointInput(BaseModel):
    name: str = Field(..., description="状态点名称")
    inputs: Dict[str, float] = Field(..., description="输入参数")
    color: Optional[str] = Field("blue", description="点的颜色")
    marker: Optional[str] = Field("o", description="点的标记样式")
    size: Optional[int] = Field(8, description="点的大小")

class ProcessLine(BaseModel):
    from_point: str = Field(..., description="起始点名称")
    to_point: str = Field(..., description="终点名称")
    label: Optional[str] = Field(None, description="过程线标签")
    color: Optional[str] = Field("red", description="线的颜色")
    style: Optional[str] = Field("-", description="线的样式")
    width: Optional[int] = Field(2, description="线的宽度")

class ChartRequest(BaseModel):
    pressure: float = Field(..., description="压力 (Pa)")
    points: Optional[List[PointInput]] = Field([], description="状态点列表")
    process_lines: Optional[List[ProcessLine]] = Field([], description="过程线列表")

class MultiplePointsRequest(BaseModel):
    pressure: float = Field(..., description="压力 (Pa)")
    points: List[PointInput] = Field(..., description="状态点列表")

class MixingRequest(BaseModel):
    pressure: float = Field(..., description="压力 (Pa)")
    point1: Dict[str, float] = Field(..., description="状态点1的参数")
    point2: Dict[str, float] = Field(..., description="状态点2的参数")
    ratio: float = Field(..., description="状态点1的混合比例 (0-1)", ge=0, le=1)

# --- API 端点 ---

@app.get("/health")
def health_check():
    """健康检查接口"""
    return {"status": "healthy", "message": "服务运行正常", "environment": "serverless"}

@app.post("/calculate", summary="计算湿空气参数")
def api_calculate(inputs: PsychroInputs):
    """
    根据输入的任意两个湿空气参数，计算所有其他参数。
    - **注意**: 所有输入值都应为国际单位制 (SI)。
    """
    try:
        props_to_send = inputs.dict(exclude_unset=True)
        if len(props_to_send) != 3: # P + 2 other params
            raise HTTPException(status_code=400, detail=f"输入错误：需要提供压力(P)和另外两个参数。")
        results = calculate_properties(props_to_send)
        if not results.get("success"):
             raise ValueError("Calculation failed in core module.")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"计算时发生内部错误: {e}")

@app.post("/calculate-multiple", summary="计算多个状态点")
def api_calculate_multiple(request: MultiplePointsRequest):
    """
    计算多个状态点的所有参数
    """
    try:
        results = calculate_multiple_points(request.points, request.pressure)
        return {
            "success": True,
            "pressure": request.pressure,
            "points": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"计算时发生内部错误: {e}")

@app.post("/generate-chart", summary="生成焓湿图")
def api_generate_chart(request: ChartRequest):
    """
    生成包含多个状态点和过程线的数据（不再返回图片）。
    """
    try:
        # 转换数据格式
        points_data = []
        if request.points:
            for point in request.points:
                # 计算点的属性
                props = {'P': request.pressure}
                props.update(point.inputs)
                calc_result = calculate_properties(props)
                
                if calc_result['success']:
                    points_data.append({
                        'name': point.name,
                        'tdb': calc_result['tdb'],
                        'w': calc_result['w'],
                        'h': calc_result['h'],
                        'rh': calc_result['rh'],
                        'color': point.color,
                        'marker': point.marker,
                        'size': point.size,
                        'properties': calc_result
                    })

        process_lines_data = []
        if request.process_lines:
            for line in request.process_lines:
                process_lines_data.append({
                    'from': line.from_point,
                    'to': line.to_point,
                    'label': line.label,
                    'color': line.color,
                    'style': line.style,
                    'width': line.width
                })

        return {
            "success": True,
            "points": points_data,
            "process_lines": process_lines_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成数据时发生内部错误: {e}")

@app.post("/mixing", summary="混风处理")
def api_mixing(request: MixingRequest):
    """
    计算两个状态点的混风结果
    - **point1**: 状态点1的参数 (tdb, w)
    - **point2**: 状态点2的参数 (tdb, w)  
    - **ratio**: 状态点1的混合比例 (0-1)
    """
    try:
        # 计算状态点1的属性
        props1 = {'P': request.pressure}
        # 转换参数格式
        if 'tdb' in request.point1:
            props1['T'] = request.point1['tdb'] + 273.15  # 转换为K
        if 'w' in request.point1:
            props1['W'] = request.point1['w'] / 1000      # 转换为kg/kg
        # 如果直接提供了T和W，也支持
        if 'T' in request.point1:
            props1['T'] = request.point1['T']
        if 'W' in request.point1:
            props1['W'] = request.point1['W']
            
        result1 = calculate_properties(props1)
        
        if not result1.get("success"):
            raise HTTPException(status_code=400, detail="状态点1计算失败")
        
        # 计算状态点2的属性
        props2 = {'P': request.pressure}
        # 转换参数格式
        if 'tdb' in request.point2:
            props2['T'] = request.point2['tdb'] + 273.15  # 转换为K
        if 'w' in request.point2:
            props2['W'] = request.point2['w'] / 1000      # 转换为kg/kg
        # 如果直接提供了T和W，也支持
        if 'T' in request.point2:
            props2['T'] = request.point2['T']
        if 'W' in request.point2:
            props2['W'] = request.point2['W']
            
        result2 = calculate_properties(props2)
        
        if not result2.get("success"):
            raise HTTPException(status_code=400, detail="状态点2计算失败")
        
        # 混风计算
        # 干球温度按质量加权平均
        tdb_mix = request.ratio * result1['tdb'] + (1 - request.ratio) * result2['tdb']
        
        # 含湿量按质量加权平均
        w_mix = request.ratio * result1['w'] + (1 - request.ratio) * result2['w']
        
        # 根据混合后的干球温度和含湿量计算其他参数
        mixing_props = {
            'P': request.pressure,
            'T': tdb_mix + 273.15,  # 转换为K
            'W': w_mix / 1000       # 转换为kg/kg
        }
        
        mixing_result = calculate_properties(mixing_props)
        
        if not mixing_result.get("success"):
            raise HTTPException(status_code=500, detail="混风点计算失败")
        
        return {
            "success": True,
            "tdb": mixing_result['tdb'],
            "twb": mixing_result['twb'],
            "rh": mixing_result['rh'],
            "w": mixing_result['w'],
            "h": mixing_result['h'],
            "tdp": mixing_result['tdp'],
            "mixing_ratio": request.ratio,
            "point1": result1,
            "point2": result2
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"混风计算时发生内部错误: {e}")

# --- Serverless 入口函数 ---
def main(event, context):
    """
    腾讯云 SCF 入口函数
    """
    try:
        # 导入 Mangum 用于 ASGI 适配
        from mangum import Mangum
        handler = Mangum(app, lifespan="off")
        return handler(event, context)
    except ImportError:
        # 如果没有 Mangum，尝试使用其他适配器
        raise HTTPException(status_code=500, detail="Serverless 适配器未安装")

# 根路径处理
@app.get("/")
def root():
    return {
        "message": "焓湿图计算 API 服务",
        "version": "2.0.0",
        "environment": "serverless",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "calculate": "/calculate",
            "calculate_multiple": "/calculate-multiple",
            "generate_chart": "/generate-chart",
            "mixing": "/mixing"
        }
    }

# 如果直接运行此文件，可以使用 uvicorn 启动（本地开发）
if __name__ == "__main__":
    # 本地开发模式
    print("🚀 启动焓湿图计算服务...")
    print("🌐 访问地址: http://localhost:7000")
    print("📚 API文档: http://localhost:7000/docs")
    print("💡 按 Ctrl+C 停止服务")
    uvicorn.run("main_app:app", host="0.0.0.0", port=7000, reload=True)

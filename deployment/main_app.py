# backend/main_app.py
import uvicorn
import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional

# 从我们的核心模块中导入计算函数
try:
    from calculator import calculate_properties
except ImportError:
    # 如果calculator模块不存在，创建模拟函数
    def calculate_properties(props_to_send: dict):
        """模拟计算函数，用于调试"""
        return {
            "tdb": "25.00",
            "twb": "20.00", 
            "rh": "60.00",
            "w": "12.500",
            "h": "50.00",
            "tdp": "17.00",
            "success": True
        }

# 初始化 FastAPI 应用
app = FastAPI(
    title="湿空气状态参数计算服务",
    description="一个统一的服务，提供 API 计算并托管前端应用。",
    version="2.0.0",
)

# --- 配置 CORS (跨域资源共享) ---
# 这对于前后端分离的开发模式至关重要
origins = [
    "http://localhost:5173",  # 允许 Vite React 开发服务器的默认端口
    "http://localhost:3000",  # 允许 Create React App 开发服务器的默认端口
    "http://localhost",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API 定义 ---

class PsychroInputs(BaseModel):
    P: float = Field(..., description="大气压力 (Pa)", example=101325.0)
    T: Optional[float] = Field(None, description="干球温度 (K)", example=298.15)
    B: Optional[float] = Field(None, description="湿球温度 (K)", example=293.15)
    R: Optional[float] = Field(None, description="相对湿度 (0-1)", example=0.6)
    W: Optional[float] = Field(None, description="含湿量 (kg/kg)", example=0.01)
    H: Optional[float] = Field(None, description="焓值 (J/kg)", example=50000.0)
    D: Optional[float] = Field(None, description="露点温度 (K)", example=290.15)

@app.get("/health")
def health_check():
    """健康检查接口"""
    return {"status": "healthy", "message": "服务运行正常"}

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

# --- 静态文件处理 ---
# 检查静态文件目录是否存在
static_dirs = [
    "../frontend/dist",  # 生产构建目录
    "../frontend/build", # 备用构建目录
    "./static",          # 本地静态目录
]

static_dir = None
for dir_path in static_dirs:
    if os.path.exists(dir_path):
        static_dir = dir_path
        break

if static_dir:
    try:
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
        print(f"✅ 静态文件目录已挂载: {static_dir}")
    except Exception as e:
        print(f"⚠️ 静态文件挂载失败: {e}")
        # 如果静态文件挂载失败，提供基本的API服务
        @app.get("/")
        def root():
            return {"message": "API服务运行正常", "docs": "/docs"}
else:
    print("⚠️ 未找到静态文件目录，仅提供API服务")
    @app.get("/")
    def root():
        return {"message": "API服务运行正常", "docs": "/docs"}

# 如果直接运行此文件，可以使用 uvicorn 启动
if __name__ == "__main__":
    # 在 7000 端口上运行统一服务
    print("🚀 启动焓湿图计算服务...")
    print("🌐 访问地址: http://localhost:7000")
    print("📚 API文档: http://localhost:7000/docs")
    print("💡 按 Ctrl+C 停止服务")
    uvicorn.run("main_app:app", host="0.0.0.0", port=7000, reload=True)

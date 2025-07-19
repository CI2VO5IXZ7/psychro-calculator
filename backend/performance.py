# performance.py - Serverless 性能优化模块
import os
import time
import functools
from typing import Dict, Any, Optional
import threading

class ServerlessOptimizer:
    """Serverless 环境性能优化器"""
    
    def __init__(self):
        self._cache = {}
        self._cache_lock = threading.Lock()
        self._startup_time = time.time()
        
    def cache_function_result(self, expire_time: int = 300):
        """
        缓存函数结果装饰器
        
        Args:
            expire_time: 缓存过期时间（秒）
        """
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # 创建缓存键
                cache_key = f"{func.__name__}_{hash(str(args))}{hash(str(kwargs))}"
                
                with self._cache_lock:
                    # 检查缓存
                    if cache_key in self._cache:
                        cached_result, cached_time = self._cache[cache_key]
                        if time.time() - cached_time < expire_time:
                            return cached_result
                    
                    # 执行函数并缓存结果
                    result = func(*args, **kwargs)
                    self._cache[cache_key] = (result, time.time())
                    
                    # 清理过期缓存
                    self._cleanup_cache()
                    
                    return result
            return wrapper
        return decorator
    
    def _cleanup_cache(self):
        """清理过期的缓存项"""
        current_time = time.time()
        expired_keys = []
        
        for key, (_, cached_time) in self._cache.items():
            if current_time - cached_time > 300:  # 5分钟过期
                expired_keys.append(key)
        
        for key in expired_keys:
            del self._cache[key]
    
    def warm_up_dependencies(self):
        """预热依赖项以减少冷启动时间"""
        try:
            # 预加载 CoolProp
            import CoolProp.HumidAirProp as HA
            # 执行一个简单计算来预热
            HA.HAPropsSI('T', 'P', 101325, 'T', 298.15, 'R', 0.6)
            
            # 预加载 matplotlib
            import matplotlib.pyplot as plt
            plt.figure()
            plt.close()
            
            print(f"依赖预热完成，耗时: {time.time() - self._startup_time:.2f}s")
            
        except Exception as e:
            print(f"依赖预热警告: {e}")
    
    def optimize_memory_usage(self):
        """优化内存使用"""
        try:
            import gc
            gc.collect()  # 强制垃圾回收
            
            # 设置matplotlib内存优化
            import matplotlib
            matplotlib.rcParams['figure.max_open_warning'] = 0
            
        except Exception as e:
            print(f"内存优化警告: {e}")

# 全局优化器实例
optimizer = ServerlessOptimizer()

# 缓存装饰器快捷方式
cache_result = optimizer.cache_function_result

# 预计算常用数据的缓存
@cache_result(expire_time=3600)  # 1小时缓存
def get_psychrometric_constants(pressure: float) -> Dict[str, Any]:
    """获取焓湿图常用常数（缓存1小时）"""
    try:
        import CoolProp.HumidAirProp as HA
        import numpy as np
        
        # 预计算常用温度范围的数据
        temps = np.linspace(-5, 45, 51)
        
        constants = {
            'pressure': pressure,
            'temp_range': temps.tolist(),
            'saturation_line': [],
            'rh_lines': {},
            'enthalpy_lines': {}
        }
        
        # 预计算饱和线
        for temp in temps:
            try:
                w_sat = HA.HAPropsSI('W', 'T', temp + 273.15, 'P', pressure, 'R', 1.0) * 1000
                constants['saturation_line'].append(w_sat)
            except:
                constants['saturation_line'].append(None)
        
        # 预计算相对湿度线
        for rh in [20, 40, 60, 80]:
            constants['rh_lines'][rh] = []
            for temp in temps:
                try:
                    w = HA.HAPropsSI('W', 'T', temp + 273.15, 'P', pressure, 'R', rh / 100.0) * 1000
                    constants['rh_lines'][rh].append(w)
                except:
                    constants['rh_lines'][rh].append(None)
        
        return constants
        
    except Exception as e:
        print(f"常数预计算错误: {e}")
        return {'pressure': pressure, 'error': str(e)}

# 启动时优化
def initialize_serverless_environment():
    """初始化 Serverless 环境"""
    try:
        # 预热依赖
        optimizer.warm_up_dependencies()
        
        # 优化内存
        optimizer.optimize_memory_usage()
        
        # 预缓存常用数据
        get_psychrometric_constants(101325.0)  # 标准大气压
        
        print("Serverless 环境初始化完成")
        
    except Exception as e:
        print(f"Serverless 环境初始化警告: {e}")

# 如果在 Serverless 环境中，自动初始化
if os.environ.get('SERVERLESS_RUNTIME') or os.environ.get('SCF_RUNTIME'):
    initialize_serverless_environment() 
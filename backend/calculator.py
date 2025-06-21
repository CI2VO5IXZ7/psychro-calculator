# calculator.py
import CoolProp.HumidAirProp as HA
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use a non-interactive backend for server-side rendering
import matplotlib.pyplot as plt
import io
import base64
import json

def create_psych_chart(pressure_pa, points=None, process_lines=None):
    """
    创建一个焓湿图并标记多个点和过程线。
    
    Args:
        pressure_pa: 压力 (Pa)
        points: 状态点列表，每个点包含 {'name': str, 'tdb': float, 'w': float, 'color': str}
        process_lines: 过程线列表，每个线包含 {'from': str, 'to': str, 'label': str, 'color': str}
    
    Returns:
        base64编码的图片字符串
    """
    # 字体配置
    try:
        plt.rcParams['font.sans-serif'] = ['WenQuanYi Zen Hei', 'SimHei', 'DejaVu Sans']
        plt.rcParams['axes.unicode_minus'] = False 
    except Exception as e:
        print(f"Warning: Could not set Chinese font. Error: {e}")

    fig, ax = plt.subplots(figsize=(12, 8))
    temps = np.linspace(-10, 50, 61)
    
    # 绘制饱和线
    hum_ratios_sat = [HA.HAPropsSI('W', 'T', T+273.15, 'P', pressure_pa, 'R', 1.0) * 1000 for T in temps]
    ax.plot(temps, hum_ratios_sat, 'k-', linewidth=2, label='RH = 100%')

    # 绘制相对湿度曲线
    for rh_val in [90, 80, 70, 60, 50, 40, 30, 20, 10]:
        hum_ratios_rh = []
        valid_temps_rh = []
        for T in temps:
            try:
                w = HA.HAPropsSI('W', 'T', T + 273.15, 'P', pressure_pa, 'R', rh_val / 100.0) * 1000
                hum_ratios_rh.append(w)
                valid_temps_rh.append(T)
            except ValueError:
                pass
        ax.plot(valid_temps_rh, hum_ratios_rh, 'b--', linewidth=0.5, alpha=0.7)
        if valid_temps_rh:
            ax.annotate(f'{rh_val}%', xy=(valid_temps_rh[-1], hum_ratios_rh[-1]), 
                       xytext=(3, -3), textcoords='offset points', 
                       fontsize=8, color='blue', alpha=0.7)

    # 绘制等焓线
    for h_val in [20, 30, 40, 50, 60, 70, 80, 90, 100]:
        hum_ratios_h = []
        valid_temps_h = []
        for T in temps:
            try:
                w = HA.HAPropsSI('W', 'T', T + 273.15, 'P', pressure_pa, 'H', h_val * 1000) * 1000
                if 0 <= w <= 30:  # 限制在合理范围内
                    hum_ratios_h.append(w)
                    valid_temps_h.append(T)
            except ValueError:
                pass
        if len(valid_temps_h) > 1:
            ax.plot(valid_temps_h, hum_ratios_h, 'g:', linewidth=0.5, alpha=0.5)
            if valid_temps_h:
                ax.annotate(f'{h_val}kJ/kg', xy=(valid_temps_h[0], hum_ratios_h[0]), 
                           xytext=(-3, 3), textcoords='offset points', 
                           fontsize=8, color='green', alpha=0.7)

    # 绘制状态点
    point_data = {}
    if points:
        for i, point in enumerate(points):
            color = point.get('color', f'C{i}')
            marker = point.get('marker', 'o')
            size = point.get('size', 8)
            
            ax.plot(point['tdb'], point['w'], marker, color=color, 
                   markersize=size, markeredgecolor='black', markeredgewidth=1,
                   label=point['name'])
            
            # 添加点的标注
            ax.annotate(point['name'], 
                       xy=(point['tdb'], point['w']), 
                       xytext=(5, 5), textcoords='offset points',
                       fontsize=10, fontweight='bold',
                       bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8))
            
            point_data[point['name']] = {
                'tdb': point['tdb'],
                'w': point['w'],
                'properties': point.get('properties', {})
            }

    # 绘制过程线
    if process_lines:
        for line in process_lines:
            from_point = line['from']
            to_point = line['to']
            color = line.get('color', 'red')
            style = line.get('style', '-')
            width = line.get('width', 2)
            
            if from_point in point_data and to_point in point_data:
                from_coords = (point_data[from_point]['tdb'], point_data[from_point]['w'])
                to_coords = (point_data[to_point]['tdb'], point_data[to_point]['w'])
                
                ax.plot([from_coords[0], to_coords[0]], 
                       [from_coords[1], to_coords[1]], 
                       color=color, linestyle=style, linewidth=width,
                       label=line.get('label', f'{from_point}→{to_point}'))
                
                # 添加箭头
                mid_x = (from_coords[0] + to_coords[0]) / 2
                mid_y = (from_coords[1] + to_coords[1]) / 2
                dx = to_coords[0] - from_coords[0]
                dy = to_coords[1] - from_coords[1]
                
                ax.annotate('', xy=(to_coords[0], to_coords[1]), 
                           xytext=(mid_x, mid_y),
                           arrowprops=dict(arrowstyle='->', color=color, lw=width))

    # 设置图表样式
    ax.set_xlabel('干球温度 (°C)', fontsize=12)
    ax.set_ylabel('含湿量 (g/kg)', fontsize=12)
    ax.set_title(f'焓湿图 (压力: {pressure_pa/1000:.1f} kPa)', fontsize=14, fontweight='bold')
    ax.grid(True, linestyle=':', linewidth=0.5, alpha=0.7)
    ax.set_xlim(-10, 50)
    ax.set_ylim(0, 30)
    
    # 添加图例
    if points or process_lines:
        ax.legend(loc='upper left', bbox_to_anchor=(1, 1), fontsize=10)
    
    plt.tight_layout()
    
    # 转换为base64字符串
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode()
    plt.close()
    
    return image_base64

def calculate_properties(props_to_send: dict):
    """
    根据输入的字典，使用 CoolProp 计算所有湿空气属性。
    返回一个包含所有计算结果的字典。
    """
    try:
        # CoolProp 需要位置参数，我们在这里构建它们
        args = []
        for key, value in props_to_send.items():
            args.extend([key, value])

        # 调用 CoolProp 计算所有属性
        final_tdb = HA.HAPropsSI('T', *args) - 273.15
        final_twb = HA.HAPropsSI('B', *args) - 273.15
        final_rh = HA.HAPropsSI('R', *args) * 100
        final_w = HA.HAPropsSI('W', *args) * 1000
        final_h = HA.HAPropsSI('H', *args) / 1000
        final_tdp = HA.HAPropsSI('D', *args) - 273.15
        
        # 将结果打包成字典返回
        results = {
            "tdb": round(final_tdb, 2),
            "twb": round(final_twb, 2),
            "rh": round(final_rh, 2),
            "w": round(final_w, 3),
            "h": round(final_h, 2),
            "tdp": round(final_tdp, 2),
            "success": True
        }
        return results
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def calculate_multiple_points(points_data: list, pressure_pa: float):
    """
    计算多个状态点的属性
    
    Args:
        points_data: 包含多个点输入数据的列表
        pressure_pa: 压力 (Pa)
    
    Returns:
        包含所有点计算结果的列表
    """
    results = []
    for point in points_data:
        # 添加压力参数
        props = {'P': pressure_pa}
        props.update(point['inputs'])
        
        # 计算属性
        calc_result = calculate_properties(props)
        if calc_result['success']:
            # 添加点的基本信息
            calc_result['name'] = point['name']
            calc_result['color'] = point.get('color', 'blue')
            calc_result['marker'] = point.get('marker', 'o')
            calc_result['size'] = point.get('size', 8)
            
            # 添加图表坐标
            calc_result['tdb'] = calc_result['tdb']
            calc_result['w'] = calc_result['w']
            
            results.append(calc_result)
        else:
            results.append({
                'name': point['name'],
                'success': False,
                'error': calc_result.get('error', '计算失败')
            })
    
    return results
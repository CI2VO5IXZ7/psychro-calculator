# calculator.py
import CoolProp.HumidAirProp as HA
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use a non-interactive backend for server-side rendering
import matplotlib.pyplot as plt

def create_psych_chart(pressure_pa, point_tdb=None, point_w=None):
    """
    创建一个焓湿图并可选地标记一个点。
    返回一个 matplotlib Figure 对象。
    """
    # --- 新增字体配置 ---
    # 尝试设置一个支持中文的字体。
    # 这解决了在服务器上生成图片时中文显示为方框或报错的问题。
    try:
        # 在 Debian/Ubuntu 上, 运行: sudo apt-get install -y fonts-wqy-zenhei
        # 在 CentOS/RHEL 上, 运行: sudo yum install -y wqy-zenhei-fonts
        plt.rcParams['font.sans-serif'] = ['WenQuanYi Zen Hei']
        # 解决负号显示问题
        plt.rcParams['axes.unicode_minus'] = False 
    except Exception as e:
        # 如果字体设置失败，打印一个警告，但继续尝试生成图表
        print(f"Warning: Could not set Chinese font. Please install 'fonts-wqy-zenhei'. Error: {e}")
    # --- 字体配置结束 ---

    fig, ax = plt.subplots(figsize=(8, 6))
    temps = np.linspace(-10, 50, 61)
    
    # 绘制饱和线
    hum_ratios_sat = [HA.HAPropsSI('W', 'T', T+273.15, 'P', pressure_pa, 'R', 1.0) * 1000 for T in temps]
    ax.plot(temps, hum_ratios_sat, 'k-', label='RH = 100%')

    # 绘制相对湿度曲线
    for rh_val in [80, 60, 40, 20]:
        hum_ratios_rh = []
        valid_temps_rh = []
        for T in temps:
            try:
                w = HA.HAPropsSI('W', 'T', T + 273.15, 'P', pressure_pa, 'R', rh_val / 100.0) * 1000
                hum_ratios_rh.append(w)
                valid_temps_rh.append(T)
            except ValueError:
                pass
        ax.plot(valid_temps_rh, hum_ratios_rh, 'b--', linewidth=0.5)
        if valid_temps_rh:
            ax.annotate(f'{rh_val}%', xy=(valid_temps_rh[-1], hum_ratios_rh[-1]), xytext=(3, -3), textcoords='offset points', fontsize='small', color='blue')

    # 标记计算点
    if point_tdb is not None and point_w is not None:
        ax.plot(point_tdb, point_w, 'ro', markersize=8, label='计算点')
        ax.annotate(f'({point_tdb:.1f}°C, {point_w:.1f}g/kg)', (point_tdb, point_w), textcoords="offset points", xytext=(0,10), ha='center')

    # 设置图表样式
    ax.set_xlabel('干球温度 (°C)')
    ax.set_ylabel('含湿量 (g/kg)')
    ax.set_title('焓湿图')
    ax.grid(True, linestyle=':', linewidth=0.5)
    ax.set_xlim(-10, 50)
    ax.set_ylim(0, 30)
    ax.legend()
    plt.tight_layout()
    
    return fig

def calculate_properties(props_to_send: dict):
    """
    根据输入的字典，使用 CoolProp 计算所有湿空气属性。
    返回一个包含所有计算结果的字典。
    """
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
        "tdb": f"{final_tdb:.2f}",
        "twb": f"{final_twb:.2f}",
        "rh": f"{final_rh:.2f}",
        "w": f"{final_w:.3f}",
        "h": f"{final_h:.2f}",
        "tdp": f"{final_tdp:.2f}",
        "success": True
    }
    return results
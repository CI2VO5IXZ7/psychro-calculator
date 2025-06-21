# 网页调试指南

## 快速启动
```bash
./start.sh
```

## 访问地址
- 主页面: http://localhost:7000
- API文档: http://localhost:7000/docs
- 健康检查: http://localhost:7000/health

## 调试功能

### 前端调试
1. 打开浏览器开发者工具 (F12)
2. 查看Console标签页的错误信息
3. 查看Network标签页的API请求
4. 查看Elements标签页的DOM结构

### 后端调试
1. 查看终端输出的日志信息
2. 访问API文档页面进行接口测试
3. 使用curl命令测试API:
```bash
curl -X POST http://localhost:7000/calculate \
  -H "Content-Type: application/json" \
  -d '{"P": 101325.0, "T": 298.15, "R": 0.6}'
```

### 常见问题

#### 页面无法访问
- 检查端口7000是否被占用
- 确认服务是否正常启动
- 查看终端错误信息

#### API请求失败
- 检查请求参数格式
- 确认Content-Type为application/json
- 查看后端日志输出

#### 样式显示异常
- 清除浏览器缓存
- 检查CSS文件是否正确加载
- 确认字体文件是否可用

## 开发模式

如果需要修改代码：
1. 修改frontend/src/下的文件
2. 运行 `npm run build` 重新构建
3. 重启后端服务

## 测试数据

如果CoolProp安装失败，系统会使用模拟数据：
- 干球温度: 25°C
- 湿球温度: 20°C
- 相对湿度: 60%
- 含湿量: 12 g/kg
- 焓值: 50 kJ/kg
- 露点温度: 17°C

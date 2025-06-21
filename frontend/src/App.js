import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Space, 
  Divider, 
  Typography, 
  Row, 
  Col, 
  Table, 
  Modal, 
  message, 
  Tag,
  InputNumber,
  Tooltip,
  Popconfirm,
  Descriptions,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  EyeOutlined,
  LineChartOutlined,
  CalculatorOutlined,
  ReloadOutlined,
  MergeCellsOutlined
} from '@ant-design/icons';
import axios from 'axios';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;
const { Option } = Select;

function App() {
  // 状态管理
  const [form] = Form.useForm();
  const [points, setPoints] = useState([]);
  const [processLines, setProcessLines] = useState([]);
  const [chartImage, setChartImage] = useState('');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [pointModalVisible, setPointModalVisible] = useState(false);
  const [lineModalVisible, setLineModalVisible] = useState(false);
  const [mixingModalVisible, setMixingModalVisible] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [pressure, setPressure] = useState(101325);
  const [loading, setLoading] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [showChart, setShowChart] = useState(false);

  // 参数选项
  const parameterOptions = [
    { label: '干球温度 (°C)', value: 'T', unit: '°C', convert: (v) => v + 273.15 },
    { label: '湿球温度 (°C)', value: 'B', unit: '°C', convert: (v) => v + 273.15 },
    { label: '相对湿度 (%)', value: 'R', unit: '%', convert: (v) => v / 100 },
    { label: '含湿量 (g/kg)', value: 'W', unit: 'g/kg', convert: (v) => v / 1000 },
    { label: '焓值 (kJ/kg)', value: 'H', unit: 'kJ/kg', convert: (v) => v * 1000 },
    { label: '露点温度 (°C)', value: 'D', unit: '°C', convert: (v) => v + 273.15 }
  ];

  // 颜色选项
  const colorOptions = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
    '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'
  ];

  // 计算单个点
  const calculatePoint = async (values) => {
    try {
      setLoading(true);
      
      const inputs = { P: pressure };
      let paramCount = 0;
      
      parameterOptions.forEach(option => {
        if (values[option.value] !== undefined && values[option.value] !== null) {
          inputs[option.value] = option.convert(values[option.value]);
          paramCount++;
        }
      });

      if (paramCount !== 2) {
        message.error('请选择两个参数进行计算');
        return null;
      }

      const response = await axios.post('/calculate', inputs);
      
      if (response.data.success) {
        message.success('计算成功');
        return response.data;
      } else {
        message.error('计算失败');
        return null;
      }
    } catch (error) {
      message.error(`计算错误: ${error.response?.data?.detail || error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 执行计算
  const handleCalculate = async () => {
    const values = form.getFieldsValue();
    const result = await calculatePoint(values);
    if (result) {
      setCalculationResult(result);
    }
  };

  // 重置输入
  const handleReset = () => {
    form.resetFields();
    setCalculationResult(null);
  };

  // 添加当前状态点到图表
  const addCurrentPointToChart = () => {
    if (!calculationResult) {
      message.warning('请先进行计算');
      return;
    }

    const values = form.getFieldsValue();
    const pointName = values.pointName || `点${points.length + 1}`;
    
    const newPoint = {
      id: Date.now(),
      name: pointName,
      color: colorOptions[points.length % colorOptions.length],
      marker: 'o',
      size: 8,
      properties: calculationResult,
      tdb: calculationResult.tdb,
      w: calculationResult.w
    };
    
    setPoints([...points, newPoint]);
    message.success(`状态点 "${pointName}" 已添加到图表`);
  };

  // 添加状态点
  const addPoint = async (values) => {
    const result = await calculatePoint(values);
    if (result) {
      const newPoint = {
        id: Date.now(),
        name: values.name || `点${points.length + 1}`,
        color: values.color || colorOptions[points.length % colorOptions.length],
        marker: values.marker || 'o',
        size: values.size || 8,
        properties: result,
        tdb: result.tdb,
        w: result.w
      };
      
      setPoints([...points, newPoint]);
      setPointModalVisible(false);
      form.resetFields();
      message.success(`状态点 "${newPoint.name}" 添加成功`);
    }
  };

  // 删除状态点
  const deletePoint = (pointId) => {
    const pointName = points.find(p => p.id === pointId)?.name;
    setPoints(points.filter(p => p.id !== pointId));
    setProcessLines(processLines.filter(line => 
      line.fromPointId !== pointId && line.toPointId !== pointId
    ));
    message.success(`状态点 "${pointName}" 已删除`);
  };

  // 添加过程线
  const addProcessLine = (values) => {
    const fromPoint = points.find(p => p.id === values.fromPointId);
    const toPoint = points.find(p => p.id === values.toPointId);
    
    if (!fromPoint || !toPoint) {
      message.error('请选择有效的起始点和终点');
      return;
    }

    const newLine = {
      id: Date.now(),
      fromPointId: values.fromPointId,
      toPointId: values.toPointId,
      fromPointName: fromPoint.name,
      toPointName: toPoint.name,
      label: values.label || `${fromPoint.name}→${toPoint.name}`,
      color: values.color || '#f5222d',
      style: values.style || '-',
      width: values.width || 2
    };

    setProcessLines([...processLines, newLine]);
    setLineModalVisible(false);
    message.success(`过程线 "${newLine.label}" 添加成功`);
  };

  // 删除过程线
  const deleteProcessLine = (lineId) => {
    const lineName = processLines.find(l => l.id === lineId)?.label;
    setProcessLines(processLines.filter(l => l.id !== lineId));
    message.success(`过程线 "${lineName}" 已删除`);
  };

  // 混风处理
  const handleMixing = async (values) => {
    try {
      setLoading(true);
      
      const fromPoint = points.find(p => p.id === values.fromPointId);
      const toPoint = points.find(p => p.id === values.toPointId);
      
      if (!fromPoint || !toPoint) {
        message.error('请选择有效的两个状态点');
        return;
      }

      const requestData = {
        pressure: pressure,
        point1: {
          tdb: fromPoint.properties.tdb + 273.15,
          w: fromPoint.properties.w / 1000
        },
        point2: {
          tdb: toPoint.properties.tdb + 273.15,
          w: toPoint.properties.w / 1000
        },
        ratio: values.ratio / 100
      };

      const response = await axios.post('/mixing', requestData);
      
      if (response.data.success) {
        const result = response.data;
        const newPoint = {
          id: Date.now(),
          name: values.name || `混风点${points.length + 1}`,
          color: values.color || '#13c2c2',
          marker: 'o',
          size: 8,
          properties: result,
          tdb: result.tdb,
          w: result.w
        };
        
        setPoints([...points, newPoint]);
        setMixingModalVisible(false);
        message.success(`混风点 "${newPoint.name}" 计算成功`);
      } else {
        message.error('混风计算失败');
      }
    } catch (error) {
      message.error(`混风计算错误: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 生成图表
  const generateChart = async () => {
    if (points.length === 0) {
      message.warning('请至少添加一个状态点');
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        pressure: pressure,
        points: points.map(point => ({
          name: point.name,
          inputs: {
            T: point.properties.tdb + 273.15,
            W: point.properties.w / 1000
          },
          color: point.color,
          marker: point.marker,
          size: point.size
        })),
        process_lines: processLines.map(line => ({
          from_point: line.fromPointName,
          to_point: line.toPointName,
          label: line.label,
          color: line.color,
          style: line.style,
          width: line.width
        }))
      };

      const response = await axios.post('/generate-chart', requestData);
      
      if (response.data.success) {
        setChartImage(response.data.image);
        setShowChart(true);
        message.success('图表生成成功');
      } else {
        message.error('图表生成失败');
      }
    } catch (error) {
      message.error(`生成图表错误: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 点表格列定义
  const pointColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Tag color={record.color}>{text}</Tag>
      )
    },
    {
      title: '干球温度',
      dataIndex: ['properties', 'tdb'],
      key: 'tdb',
      render: (value) => `${value}°C`
    },
    {
      title: '湿球温度',
      dataIndex: ['properties', 'twb'],
      key: 'twb',
      render: (value) => `${value}°C`
    },
    {
      title: '相对湿度',
      dataIndex: ['properties', 'rh'],
      key: 'rh',
      render: (value) => `${value}%`
    },
    {
      title: '含湿量',
      dataIndex: ['properties', 'w'],
      key: 'w',
      render: (value) => `${value} g/kg`
    },
    {
      title: '焓值',
      dataIndex: ['properties', 'h'],
      key: 'h',
      render: (value) => `${value} kJ/kg`
    },
    {
      title: '露点温度',
      dataIndex: ['properties', 'tdp'],
      key: 'tdp',
      render: (value) => `${value}°C`
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => setSelectedPoint(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个状态点吗？"
            onConfirm={() => deletePoint(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 过程线表格列定义
  const lineColumns = [
    {
      title: '标签',
      dataIndex: 'label',
      key: 'label',
      render: (text, record) => (
        <Tag color={record.color}>{text}</Tag>
      )
    },
    {
      title: '起始点',
      dataIndex: 'fromPointName',
      key: 'fromPointName'
    },
    {
      title: '终点',
      dataIndex: 'toPointName',
      key: 'toPointName'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => setSelectedLine(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个过程线吗？"
            onConfirm={() => deleteProcessLine(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px' }}>
        <Title level={3} style={{ margin: '16px 0', color: '#1890ff' }}>
          <CalculatorOutlined /> 焓湿图计算工具
        </Title>
      </Header>
      
      <Layout>
        <Sider width={500} style={{ background: '#fff', padding: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            
            {/* 压力设置 */}
            <Card title="压力设置" size="small">
              <Form layout="vertical">
                <Form.Item label="大气压力">
                  <InputNumber
                    value={pressure}
                    onChange={setPressure}
                    min={80000}
                    max={120000}
                    step={100}
                    addonAfter="Pa"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Form>
            </Card>

            {/* 参数计算 */}
            <Card title="参数计算" size="small">
              <Form form={form} layout="vertical">
                <Row gutter={16}>
                  {parameterOptions.map(option => (
                    <Col span={12} key={option.value}>
                      <Form.Item
                        name={option.value}
                        label={option.label}
                      >
                        <InputNumber
                          placeholder={`输入${option.label}`}
                          addonAfter={option.unit}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
                
                <Space>
                  <Button 
                    type="primary" 
                    icon={<CalculatorOutlined />}
                    onClick={handleCalculate}
                    loading={loading}
                  >
                    计算
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                  >
                    重置输入
                  </Button>
                </Space>
              </Form>
            </Card>

            {/* 计算结果 */}
            {calculationResult && (
              <Card title="计算结果" size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="干球温度">
                    {calculationResult.tdb}°C
                  </Descriptions.Item>
                  <Descriptions.Item label="湿球温度">
                    {calculationResult.twb}°C
                  </Descriptions.Item>
                  <Descriptions.Item label="相对湿度">
                    {calculationResult.rh}%
                  </Descriptions.Item>
                  <Descriptions.Item label="含湿量">
                    {calculationResult.w} g/kg
                  </Descriptions.Item>
                  <Descriptions.Item label="焓值">
                    {calculationResult.h} kJ/kg
                  </Descriptions.Item>
                  <Descriptions.Item label="露点温度">
                    {calculationResult.tdp}°C
                  </Descriptions.Item>
                </Descriptions>
                
                <Divider />
                
                <Form.Item label="状态点名称">
                  <Input 
                    placeholder="输入状态点名称"
                    onChange={(e) => form.setFieldsValue({ pointName: e.target.value })}
                  />
                </Form.Item>
                
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={addCurrentPointToChart}
                  block
                >
                  添加当前状态点
                </Button>
              </Card>
            )}

            {/* 状态点管理 */}
            <Card 
              title="状态点管理" 
              size="small"
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingPoint(null);
                    form.resetFields();
                    setPointModalVisible(true);
                  }}
                >
                  添加点
                </Button>
              }
            >
              <Table
                dataSource={points}
                columns={pointColumns}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
            </Card>

            {/* 过程线管理 */}
            <Card 
              title="过程线管理" 
              size="small"
              extra={
                <Space>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setLineModalVisible(true)}
                    disabled={points.length < 2}
                  >
                    添加过程线
                  </Button>
                  <Button 
                    type="default" 
                    icon={<MergeCellsOutlined />}
                    onClick={() => setMixingModalVisible(true)}
                    disabled={points.length < 2}
                  >
                    混风处理
                  </Button>
                </Space>
              }
            >
              <Table
                dataSource={processLines}
                columns={lineColumns}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
            </Card>

            {/* 图表操作 */}
            <Card title="图表操作" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  icon={<LineChartOutlined />}
                  onClick={generateChart}
                  loading={loading}
                  block
                >
                  生成焓湿图
                </Button>
                
                {showChart && (
                  <Button 
                    onClick={() => setShowChart(false)}
                    block
                  >
                    隐藏图表
                  </Button>
                )}
              </Space>
            </Card>
          </Space>
        </Sider>

        <Content style={{ padding: '16px' }}>
          {showChart ? (
            <Card title="焓湿图" style={{ height: '100%' }}>
              {chartImage ? (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={chartImage} 
                    alt="焓湿图" 
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '100px 0',
                  color: '#999'
                }}>
                  <LineChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <p>点击"生成焓湿图"按钮来显示图表</p>
                </div>
              )}
            </Card>
          ) : (
            <Card title="使用说明" style={{ height: '100%' }}>
              <Alert
                message="欢迎使用焓湿图计算工具"
                description={
                  <div>
                    <p>1. 在左侧输入任意两个参数，点击"计算"查看结果</p>
                    <p>2. 输入状态点名称，点击"添加当前状态点"将点添加到图表</p>
                    <p>3. 添加多个状态点后，可以生成过程线或进行混风处理</p>
                    <p>4. 点击"生成焓湿图"查看可视化结果</p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              
              <div style={{ 
                textAlign: 'center', 
                padding: '50px 0',
                color: '#999'
              }}>
                <LineChartOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
                <p>点击"生成焓湿图"按钮来显示图表</p>
              </div>
            </Card>
          )}
        </Content>
      </Layout>

      {/* 添加状态点模态框 */}
      <Modal
        title="添加状态点"
        open={pointModalVisible}
        onCancel={() => {
          setPointModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width="90vw"
        maxWidth={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={addPoint}
        >
          <Form.Item
            name="name"
            label="点名称"
            rules={[{ required: true, message: '请输入点名称' }]}
          >
            <Input placeholder="例如: 点A" />
          </Form.Item>

          <Form.Item name="color" label="颜色">
            <Select placeholder="选择颜色">
              {colorOptions.map(color => (
                <Option key={color} value={color}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        backgroundColor: color, 
                        marginRight: '8px',
                        borderRadius: '2px'
                      }} 
                    />
                    {color}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>输入参数 (选择两个)</Divider>

          <Row gutter={16}>
            {parameterOptions.map(option => (
              <Col span={12} key={option.value}>
                <Form.Item
                  name={option.value}
                  label={option.label}
                >
                  <InputNumber
                    placeholder={`输入${option.label}`}
                    addonAfter={option.unit}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                添加
              </Button>
              <Button onClick={() => {
                setPointModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加过程线模态框 */}
      <Modal
        title="添加过程线"
        open={lineModalVisible}
        onCancel={() => setLineModalVisible(false)}
        footer={null}
        width="90vw"
        maxWidth={500}
      >
        <Form
          layout="vertical"
          onFinish={addProcessLine}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fromPointId"
                label="起始点"
                rules={[{ required: true, message: '请选择起始点' }]}
              >
                <Select placeholder="选择起始点">
                  {points.map(point => (
                    <Option key={point.id} value={point.id}>
                      <Tag color={point.color}>{point.name}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="toPointId"
                label="终点"
                rules={[{ required: true, message: '请选择终点' }]}
              >
                <Select placeholder="选择终点">
                  {points.map(point => (
                    <Option key={point.id} value={point.id}>
                      <Tag color={point.color}>{point.name}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="label" label="标签">
                <Input placeholder="过程线标签" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="color" label="颜色">
                <Select placeholder="选择颜色">
                  {colorOptions.map(color => (
                    <Option key={color} value={color}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div 
                          style={{ 
                            width: '16px', 
                            height: '16px', 
                            backgroundColor: color, 
                            marginRight: '8px',
                            borderRadius: '2px'
                          }} 
                        />
                        {color}
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="style" label="线型">
                <Select placeholder="选择线型">
                  <Option value="-">实线</Option>
                  <Option value="--">虚线</Option>
                  <Option value=":">点线</Option>
                  <Option value="-.">点划线</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="width" label="线宽">
                <InputNumber min={1} max={5} placeholder="2" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
              <Button onClick={() => setLineModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 混风处理模态框 */}
      <Modal
        title="混风处理"
        open={mixingModalVisible}
        onCancel={() => setMixingModalVisible(false)}
        footer={null}
        width="90vw"
        maxWidth={500}
      >
        <Form
          layout="vertical"
          onFinish={handleMixing}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fromPointId"
                label="状态点1"
                rules={[{ required: true, message: '请选择状态点1' }]}
              >
                <Select placeholder="选择状态点1">
                  {points.map(point => (
                    <Option key={point.id} value={point.id}>
                      <Tag color={point.color}>{point.name}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="toPointId"
                label="状态点2"
                rules={[{ required: true, message: '请选择状态点2' }]}
              >
                <Select placeholder="选择状态点2">
                  {points.map(point => (
                    <Option key={point.id} value={point.id}>
                      <Tag color={point.color}>{point.name}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ratio"
                label="状态点1占比"
                rules={[{ required: true, message: '请输入占比' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  placeholder="50"
                  addonAfter="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="混风点名称">
                <Input placeholder="混风点名称" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="color" label="颜色">
            <Select placeholder="选择颜色">
              {colorOptions.map(color => (
                <Option key={color} value={color}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        backgroundColor: color, 
                        marginRight: '8px',
                        borderRadius: '2px'
                      }} 
                    />
                    {color}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                计算混风
              </Button>
              <Button onClick={() => setMixingModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 状态点详情模态框 */}
      <Modal
        title="状态点详情"
        open={!!selectedPoint}
        onCancel={() => setSelectedPoint(null)}
        footer={null}
      >
        {selectedPoint && (
          <div>
            <p><strong>名称:</strong> {selectedPoint.name}</p>
            <p><strong>干球温度:</strong> {selectedPoint.properties.tdb}°C</p>
            <p><strong>湿球温度:</strong> {selectedPoint.properties.twb}°C</p>
            <p><strong>相对湿度:</strong> {selectedPoint.properties.rh}%</p>
            <p><strong>含湿量:</strong> {selectedPoint.properties.w} g/kg</p>
            <p><strong>焓值:</strong> {selectedPoint.properties.h} kJ/kg</p>
            <p><strong>露点温度:</strong> {selectedPoint.properties.tdp}°C</p>
          </div>
        )}
      </Modal>

      {/* 过程线详情模态框 */}
      <Modal
        title="过程线详情"
        open={!!selectedLine}
        onCancel={() => setSelectedLine(null)}
        footer={null}
      >
        {selectedLine && (
          <div>
            <p><strong>标签:</strong> {selectedLine.label}</p>
            <p><strong>起始点:</strong> {selectedLine.fromPointName}</p>
            <p><strong>终点:</strong> {selectedLine.toPointName}</p>
            <p><strong>颜色:</strong> 
              <span style={{ 
                display: 'inline-block', 
                width: '20px', 
                height: '20px', 
                backgroundColor: selectedLine.color,
                marginLeft: '8px',
                borderRadius: '2px'
              }} />
            </p>
            <p><strong>线型:</strong> {selectedLine.style}</p>
            <p><strong>线宽:</strong> {selectedLine.width}</p>
          </div>
        )}
      </Modal>
    </Layout>
  );
}

export default App; 
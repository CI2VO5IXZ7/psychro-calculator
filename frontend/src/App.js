import React, { useState, Suspense } from 'react';
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Table, 
  Modal, 
  message, 
  Tag,
  InputNumber,
  Popconfirm,
  Divider,
  Alert,
  Skeleton
} from 'antd';
import { 
  PlusOutlined, 
  CalculatorOutlined,
  LineChartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { usePointsStore } from './store/points';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

// 懒加载PsychroChart组件
const PsychroChart = React.lazy(() => import('./components/PsychroChart'));

function App() {
  // Zustand状态管理
  const { 
    pressure, 
    points, 
    processLines, 
    setPressure, 
    setPoints, 
    setProcessLines, 
    addPoint, 
    addProcessLine: addProcessLineToStore 
  } = usePointsStore();

  // 局部状态管理
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [mixingModalVisible, setMixingModalVisible] = useState(false);
  const [chartData, setChartData] = useState({ points: [], processLines: [] });

  // 参数选项
  const parameterOptions = [
    { label: '干球温度', value: 'T', unit: '°C', convert: (v) => v + 273.15 },
    { label: '湿球温度', value: 'B', unit: '°C', convert: (v) => v + 273.15 },
    { label: '相对湿度', value: 'R', unit: '%', convert: (v) => v / 100 },
    { label: '含湿量', value: 'W', unit: 'g/kg', convert: (v) => v / 1000 },
    { label: '焓值', value: 'H', unit: 'kJ/kg', convert: (v) => v * 1000 },
    { label: '露点温度', value: 'D', unit: '°C', convert: (v) => v + 273.15 }
  ];

  // 颜色选项
  const colorOptions = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

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
    const pointName = values.pointName && values.pointName.trim() !== '' 
      ? values.pointName.trim() 
      : `点${points.length + 1}`;
    
    const newPoint = {
      id: Date.now(),
      name: pointName,
      color: colorOptions[points.length % colorOptions.length],
      properties: calculationResult
    };
    
    addPoint(newPoint);
    message.success(`状态点 "${pointName}" 已添加`);
    
    form.setFieldsValue({ pointName: '' });
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
      color: values.color || '#f5222d'
    };

    addProcessLineToStore(newLine);
    message.success(`过程线 "${newLine.label}" 已添加`);
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
          tdb: fromPoint.properties.tdb,
          w: fromPoint.properties.w
        },
        point2: {
          tdb: toPoint.properties.tdb,
          w: toPoint.properties.w
        },
        ratio: values.ratio / 100
      };

      const response = await axios.post('/mixing', requestData);
      
      if (response.data.success) {
        const result = response.data;
        const newPoint = {
          id: Date.now(),
          name: values.name && values.name.trim() !== '' 
            ? values.name.trim() 
            : `混风点${points.length + 1}`,
          color: '#13c2c2',
          properties: result
        };
        
        addPoint(newPoint);
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
          marker: 'o',
          size: 8
        })),
        process_lines: processLines.map(line => ({
          from_point: line.fromPointName,
          to_point: line.toPointName,
          label: line.label,
          color: line.color,
          style: '-',
          width: 2
        }))
      };

      const response = await axios.post('/generate-chart', requestData);
      
      if (response.data.success) {
        setShowChart(true);
        message.success('图表生成成功');
        setChartData({ points: response.data.points, processLines: response.data.process_lines });
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
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="确定要删除这个状态点吗？"
          onConfirm={() => deletePoint(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="text" danger size="small">删除</Button>
        </Popconfirm>
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
        <Popconfirm
          title="确定要删除这个过程线吗？"
          onConfirm={() => deleteProcessLine(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="text" danger size="small">删除</Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={3} style={{ margin: '16px 0', color: '#1890ff' }}>
          <CalculatorOutlined /> 焓湿图计算工具
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Row gutter={[24, 24]}>
          {/* 左侧控制面板 */}
          <Col xs={24} lg={12}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              {/* 压力设置 */}
              <Card title="压力设置" size="small">
                <InputNumber
                  value={pressure}
                  onChange={setPressure}
                  min={80000}
                  max={120000}
                  step={100}
                  addonAfter="Pa"
                  style={{ width: '100%' }}
                />
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
                            placeholder={option.label}
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
                      重置
                    </Button>
                  </Space>
                </Form>
              </Card>

              {/* 计算结果 */}
              {calculationResult && (
                <Card title="计算结果" size="small">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div><strong>干球温度:</strong> {calculationResult.tdb}°C</div>
                      <div><strong>湿球温度:</strong> {calculationResult.twb}°C</div>
                    </Col>
                    <Col span={8}>
                      <div><strong>相对湿度:</strong> {calculationResult.rh}%</div>
                      <div><strong>含湿量:</strong> {calculationResult.w} g/kg</div>
                    </Col>
                    <Col span={8}>
                      <div><strong>焓值:</strong> {calculationResult.h} kJ/kg</div>
                      <div><strong>露点温度:</strong> {calculationResult.tdp}°C</div>
                    </Col>
                  </Row>
                  
                  <Divider />
                  
                  <Form form={form}>
                    <Row gutter={16}>
                      <Col span={16}>
                        <Form.Item 
                          name="pointName" 
                          label="状态点名称"
                          style={{ marginBottom: 0 }}
                        >
                          <Input 
                            placeholder="输入状态点名称"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={addCurrentPointToChart}
                          block
                          style={{ marginTop: 29 }}
                        >
                          添加点
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card>
              )}

              {/* 操作按钮 */}
              <Card size="small">
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
          </Col>

          {/* 右侧数据面板 */}
          <Col xs={24} lg={12}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              {/* 状态点管理 */}
              <Card 
                title="状态点管理" 
                size="small"
                extra={
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setMixingModalVisible(true)}
                    disabled={points.length < 2}
                  >
                    混风处理
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
              <Card title="过程线管理" size="small">
                <Table
                  dataSource={processLines}
                  columns={lineColumns}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            </Space>
          </Col>
        </Row>

        {/* 图表显示区域 */}
        {showChart && (
          <Row style={{ marginTop: '24px' }}>
            <Col span={24}>
              <Card title="焓湿图" size="small">
                <Suspense fallback={<Skeleton active />}>
                  <div style={{ textAlign: 'center' }}>
                    <PsychroChart 
                      points={chartData.points} 
                      processLines={chartData.processLines} 
                    />
                  </div>
                </Suspense>
              </Card>
            </Col>
          </Row>
        )}

        {/* 使用说明 */}
        {!showChart && (
          <Row style={{ marginTop: '24px' }}>
            <Col span={24}>
              <Alert
                message="使用说明"
                description={
                  <div>
                    <p>1. 输入任意两个参数，点击"计算"查看结果</p>
                    <p>2. 输入状态点名称，点击"添加点"将点添加到图表</p>
                    <p>3. 添加多个状态点后，可以进行混风处理</p>
                    <p>4. 点击"生成焓湿图"查看可视化结果</p>
                  </div>
                }
                type="info"
                showIcon
              />
            </Col>
          </Row>
        )}
      </Content>

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
    </Layout>
  );
}

export default App; 
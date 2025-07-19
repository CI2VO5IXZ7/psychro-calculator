// API 配置文件 - 支持多环境部署
const apiConfig = {
  development: {
    baseURL: 'http://localhost:7000',
    timeout: 30000,
  },
  production: {
    // 生产环境 - 腾讯云 API 网关地址
    // 部署后需要替换为实际的 API 网关地址
    baseURL: process.env.REACT_APP_API_BASE_URL || 'https://your-api-gateway-id.apigw.tencentcloudapi.com/release',
    timeout: 30000,
  }
};

// 获取当前环境
const getCurrentEnv = () => {
  // 优先使用环境变量
  if (process.env.REACT_APP_ENV) {
    return process.env.REACT_APP_ENV;
  }
  
  // 其次判断NODE_ENV
  if (process.env.NODE_ENV === 'development') {
    return 'development';
  }
  
  // 默认为生产环境
  return 'production';
};

// 获取当前环境的API配置
export const getApiConfig = () => {
  const env = getCurrentEnv();
  return apiConfig[env] || apiConfig.production;
};

// API 端点配置
export const apiEndpoints = {
  health: '/health',
  calculate: '/calculate',
  calculateMultiple: '/calculate-multiple',
  generateChart: '/generate-chart',
  mixing: '/mixing'
};

// 导出配置
export default {
  ...getApiConfig(),
  endpoints: apiEndpoints,
  environment: getCurrentEnv()
}; 
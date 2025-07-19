// 腾讯云 Serverless 部署配置示例
// 复制此文件为 config.js 并填入实际值

module.exports = {
  // 腾讯云账号配置
  tencent: {
    secretId: 'your_secret_id_here',
    secretKey: 'your_secret_key_here',
    region: 'ap-guangzhou'
  },
  
  // 部署配置
  deployment: {
    stage: 'prod',
    region: 'ap-guangzhou',
    memorySize: 1024,
    timeout: 30
  },
  
  // API 网关配置
  apiGateway: {
    // 部署后会自动生成，需要更新到前端配置中
    baseURL: 'https://your-api-gateway-id.apigw.tencentcloudapi.com/release'
  },
  
  // 前端配置
  frontend: {
    name: '焓湿图计算工具',
    version: '2.0.0',
    debug: false
  },
  
  // 可选：自定义域名配置
  customDomain: {
    enabled: false,
    domain: 'your-domain.com',
    certificateId: 'your-certificate-id'
  }
}; 
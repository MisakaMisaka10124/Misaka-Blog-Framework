import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';

const configPath = path.join(__dirname, '../data/config/core_server_config.json');

/**
 * 创建通用数据接口限流中间件
 * 用于保护 GET 类数据读取接口，防止爬虫和 DDoS
 * 配置项来自 core_server_config.json 的 rate_limit.data_api
 */
export function createDataLimiter() {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const { window_ms, max_requests, message } = config.rate_limit.data_api;

  return rateLimit({
    windowMs: window_ms,
    max: max_requests,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

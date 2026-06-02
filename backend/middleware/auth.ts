import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const configPath = path.join(__dirname, '../data/config/core_server_config.json');
const getConfig = () => JSON.parse(fs.readFileSync(configPath, 'utf-8'));

/**
 * JWT 认证中间件
 * - 检查 Authorization: Bearer <token>
 * - 验证签名和过期时间
 * - 通过后将 payload 写入 req.user
 */
export function verifyToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, getConfig().jwt.secret);
    req.user = payload;
    next();
  } catch (e: any) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期，请重新登录' });
    }
    return res.status(401).json({ error: '令牌无效' });
  }
}

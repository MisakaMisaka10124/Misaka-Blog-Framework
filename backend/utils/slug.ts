import crypto from 'crypto';

/**
 * 生成短哈希 slug
 * 基于文件名和时间戳生成 8 位哈希值
 */
export function generateSlug(filename: string): string {
  const timestamp = Date.now().toString();
  const raw = `${filename}-${timestamp}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 8);
}

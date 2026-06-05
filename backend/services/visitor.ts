import fs from 'fs';
import path from 'path';

const STATS_PATH = () => path.join(__dirname, '../data/config/visitor_stats.json');

interface VisitorStats {
  total: number;
  daily: Record<string, number>;
  ips: Record<string, string[]>;
}

/** 读取统计数据（不存在则初始化） */
function readStats(): VisitorStats {
  const filePath = STATS_PATH();
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return { total: 0, daily: {}, ips: {} };
}

/** 写入统计数据 */
function writeStats(stats: VisitorStats) {
  const filePath = STATS_PATH();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(stats, null, 2), 'utf-8');
}

/** 获取今日日期字符串 YYYY-MM-DD */
function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 记录一次访问（同一 IP 同一天只计一次）
 * 返回今日访问数和总访问数
 */
export function recordVisit(ip: string): { todayCount: number; totalCount: number } {
  const stats = readStats();
  const date = today();

  if (!stats.daily[date]) stats.daily[date] = 0;
  if (!stats.ips[date]) stats.ips[date] = [];

  // 同一 IP 同一天只计一次
  if (!stats.ips[date].includes(ip)) {
    stats.ips[date].push(ip);
    stats.daily[date]++;
    stats.total++;
  }

  // 清理 30 天前的 ip 记录（节省空间）
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  for (const d of Object.keys(stats.ips)) {
    if (d < cutoffStr) delete stats.ips[d];
  }

  writeStats(stats);
  return { todayCount: stats.daily[date], totalCount: stats.total };
}

/** 获取统计数据（不记录访问） */
export function getStats(): { todayCount: number; totalCount: number } {
  const stats = readStats();
  const date = today();
  return { todayCount: stats.daily[date] || 0, totalCount: stats.total };
}

/**
 * 根据 IP 获取国家代码（用于国旗显示）
 * 使用 ip-api.com 免费接口，无需 API Key
 */
export async function getCountryCode(ip: string): Promise<string> {
  // 本地 IP 不查询
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return 'CN';
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json() as { countryCode?: string };
    return data.countryCode || 'UN';
  } catch {
    return 'UN';
  }
}

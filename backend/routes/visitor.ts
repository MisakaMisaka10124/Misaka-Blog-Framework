import { Router } from 'express';
import { recordVisit, getCountryCode } from '../services/visitor';
import { readSiteStats, updateVisitorStats } from '../services/site_stats';
import { readIndex } from '../services/post_index';
import { createDataLimiter } from '../utils/rate_limit';

const router = Router();
const dataLimiter = createDataLimiter();

/** 获取客户端 IP */
function getClientIp(req: any): string {
  return (req.headers['cf-connecting-ip'] as string)
    || req.ip?.replace('::ffff:', '')
    || req.socket.remoteAddress
    || '0.0.0.0';
}

/**
 * @openapi
 * /api/visitor/record:
 *   get:
 *     tags: [Visitor]
 *     summary: 记录访问并获取站点统计
 *     description: 记录当前 IP 的访问（同一天同一 IP 只计一次），返回 IP、国旗国家代码、访客统计和今日更新文章数
 *     responses:
 *       200:
 *         description: 站点统计数据
 */
router.get('/record', dataLimiter, async (req, res) => {
  try {
    const ip = getClientIp(req);
    const counts = recordVisit(ip);
    const countryCode = await getCountryCode(ip);

    // 同步更新 site_stats.json
    updateVisitorStats(counts.todayCount, counts.totalCount);

    // 统计今日更新的文章数
    const today = new Date().toISOString().split('T')[0];
    const index = readIndex();
    const todayPosts = index.posts.filter(p => p.date === today).length;

    res.json({
      ip,
      countryCode,
      todayVisitors: counts.todayCount,
      totalVisitors: counts.totalCount,
      todayPosts,
    });
  } catch (e) {
    res.status(500).json({ error: '统计获取失败' });
  }
});

/**
 * @openapi
 * /api/visitor/stats:
 *   get:
 *     tags: [Visitor]
 *     summary: 获取站点统计（只读）
 *     description: 从预计算的统计文件读取访客数据，不记录访问
 *     responses:
 *       200:
 *         description: 访客统计数据
 */
router.get('/stats', dataLimiter, (req, res) => {
  try {
    const stats = readSiteStats();
    res.json({
      todayVisitors: stats.todayVisitors,
      totalVisitors: stats.totalVisitors,
    });
  } catch (e) {
    res.status(500).json({ error: '统计获取失败' });
  }
});

/**
 * @openapi
 * /api/visitor/site-stats:
 *   get:
 *     tags: [Visitor]
 *     summary: 获取完整站点统计（Dashboard专用）
 *     description: 返回预计算的完整站点统计，包括文章数、标签数、访客数、最近文章
 *     responses:
 *       200:
 *         description: 完整站点统计数据
 */
router.get('/site-stats', dataLimiter, (req, res) => {
  try {
    const stats = readSiteStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: '统计获取失败' });
  }
});

export default router;

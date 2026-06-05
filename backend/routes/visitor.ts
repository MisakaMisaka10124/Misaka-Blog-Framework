import { Router } from 'express';
import { recordVisit, getCountryCode } from '../services/visitor';
import { readIndex } from '../services/post_index';
import { createDataLimiter } from '../utils/rate_limit';

const router = Router();
const dataLimiter = createDataLimiter();

/**
 * @openapi
 * /api/visitor/stats:
 *   get:
 *     tags: [Visitor]
 *     summary: 记录访问并获取站点统计
 *     description: 记录当前 IP 的访问（同一天同一 IP 只计一次），返回 IP、国旗国家代码、访客统计和今日更新文章数
 *     responses:
 *       200:
 *         description: 站点统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ip:
 *                   type: string
 *                   description: 当前访问者 IP
 *                 countryCode:
 *                   type: string
 *                   description: 国家代码（用于 flag-icons 显示国旗）
 *                 todayVisitors:
 *                   type: number
 *                   description: 今日访客数
 *                 totalVisitors:
 *                   type: number
 *                   description: 总访客数
 *                 todayPosts:
 *                   type: number
 *                   description: 今日更新文章数
 */
router.get('/stats', dataLimiter, async (req, res) => {
  try {
    // 优先使用 Cloudflare 传递的真实客户端 IP
    const ip = (req.headers['cf-connecting-ip'] as string)
      || req.ip?.replace('::ffff:', '')
      || req.socket.remoteAddress
      || '0.0.0.0';

    const counts = recordVisit(ip);
    const countryCode = await getCountryCode(ip);

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

export default router;

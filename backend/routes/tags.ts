import { Router } from 'express';
import { getAllTags, getPostsByTag } from '../services/tag';
import { readIndex } from '../services/post_index';
import { createDataLimiter } from '../utils/rate_limit';

const router = Router();
const dataLimiter = createDataLimiter();

/**
 * @openapi
 * /api/tags:
 *   get:
 *     tags: [Tags]
 *     summary: 获取所有标签
 *     description: 返回所有标签及其文章数量
 *     responses:
 *       200:
 *         description: 成功获取标签列表
 */
router.get('/', dataLimiter, (req, res) => {
  try {
    const tags = getAllTags();
    res.json({ tags });
  } catch (e) {
    res.status(500).json({ error: '标签读取失败' });
  }
});

/**
 * @openapi
 * /api/tags/{tag}:
 *   get:
 *     tags: [Tags]
 *     summary: 获取某标签下的文章
 *     description: 返回指定标签下的所有文章元数据
 *     parameters:
 *       - in: path
 *         name: tag
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取文章列表
 */
router.get('/:tag', dataLimiter, (req, res) => {
  try {
    const { tag } = req.params;
    const slugs = getPostsByTag(tag);
    const index = readIndex();
    const posts = index.posts.filter(p => slugs.includes(p.slug));
    res.json({ tag, posts });
  } catch (e) {
    res.status(500).json({ error: '标签文章读取失败' });
  }
});

export default router;

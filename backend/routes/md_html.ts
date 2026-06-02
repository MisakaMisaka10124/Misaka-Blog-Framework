import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { renderMarkdown } from '../utils/md_html';

const router = Router();
const configPath = path.join(__dirname, '../data/config/core_server_config.json');

/**
 * @openapi
 * /api/md/render:
 *   post:
 *     tags: [Tools]
 *     summary: Markdown 渲染接口
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               markdown:
 *                 type: string
 *     responses:
 *       200:
 *         description: 成功返回渲染后的 HTML
 */
router.post('/render', async (req, res) => {
    const { markdown } = req.body;
    if (!markdown) return res.status(400).json({ error: '请输入Markdown内容' });

    try {
        const html = await renderMarkdown(markdown);
        res.json({ html });
    } catch (e) {
        res.status(500).json({ error: '渲染失败' });
    }
});

export default router;
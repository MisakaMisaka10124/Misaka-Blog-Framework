import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { generateCaptcha, verifyCaptcha } from '../utils/verify';

const router = Router();
const configPath = path.join(__dirname, '../data/config/core_server_config.json');

const getConfig = () => JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// 配置限流
const configForLimit = getConfig();
const chatLimiter = rateLimit({
    windowMs: configForLimit.rate_limit.ai_chat.window_ms,
    max: configForLimit.rate_limit.ai_chat.max_requests,
    message: { error: configForLimit.rate_limit.ai_chat.message }
});

/**
 * @openapi
 * /api/chat/captcha:
 *   get:
 *     tags: [AI Chat]
 *     summary: 获取聊天验证码
 */
router.get('/captcha', (req, res) => {
    res.json(generateCaptcha());
});

/**
 * @openapi
 * /api/chat:
 *   post:
 *     tags: [AI Chat]
 *     summary: 向 AI 发送消息
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message, captchaId, captchaText]
 *             properties:
 *               message: { type: string }
 *               captchaId: { type: string }
 *               captchaText: { type: string }
 *     responses:
 *       200:
 *         description: AI 的回复
 *       429:
 *         description: 请求过于频繁
 */
router.post('/', chatLimiter, async (req, res) => {
    const { message, captchaId, captchaText } = req.body;
    
    if (!verifyCaptcha(captchaId, captchaText)) {
        return res.status(400).json({ error: '验证码错误' });
    }

    const currentConfig = getConfig();
    const knowledgePath = path.join(__dirname, '../../', currentConfig.paths.ai_knowledge);
    
    let systemPrompt = currentConfig.ai.fallback_prompt;
    if (fs.existsSync(knowledgePath)) {
        const kn = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));
        systemPrompt = kn.systemPrompt;
    }

    if (currentConfig.ai.simulate_reply) {
        return res.json({ reply: `[Mock] 收到消息: ${message}`, system: systemPrompt });
    }

    res.json({ reply: "AI 接口待集成" });
});

export default router;
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { generateCaptcha, verifyCaptcha } from '../utils/verify';

const router = Router();
const configPath = path.join(__dirname, '../data/config/core_server_config.json');

/**
 * @openapi
 * /api/login/captcha:
 *   get:
 *     tags: [Auth]
 *     summary: 获取登录验证码
 *     responses:
 *       200:
 *         description: 返回验证码 svg 和用于校验的 ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 data: { type: string, description: "原始 SVG 字符串" }
 */
router.get('/captcha', (req, res) => {
    res.json(generateCaptcha());
});

/**
 * @openapi
 * /api/login:
 *   post:
 *     tags: [Auth]
 *     summary: 管理员登录
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, captchaId, captchaText]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *               captchaId: { type: string }
 *               captchaText: { type: string }
 *     responses:
 *       200:
 *         description: 登录成功，返回 JWT Token
 *       401:
 *         description: 用户名或密码错误
 *       400:
 *         description: 验证码错误
 */
router.post('/', (req, res) => {
    const { username, password, captchaId, captchaText } = req.body;
    
    if (!verifyCaptcha(captchaId, captchaText)) {
        return res.status(400).json({ error: '验证码错误或已过期' });
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    if (username === config.admin.username && password === config.admin.password) {
        const token = jwt.sign(
            { user: username }, 
            config.jwt.secret, 
            { expiresIn: config.jwt.expires_in }
        );
        res.json({ message: '登录成功', token });
    } else {
        res.status(401).json({ error: '用户名或密码错误' });
    }
});

export default router;
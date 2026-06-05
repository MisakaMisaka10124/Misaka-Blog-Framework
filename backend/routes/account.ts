import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '../middleware/auth';
import { generateCaptcha, verifyCaptcha } from '../utils/verify';

const router = Router();
const configPath = path.join(__dirname, '../data/config/core_server_config.json');

// 所有账户路由都需要认证
router.use(verifyToken);

/**
 * @openapi
 * /api/admin/account:
 *   get:
 *     tags: [Account]
 *     summary: 获取当前账户信息
 *     description: 返回当前登录的管理员用户名
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取账户信息
 *       401:
 *         description: 未授权
 */
router.get('/', (req: any, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    res.json({
      username: config.admin.username
    });
  } catch (e) {
    res.status(500).json({ error: '获取账户信息失败' });
  }
});

/**
 * @openapi
 * /api/admin/account/username:
 *   put:
 *     tags: [Account]
 *     summary: 修改用户名
 *     description: 修改管理员用户名，无需验证码
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newUsername]
 *             properties:
 *               newUsername:
 *                 type: string
 *                 description: 新用户名
 *     responses:
 *       200:
 *         description: 修改成功
 *       400:
 *         description: 参数错误
 */
router.put('/username', (req, res) => {
  try {
    const { newUsername } = req.body;

    if (!newUsername || !newUsername.trim()) {
      return res.status(400).json({ error: '请输入新用户名' });
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    config.admin.username = newUsername.trim();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    res.json({ message: '用户名修改成功', username: newUsername.trim() });
  } catch (e) {
    res.status(500).json({ error: '修改用户名失败' });
  }
});

/**
 * @openapi
 * /api/admin/account/password:
 *   put:
 *     tags: [Account]
 *     summary: 修改密码
 *     description: 修改管理员密码，需要验证码和当前密码验证
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, captchaId, captchaText]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: 当前密码
 *               newPassword:
 *                 type: string
 *                 description: 新密码
 *               captchaId:
 *                 type: string
 *                 description: 验证码ID
 *               captchaText:
 *                 type: string
 *                 description: 验证码文本
 *     responses:
 *       200:
 *         description: 修改成功
 *       400:
 *         description: 参数错误或验证码错误
 *       401:
 *         description: 当前密码错误
 */
router.put('/password', (req, res) => {
  try {
    const { currentPassword, newPassword, captchaId, captchaText } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: '请输入当前密码' });
    }

    if (!newPassword) {
      return res.status(400).json({ error: '请输入新密码' });
    }

    if (!captchaId || !captchaText) {
      return res.status(400).json({ error: '请输入验证码' });
    }

    if (!verifyCaptcha(captchaId, captchaText)) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    if (currentPassword !== config.admin.password) {
      return res.status(401).json({ error: '当前密码错误' });
    }

    config.admin.password = newPassword;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    res.json({ message: '密码修改成功，请重新登录' });
  } catch (e) {
    res.status(500).json({ error: '修改密码失败' });
  }
});

export default router;

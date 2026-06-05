import { Router } from 'express';
import loginRouter from './login';
import aiChatRouter from './ai_chat';
import postsRouter from './posts';
import mdRouter from './md_html';
import tagsRouter from './tags';
import visitorRouter from './visitor';
import adminRouter from './admin';
import accountRouter from './account';

const router = Router();

// 统一挂载子路由
router.use('/login', loginRouter);
router.use('/chat', aiChatRouter);
router.use('/posts', postsRouter);
router.use('/md', mdRouter);
router.use('/tags', tagsRouter);
router.use('/visitor', visitorRouter);
router.use('/admin', adminRouter);
router.use('/admin/account', accountRouter);

export default router;

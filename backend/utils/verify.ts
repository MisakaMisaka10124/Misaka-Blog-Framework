import svgCaptcha from 'svg-captcha';
import fs from 'fs';
import path from 'path';

const configPath = path.join(__dirname, '../data/config/core_server_config.json');
const getConfig = () => JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const captchaStore = new Map<string, {text: string, expires: number}>();

export const generateCaptcha = () => {
    const config = getConfig();
    const captcha = svgCaptcha.create({
        size: config.captcha.size,
        noise: config.captcha.noise,
        color: config.captcha.color,
        background: config.captcha.background
    });
    const id = Math.random().toString(36).substring(2, 15);
    const expires = Date.now() + config.captcha.expires_in_ms;

    captchaStore.set(id, { text: captcha.text.toLowerCase(), expires });

    return { id, data: captcha.data };
};

export const verifyCaptcha = (id: string, text: string): boolean => {
    const record = captchaStore.get(id);
    if (!record) return false;
    
    captchaStore.delete(id);
    
    if (Date.now() > record.expires) return false;
    
    return record.text === text.toLowerCase();
};
module.exports = {
  apps: [{
    name: 'personal_web',
    script: 'tsx',
    args: 'backend/index.ts',
    cwd: '/var/www/Misaka-Blog-Framework',
    env: {
      NODE_ENV: 'production'
    },
    // 日志配置
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    // 自动重启配置
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    // 重启延迟
    restart_delay: 3000,
    // 最大重启次数
    max_restarts: 10
  }]
}

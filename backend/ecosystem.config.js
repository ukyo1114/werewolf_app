module.exports = {
  apps: [
    {
      name: 'werewolf-backend',
      script: './dist/app.js',
      cwd: '/var/www/werewolf-app/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        MONGO_URI: 'mongodb://localhost:27017/werewolf_app',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        MONGO_URI: 'mongodb://localhost:27017/werewolf_app',
      },
      error_file: '/var/log/pm2/werewolf-backend-error.log',
      out_file: '/var/log/pm2/werewolf-backend-out.log',
      log_file: '/var/log/pm2/werewolf-backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};

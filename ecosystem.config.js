module.exports = {
  apps: [
    {
      name: "werewolf-backend",
      script: "./backend/src/app.ts",
      interpreter: "node",
      interpreter_args: "-r ts-node/register",
      cwd: "/var/www/werewolf-app/backend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        MONGODB_URI:
          "mongodb://admin:werewolf_password_2024@localhost:27017/werewolf_app?authSource=admin",
        JWT_SECRET: "your-super-secret-jwt-key-change-this-in-production",
        EMAIL_USER: "your-email@gmail.com",
        EMAIL_PASS: "your-email-password",
        FRONTEND_URL: "http://54.199.89.153",
      },
      error_file: "/var/log/pm2/werewolf-backend-error.log",
      out_file: "/var/log/pm2/werewolf-backend-out.log",
      log_file: "/var/log/pm2/werewolf-backend-combined.log",
      time: true,
    },
  ],
};

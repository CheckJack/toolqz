/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: "toolqz",
      script: "npm",
      args: "run start:prod",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "1G",
      watch: false,
      time: true,
    },
  ],
};

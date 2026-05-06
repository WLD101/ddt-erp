module.exports = {
  apps: [
    {
      name: "whatsquery-erp",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      },
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};

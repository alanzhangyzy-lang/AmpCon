#!/bin/bash

# 将环境变量写入 cron 可读的文件（cron 默认不继承容器环境变量）
printenv | grep -v "no_proxy" >> /etc/environment

echo "$(date) - Stock Report Container Started" >> /app/output/run.log
echo "Cron schedule: 15:35 Mon-Fri" >> /app/output/run.log

# 启动 cron 前台运行
cron -f

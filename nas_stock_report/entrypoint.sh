#!/bin/bash
# 启动 cron 服务并保持前台运行
echo "Stock Report Container Started: $(date)" >> /app/output/run.log
cron -f

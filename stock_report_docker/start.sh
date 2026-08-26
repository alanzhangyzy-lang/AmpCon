#!/bin/bash
# 容器启动脚本 - 每次启动自动安装依赖并启动 cron

echo "$(date) - 容器启动，开始初始化..." >> /app/output/run.log

# 安装依赖（有缓存的话很快）
pip install akshare pandas openpyxl -q

# 安装 cron（如果没有的话）
apt-get update -qq && apt-get install -y -qq cron > /dev/null 2>&1

# 创建输出目录
mkdir -p /app/output

# 设置定时任务：周一到周五 15:35
echo "TZ=Asia/Shanghai" > /etc/cron.d/stock-cron
echo "35 15 * * 1-5 root cd /app && python stock_daily_report.py >> /app/output/run.log 2>&1" >> /etc/cron.d/stock-cron
echo "" >> /etc/cron.d/stock-cron
chmod 0644 /etc/cron.d/stock-cron
crontab /etc/cron.d/stock-cron

echo "$(date) - 初始化完成，cron 已启动" >> /app/output/run.log
echo "定时任务：每周一至周五 15:35 执行" >> /app/output/run.log

# 启动 cron 并保持前台运行
cron -f

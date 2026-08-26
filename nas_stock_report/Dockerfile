FROM python:3.11-slim

# 安装 cron
RUN apt-get update && apt-get install -y cron && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 安装 Python 依赖
RUN pip install --no-cache-dir tushare pandas openpyxl

# 复制文件
COPY stock_daily_report.py .
COPY crontab /etc/cron.d/stock-cron
COPY entrypoint.sh .

# 设置权限
RUN chmod +x entrypoint.sh \
    && chmod 0644 /etc/cron.d/stock-cron \
    && crontab /etc/cron.d/stock-cron

# 创建输出目录和日志文件
RUN mkdir -p /app/output && touch /var/log/cron.log

ENTRYPOINT ["/app/entrypoint.sh"]

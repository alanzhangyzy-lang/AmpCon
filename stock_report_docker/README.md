# A股每日大盘报告 - 绿联云 NAS Docker 部署指南

## 文件说明

```
stock_report_docker/
├── Dockerfile              # Docker 镜像构建文件
├── docker-compose.yml      # Docker Compose 编排文件
├── stock_daily_report.py   # 主脚本
├── crontab                 # 定时任务配置（每天15:35执行）
├── entrypoint.sh           # 容器启动脚本
├── output/                 # 输出目录（自动生成）
│   ├── 大盘数据_YYYYMMDD.xlsx
│   ├── 总结_YYYYMMDD.txt
│   └── run.log
└── README.md               # 本文件
```

## 部署步骤

### 1. 上传文件到 NAS

通过绿联云文件管理器，将整个 `stock_report_docker` 文件夹上传到：
```
/个人文件夹/常用/stock_report_docker/
```

### 2. SSH 登录 NAS

绿联云开启 SSH：
- UGOS 管理界面 → 系统设置 → 终端与SNMP → 启用SSH

然后用终端连接：
```bash
ssh root@你的NAS_IP
```

### 3. 构建并启动容器

```bash
cd /个人文件夹/常用/stock_report_docker
# 如果路径有中文，可能需要确认实际挂载路径，通常为：
# cd /volume1/用户名/常用/stock_report_docker

# 构建并启动
docker-compose up -d --build
```

### 4. 验证

```bash
# 查看容器是否运行
docker ps | grep stock-report

# 手动执行一次测试
docker exec stock-report python /app/stock_daily_report.py

# 查看输出
ls output/

# 查看日志
cat output/run.log
```

## 常用命令

```bash
# 查看容器日志
docker logs stock-report

# 停止容器
docker-compose down

# 重启容器
docker-compose restart

# 重新构建（修改脚本后）
docker-compose up -d --build

# 手动指定日期运行
docker exec stock-report python /app/stock_daily_report.py 20260701
```

## 定时执行说明

- 默认每周一到周五 15:35 自动执行
- 非交易日（周末、节假日）脚本会自动检测并跳过
- 时区已设为 Asia/Shanghai

## 输出文件

每次执行会在 `output/` 目录下生成：
- `大盘数据_YYYYMMDD.xlsx` — Excel 报表
- `总结_YYYYMMDD.txt` — 文字总结
- `run.log` — 运行日志（追加模式）

## 修改定时

编辑 `crontab` 文件中的时间规则：
```
# 分 时 日 月 周  （当前：15:35 周一到周五）
35 15 * * 1-5 root cd /app && python stock_daily_report.py >> /app/output/run.log 2>&1
```

修改后重新构建容器：
```bash
docker-compose up -d --build
```

## 备用方案：不用 Docker Compose

如果绿联云的 Docker 不支持 Compose，可以手动操作：

```bash
# 构建镜像
docker build -t stock-report .

# 运行容器
docker run -d \
  --name stock-report \
  --restart always \
  -e TUSHARE_TOKEN=fda470738bdc41a2768fcc39fd271be864cfe1599a3d97345fbed80b \
  -e TZ=Asia/Shanghai \
  -v $(pwd)/output:/app/output \
  stock-report
```

## 注意事项

1. 绿联云的实际文件路径可能与界面显示不同，SSH 后用 `find / -name "stock_report_docker"` 查找
2. 确保 NAS 时区设置为中国标准时间
3. Tushare 部分接口有积分门槛，如涨停板列表需要 2000+ 积分
4. 建议定期清理过期的 Excel 文件，避免占用存储空间

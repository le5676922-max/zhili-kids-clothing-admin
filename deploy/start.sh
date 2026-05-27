#!/bin/bash
# 织里镇童装产业协同管理平台 - 启动脚本
# 放在 /www/wwwroot/zhili-kids-industry/ 目录下

APP_NAME="zhili-kids-industry.jar"
APP_DIR="/www/wwwroot/zhili-kids-industry"
LOG_DIR="$APP_DIR/logs"

mkdir -p "$LOG_DIR"

# JVM参数
JAVA_OPTS="-server -Xms256m -Xmx512m -XX:+UseG1GC -Dfile.encoding=UTF-8"

# 检查是否已运行
PID=$(ps -ef | grep $APP_NAME | grep -v grep | awk '{print $2}')
if [ -n "$PID" ]; then
    echo "应用已在运行中, PID: $PID"
    echo "如需重启请先执行 ./stop.sh"
    exit 1
fi

echo "启动 $APP_NAME ..."
nohup java $JAVA_OPTS -jar $APP_DIR/$APP_NAME \
    --spring.config.location=$APP_DIR/application.yaml \
    > $LOG_DIR/app.log 2>&1 &

sleep 3

NEW_PID=$(ps -ef | grep $APP_NAME | grep -v grep | awk '{print $2}')
if [ -n "$NEW_PID" ]; then
    echo "启动成功! PID: $NEW_PID"
    echo "日志路径: $LOG_DIR/app.log"
else
    echo "启动失败，请查看日志: $LOG_DIR/app.log"
fi

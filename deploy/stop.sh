#!/bin/bash
# 织里镇童装产业协同管理平台 - 停止脚本

APP_NAME="zhili-kids-industry.jar"

PID=$(ps -ef | grep $APP_NAME | grep -v grep | awk '{print $2}')
if [ -z "$PID" ]; then
    echo "应用未运行"
    exit 0
fi

echo "停止应用, PID: $PID ..."
kill $PID

# 等待最多30秒
for i in $(seq 1 30); do
    if ! kill -0 $PID 2>/dev/null; then
        echo "应用已停止"
        exit 0
    fi
    sleep 1
done

# 强制kill
echo "应用未响应，强制停止..."
kill -9 $PID
echo "已强制停止"

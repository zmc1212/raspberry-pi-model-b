# RASPBERRY PI MODEL B（2012）装配模拟

复刻初代 Raspberry Pi Model B：BCM2835 + 256MB PoP 堆叠、LAN9512、USB 双层堆叠、
RJ45 磁性插座、HDMI、GPIO 26Pin、SD 卡水平插入、microUSB 电源。仪表盘：
TTY1 启动终端（内核日志 → pi 登录 → wheezy 欢迎语）、GPIO 状态矩阵、
SoC 温度表、eth0 网络。

## 启动方式
- HTTP：`python3 tools/serve.py 8080`（禁缓存）→ http://127.0.0.1:8080
- 双击 index.html：经典 `<script>` 无模块，file:// 行为一致。

## 交互
拖动旋转 / 滚轮缩放 / 点击零件 / 空格暂停 / R 重播 / 1-8 跳阶段
（pop → conn → gpio → sd → power → kernel → login → home）。

## 验收
按 7（login）：终端打出 raspberrypi login → Welcome to Debian；GPIO 引脚
跳动、eth0 拿到 192.168.1.42、SoC 温度升到 ~58°。控制台无错误。

音效：首次点击/按键自动启用（合成音，零素材），右上角 🔊/🔇 可切换；零件落座、阶段切换、打字均配音。

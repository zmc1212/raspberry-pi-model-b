# RASPBERRY PI MODEL B（2012）装配模拟

复刻初代 Raspberry Pi Model B：BCM2835 + 512MB PoP 堆叠（rev2，含 P5 排针）、LAN9512、USB 双层堆叠、
RJ45 磁性插座、HDMI、GPIO 26Pin、SD 卡水平插入、microUSB 电源。仪表盘：
TTY1 启动终端（内核日志 → pi 登录 → wheezy 欢迎语）、GPIO 状态矩阵、
SoC 温度表、eth0 网络。

## 启动方式
- HTTP：`python3 tools/serve.py 8080`（禁缓存）→ http://127.0.0.1:8080
- 双击 index.html：经典 `<script>` 无模块，file:// 行为一致。

## 交互
拖动旋转 / 滚轮缩放 / 点击零件 / 空格暂停 · D 隐藏/显示仪表盘（录屏可用 URL ?dash=0） / R 重播 / 1-8 跳阶段
（pop → conn → gpio → sd → power → kernel → login → home）。

## 验收

**自然播放回归（必查）**：刷新页面后不碰键盘，只看装配——已落座零件必须
全程留在板上（只增不减），conn 阶段后计数 18，home 阶段全部飞出后循环重启。
seek 跳段会 sealAll 掩盖飞行 bug，不能用 seek 代替此项。
按 7（login）：终端打出 raspberrypi login → Welcome to Debian；GPIO 引脚
跳动、eth0 拿到 192.168.1.42、SoC 温度升到 ~58°。控制台无错误。

音效：默认开启，页面加载即尝试出声（浏览器拦截自动播放时，首次点击/按键/触摸页面立即恢复；合成音，零素材），右上角 🔊/🔇 可切换；零件落座、阶段切换、打字均配音。

## 界面语言（双语约定）
中文为主、英文为副的双语风格：标题卡/状态卡/阶段胶囊/仪表盘为中文主文案，
英文原文退到小字副位（`.tag .sub`、面板 `.meta`）；型号代号与单位
（BCM2835、LAN9512、GPIO、MHz、MB、GB）保留英文；3D 零件丝印贴图保持英文
（真实硬件即英文标注）；TTY 终端滚出的内核日志与命令行输出属机器内容，保持英文。
改动文案时遵循同一约定：主位中文、副位英文、代号不译。

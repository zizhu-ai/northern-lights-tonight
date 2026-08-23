先读实施简报和仓库现状，再按阶段 A 拆 Python 管道、录 golden fixtures，全程不碰 TypeScript。接下来对照简报 §3 和现有 `engine/snapshot.py`，把阶段 A 的拆分边界和 fixture 表钉死。先冻结拆分前基线：看 cache、地点数和现有输出，再动 `snapshot.py`。

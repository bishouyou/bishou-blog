#!/usr/bin/env python3
"""从 CTFtime 抓取近期赛事,生成 docs/events.md。

对比 Hello-CTF 的 collector:无需 Docker/admin 面板,只用官方 JSON API;
CI 里跑(GitHub Actions 网络无限制),失败时写入降级页面并正常退出。
"""
import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests

API = "https://ctftime.org/api/v1/events/"
OUT = Path(__file__).resolve().parent.parent / "docs" / "events.md"
UA = {"User-Agent": "bishou-blog/1.0 (GitHub Actions; contact: bishouyou)"}
LIMIT = 30
RETRIES = 3


def fetch() -> list | None:
    for attempt in range(1, RETRIES + 1):
        try:
            r = requests.get(API, params={"limit": LIMIT}, headers=UA, timeout=30)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"[warn] 第 {attempt} 次抓取失败: {e}", file=sys.stderr)
    return None


def fmt_time(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.astimezone(timezone(timedelta(hours=8))).strftime("%Y-%m-%d %H:%M")
    except Exception:
        return iso


def render(events: list | None) -> str:
    now = datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d %H:%M UTC+8")
    head = [
        "---",
        "title: 赛事日程",
        "hide:",
        "  - toc",
        "---",
        "",
        "# CTF 赛事日程",
        "",
        f"> 自动同步自 [CTFtime](https://ctftime.org) · 最近更新 {now}",
        "",
    ]
    if events is None:
        return head + [
            "!!! warning \"抓取失败\"",
            "    数据源暂时不可达,下次定时任务会自动重试。可到仓库 Actions 手动运行 **Update CTF events**。",
        ]
    rows = ["| 比赛 | 开始 | 结束 | 形式 | 详情 |", "| --- | --- | --- | --- | --- |"]
    for ev in sorted(events, key=lambda x: x.get("start", "")):
        rows.append(
            "| [{title}]({ctftime_url}) | {start} | {finish} | {fmt} | [CTFtime]({ctftime_url}) |".format(
                title=str(ev.get("title", "")).replace("|", "\\|"),
                ctftime_url=ev.get("ctftime_url", "#"),
                start=fmt_time(ev.get("start", "")),
                finish=fmt_time(ev.get("finish", "")),
                fmt=ev.get("format", "") or "-",
            )
        )
    if len(rows) == 6:
        rows.append("| 暂无近期赛事 | - | - | - | - |")
    return head + rows + [""]


def main() -> None:
    events = fetch()
    OUT.write_text("\n".join(render(events)), encoding="utf-8")
    n = len(events) if events is not None else 0
    print(f"OK: 写入 {OUT} ({n} 场赛事)" if events is not None else "OK: 写入降级页面")


if __name__ == "__main__":
    main()
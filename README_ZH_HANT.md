# CFO Stack

### AI 財務作業 + 純文字記帳

作者：Mike Chong（[realmikechong.com](https://realmikechong.com)）

[English README](README.md)

---

## 這是什麼

CFO Stack 是一套以 [Beancount](https://github.com/beancount/beancount) 為核心的開源 AI 記帳與財務作業系統。
它把 Claude Code、Codex 這類 AI agent 變成你的記帳員、控制者、稅務策略助手與 CFO。

> *"You have to know accounting. It's the language of practical business life. It was a very useful thing to deliver to civilization. I've heard it came to civilization through Venice which of course was once the great commercial power in the Mediterranean. However, double-entry bookkeeping was a hell of an invention."*
> — Charlie Munger
>
> 你必須懂會計。它是實際商業生活的語言。這是人類文明中非常有用的發明。我聽說它是從威尼斯傳入文明世界的——當然，威尼斯曾是地中海最偉大的商業強國。不過，複式記帳法確實是一項了不起的發明。

靈感來自 [gstack](https://github.com/garrytan/gstack)（Garry Tan 為 Claude Code 打造的「軟體工廠」）。相同理念，不同領域：**會計取代工程**。

核心流程是 **C.L.E.A.R.**：

- Capture：收集銀行、信用卡、收據、發票、平台資料
- Log：整理成結構化分錄
- Extract：分析趨勢、異常、稅務準備資料
- Automate：把重複工作變成流程
- Report：輸出報表與整體財務視圖

---

## 快速開始

```bash
git clone https://github.com/MikeChongCan/cfo-stack.git ~/.claude/skills/cfo-stack
cd ~/.claude/skills/cfo-stack && ./setup
```

其他 host：

- Codex：`./setup --host codex`
- OpenClaw：`./setup --host openclaw`
- Antigravity：`./setup --host antigravity`
- 自動偵測：`./setup --host auto`

安裝後可用：

```bash
./bin/cfo-check
./bin/cfo-fava ./ledger/main.beancount 5000
```

---

## 基本使用流程

1. 用 `/setup` 建立 ledger
2. 如果銀行或券商資料還沒下載，用 `/statement-export`
3. 用 `/capture` 整理原始檔案
4. 用 `/classify` 分類交易
5. 用 `/reconcile` 對帳
6. 用 `/report` 看報表
7. 用 `/snapshot` 提交重要變更

---

## 範例

- `examples/canadian-company/`
- `examples/usa-company/`
- `examples/canadian-individual/`
- `examples/canadian-family/`
- `examples/usa-individual/`
- `examples/usa-family/`

---

## 注意

- 目前模板與稅務流程以加拿大、美國為主
- 稅率與申報規則必須來自 `tax/jurisdiction.yaml`
- AI 可以協助整理資料，但不能憑空猜稅務規則
- 複雜情況仍應找持牌專業人士確認

---

## 想看完整最新版英文說明

這份繁體中文說明刻意保持精簡。

如果你想看最新、最完整的版本，可以直接讀英文 README：

- [README.md](README.md)

也可以用 Google Translate 開啟英文原文：

- https://translate.google.com/translate?sl=auto&tl=zh-TW&u=https://github.com/MikeChongCan/cfo-stack/blob/main/README.md

# pi-linkly-memory

给 [Pi](https://pi.dev) 补上长期记忆，记忆存在 [Linkly AI](https://linkly.ai) 的笔记里。

跟 Pi 说一次长期的要求，比如「以后写代码，注释一律用英文」，它会存成一条带 `#记忆` 标签的 Linkly AI 笔记。之后每开一个新会话，这些笔记都会放进 Pi 的系统提示词，不用你再提醒。

## 快速上手

准备：

- Pi 1.0 以上，已经登录一个模型
- [Linkly AI 桌面端](https://linkly.ai)开着，并装好命令行工具 `linkly`。在桌面端「Agent 使用」页的「高级」区，在「Linkly AI CLI」一行点「安装」；或者在终端运行 `curl -sSL https://updater.linkly.ai/cli/install.sh | sh`

然后运行：

```bash
pi mcp add linkly --url http://127.0.0.1:60606/mcp --exposure direct
pi install git:github.com/LinklyAI/pi-linkly-memory
```

`60606` 是默认端口。如果 `pi mcp list` 里看不到 `connected`，运行 `linkly status`，换成它给出的 MCP 地址。

打开 `pi`，说一条你的习惯。Pi 会存下来，并告诉你记了什么。再开一个新会话，让它做一件用得上这条习惯的事。

## 原理

- **读**：每轮对话开始前，扩展用 `linkly` 命令行列出带 `#记忆` 的笔记，读出全文，放进系统提示词里的 `user_memory` 段落，同时附上什么时候存、怎么存的规则。在 Linkly AI 里改了记忆，下一条消息就生效。
- **写**：模型用 Linkly AI 的 MCP 工具 `note_save` 存记忆、改记忆。已有同一件事的记忆，就改那一条，不新建。

## 管理记忆

记忆就是普通的 Linkly AI 笔记，在应用里就能看、改、删。想把记忆放在一处看，可以建一个库，添加笔记筛选，按 `记忆` 标签筛选，带这个标签的笔记会自动加进来。

记忆总长 12000 字以内全文放进提示词；超出的部分只放标题，模型需要时自己去读。

## 配置

| 环境变量 | 默认值 | 作用 |
| --- | --- | --- |
| `LINKLY_MEMORY_TAG` | `记忆` | 哪个标签算记忆 |
| `LINKLY_CLI` | `linkly` | Linkly AI 命令行的命令名或路径 |

## 更新和卸载

```bash
pi update git:github.com/LinklyAI/pi-linkly-memory
pi remove git:github.com/LinklyAI/pi-linkly-memory
```

卸载扩展不会删除 Linkly AI 里的记忆笔记。

## 许可证

Apache-2.0

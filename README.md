# pi-linkly-memory

Long-term memory for [Pi](https://pi.dev), stored as notes in [Linkly AI](https://linkly.ai).

Tell Pi a lasting preference once, for example "from now on, write code comments in English". Pi saves it as a Linkly AI note tagged `#记忆`. Every new session starts with those notes in its system prompt, so Pi keeps following them without being reminded.

[中文说明](README.zh-CN.md)

## Quick start

You need:

- Pi 1.0 or later, signed in to a model
- [Linkly AI Desktop](https://linkly.ai) running, with the `linkly` CLI installed. In the Desktop app, open the **Agent usage** page and click **Install** in the **Linkly AI CLI** row under **Advanced**, or run `curl -sSL https://updater.linkly.ai/cli/install.sh | sh`

Then run:

```bash
pi mcp add linkly --url http://127.0.0.1:60606/mcp --exposure direct
pi install git:github.com/LinklyAI/pi-linkly-memory
```

`60606` is the default port. If `pi mcp list` doesn't show `connected`, run `linkly status` and use the MCP address it prints.

Start `pi` and state a preference. Pi saves it and tells you what it remembered. Open a new session and ask for something the preference applies to.

## How it works

- **Read.** Before every agent run, the extension lists the notes tagged `#记忆` with the `linkly` CLI, reads them, and adds them to the system prompt as a `user_memory` section, together with rules for when and how to save memories. Editing a memory in Linkly AI takes effect on the next message.
- **Write.** The model saves and updates memories with the Linkly AI MCP tool `note_save`. A memory that covers the same topic is updated instead of duplicated.

## Managing memories

Memories are ordinary Linkly AI notes, so you can read, edit, or delete them in the app. To see them in one place, create a library and add a note filter for the `记忆` tag; matching notes are added automatically.

Up to 12,000 characters of memories are loaded in full. Past that, the remaining memories are listed by title and the model reads them when needed.

## Configuration

| Environment variable | Default | Meaning |
| --- | --- | --- |
| `LINKLY_MEMORY_TAG` | `记忆` | Tag that marks memory notes |
| `LINKLY_CLI` | `linkly` | Command or path of the Linkly AI CLI |

## Update and uninstall

```bash
pi update git:github.com/LinklyAI/pi-linkly-memory
pi remove git:github.com/LinklyAI/pi-linkly-memory
```

Removing the extension leaves your memory notes in Linkly AI.

## License

Apache-2.0

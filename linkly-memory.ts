/**
 * Linkly AI Memory Extension
 *
 * Gives Pi long-term memory backed by Linkly AI notes. Memories are notes
 * tagged #记忆 (override with LINKLY_MEMORY_TAG). Before every run the
 * extension lists them through the linkly CLI and injects their full text
 * into the system prompt, together with rules for saving new memories with
 * the Linkly AI MCP tool note_save.
 *
 * Requirements:
 * - Linkly AI Desktop running and the `linkly` CLI on PATH
 * - Linkly AI MCP server in ~/.pi/agent/mcp.json, so the model can call note_save
 *
 * Install: pi install git:github.com/LinklyAI/pi-linkly-memory
 */

import { execFile } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const TAG = process.env.LINKLY_MEMORY_TAG || "记忆";
const CLI = process.env.LINKLY_CLI || "linkly";
const TIMEOUT_MS = 3000;
// Memories past this many characters are listed by title only, to keep the prompt bounded.
const MAX_CHARS = 12000;

interface Memory {
	noteId: string;
	version: string;
	docId: string;
	body: string;
}

function runCli(args: string[]): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile(
			CLI,
			[...args, "--json", "--client", "pi"],
			{ timeout: TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, LINKLY_NO_SKILLS_HINT: "1" } },
			(error, stdout) => (error ? reject(error) : resolve(stdout)),
		);
	});
}

/** `linkly read` prefixes every line with its number and a tab; note files also carry YAML front matter. */
function noteBody(content: string): string {
	return content
		.replace(/^ *\d+\t/gm, "")
		.replace(/^---\n[\s\S]*?\n---\n/, "")
		.trim();
}

async function loadMemories(): Promise<Memory[]> {
	const list = JSON.parse(
		await runCli(["list", "--scope", "notes", "--tags", TAG, "--sort", "oldest", "--no-snippet", "--limit", "200"]),
	);
	const items: any[] = list.items ?? [];
	if (items.length === 0) return [];

	// One JSON object per document.
	const bodies = new Map<string, string>();
	const output = await runCli(["read", ...items.map((item) => item.doc_id)]);
	for (const line of output.split("\n")) {
		if (!line.trim()) continue;
		const doc = JSON.parse(line);
		if (doc.status === "success" && typeof doc.content === "string") {
			bodies.set(doc.doc_id, noteBody(doc.content));
		}
	}

	return items.map((item) => ({
		noteId: item.note_id,
		version: item.version,
		docId: item.doc_id,
		body: bodies.get(item.doc_id) ?? item.title ?? "",
	}));
}

function renderSection(memories: Memory[]): string {
	let used = 0;
	const entries = memories.map((memory, index) => {
		const header = `### Memory ${index + 1} (note_id: ${memory.noteId}, version: ${memory.version})`;
		if (used + memory.body.length > MAX_CHARS) {
			const title = memory.body.split("\n", 1)[0];
			return `${header}\n${title} (not loaded; read it with the Linkly AI read tool, doc_id ${memory.docId})`;
		}
		used += memory.body.length;
		return `${header}\n${memory.body}`;
	});

	return `You have long-term memory that persists across sessions. It is stored as notes in the user's Linkly AI app, tagged #${TAG}, and the current memories are listed below. Treat them as the user's standing preferences: apply every relevant memory to your work without being asked, unless the user says otherwise in this conversation.

## When to save
- Save a memory when the user states a lasting preference, corrects how you work, or asks you to remember something, even if they never say "remember".
- Don't save one-off task details, things you can read from the code or files, or secrets.

## How to save
- Use the Linkly AI MCP tool note_save with app_name "Pi". If it isn't available, run: linkly note-save --mode create --content - --app-name Pi --client pi (body on stdin).
- One topic per note. First line: a short title. Then the rule, plus one line on why if the user gave a reason.
- End the body with the inline tag #${TAG}. The user has explicitly asked for this tag on every memory note, so add it even though the Linkly AI skill says not to add tags on your own initiative.
- Note bodies accept only paragraphs, line breaks, bold, strikethrough and ordered/unordered lists. Headings, italics, inline code, code blocks, links and tables are rejected, so write identifiers as plain words.
- If a memory below already covers the topic, update it instead of creating a duplicate. An edit needs both ids from the memory's header: {"mode": "edit", "note_id": "<note_id>", "base_version": "<version>", "content": "<full new body, keeping #${TAG}>"}. Never pass a library argument.
- After saving, tell the user in one short sentence what you remembered.

## Current memories

${entries.length > 0 ? entries.join("\n\n") : "(none yet)"}`;
}

export default function linklyMemoryExtension(pi: ExtensionAPI) {
	let memories: Memory[] | undefined;
	let warned = false;

	pi.on("before_agent_start", async (event, ctx) => {
		try {
			memories = await loadMemories();
		} catch (error) {
			// Keep the last good snapshot; the Desktop may be briefly unreachable.
			if (!warned && ctx.hasUI) {
				const reason = error instanceof Error ? error.message : String(error);
				ctx.ui.notify(`Linkly AI memory unavailable: ${reason}`, "warning");
				warned = true;
			}
		}
		if (memories === undefined) return;
		event.systemPromptOptions.sections.user_memory = renderSection(memories);
	});
}

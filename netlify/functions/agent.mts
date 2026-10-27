import Anthropic from "@anthropic-ai/sdk"
import type { Config } from "@netlify/functions"
import { getUser } from "@netlify/identity"

const anthropic = new Anthropic()
const MODEL = "claude-sonnet-5-5"
const MAX_TURNS = 4
// Synchronous functions have 60s; stop starting new model turns well before that.
const DEADLINE_MS = 38_000

const SHAPES = ["sphere", "box", "cylinder", "cone", "torus", "capsule"]

const blockProps = {
  id: { type: "string", description: "Stable id. Choose short unique ids for new blocks (e.g. 'ear') so later ops can reference them." },
  name: { type: "string" },
  shape: { type: "string", enum: SHAPES },
  position: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3, description: "[x, y, z] world units, ground is y=0, +z faces the camera" },
  rotation: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3, description: "Euler degrees" },
  scale: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3, description: "Per-axis size multiplier" },
  color: { type: "string", description: "#rrggbb" },
  metalness: { type: "number", minimum: 0, maximum: 1 },
  roughness: { type: "number", minimum: 0, maximum: 1 },
  emissive: { type: "string", description: "#rrggbb glow colour" },
  emissiveIntensity: { type: "number", minimum: 0, maximum: 4 },
  taper: { type: "number", minimum: 0, maximum: 2, description: "Cylinder/cone top radius factor (0 = point)" },
  thickness: { type: "number", minimum: 0.05, maximum: 0.5, description: "Torus tube thickness" },
  mirror: { type: "boolean", description: "Also render a twin mirrored across x=0" },
}

const EDIT_TOOL: Anthropic.Tool = {
  name: "edit_model",
  description:
    "Apply edits to the user's 3D block model. Operations run in order: add a block, update an existing block by id, remove a block by id, or clear everything.",
  input_schema: {
    type: "object",
    properties: {
      operations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            op: { type: "string", enum: ["add", "update", "remove", "clear"] },
            id: { type: "string", description: "Target id for update/remove" },
            block: { type: "object", properties: blockProps, required: ["shape"], description: "For add" },
            patch: { type: "object", properties: blockProps, description: "For update — only the fields to change" },
          },
          required: ["op"],
        },
      },
    },
    required: ["operations"],
  },
}

const SEARCH_TOOL: Anthropic.Tool = {
  name: "web_search",
  description:
    "Search the web for reference on what something looks like (proportions, colours, parts) before modelling it. Use sparingly — only when you genuinely need reference.",
  input_schema: {
    type: "object",
    properties: { query: { type: "string" } },
    required: ["query"],
  },
}

const SYSTEM = `You are Norvos, a friendly 3D modelling assistant inside a block-based sculpting tool.
Users build models from primitive blocks: ${SHAPES.join(", ")}.
Base sizes at scale [1,1,1]: sphere diameter 1, box 1×1×1, cylinder/cone diameter 1 and height 1, capsule ~0.6 wide × 1.2 tall, torus outer diameter ~1.
Blocks are centred on their position, so a block of height h resting on the ground has y = h/2.
"Molding" a sphere means stretching it with non-uniform scale (eggs, heads, bellies, petals) and rotating it.
Build complex models by layering many blocks; use mirror: true for symmetric pairs (place the original at +x).
When the user asks you to build or change something, call edit_model with the operations — don't just describe them.
Prefer updating existing blocks (by id) over re-adding. Keep models under ~40 blocks. Keep chat replies short (1–3 sentences) and
mention what you built plus one tip for molding it further.`

interface SearchResult {
  title: string
  url: string
  content: string
}

async function tavilySearch(query: string, apiKey: string): Promise<SearchResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query, max_results: 4, search_depth: "basic" }),
  })
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  const data = (await res.json()) as { results?: SearchResult[] }
  return (data.results ?? []).map((r) => ({ title: r.title, url: r.url, content: r.content?.slice(0, 600) ?? "" }))
}

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })
  const user = await getUser()
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 })

  let body: { messages?: { role: string; content: string }[]; blocks?: unknown[] }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const history = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 4000) }))
  while (history.length && history[0].role !== "user") history.shift()
  if (!history.length) return Response.json({ error: "Missing message" }, { status: 400 })

  const scene = JSON.stringify((body.blocks ?? []).slice(0, 80))
  const tavilyKey = process.env.TAVILY_API_KEY
  const tools = tavilyKey ? [EDIT_TOOL, SEARCH_TOOL] : [EDIT_TOOL]

  const messages: Anthropic.MessageParam[] = history
  messages[messages.length - 1] = {
    role: "user",
    content: `Current model blocks (JSON):\n${scene}\n\nRequest: ${history[history.length - 1].content}`,
  }

  const operations: unknown[] = []
  const sources: { title: string; url: string }[] = []
  let reply = ""
  const startedAt = Date.now()

  try {
    for (let turn = 0; turn < MAX_TURNS && Date.now() - startedAt < DEADLINE_MS; turn++) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM,
        tools,
        messages,
      })
      const text = response.content
        .filter((c): c is Anthropic.TextBlock => c.type === "text")
        .map((c) => c.text)
        .join("\n")
        .trim()
      if (text) reply = text

      const toolUses = response.content.filter((c): c is Anthropic.ToolUseBlock => c.type === "tool_use")
      if (response.stop_reason !== "tool_use" || !toolUses.length) break

      messages.push({ role: "assistant", content: response.content })
      const results: Anthropic.ToolResultBlockParam[] = []
      for (const call of toolUses) {
        const input = call.input as { operations?: unknown[]; query?: string }
        if (call.name === "edit_model") {
          const ops = Array.isArray(input.operations) ? input.operations : []
          operations.push(...ops)
          results.push({ type: "tool_result", tool_use_id: call.id, content: `Applied ${ops.length} operation(s).` })
        } else if (call.name === "web_search" && tavilyKey && input.query) {
          try {
            const found = await tavilySearch(input.query, tavilyKey)
            sources.push(...found.map(({ title, url }) => ({ title, url })))
            results.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(found) })
          } catch (error) {
            results.push({ type: "tool_result", tool_use_id: call.id, content: String(error), is_error: true })
          }
        } else {
          results.push({ type: "tool_result", tool_use_id: call.id, content: "Unknown tool", is_error: true })
        }
      }
      messages.push({ role: "user", content: results })
    }
  } catch (error) {
    console.error("agent error", error)
    return Response.json({ error: "The assistant is unavailable right now. Try again in a moment." }, { status: 502 })
  }

  return Response.json({
    reply: reply || (operations.length ? "Done — take a look!" : "I'm not sure how to help with that one."),
    operations,
    sources: sources.slice(0, 6),
  })
}

export const config: Config = {
  path: "/api/agent",
}

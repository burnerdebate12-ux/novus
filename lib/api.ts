import type { Design } from "@/lib/avatar/types"
import type { Block, BlockOp } from "@/lib/blocks/types"

export type ModelKind = "avatar" | "blocks"

export interface ModelSummary {
  id: number
  name: string
  kind: ModelKind
  updatedAt: string
}

export type SavedModel = ModelSummary &
  ({ kind: "avatar"; data: { design: Design } } | { kind: "blocks"; data: { blocks: Block[] } })

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const api = {
  listModels: () => request<ModelSummary[]>("/api/models"),
  getModel: (id: number) => request<SavedModel>(`/api/models/${id}`),
  createModel: (kind: ModelKind, name: string, data: unknown) =>
    request<ModelSummary>("/api/models", { method: "POST", body: JSON.stringify({ kind, name, data }) }),
  updateModel: (id: number, name: string, data: unknown) =>
    request<ModelSummary>(`/api/models/${id}`, { method: "PUT", body: JSON.stringify({ name, data }) }),
  deleteModel: (id: number) => request<void>(`/api/models/${id}`, { method: "DELETE" }),
  askAgent: (messages: AgentMessage[], blocks: Block[]) =>
    request<AgentReply>("/api/agent", { method: "POST", body: JSON.stringify({ messages, blocks }) }),
}

export interface AgentMessage {
  role: "user" | "assistant"
  content: string
}

export interface AgentReply {
  reply: string
  operations: BlockOp[]
  sources: { title: string; url: string }[]
}

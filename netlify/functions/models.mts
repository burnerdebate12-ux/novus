import type { Config, Context } from "@netlify/functions"
import { getUser } from "@netlify/identity"
import { and, desc, eq } from "drizzle-orm"
import { db } from "../../db/index"
import { models } from "../../db/schema"

const KINDS = new Set(["avatar", "blocks"])
const MAX_BYTES = 500_000

const summary = {
  id: models.id,
  name: models.name,
  kind: models.kind,
  updatedAt: models.updatedAt,
}

export default async (req: Request, context: Context) => {
  const user = await getUser()
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 })

  const id = context.params.id ? Number(context.params.id) : null
  if (context.params.id && !Number.isInteger(id)) return Response.json({ error: "Invalid id" }, { status: 400 })
  const owned = id ? and(eq(models.id, id), eq(models.userId, user.id)) : undefined

  if (req.method === "GET") {
    if (!owned) {
      const rows = await db.select(summary).from(models).where(eq(models.userId, user.id)).orderBy(desc(models.updatedAt))
      return Response.json(rows)
    }
    const [row] = await db.select().from(models).where(owned)
    return row ? Response.json(row) : Response.json({ error: "Not found" }, { status: 404 })
  }

  if (req.method === "DELETE" && owned) {
    await db.delete(models).where(owned)
    return new Response(null, { status: 204 })
  }

  if (req.method === "POST" || req.method === "PUT") {
    const raw = await req.text()
    if (raw.length > MAX_BYTES) return Response.json({ error: "Model is too large" }, { status: 413 })
    let body: { name?: unknown; kind?: unknown; data?: unknown }
    try {
      body = JSON.parse(raw)
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 })
    }
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 80) : "Untitled"
    if (body.data === undefined || body.data === null) return Response.json({ error: "Missing data" }, { status: 400 })

    if (req.method === "PUT" && owned) {
      const [row] = await db
        .update(models)
        .set({ name, data: body.data, updatedAt: new Date() })
        .where(owned)
        .returning(summary)
      return row ? Response.json(row) : Response.json({ error: "Not found" }, { status: 404 })
    }
    if (req.method === "POST" && !owned) {
      if (typeof body.kind !== "string" || !KINDS.has(body.kind)) return Response.json({ error: "Invalid kind" }, { status: 400 })
      const [row] = await db
        .insert(models)
        .values({ userId: user.id, name, kind: body.kind, data: body.data })
        .returning(summary)
      return Response.json(row, { status: 201 })
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 })
}

export const config: Config = {
  path: ["/api/models", "/api/models/:id"],
}

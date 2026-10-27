import { index, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

/** A saved creation. `kind` is "avatar" (character designer) or "blocks" (block builder). */
export const models = pgTable(
  "models",
  {
    id: serial().primaryKey(),
    userId: text("user_id").notNull(),
    name: text().notNull(),
    kind: text().notNull(),
    data: jsonb().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("models_user_id_idx").on(t.userId)],
)

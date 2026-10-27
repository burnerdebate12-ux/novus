import type { Object3D } from "three"
import { generateJsonSchema } from "./code-gen"
import type { Design } from "./types"

export type ExportFormat = "glb" | "gltf" | "obj" | "json"

export const EXPORT_FORMATS: { id: ExportFormat; label: string; description: string; ext: string }[] = [
  { id: "glb", label: "GLB Binary", description: "Single-file glTF 2.0 for Unity, Unreal, Three.js", ext: "glb" },
  { id: "gltf", label: "glTF JSON", description: "Human-readable glTF 2.0 with embedded buffers", ext: "gltf" },
  { id: "obj", label: "Wavefront OBJ", description: "Universal mesh format for Blender & Maya", ext: "obj" },
  { id: "json", label: "JSON Schema", description: "Avatar config for runtime re-hydration", ext: "json" },
]

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "avatar"
  )
}

function download(data: BlobPart, filename: string, type: string) {
  const blob = new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return blob.size
}

export async function exportAvatar(
  format: ExportFormat,
  avatar: Object3D | null,
  design: Design,
  projectName: string,
): Promise<{ filename: string; bytes: number }> {
  const base = slugify(projectName)

  if (format === "json") {
    const filename = `${base}.avatar.json`
    return { filename, bytes: download(generateJsonSchema(design, projectName), filename, "application/json") }
  }

  if (!avatar) throw new Error("The 3D viewport is still loading")

  if (format === "obj") {
    const { OBJExporter } = await import("three/examples/jsm/exporters/OBJExporter.js")
    const filename = `${base}.obj`
    return { filename, bytes: download(new OBJExporter().parse(avatar), filename, "text/plain") }
  }

  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js")
  const binary = format === "glb"
  const result = await new GLTFExporter().parseAsync(avatar, { binary, onlyVisible: true })
  const filename = `${base}.${binary ? "glb" : "gltf"}`
  const data = binary ? (result as ArrayBuffer) : JSON.stringify(result, null, 2)
  return {
    filename,
    bytes: download(data, filename, binary ? "model/gltf-binary" : "model/gltf+json"),
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

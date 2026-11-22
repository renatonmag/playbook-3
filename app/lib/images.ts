// Strip any folder and the "<timestamp>-<id>-" prefix added on upload.
export function displayName(name: string) {
  return name.slice(name.lastIndexOf('/') + 1).replace(/^\d+-[0-9a-f]{8}-/, '')
}

export function formatSize(bytes: number | null) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function copyToClipboard(text: string) {
  if (!text) return
  void navigator.clipboard.writeText(text)
}


export function escapeCsvCell(value: unknown) {
  let text = String(value ?? "").replace(/\0/g, "");
  if (/^[\t\r ]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, "\"\"")}"`;
}


export function chunkDocument(
  title: string,
  body: string,
  maxWords = 250,
  overlapWords = 30,
): string[] {
  const cleanBody = body.trim();
  if (!cleanBody) return [];

  const paragraphs = cleanBody
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentWords: string[] = [];

  for (const para of paragraphs) {
    const paraWords = para.split(/\s+/).filter(Boolean);

    if (currentWords.length + paraWords.length <= maxWords) {
      currentWords.push(...paraWords);
    } else {
      if (currentWords.length > 0) {
        chunks.push(`${title}\n\n${currentWords.join(" ")}`);
        // Overlap: keep the last N words
        currentWords = currentWords.slice(-overlapWords);
      }
      currentWords.push(...paraWords);
    }
  }

  if (currentWords.length > 0) {
    chunks.push(`${title}\n\n${currentWords.join(" ")}`);
  }

  return chunks.length > 0 ? chunks : [`${title}\n\n${cleanBody}`];
}

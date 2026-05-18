import { createWorker } from 'tesseract.js';

export async function performOCR(imageSource: string | File): Promise<string> {
  const worker = await createWorker('por'); // Portuguese support
  const { data: { text } } = await worker.recognize(imageSource);
  await worker.terminate();
  return text;
}

export async function analyzeFileWithAI(fileName: string, fileType: string, textContent?: string) {
  const response = await fetch('/api/ai/analyze-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, fileType, textContent })
  });
  return response.json();
}

export async function semanticSearch(query: string, files: any[]) {
  const response = await fetch('/api/ai/semantic-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, files })
  });
  return response.json();
}

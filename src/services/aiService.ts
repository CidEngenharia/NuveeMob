import { createWorker } from 'tesseract.js';

export async function performOCR(imageSource: string | File): Promise<string> {
  const worker = await createWorker('por'); // Portuguese support
  const { data: { text } } = await worker.recognize(imageSource);
  await worker.terminate();
  return text;
}

const isProduction = import.meta.env.PROD;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function analyzeFileWithAI(fileName: string, fileType: string, textContent?: string) {
  const url = isProduction 
    ? `${SUPABASE_URL}/functions/v1/analyze-file`
    : '/api/ai/analyze-file';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (isProduction && SUPABASE_ANON_KEY) {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileName, fileType, textContent })
  });
  return response.json();
}

export async function semanticSearch(query: string, files: any[]) {
  const url = isProduction
    ? `${SUPABASE_URL}/functions/v1/semantic-search`
    : '/api/ai/semantic-search';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (isProduction && SUPABASE_ANON_KEY) {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, files })
  });
  return response.json();
}

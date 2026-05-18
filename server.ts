import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/ai/analyze-file", async (req, res) => {
  try {
    const { fileName, fileType, textContent } = req.body;
    
    const prompt = `Analyze this file and provide a category, short summary, and 3 tags. 
    FileName: ${fileName}
    FileType: ${fileType}
    Content (partial): ${textContent?.substring(0, 1000)}
    
    Return JSON only: { "category": "...", "summary": "...", "tags": ["...", "...", "..."] }`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    res.json(JSON.parse(result.text || '{}'));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/semantic-search", async (req, res) => {
  try {
    const { query, files } = req.body;
    
    const fileListSnippet = files.map((f: any) => 
      `- ID: ${f.id}, Name: ${f.name}, Category: ${f.category || 'other'}, Summary: ${f.summary || 'No summary available.'}, Tags: ${f.tags ? f.tags.join(', ') : 'None'}`
    ).join('\n');
    
    const prompt = `Você é o assistente virtual inteligente NuveeAssist do aplicativo NuveeMob.
    O usuário está buscando ou perguntando o seguinte: "${query}"
    Aqui está a lista de arquivos atualmente disponíveis no sistema:
    ${fileListSnippet}
    
    Instruções:
    1. Analise se algum dos arquivos disponíveis é semanticamente relevante para a mensagem ou pergunta do usuário.
    2. Identifique os IDs dos arquivos mais relevantes. Retorne um array vazio [] se nenhum arquivo for relevante.
    3. Escreva uma resposta amigável, direta e concisa em português do Brasil explicando o que você encontrou ou respondendo à dúvida do usuário com base nos arquivos. Não use fontes em negrito no texto da resposta.
    
    Retorne estritamente um objeto JSON com o seguinte formato:
    {
      "response": "Sua resposta textual simpática aqui, sem usar fontes em negrito.",
      "relevantFileIds": ["id1", "id2"]
    }`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    res.json(JSON.parse(result.text || '{"response": "Nenhum arquivo relevante encontrado.", "relevantFileIds": []}'));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

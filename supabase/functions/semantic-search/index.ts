import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { query, files } = await req.json()
    const apiKey = Deno.env.get("GEMINI_API_KEY")

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not defined" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const fileListSnippet = files.map((f: any) => 
      `- ID: ${f.id}, Name: ${f.name}, Category: ${f.category || 'other'}, Summary: ${f.summary || 'No summary available.'}, Tags: ${f.tags ? f.tags.join(', ') : 'None'}`
    ).join('\n')

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
    }`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || `{"response": "Nenhum arquivo relevante encontrado.", "relevantFileIds": []}`

    return new Response(
      text,
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

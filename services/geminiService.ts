import { GoogleGenAI } from "@google/genai";
import { Mode } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getFinancialAdvice = async (mode: Mode, data: any): Promise<string> => {
  try {
    const prompt = `
      Atue como um consultor financeiro sênior para a plataforma "Gerencie".
      
      Analise os seguintes dados do painel ${mode}:
      ${JSON.stringify(data, null, 2)}
      
      Forneça um feedback curto, direto e acionável (máximo 3 frases) sobre a saúde financeira atual e uma sugestão de melhoria.
      Use um tom profissional mas encorajador. Responda em Português do Brasil.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar uma análise no momento.";
  } catch (error) {
    console.error("Error fetching Gemini advice:", error);
    return "Erro ao conectar com o assistente financeiro. Verifique sua chave API.";
  }
};

export interface ExtractedTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  confidence: string;
}

export const processMessage = async (
  message: string, 
  media?: { data: string, mimeType: string },
  mode: Mode = Mode.PERSONAL
): Promise<ExtractedTransaction | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const parts: any[] = [];
    
    if (media) {
      parts.push({
        inlineData: {
          mimeType: media.mimeType,
          data: media.data
        }
      });
    }

    let promptText = `
      Você é um assistente financeiro inteligente (Agent) do app "Gerencie".
      Sua tarefa é analisar a entrada do usuário (texto, imagem de recibo ou áudio) e extrair os dados para criar uma transação financeira.
      
      Data de hoje: ${today}
      Modo atual: ${mode}

      Instruções Específicas:
      1. Se houver ÁUDIO: O áudio tem prioridade. Transcreva mentalmente e extraia a intenção.
         - "Gastei 50 no mercado" -> Despesa, 50, Mercado, Categoria: Alimentação.
         - "Recebi 1000 reais hoje" -> Receita, 1000, Recebimento, Categoria: Salário/Renda.
      2. Se houver IMAGEM: Analise o recibo para encontrar Total, Data e Estabelecimento.
      3. Se houver apenas TEXTO: Extraia do texto.

      Campos obrigatórios:
      - amount (número puro)
      - type ("income" ou "expense")
      - description (breve resumo)
      - category (sugira uma categoria apropriada: Alimentação, Transporte, Lazer, Casa, Saúde, Salário, Vendas, Outros)
      - date (YYYY-MM-DD, use hoje se não especificado)

      IMPORTANTE: Retorne APENAS um objeto JSON válido. Não use markdown. Não inclua explicações.
      
      Formato JSON esperado:
      {
        "description": "string",
        "amount": number,
        "type": "income" | "expense",
        "category": "string",
        "date": "YYYY-MM-DD"
      }
    `;

    if (message) {
      promptText += `\nEntrada de texto do usuário: "${message}"`;
    } else if (media && media.mimeType.includes('audio')) {
      promptText += `\n(Este é um arquivo de áudio enviado pelo usuário. Analise o conteúdo falado.)`;
    }

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;

    try {
      const data = JSON.parse(text);
      if (data && data.amount && data.description) {
        return data as ExtractedTransaction;
      }
      return null;
    } catch (e) {
      console.error("Failed to parse JSON from Agent:", text);
      return null;
    }

  } catch (error) {
    console.error("Error processing agent message:", error);
    return null;
  }
};
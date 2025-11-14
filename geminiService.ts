import { GoogleGenAI, Type } from "@google/genai";
import { DEPOSIT_ENTITY, DEPOSIT_REFERENCE } from '../constants';
import type { AIReceiptAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

const receiptAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    isValid: { type: Type.BOOLEAN },
    reason: { type: Type.STRING },
    extractedData: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, nullable: true },
        currency: { type: Type.STRING, nullable: true },
        reference: { type: Type.STRING, nullable: true },
        entity: { type: Type.STRING, nullable: true },
        transactionId: { type: Type.STRING, nullable: true },
        date: { type: Type.STRING, nullable: true },
      },
    },
    confidenceScore: { type: Type.NUMBER },
    isPotentiallyForged: { type: Type.BOOLEAN },
    rejectionReason: { type: Type.STRING, nullable: true },
  },
};

export const analyzeReceipt = async (receiptFile: File, amount: number): Promise<AIReceiptAnalysis> => {
  try {
    const base64Image = await fileToBase64(receiptFile);
    const imagePart = {
      inlineData: {
        mimeType: receiptFile.type,
        data: base64Image,
      },
    };

    const textPart = {
      text: `You are an expert financial document analyst for an Angolan company. Analyze the provided image of a bank deposit receipt ('comprovativo'). Your goal is to verify if it confirms a payment of exactly ${amount} AOA (Angolan Kwanza). The required payment details are:
- Amount (Valor): ${amount}
- Entity (Entidade): ${DEPOSIT_ENTITY}
- Reference (Referência): ${DEPOSIT_REFERENCE}

Analyze the image, extract the details, and determine if the receipt is valid for a payment of ${amount} Kz. The 'isValid' field must be true ONLY IF ALL conditions are met: the extracted amount is exactly ${amount}, the entity matches ${DEPOSIT_ENTITY}, and the reference matches ${DEPOSIT_REFERENCE}. Provide a response in a strict JSON format. Do not add any text before or after the JSON object.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptAnalysisSchema,
      }
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString) as AIReceiptAnalysis;
    
    // Additional backend-like validation
    if (result.isValid) { // Only run extra checks if the AI thinks it's valid
        if (result.extractedData?.reference !== DEPOSIT_REFERENCE) {
            result.isValid = false;
            result.rejectionReason = `Referência inválida. Esperado: ${DEPOSIT_REFERENCE}, Encontrado: ${result.extractedData?.reference || 'N/A'}`;
        }
        else if (result.extractedData?.entity !== DEPOSIT_ENTITY) {
            result.isValid = false;
            result.rejectionReason = `Entidade inválida. Esperada: ${DEPOSIT_ENTITY}, Encontrada: ${result.extractedData?.entity || 'N/A'}`;
        }
         else if (result.extractedData?.amount !== amount) {
            result.isValid = false;
            result.rejectionReason = `Valor do comprovativo (${result.extractedData?.amount?.toLocaleString('pt-AO')} Kz) não corresponde ao valor informado (${amount.toLocaleString('pt-AO')} Kz).`;
        }
    }


    return result;
  } catch (error) {
    console.error("Error analyzing receipt with Gemini API:", error);
    return {
      isValid: false,
      reason: "API Error or invalid response format.",
      rejectionReason: "Ocorreu um erro ao analisar o comprovativo. Tente novamente.",
      extractedData: {
        amount: null,
        currency: null,
        reference: null,
        entity: null,
        transactionId: null,
        date: null,
      },
      confidenceScore: 0,
      isPotentiallyForged: false,
    };
  }
};

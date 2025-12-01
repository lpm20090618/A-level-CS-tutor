
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Attachment, TeachingPersona, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = 'gemini-2.5-flash';

// Cambridge 9618 Pseudocode Standard (from pseudocode.pro)
const PSEUDOCODE_GUIDE = `
 STRICT CAMBRIDGE 9618 PSEUDOCODE GUIDE:
 - Assignment: Use '<-' (e.g., Count <- 0)
 - Comparison: =, <>, >, <, >=, <=
 - Logic: AND, OR, NOT
 - Input/Output: INPUT x, OUTPUT "Hello"
 - Selection:
   IF condition THEN ... ELSE ... ENDIF
   CASE OF variable ... value1: ... value2: ... OTHERWISE ... ENDCASE
 - Iteration:
   FOR i <- 1 TO 10 ... NEXT i
   REPEAT ... UNTIL condition
   WHILE condition DO ... ENDWHILE
 - Arrays: DECLARE MyArr : ARRAY[1:10] OF INTEGER
 - File Handling: OPENFILE, READFILE, WRITEFILE, CLOSEFILE
 - Procedures: PROCEDURE MyProc(BYVAL x : INTEGER) ... ENDPROCEDURE
 - Functions: FUNCTION MyFunc() RETURNS INTEGER ... ENDFUNCTION
 - Comments: // Comment
 - Variables: DECLARE MyVar : STRING
 ALWAYS USE THESE CONVENTIONS WHEN WRITING PSEUDOCODE.
`;

const PERSONA_PROMPTS: Record<TeachingPersona, Record<Language, string>> = {
  standard: {
    en: `You are an expert A-Level Computer Science (9618) tutor. Explain concepts clearly, use analogies, and provide examples in Python, VB.NET, or Java when relevant. Use Markdown for formatting. ${PSEUDOCODE_GUIDE}`,
    zh: `你是一位专业的 A-Level 计算机科学 (9618) 导师。请清晰地解释概念，使用类比，并在相关时提供 Python、VB.NET 或 Java 的示例。使用 Markdown 格式。请用中文回答。 ${PSEUDOCODE_GUIDE}`
  },
  socratic: {
    en: `You are a Socratic tutor for A-Level CS 9618. Do not give the answer directly. Ask guiding questions to help the student derive the answer. Be encouraging but firm on logic. ${PSEUDOCODE_GUIDE}`,
    zh: `你是 A-Level CS 9618 的苏格拉底式导师。不要直接给出答案。提出引导性问题，帮助学生推导出答案。在逻辑上要坚定，但态度要鼓励。请用中文回答。 ${PSEUDOCODE_GUIDE}`
  },
  examiner: {
    en: `You are a strict Cambridge examiner for 9618. Ask viva-style questions to test depth of understanding. Grade responses critically. Focus on technical accuracy and terminology. ${PSEUDOCODE_GUIDE}`,
    zh: `你是 9618 课程的严格剑桥考官。提出口试风格的问题以测试理解深度。批判性地评分回答。专注于技术准确性和术语。请用中文回答。 ${PSEUDOCODE_GUIDE}`
  }
};

export const chatWithGemini = async (
  history: string[],
  message: string,
  attachments: Attachment[],
  persona: TeachingPersona,
  language: Language
): Promise<string> => {
  try {
    const systemInstruction = PERSONA_PROMPTS[persona][language];
    
    const contentParts: any[] = [];
    
    // Add context from history if available
    if (history.length > 0) {
        contentParts.push({ text: `Context from previous messages:\n${history.join("\n")}\n---\n` });
    }
    
    // Add attachments
    for (const att of attachments) {
        contentParts.push({
            inlineData: {
                mimeType: att.mimeType,
                data: att.data
            }
        });
    }
    
    // Add user message
    contentParts.push({ text: message });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
          role: 'user',
          parts: contentParts
      },
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || (language === 'zh' ? "未生成回复。" : "No response generated.");
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return language === 'zh' 
        ? "目前连接剑桥大纲数据库时遇到问题，请重试。" 
        : "I'm having trouble connecting to the Cambridge syllabus database right now. Please try again.";
  }
};

export const generateQuizQuestions = async (topics: string[], language: Language): Promise<QuizQuestion[]> => {
    try {
        const topicStr = topics.length > 0 ? topics.join(", ") : (language === 'zh' ? "9618 教学大纲" : "General 9618 Syllabus");
        const langInstruction = language === 'zh' ? "Generate the questions and explanations entirely in Chinese (Simplified)." : "Generate in English.";
        
        const prompt = `Generate 5 multiple-choice questions for A-Level Computer Science (9618) focusing on: ${topicStr}. 
        ${langInstruction}
        Include 4 options, the correct index (0-3), and a brief explanation.`;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctIndex: { type: Type.INTEGER },
                            explanation: { type: Type.STRING }
                        },
                        required: ["question", "options", "correctIndex", "explanation"]
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return [];
    } catch (error) {
        console.error("Quiz Gen Error:", error);
        return [];
    }
}

export const gradeSubmission = async (text: string, files: Attachment[], language: Language): Promise<string> => {
    try {
        const parts: any[] = [];
        for (const file of files) {
            parts.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.data
                }
            });
        }
        
        const promptText = language === 'zh' 
            ? `请根据 A-Level 计算机科学 9618 标准对以下提交内容进行评分。
               如果是代码，请检查正确性、效率和注释。
               如果是理论，请检查关键得分点。
               如果可能，提供分数等级（A*-U）估计，并列出改进建议。请用中文回答。
               ${PSEUDOCODE_GUIDE}
               
               提交内容：
               ${text}`
            : `Please grade the following submission against A-Level Computer Science 9618 standards. 
               If it's code, check for correctness, efficiency, and comments. 
               If it's theory, check for key marking points.
               Provide a grade (A*-U) estimate if possible and bullet points for improvement.
               ${PSEUDOCODE_GUIDE}
               
               Submission:
               ${text}`;

        parts.push({ text: promptText });

        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
                systemInstruction: language === 'zh' ? "你是一位严格的剑桥考官。" : "You are a strict Cambridge examiner."
            }
        });
        
        return response.text || (language === 'zh' ? "无法生成反馈。" : "Could not generate feedback.");
    } catch (e) {
        console.error("Grading Error:", e);
        return language === 'zh' ? "评分出错。" : "Error grading submission.";
    }
}

export const analyzeCode = async (code: string, language: string, userLang: Language): Promise<string> => {
     try {
        const langInstruction = userLang === 'zh' ? "Please provide the analysis in Chinese (Simplified)." : "Provide analysis in English.";
        const prompt = `Analyze the following ${language} code. 
        1. Explain what it does.
        2. Determine the Big O time complexity.
        3. Identify any potential bugs or edge cases.
        4. Suggest optimizations.
        ${langInstruction}
        ${PSEUDOCODE_GUIDE}
        
        Code:
        ${code}`;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                systemInstruction: userLang === 'zh' ? "你是一位专家级程序员和计算机科学导师。" : "You are an expert programmer and computer science tutor."
            }
        });
        
        return response.text || (userLang === 'zh' ? "分析失败。" : "Analysis failed.");
    } catch (e) {
        console.error("Analysis Error:", e);
        return userLang === 'zh' ? "代码分析出错。" : "Error analyzing code.";
    }
}

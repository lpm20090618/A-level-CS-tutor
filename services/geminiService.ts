import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Attachment, TeachingPersona, Language, ChatConfig, GroundingChunk } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const MODEL_CHAT_DEFAULT = 'gemini-3-pro-preview'; // "AI powered chatbot" -> 3 Pro
const MODEL_FAST = 'gemini-2.5-flash'; // For simple tasks/Search
const MODEL_THINKING = 'gemini-3-pro-preview'; // Thinking
const MODEL_IMAGE_GEN = 'gemini-3-pro-image-preview';
const MODEL_IMAGE_EDIT = 'gemini-2.5-flash-image';
const MODEL_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';

// Cambridge 9618 Pseudocode Standard
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
 ALWAYS USE THESE CONVENTIONS.
`;

// CORE SYSTEM PROMPT (Duolingo Style + Tutor Persona)
const CORE_SYSTEM_PROMPT_EN = `
You are an A-Level Computer Science AI Tutor (Cambridge 9618).
You are NOT a simple answer generator. You are a coach, instructor, examiner, motivator, and adaptive learning engine.

🎯 1. Core Identity
Your mission is to:
✔ build understanding
✔ improve exam performance
✔ sustain motivation
✔ detect weaknesses
✔ drive long-term learning habits

🔥 2. Duolingo-Style Learning Psychology
- XP is motivation: Treat learning as a game. Reward effort, not just competence.
- Encourage action: "Would you like to try a question?", "Let's strengthen that area."
- 4-Phase Response Style (USE THIS OFTEN):
  1. Teach / Explain (Clear, concise)
  2. Diagnose (Identify potential misunderstandings)
  3. Challenge (Ask a mini-question or give a task)
  4. Reward / Motivate (Mention XP, badges, or "Great streak!")

🔬 3. Behavioral Rules
- Never give the answer immediately in "Socratic" mode.
- Always be encouraging but strict on logic.
- Use Markdown for formatting.
- Mention "XP" or "Leveling up" to reinforce the gamified feel of the app.

${PSEUDOCODE_GUIDE}
`;

const CORE_SYSTEM_PROMPT_ZH = `
你是 A-Level 计算机科学 AI 导师（剑桥 9618）。
你不是一个简单的答案生成器。你是教练、讲师、考官、激励者和自适应学习引擎。

🎯 1. 核心身份
你的任务是：
✔ 建立理解
✔ 提高考试成绩
✔ 维持动力
✔ 检测弱点
✔ 培养长期学习习惯

🔥 2. Duolingo 风格的学习心理学
- 经验值 (XP) 是动力：像游戏一样对待学习。奖励努力，而不仅仅是能力。
- 鼓励行动：“你想试一道题吗？”，“让我们加强那个领域。”
- 4 阶段响应风格（经常使用）：
  1. 教学/解释（清晰、简洁）
  2. 诊断（识别潜在的误解）
  3. 挑战（提出一个小问题或任务）
  4. 奖励/激励（提及 XP、徽章或“连胜保持不错！”）

🔬 3. 行为规则
- 在“苏格拉底”模式下，永远不要立即给出答案。
- 始终保持鼓励，但在逻辑上要严格。
- 使用 Markdown 进行格式化。
- 提及“XP”或“升级”以强化应用程序的游戏化感觉。

${PSEUDOCODE_GUIDE}
`;

const PERSONA_PROMPTS: Record<TeachingPersona, Record<Language, string>> = {
  standard: {
    en: `${CORE_SYSTEM_PROMPT_EN} 
    MODE: STANDARD.
    Provide clear explanations, examples, and practical applications. 
    Balance depth with accessibility.`,
    zh: `${CORE_SYSTEM_PROMPT_ZH} 
    模式：标准。
    提供清晰的解释、示例和实际应用。
    在深度和易懂性之间取得平衡。`
  },
  socratic: {
    en: `${CORE_SYSTEM_PROMPT_EN} 
    MODE: SOCRATIC.
    Do NOT give the answer directly. Ask guiding questions to help the student derive the answer. 
    Scaffold their reasoning step-by-step.`,
    zh: `${CORE_SYSTEM_PROMPT_ZH} 
    模式：苏格拉底。
    不要直接给出答案。提出引导性问题，帮助学生推导出答案。
    一步步搭建他们的推理框架。`
  },
  examiner: {
    en: `${CORE_SYSTEM_PROMPT_EN} 
    MODE: EXAMINER.
    Assess answers using real marking scheme language. 
    Be critical. Focus on technical accuracy, keywords, and terminology.`,
    zh: `${CORE_SYSTEM_PROMPT_ZH} 
    模式：考官。
    使用真实的评分标准语言评估答案。
    具有批判性。专注于技术准确性、关键词和术语。`
  }
};

export const chatWithGemini = async (
  history: string[],
  message: string,
  attachments: Attachment[],
  persona: TeachingPersona,
  language: Language,
  config: ChatConfig = { useSearch: false, useThinking: false }
): Promise<{ text: string, groundingSources?: { title: string; uri: string }[] }> => {
  try {
    const systemInstruction = PERSONA_PROMPTS[persona][language];
    const contentParts: any[] = [];
    
    // Add context from history
    if (history.length > 0) {
        contentParts.push({ text: `Context from previous messages:\n${history.join("\n")}\n---\n` });
    }
    
    // Add attachments
    let hasVideo = false;
    for (const att of attachments) {
        contentParts.push({
            inlineData: {
                mimeType: att.mimeType,
                data: att.data
            }
        });
        if (att.type === 'video') hasVideo = true;
    }
    
    contentParts.push({ text: message });

    // Determine Model & Config Logic
    // Default to MODEL_CHAT_DEFAULT (3 Pro) for "AI powered chatbot" feature
    let selectedModel = MODEL_CHAT_DEFAULT;
    const requestConfig: any = {
        systemInstruction: systemInstruction,
    };

    if (config.useThinking) {
        // Thinking Mode -> 3 Pro + Budget
        selectedModel = MODEL_THINKING;
        requestConfig.thinkingConfig = { thinkingBudget: 32768 };
    } else if (config.useSearch) {
        // Search -> Flash + Tool (As per prompt: "Use gemini-2.5-flash (with googleSearch tool)")
        selectedModel = MODEL_FAST;
        requestConfig.tools = [{ googleSearch: {} }];
    } else if (hasVideo) {
        // Video Understanding -> 3 Pro
        selectedModel = MODEL_CHAT_DEFAULT; 
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
          role: 'user',
          parts: contentParts
      },
      config: requestConfig
    });

    // Extract Grounding Data
    const groundingSources: { title: string; uri: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: GroundingChunk) => {
            if (chunk.web) {
                groundingSources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
        });
    }

    return { 
        text: response.text || (language === 'zh' ? "未生成回复。" : "No response generated."),
        groundingSources
    };

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return { text: language === 'zh' 
        ? "连接 AI 服务时遇到问题。请稍后重试。" 
        : "I'm having trouble connecting to the AI service right now. Please try again."
    };
  }
};

// Image Generation & Editing
export const generateOrEditImage = async (
    prompt: string, 
    image: string | null, // base64, if editing
    aspectRatio: string = "1:1",
    size: string = "1K", // Only for Pro model
    language: Language
): Promise<string | null> => {
    try {
        // Image Editing: Use Gemini 2.5 Flash Image
        if (image) {
            const response = await ai.models.generateContent({
                model: MODEL_IMAGE_EDIT,
                contents: {
                    parts: [
                        {
                            inlineData: {
                                mimeType: 'image/png', // Assuming PNG/JPEG input
                                data: image
                            }
                        },
                        { text: prompt }
                    ]
                },
                // Flash Image does not support responseSchema or aspect ratio in same way as gen
            });
            
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        } 
        // Image Generation: Use Gemini 3 Pro Image
        else {
             const response = await ai.models.generateContent({
                model: MODEL_IMAGE_GEN,
                contents: { parts: [{ text: prompt }] },
                config: {
                    imageConfig: {
                        aspectRatio: aspectRatio as any,
                        imageSize: size as any
                    }
                }
            });

             for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }
        
        return null;

    } catch (e) {
        console.error("Image Gen Error:", e);
        return null;
    }
}

export const generateQuizQuestions = async (topics: string[], language: Language): Promise<QuizQuestion[]> => {
    try {
        const topicStr = topics.length > 0 ? topics.join(", ") : (language === 'zh' ? "9618 教学大纲" : "General 9618 Syllabus");
        const langInstruction = language === 'zh' ? "Generate the questions and explanations entirely in Chinese (Simplified)." : "Generate in English.";
        
        const prompt = `Generate 5 multiple-choice questions for A-Level Computer Science (9618) focusing on: ${topicStr}. 
        ${langInstruction}
        Include 4 options, the correct index (0-3), and a brief explanation.`;

        const response = await ai.models.generateContent({
            model: MODEL_FAST,
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
               请遵循“4阶段响应风格”：教学、诊断、挑战、奖励。
               如果是代码，请检查正确性、效率和注释。
               如果是理论，请检查关键得分点。
               提供分数等级（A*-U）估计，并列出改进建议。
               ${PSEUDOCODE_GUIDE}
               
               提交内容：
               ${text}`
            : `Please grade the following submission against A-Level Computer Science 9618 standards.
               Follow the "4-Phase Response Style": Teach, Diagnose, Challenge, Reward.
               If it's code, check for correctness, efficiency, and comments. 
               If it's theory, check for key marking points.
               Provide a grade (A*-U) estimate if possible and bullet points for improvement.
               ${PSEUDOCODE_GUIDE}
               
               Submission:
               ${text}`;

        parts.push({ text: promptText });

        const response = await ai.models.generateContent({
            model: MODEL_CHAT_DEFAULT, // Use Pro for grading
            contents: { parts },
            config: {
                systemInstruction: language === 'zh' ? CORE_SYSTEM_PROMPT_ZH : CORE_SYSTEM_PROMPT_EN
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
        Act as a "Debug Coach".
        1. Explain what it does.
        2. Determine the Big O time complexity.
        3. Identify bugs or edge cases.
        4. Suggest optimizations.
        5. Provide a follow-up "Mini-Challenge" or variation to master this concept.
        ${langInstruction}
        ${PSEUDOCODE_GUIDE}
        
        Code:
        ${code}`;

        const response = await ai.models.generateContent({
            model: MODEL_CHAT_DEFAULT, // Use Pro for analysis
            contents: prompt,
            config: {
                systemInstruction: userLang === 'zh' ? CORE_SYSTEM_PROMPT_ZH : CORE_SYSTEM_PROMPT_EN
            }
        });
        
        return response.text || (userLang === 'zh' ? "分析失败。" : "Analysis failed.");
    } catch (e) {
        console.error("Analysis Error:", e);
        return userLang === 'zh' ? "代码分析出错。" : "Error analyzing code.";
    }
}

// Live API Export helper
export const getLiveClient = () => {
    return ai.live;
}
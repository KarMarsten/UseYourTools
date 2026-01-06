import { loadPreferences } from './preferences';
import { EmailTone } from './emailTemplates';

export interface AIRewriteResult {
  text: string | null;
  error?: string;
  usedAI: boolean;
}

/**
 * Rewrite email text using AI based on tone
 */
export const rewriteWithAI = async (
  text: string,
  tone: EmailTone | string
): Promise<AIRewriteResult> => {
  try {
    const preferences = await loadPreferences();
    
    if (preferences.aiToneRewriting === 'none') {
      return { text: null, usedAI: false }; // AI rewriting disabled
    }

    if (preferences.aiToneRewriting === 'openai' && preferences.openaiApiKey) {
      const result = await rewriteWithOpenAI(text, tone, preferences.openaiApiKey);
      if (result.error) {
        return { text: null, error: result.error, usedAI: true };
      }
      return { text: result.text, usedAI: true };
    }

    if (preferences.aiToneRewriting === 'gemini' && preferences.geminiApiKey) {
      const result = await rewriteWithGemini(text, tone, preferences.geminiApiKey);
      if (result.error) {
        return { text: null, error: result.error, usedAI: true };
      }
      return { text: result.text, usedAI: true };
    }

    return { text: null, usedAI: false, error: 'No API key configured' };
  } catch (error: any) {
    console.error('Error in AI tone rewriting:', error);
    return { 
      text: null, 
      usedAI: true, 
      error: error?.message || 'Unknown error occurred' 
    };
  }
};

/**
 * Rewrite text using OpenAI GPT
 */
const rewriteWithOpenAI = async (
  text: string,
  tone: EmailTone | string,
  apiKey: string
): Promise<{ text: string | null; error?: string }> => {
  try {
    const toneDescription = getToneDescription(tone);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using mini for cost efficiency
        messages: [
          {
            role: 'system',
            content: `You are a professional email writing assistant. Rewrite the following email text to match the specified tone exactly. Only change the wording to match the tone - do not change the meaning, structure, or key information. Return only the rewritten text without any explanation or additional text.`,
          },
          {
            role: 'user',
            content: `Tone: ${toneDescription}\n\nEmail text:\n${text}\n\nRewritten email:`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      const errorMessage = errorData.error?.message || `API returned status ${response.status}`;
      return { text: null, error: `OpenAI API error: ${errorMessage}` };
    }

    const data = await response.json();
    const rewrittenText = data.choices?.[0]?.message?.content?.trim();
    
    if (!rewrittenText) {
      return { text: null, error: 'OpenAI API returned empty response' };
    }

    return { text: rewrittenText };
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    return { 
      text: null, 
      error: error?.message || 'Network error connecting to OpenAI API' 
    };
  }
};

/**
 * Get list of available Gemini models
 */
const getAvailableGeminiModels = async (apiKey: string): Promise<string[]> => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    
    if (response.ok) {
      const data = await response.json();
      const models = data.models
        ?.filter((m: any) => 
          m.supportedGenerationMethods?.includes('generateContent') &&
          m.name?.includes('gemini')
        )
        ?.map((m: any) => m.name.replace('models/', '')) || [];
      return models;
    }
  } catch (error) {
    console.error('Error fetching available models:', error);
  }
  
  // Fallback to common model names if listing fails
  return [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
  ];
};

/**
 * Rewrite text using Google Gemini
 */
const rewriteWithGemini = async (
  text: string,
  tone: EmailTone | string,
  apiKey: string
): Promise<{ text: string | null; error?: string }> => {
  try {
    const toneDescription = getToneDescription(tone);
    
    const prompt = `You are a professional email writing assistant. Rewrite the following email text to match the specified tone exactly. Only change the wording to match the tone - do not change the meaning, structure, or key information. Return only the rewritten text without any explanation or additional text.

Tone: ${toneDescription}

Email text:
${text}

Rewritten email:`;

    // Get available models, then try them in order
    const availableModels = await getAvailableGeminiModels(apiKey);
    
    // Prefer flash models (faster/cheaper) over pro models
    const modelsToTry = [
      ...availableModels.filter(m => m && m.includes('flash')),
      ...availableModels.filter(m => m && m.includes('pro') && !m.includes('flash')),
      ...availableModels.filter(m => m && !m.includes('flash') && !m.includes('pro')),
    ].filter(Boolean); // Remove any null/undefined values

    // If no models to try, return error immediately
    if (modelsToTry.length === 0) {
      return { 
        text: null, 
        error: 'No available Gemini models found. Please check your API key.' 
      };
    }

    let lastError: any = null;
    
    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const rewrittenText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          
          if (!rewrittenText) {
            return { text: null, error: 'Gemini API returned empty response' };
          }

          return { text: rewrittenText };
        } else {
          const errorData = await response.json().catch(() => ({}));
          lastError = errorData;
          // If it's a 404, try next model; otherwise return error immediately
          if (response.status !== 404) {
            const errorMessage = errorData.error?.message || `API returned status ${response.status}`;
            return { text: null, error: `Gemini API error: ${errorMessage}` };
          }
          // Continue to next model on 404
        }
      } catch (error: any) {
        lastError = error;
        // Continue to next model on network errors
        continue;
      }
    }

    // If all models failed, return the last error
    const errorMessage = lastError?.error?.message || lastError?.message || 'All Gemini models failed';
    console.error('Gemini API error (all models failed):', lastError);
    return { text: null, error: `Gemini API error: ${errorMessage}` };

  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    return { 
      text: null, 
      error: error?.message || 'Network error connecting to Gemini API' 
    };
  }
};

/**
 * Get human-readable description of tone
 */
const getToneDescription = (tone: EmailTone | string): string => {
  const toneMap: Record<string, string> = {
    professional: 'Professional: Polite, respectful, and business-appropriate. Use formal language but not overly stiff.',
    friendly: 'Friendly: Warm and approachable while maintaining professionalism. Use contractions and warm phrases.',
    casual: 'Casual: Relaxed and conversational. More informal language, can use casual greetings and phrases.',
    formal: 'Very formal: Traditional business communication. Use formal language, avoid contractions, use traditional business phrases.',
    enthusiastic: 'Enthusiastic: Energetic and excited, showing high interest. Use enthusiastic language and exclamation points where appropriate.',
    concise: 'Concise: Brief and to the point. Remove unnecessary words and phrases while keeping all key information.',
  };

  return toneMap[tone] || `Match the tone: ${tone}`;
};


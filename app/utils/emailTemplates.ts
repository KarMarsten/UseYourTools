import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Email Templates for Job Search Communications
 * Templates maintain a positive, empathetic, and professional voice
 */

export type EmailTemplateType = 'thank-you' | 'follow-up' | 'decline-offer' | 'acceptance' | 'rejection-response';

export type EmailTone = 'professional' | 'friendly' | 'casual' | 'formal' | 'enthusiastic' | 'concise';

export interface EmailTemplate {
  id: string;
  type: EmailTemplateType;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TonePreset {
  id: EmailTone | string; // Can be built-in tone or custom ID
  name: string;
  description: string;
  isCustom?: boolean; // True for user-created presets
  createdAt?: string;
  updatedAt?: string;
  transformations?: {
    // Custom transformation rules for user-created presets
    replacements?: Array<{ from: string; to: string; flags?: string }>;
  };
}

export interface EmailVariable {
  key: string;
  label: string;
  description: string;
}

/**
 * Available variables for email templates
 */
export const EMAIL_VARIABLES: EmailVariable[] = [
  { key: '{company}', label: 'Company Name', description: 'Name of the company' },
  { key: '{position}', label: 'Position Title', description: 'Job position title' },
  { key: '{interviewerName}', label: 'Interviewer Name', description: 'Name of the interviewer' },
  { key: '{date}', label: 'Date', description: 'Current date or interview date' },
  { key: '{yourName}', label: 'Your Name', description: 'Your full name' },
  { key: '{appliedDate}', label: 'Applied Date', description: 'Date you applied for the position' },
];

/**
 * Available tone presets for email templates
 */
export const TONE_PRESETS: TonePreset[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Polite, respectful, and business-appropriate',
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm and approachable while maintaining professionalism',
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'Relaxed and conversational tone',
  },
  {
    id: 'formal',
    name: 'Formal',
    description: 'Very formal and traditional business communication',
  },
  {
    id: 'enthusiastic',
    name: 'Enthusiastic',
    description: 'Energetic and excited, showing high interest',
  },
  {
    id: 'concise',
    name: 'Concise',
    description: 'Brief and to the point, no unnecessary words',
  },
];

/**
 * Replace variables in template text with provided values
 */
export const replaceVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    // Replace both {key} and {key} formats
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
};

/**
 * Get all tone presets (built-in + custom)
 */
export const getAllTonePresets = async (): Promise<TonePreset[]> => {
  try {
    const builtInPresets = TONE_PRESETS;
    const customPresets = await loadCustomTonePresets();
    return [...builtInPresets, ...customPresets];
  } catch (error) {
    console.error('Error loading tone presets:', error);
    return TONE_PRESETS;
  }
};

/**
 * Load custom tone presets from storage
 */
const loadCustomTonePresets = async (): Promise<TonePreset[]> => {
  try {
    const index = await getTonePresetsIndex();
    const presets: TonePreset[] = [];

    for (const id of index) {
      const key = `${TONE_PRESETS_KEY_PREFIX}${id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        presets.push(JSON.parse(stored) as TonePreset);
      }
    }

    return presets.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error loading custom tone presets:', error);
    return [];
  }
};

/**
 * Get tone presets index
 */
const getTonePresetsIndex = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(TONE_PRESETS_INDEX_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error loading tone presets index:', error);
    return [];
  }
};

/**
 * Save a custom tone preset
 */
export const saveTonePreset = async (preset: TonePreset): Promise<void> => {
  try {
    if (!preset.id || typeof preset.id === 'string' && preset.id.startsWith('custom_')) {
      preset.id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    preset.isCustom = true;
    preset.updatedAt = new Date().toISOString();
    if (!preset.createdAt) {
      preset.createdAt = preset.updatedAt;
    }

    const key = `${TONE_PRESETS_KEY_PREFIX}${preset.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(preset));

    // Update index
    const index = await getTonePresetsIndex();
    if (!index.includes(preset.id as string)) {
      index.push(preset.id as string);
      await AsyncStorage.setItem(TONE_PRESETS_INDEX_KEY, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Error saving tone preset:', error);
    throw error;
  }
};

/**
 * Delete a custom tone preset
 */
export const deleteTonePreset = async (id: string): Promise<void> => {
  try {
    const key = `${TONE_PRESETS_KEY_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);

    // Update index
    const index = await getTonePresetsIndex();
    const updatedIndex = index.filter((presetId) => presetId !== id);
    await AsyncStorage.setItem(TONE_PRESETS_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Error deleting tone preset:', error);
    throw error;
  }
};

/**
 * Get tone preset by ID
 */
export const getTonePresetById = async (id: string | EmailTone): Promise<TonePreset | null> => {
  try {
    // Check if it's a built-in preset
    const builtIn = TONE_PRESETS.find(p => p.id === id);
    if (builtIn) {
      return builtIn;
    }

    // Check custom presets
    const key = `${TONE_PRESETS_KEY_PREFIX}${id}`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as TonePreset;
    }
    return null;
  } catch (error) {
    console.error('Error loading tone preset:', error);
    return null;
  }
};

/**
 * Apply tone transformation to email content
 */
export const applyTone = async (text: string, tone: EmailTone | string): Promise<string> => {
  // Check if it's a custom tone preset
  const preset = await getTonePresetById(tone);
  if (preset?.isCustom && preset.transformations?.replacements) {
    // Apply custom transformations
    let result = text;
    for (const replacement of preset.transformations.replacements) {
      const flags = replacement.flags || 'gi';
      const regex = new RegExp(replacement.from, flags);
      result = result.replace(regex, replacement.to);
    }
    return result;
  }

  // Try AI rewriting first (if enabled)
  let aiError: string | undefined;
  try {
    const { rewriteWithAI } = await import('./aiToneRewriter');
    const aiResult = await rewriteWithAI(text, tone);
    if (aiResult.text) {
      return aiResult.text;
    }
    // If AI was attempted but failed, save error to throw later
    if (aiResult.usedAI && aiResult.error) {
      aiError = aiResult.error;
    }
  } catch (error: any) {
    // Save error if it's an API error
    if (error?.message && (error.message.includes('API') || error.message.includes('Network'))) {
      aiError = error.message;
    }
    // Fall through to hardcoded rules if AI not available
    console.log('AI rewriting not available, using hardcoded rules');
  }

  // Apply built-in tone transformations (fallback)
  const fallbackResult = applyToneSync(text, tone as EmailTone);
  
  // If AI was attempted but failed, throw error so user knows
  if (aiError) {
    const error = new Error(aiError);
    // Attach the fallback result so it can still be used
    (error as any).fallbackResult = fallbackResult;
    throw error;
  }
  
  return fallbackResult;
};

/**
 * Apply tone transformation to email content (synchronous version for built-in tones)
 */
const applyToneSync = (text: string, tone: EmailTone): string => {
  if (tone === 'professional') {
    // Professional: Keep as is, but ensure formal language
    return text
      .replace(/\bI'm\b/gi, 'I am')
      .replace(/\bI've\b/gi, 'I have')
      .replace(/\bI'll\b/gi, 'I will')
      .replace(/\bcan't\b/gi, 'cannot')
      .replace(/\bdon't\b/gi, 'do not')
      .replace(/\bwon't\b/gi, 'will not')
      .replace(/\bwouldn't\b/gi, 'would not')
      .replace(/\bshouldn't\b/gi, 'should not');
  } else if (tone === 'friendly') {
    // Friendly: Add warmth, use contractions, friendly phrases
    return text
      .replace(/\bDear\b/gi, 'Hi')
      .replace(/\bI hope this message finds you well\b/gi, "Hope you're doing well")
      .replace(/\bI wanted to\b/gi, "I'd like to")
      .replace(/\bI am\b/gi, "I'm")
      .replace(/\bI have\b/gi, "I've")
      .replace(/\bI will\b/gi, "I'll")
      .replace(/\bcannot\b/gi, "can't")
      .replace(/\bdo not\b/gi, "don't")
      .replace(/\bwill not\b/gi, "won't")
      .replace(/\bThank you\b/gi, 'Thanks')
      .replace(/\bPlease\b/gi, 'Please')
      .replace(/\bBest regards\b/gi, 'Best')
      .replace(/\bSincerely\b/gi, 'Best')
      .replace(/\bI remain very interested\b/gi, "I'm still very interested")
      .replace(/\bI would appreciate\b/gi, "I'd appreciate")
      .replace(/\bI am happy to\b/gi, "I'm happy to")
      .replace(/\bI am very\b/gi, "I'm very")
      .replace(/\bI am\b/gi, "I'm")
      .replace(/\bwould appreciate\b/gi, "would really appreciate")
      .replace(/\bregarding the status\b/gi, "about the status")
      .replace(/\bthat might be helpful\b/gi, "that could be helpful");
  } else if (tone === 'casual') {
    // Casual: Very relaxed, conversational
    return text
      .replace(/\bDear\b/gi, 'Hey')
      .replace(/\bI hope this message finds you well\b/gi, 'Hope all is well')
      .replace(/\bI wanted to\b/gi, "I wanted to")
      .replace(/\bI am\b/gi, "I'm")
      .replace(/\bI have\b/gi, "I've")
      .replace(/\bI will\b/gi, "I'll")
      .replace(/\bcannot\b/gi, "can't")
      .replace(/\bdo not\b/gi, "don't")
      .replace(/\bwill not\b/gi, "won't")
      .replace(/\bThank you\b/gi, 'Thanks')
      .replace(/\bPlease\b/gi, '')
      .replace(/\bBest regards\b/gi, 'Thanks')
      .replace(/\bSincerely\b/gi, 'Thanks')
      .replace(/\bI truly appreciate\b/gi, "I really appreciate")
      .replace(/\bI am very excited\b/gi, "I'm really excited")
      .replace(/\bI am thrilled\b/gi, "I'm thrilled")
      .replace(/\bI remain very interested\b/gi, "I'm still really interested")
      .replace(/\bI would appreciate\b/gi, "I'd appreciate")
      .replace(/\bI am happy to\b/gi, "I'm happy to")
      .replace(/\bI am very\b/gi, "I'm very")
      .replace(/\bwould appreciate\b/gi, "would love")
      .replace(/\bregarding the status\b/gi, "about where things stand")
      .replace(/\bthat might be helpful\b/gi, "that could help")
      .replace(/\bin your consideration\b/gi, "when you're deciding");
  } else if (tone === 'formal') {
    // Formal: Very formal, traditional business language
    return text
      .replace(/\bHi\b/gi, 'Dear')
      .replace(/\bHey\b/gi, 'Dear')
      .replace(/\bThanks\b/gi, 'Thank you')
      .replace(/\bI'm\b/gi, 'I am')
      .replace(/\bI've\b/gi, 'I have')
      .replace(/\bI'll\b/gi, 'I will')
      .replace(/\bcan't\b/gi, 'cannot')
      .replace(/\bdon't\b/gi, 'do not')
      .replace(/\bwon't\b/gi, 'will not')
      .replace(/\bwouldn't\b/gi, 'would not')
      .replace(/\bshouldn't\b/gi, 'should not')
      .replace(/\bI wanted to\b/gi, 'I wish to')
      .replace(/\bI'd like to\b/gi, 'I would like to')
      .replace(/\bBest\b/gi, 'Best regards')
      .replace(/\bI really\b/gi, 'I truly')
      .replace(/\bI'm really\b/gi, 'I am truly')
      .replace(/\bI remain very interested\b/gi, 'I continue to maintain a strong interest')
      .replace(/\bI would appreciate\b/gi, 'I would be most appreciative')
      .replace(/\bI am happy to\b/gi, 'I would be pleased to')
      .replace(/\bI am very\b/gi, 'I am most')
      .replace(/\bwould appreciate\b/gi, 'would be most appreciative of')
      .replace(/\bregarding the status\b/gi, 'concerning the status')
      .replace(/\bthat might be helpful\b/gi, 'that may be of assistance')
      .replace(/\bin your consideration\b/gi, 'in your deliberations');
  } else if (tone === 'enthusiastic') {
    // Enthusiastic: Add excitement, exclamation points, energetic language
    return text
      .replace(/\bI am excited\b/gi, 'I am SO excited')
      .replace(/\bI am very excited\b/gi, 'I am absolutely thrilled')
      .replace(/\bI am thrilled\b/gi, 'I am absolutely thrilled')
      .replace(/\bI'm excited\b/gi, "I'm SO excited")
      .replace(/\bI'm very excited\b/gi, "I'm absolutely thrilled")
      .replace(/\bI'm thrilled\b/gi, "I'm absolutely thrilled")
      .replace(/\bThank you\b/gi, 'Thank you so much')
      .replace(/\bThanks\b/gi, 'Thanks so much')
      .replace(/\bI look forward to\b/gi, 'I cannot wait to')
      .replace(/\bI'm looking forward to\b/gi, "I can't wait to")
      .replace(/\bI am looking forward to\b/gi, 'I cannot wait to')
      .replace(/\bI can't wait\b/gi, "I absolutely can't wait")
      .replace(/\bI cannot wait\b/gi, 'I absolutely cannot wait')
      .replace(/\bI remain very interested\b/gi, "I'm SO excited and remain very interested")
      .replace(/\bI would appreciate\b/gi, "I'd really love")
      .replace(/\bI am happy to\b/gi, "I'm thrilled to")
      .replace(/\bI am very\b/gi, "I'm absolutely")
      .replace(/\bwould appreciate\b/gi, "would absolutely love")
      .replace(/\bregarding the status\b/gi, "about the status")
      .replace(/\bthat might be helpful\b/gi, "that could be super helpful")
      .replace(/\bin your consideration\b/gi, "as you consider")
      // Convert periods to exclamation points for positive statements (limited)
      .replace(/\b(excited|thrilled|thank|appreciate|wonderful|great|pleasure|opportunity|interested|happy)\b[^.!?]*\./gi, (match) => {
        // Only convert if it's a short sentence (less than 100 chars)
        if (match.length < 100 && !match.includes('!')) {
          return match.replace(/\.$/, '!');
        }
        return match;
      });
  } else if (tone === 'concise') {
    // Concise: Remove unnecessary words, make it shorter
    return text
      .replace(/\bI hope this message finds you well\b/gi, '')
      .replace(/\bI wanted to follow up on\b/gi, 'Following up on')
      .replace(/\bI wanted to\b/gi, '')
      .replace(/\bI would like to\b/gi, '')
      .replace(/\bI wish to\b/gi, '')
      .replace(/\bI truly appreciate\b/gi, 'Appreciate')
      .replace(/\bI really appreciate\b/gi, 'Appreciate')
      .replace(/\bThank you so much\b/gi, 'Thanks')
      .replace(/\bThank you\b/gi, 'Thanks')
      .replace(/\bPlease feel free to\b/gi, '')
      .replace(/\bPlease\b/gi, '')
      .replace(/\bI look forward to\b/gi, 'Looking forward to')
      .replace(/\bI am looking forward to\b/gi, 'Looking forward to')
      .replace(/\bI'm looking forward to\b/gi, "Looking forward to")
      .replace(/\bBest regards\b/gi, 'Best')
      .replace(/\bSincerely\b/gi, 'Best')
      .replace(/\bI remain very interested\b/gi, 'Still very interested')
      .replace(/\bI would appreciate\b/gi, 'Would appreciate')
      .replace(/\bI am happy to\b/gi, 'Happy to')
      .replace(/\bI am very\b/gi, '')
      .replace(/\bI'm very\b/gi, '')
      .replace(/\bI am truly\b/gi, '')
      .replace(/\bI'm truly\b/gi, '')
      .replace(/\bwould appreciate\b/gi, 'appreciate')
      .replace(/\bregarding the status\b/gi, 'on status')
      .replace(/\bthat might be helpful\b/gi, 'that could help')
      .replace(/\bin your consideration\b/gi, 'in your review')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }
  
  // Default: return as is
  return text;
};

/**
 * Default email templates
 */
const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'thank-you',
    name: 'Thank You - Interview',
    subject: 'Thank You - {position} Position at {company}',
    body: `Dear {interviewerName},

Thank you for taking the time to meet with me today to discuss the {position} role at {company}. I truly enjoyed our conversation and learning more about the position and your team.

I was particularly excited to hear about [specific detail from interview - user should customize]. Your insights have only strengthened my interest in this opportunity.

I believe my experience in [relevant experience] aligns well with what you're looking for, and I'm eager to contribute to [company goal/project mentioned].

Please feel free to reach out if you need any additional information. I look forward to hearing from you.

Best regards,
{yourName}`,
    isDefault: true,
  },
  {
    type: 'follow-up',
    name: 'Follow-Up - Application Status',
    subject: 'Following Up on {position} Application - {company}',
    body: `Dear Hiring Manager,

I hope this message finds you well. I wanted to follow up on my application for the {position} position at {company}, which I submitted on {appliedDate}.

I remain very interested in this opportunity and would appreciate any update you can provide regarding the status of my application. I'm happy to provide any additional information or materials that might be helpful in your consideration.

Thank you for your time and consideration. I look forward to the possibility of contributing to your team.

Best regards,
{yourName}`,
    isDefault: true,
  },
  {
    type: 'decline-offer',
    name: 'Decline Offer - Appreciative',
    subject: 'Regarding the {position} Opportunity at {company}',
    body: `Dear {interviewerName},

Thank you so much for offering me the {position} position at {company}. I truly appreciate the time and consideration you and your team extended throughout the interview process. It was a pleasure getting to know everyone and learning more about the role and organization.

After careful consideration, I have decided to pursue another opportunity that better aligns with my current career goals at this time. This was not an easy decision, and I have great respect for {company} and the work you do.

I hope we can stay connected, and I wish you and your team all the best in finding the right candidate for this role. Please don't hesitate to reach out if there are future opportunities where I might be a good fit.

Thank you again for this opportunity.

Best regards,
{yourName}`,
    isDefault: true,
  },
  {
    type: 'acceptance',
    name: 'Accept Offer - Enthusiastic',
    subject: 'Accepting the {position} Position at {company}',
    body: `Dear {interviewerName},

I am thrilled to accept the {position} position at {company}! Thank you so much for this wonderful opportunity. I am very excited about the prospect of joining your team and contributing to [specific project/goal mentioned in interview].

I am looking forward to starting on [start date if discussed, or "the agreed-upon date"] and am eager to begin working with you and the rest of the team.

Please let me know what the next steps are in the onboarding process, and if there is any additional information or documentation you need from me.

Thank you again for this opportunity. I can't wait to get started!

Best regards,
{yourName}`,
    isDefault: true,
  },
  {
    type: 'rejection-response',
    name: 'Rejection Response - Professional',
    subject: 'Thank You - {position} Position at {company}',
    body: `Dear {interviewerName},

Thank you for taking the time to consider my application for the {position} position at {company}. I appreciate the opportunity to have been considered for this role.

While I'm disappointed that I wasn't selected this time, I remain very interested in {company} and would welcome the opportunity to be considered for future positions that align with my skills and experience.

I wish you and your team all the best in finding the right candidate for this role. Please keep me in mind for future opportunities.

Thank you again for your time and consideration.

Best regards,
{yourName}`,
    isDefault: true,
  },
];

const TEMPLATES_KEY_PREFIX = 'email_template_';
const TEMPLATES_INDEX_KEY = 'email_templates_index';
const TONE_PRESETS_KEY_PREFIX = 'tone_preset_';
const TONE_PRESETS_INDEX_KEY = 'tone_presets_index';

/**
 * Generate a unique ID for a template
 */
const generateTemplateId = (): string => {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Load templates from storage without initializing defaults (used internally)
 */
const loadTemplatesFromStorage = async (): Promise<EmailTemplate[]> => {
  try {
    const index = await getTemplatesIndex();
    const templates: EmailTemplate[] = [];

    for (const id of index) {
      const key = `${TEMPLATES_KEY_PREFIX}${id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        templates.push(JSON.parse(stored) as EmailTemplate);
      }
    }

    // Sort: defaults first, then by type, then by name
    return templates.sort((a, b) => {
      if (a.isDefault !== b.isDefault) {
        return a.isDefault ? -1 : 1;
      }
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error loading templates from storage:', error);
    return [];
  }
};

/**
 * Initialize default templates if they don't exist
 * Checks for each default template by type AND name to ensure all defaults are created
 * This ensures that even if users have custom templates, the default ones are always available
 */
export const initializeDefaultTemplates = async (): Promise<void> => {
  try {
    const existingTemplates = await loadTemplatesFromStorage();
    const now = new Date().toISOString();
    
    // Check each default template individually
    for (const defaultTemplate of DEFAULT_TEMPLATES) {
      // Check if a default template with this exact type and name exists
      const existingDefault = existingTemplates.find(
        t => t.isDefault && t.type === defaultTemplate.type && t.name === defaultTemplate.name
      );
      
      if (!existingDefault) {
        // Check if there's any template (even non-default) with this type and name
        const existingTemplate = existingTemplates.find(
          t => t.type === defaultTemplate.type && t.name === defaultTemplate.name
        );
        
        if (!existingTemplate) {
          // Create the default template
          const newTemplate: EmailTemplate = {
            ...defaultTemplate,
            id: generateTemplateId(),
            createdAt: now,
            updatedAt: now,
          };
          await saveTemplate(newTemplate);
        } else if (existingTemplate.isDefault) {
          // If it's a default template but body/subject might be empty or corrupted, fix it
          if (!existingTemplate.body || existingTemplate.body.trim() === '' || 
              !existingTemplate.subject || existingTemplate.subject.trim() === '') {
            existingTemplate.subject = defaultTemplate.subject;
            existingTemplate.body = defaultTemplate.body;
            existingTemplate.updatedAt = now;
            await saveTemplate(existingTemplate);
          }
        } else {
          // Template exists but isn't default - create the default one anyway (user can have both)
          // Only create if there isn't already a default of this type
          const hasDefaultOfType = existingTemplates.some(
            t => t.isDefault && t.type === defaultTemplate.type
          );
          if (!hasDefaultOfType) {
            const newTemplate: EmailTemplate = {
              ...defaultTemplate,
              id: generateTemplateId(),
              createdAt: now,
              updatedAt: now,
            };
            await saveTemplate(newTemplate);
          }
        }
      } else {
        // Default exists, but check if body/subject are empty and fix if needed
        if (!existingDefault.body || existingDefault.body.trim() === '' || 
            !existingDefault.subject || existingDefault.subject.trim() === '') {
          existingDefault.subject = defaultTemplate.subject;
          existingDefault.body = defaultTemplate.body;
          existingDefault.updatedAt = now;
          await saveTemplate(existingDefault);
        }
      }
    }
  } catch (error) {
    console.error('Error initializing default templates:', error);
  }
};

/**
 * Get templates index
 */
const getTemplatesIndex = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(TEMPLATES_INDEX_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error loading templates index:', error);
    return [];
  }
};

/**
 * Save an email template
 */
export const saveTemplate = async (template: EmailTemplate): Promise<void> => {
  try {
    if (!template.id) {
      template.id = generateTemplateId();
    }
    
    template.updatedAt = new Date().toISOString();
    if (!template.createdAt) {
      template.createdAt = template.updatedAt;
    }

    const key = `${TEMPLATES_KEY_PREFIX}${template.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(template));

    // Update index
    const index = await getTemplatesIndex();
    if (!index.includes(template.id)) {
      index.push(template.id);
      await AsyncStorage.setItem(TEMPLATES_INDEX_KEY, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Error saving template:', error);
    throw error;
  }
};

/**
 * Get all email templates
 */
export const getAllTemplates = async (): Promise<EmailTemplate[]> => {
  try {
    await initializeDefaultTemplates(); // Ensure defaults exist
    return await loadTemplatesFromStorage();
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
};

/**
 * Get templates by type
 */
export const getTemplatesByType = async (type: EmailTemplateType): Promise<EmailTemplate[]> => {
  const allTemplates = await getAllTemplates();
  return allTemplates.filter(t => t.type === type);
};

/**
 * Get template by ID
 */
export const getTemplateById = async (id: string): Promise<EmailTemplate | null> => {
  try {
    const key = `${TEMPLATES_KEY_PREFIX}${id}`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as EmailTemplate;
    }
    return null;
  } catch (error) {
    console.error('Error loading template:', error);
    return null;
  }
};

/**
 * Delete a template (cannot delete default templates)
 */
export const deleteTemplate = async (id: string): Promise<void> => {
  try {
    const template = await getTemplateById(id);
    if (template?.isDefault) {
      throw new Error('Cannot delete default template');
    }

    const key = `${TEMPLATES_KEY_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);

    // Update index
    const index = await getTemplatesIndex();
    const newIndex = index.filter(templateId => templateId !== id);
    await AsyncStorage.setItem(TEMPLATES_INDEX_KEY, JSON.stringify(newIndex));
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};


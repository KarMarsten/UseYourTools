import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Email Templates for Job Search Communications
 * Templates maintain a positive, empathetic, and professional voice
 */

export type EmailTemplateType = 'thank-you' | 'follow-up' | 'decline-offer';

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
];

const TEMPLATES_KEY_PREFIX = 'email_template_';
const TEMPLATES_INDEX_KEY = 'email_templates_index';

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
 */
export const initializeDefaultTemplates = async (): Promise<void> => {
  try {
    const existingTemplates = await loadTemplatesFromStorage();
    const hasDefaults = existingTemplates.some(t => t.isDefault);
    
    if (!hasDefaults) {
      const now = new Date().toISOString();
      for (const template of DEFAULT_TEMPLATES) {
        const newTemplate: EmailTemplate = {
          ...template,
          id: generateTemplateId(),
          createdAt: now,
          updatedAt: now,
        };
        await saveTemplate(newTemplate);
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


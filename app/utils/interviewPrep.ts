import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string; // e.g., "Behavioral", "Technical", "Situational"
  industry?: string; // e.g., "Software Engineering", "Marketing", "Sales"
  role?: string; // e.g., "Frontend Developer", "Product Manager"
  tags?: string[]; // Additional tags for filtering
}

export interface STARResponse {
  id: string;
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

export interface CompanyResearch {
  id: string;
  applicationIds: string[]; // Links to job applications (can have multiple)
  companyName: string;
  positionTitle: string; // Primary position title (for display)
  researchNotes: string;
  website?: string;
  linkedinUrl?: string;
  glassdoorUrl?: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

export interface InterviewFeedback {
  id: string;
  applicationId: string; // Link to job application
  eventId?: string; // Link to interview event
  companyName: string;
  positionTitle: string;
  interviewDate: string; // ISO 8601 date string
  interviewerNames?: string;
  feedback: string;
  strengths?: string;
  areasForImprovement?: string;
  nextSteps?: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

// Common interview questions by category
export const DEFAULT_QUESTIONS: InterviewQuestion[] = [
  // Behavioral Questions
  { id: 'q1', question: 'Tell me about yourself', category: 'Behavioral' },
  { id: 'q2', question: 'Why do you want to work here?', category: 'Behavioral' },
  { id: 'q3', question: 'What are your greatest strengths?', category: 'Behavioral' },
  { id: 'q4', question: 'What are your weaknesses?', category: 'Behavioral' },
  { id: 'q5', question: 'Where do you see yourself in 5 years?', category: 'Behavioral' },
  { id: 'q6', question: 'Why are you leaving your current job?', category: 'Behavioral' },
  { id: 'q7', question: 'Tell me about a time you handled a difficult situation', category: 'Behavioral' },
  { id: 'q8', question: 'Tell me about a time you worked in a team', category: 'Behavioral' },
  { id: 'q9', question: 'Tell me about a time you showed leadership', category: 'Behavioral' },
  { id: 'q10', question: 'Tell me about a time you failed and what you learned', category: 'Behavioral' },
  { id: 'q11', question: 'Tell me about a time you dealt with conflict', category: 'Behavioral' },
  { id: 'q12', question: 'What motivates you?', category: 'Behavioral' },
  
  // Technical Questions (Software Engineering)
  { id: 'q13', question: 'Explain a challenging technical problem you solved', category: 'Technical', industry: 'Software Engineering' },
  { id: 'q14', question: 'How do you approach debugging?', category: 'Technical', industry: 'Software Engineering' },
  { id: 'q15', question: 'Describe your experience with [specific technology]', category: 'Technical', industry: 'Software Engineering' },
  { id: 'q16', question: 'How do you ensure code quality?', category: 'Technical', industry: 'Software Engineering' },
  { id: 'q17', question: 'Explain your experience with testing', category: 'Technical', industry: 'Software Engineering' },
  
  // Situational Questions
  { id: 'q18', question: 'How do you handle tight deadlines?', category: 'Situational' },
  { id: 'q19', question: 'How do you prioritize multiple tasks?', category: 'Situational' },
  { id: 'q20', question: 'How do you handle feedback?', category: 'Situational' },
  { id: 'q21', question: 'Describe how you adapt to change', category: 'Situational' },
];

const QUESTIONS_KEY_PREFIX = 'interview_question_';
const QUESTIONS_INDEX_KEY = 'interview_questions_index';
const STAR_KEY_PREFIX = 'star_response_';
const STAR_INDEX_KEY = 'star_responses_index';
const COMPANY_RESEARCH_KEY_PREFIX = 'company_research_';
const COMPANY_RESEARCH_INDEX_KEY = 'company_research_index';
const INTERVIEW_FEEDBACK_KEY_PREFIX = 'interview_feedback_';
const INTERVIEW_FEEDBACK_INDEX_KEY = 'interview_feedback_index';

// ===== Interview Questions =====

const generateQuestionId = (): string => {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const saveQuestion = async (question: InterviewQuestion): Promise<void> => {
  try {
    if (!question.id) {
      question.id = generateQuestionId();
    }
    const key = `${QUESTIONS_KEY_PREFIX}${question.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(question));

    const index = await getQuestionsIndex();
    if (!index.includes(question.id)) {
      index.push(question.id);
      await AsyncStorage.setItem(QUESTIONS_INDEX_KEY, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Error saving question:', error);
    throw error;
  }
};

const getQuestionsIndex = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(QUESTIONS_INDEX_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading questions index:', error);
    return [];
  }
};

export const getAllQuestions = async (): Promise<InterviewQuestion[]> => {
  try {
    // Load default questions first
    const allQuestions = [...DEFAULT_QUESTIONS];
    
    // Load custom questions
    const index = await getQuestionsIndex();
    for (const id of index) {
      const key = `${QUESTIONS_KEY_PREFIX}${id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const customQuestion = JSON.parse(stored) as InterviewQuestion;
        // Only add if not already in defaults (by ID)
        if (!allQuestions.some(q => q.id === customQuestion.id)) {
          allQuestions.push(customQuestion);
        }
      }
    }
    
    return allQuestions;
  } catch (error) {
    console.error('Error loading questions:', error);
    return DEFAULT_QUESTIONS;
  }
};

export const getQuestionsByCategory = async (category?: string, industry?: string, role?: string): Promise<InterviewQuestion[]> => {
  const allQuestions = await getAllQuestions();
  return allQuestions.filter(q => {
    if (category && q.category !== category) return false;
    if (industry && q.industry && q.industry !== industry) return false;
    if (role && q.role && q.role !== role) return false;
    return true;
  });
};

export const deleteQuestion = async (id: string): Promise<void> => {
  try {
    // Don't delete default questions
    if (DEFAULT_QUESTIONS.some(q => q.id === id)) {
      throw new Error('Cannot delete default questions');
    }
    
    const key = `${QUESTIONS_KEY_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);

    const index = await getQuestionsIndex();
    const updatedIndex = index.filter(qId => qId !== id);
    await AsyncStorage.setItem(QUESTIONS_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

// ===== STAR Responses =====

const generateSTARId = (): string => {
  return `star_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const saveSTARResponse = async (response: STARResponse): Promise<void> => {
  try {
    const now = new Date().toISOString();
    if (!response.id) {
      response.id = generateSTARId();
      response.createdAt = now;
    }
    response.updatedAt = now;

    const key = `${STAR_KEY_PREFIX}${response.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(response));

    const index = await getSTARIndex();
    if (!index.includes(response.id)) {
      index.push(response.id);
      await AsyncStorage.setItem(STAR_INDEX_KEY, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Error saving STAR response:', error);
    throw error;
  }
};

const getSTARIndex = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(STAR_INDEX_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading STAR index:', error);
    return [];
  }
};

export const getAllSTARResponses = async (): Promise<STARResponse[]> => {
  try {
    const index = await getSTARIndex();
    const responses: STARResponse[] = [];
    for (const id of index) {
      const key = `${STAR_KEY_PREFIX}${id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        responses.push(JSON.parse(stored) as STARResponse);
      }
    }
    return responses.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error('Error loading STAR responses:', error);
    return [];
  }
};

export const getSTARResponseById = async (id: string): Promise<STARResponse | null> => {
  try {
    const key = `${STAR_KEY_PREFIX}${id}`;
    const stored = await AsyncStorage.getItem(key);
    return stored ? (JSON.parse(stored) as STARResponse) : null;
  } catch (error) {
    console.error('Error getting STAR response by ID:', error);
    return null;
  }
};

export const deleteSTARResponse = async (id: string): Promise<void> => {
  try {
    const key = `${STAR_KEY_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);

    const index = await getSTARIndex();
    const updatedIndex = index.filter(rId => rId !== id);
    await AsyncStorage.setItem(STAR_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Error deleting STAR response:', error);
    throw error;
  }
};

// ===== Company Research =====

const generateResearchId = (): string => {
  return `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const saveCompanyResearch = async (research: CompanyResearch): Promise<void> => {
  try {
    const now = new Date().toISOString();
    if (!research.id) {
      research.id = generateResearchId();
      research.createdAt = now;
    }
    research.updatedAt = now;

    const key = `${COMPANY_RESEARCH_KEY_PREFIX}${research.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(research));

    const index = await getResearchIndex();
    if (!index.includes(research.id)) {
      index.push(research.id);
      await AsyncStorage.setItem(COMPANY_RESEARCH_INDEX_KEY, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Error saving company research:', error);
    throw error;
  }
};

const getResearchIndex = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(COMPANY_RESEARCH_INDEX_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading research index:', error);
    return [];
  }
};

export const getAllCompanyResearch = async (): Promise<CompanyResearch[]> => {
  try {
    const index = await getResearchIndex();
    const research: CompanyResearch[] = [];
    for (const id of index) {
      const key = `${COMPANY_RESEARCH_KEY_PREFIX}${id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as CompanyResearch;
        // Migrate old data: convert applicationId to applicationIds array
        if ('applicationId' in parsed && !('applicationIds' in parsed)) {
          parsed.applicationIds = [parsed.applicationId];
          delete (parsed as any).applicationId;
          // Save migrated data
          await AsyncStorage.setItem(key, JSON.stringify(parsed));
        }
        research.push(parsed);
      }
    }
    return research.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error('Error loading company research:', error);
    return [];
  }
};

export const getCompanyResearchByApplicationId = async (applicationId: string): Promise<CompanyResearch[]> => {
  try {
    const allResearch = await getAllCompanyResearch();
    return allResearch.filter(r => r.applicationIds && r.applicationIds.includes(applicationId));
  } catch (error) {
    console.error('Error getting company research by application ID:', error);
    return [];
  }
};

export const deleteCompanyResearch = async (id: string): Promise<void> => {
  try {
    const key = `${COMPANY_RESEARCH_KEY_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);

    const index = await getResearchIndex();
    const updatedIndex = index.filter(rId => rId !== id);
    await AsyncStorage.setItem(COMPANY_RESEARCH_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Error deleting company research:', error);
    throw error;
  }
};

// ===== Interview Feedback =====

const generateFeedbackId = (): string => {
  return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const saveInterviewFeedback = async (feedback: InterviewFeedback): Promise<void> => {
  try {
    const now = new Date().toISOString();
    if (!feedback.id) {
      feedback.id = generateFeedbackId();
      feedback.createdAt = now;
    }
    feedback.updatedAt = now;

    const key = `${INTERVIEW_FEEDBACK_KEY_PREFIX}${feedback.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(feedback));

    const index = await getFeedbackIndex();
    if (!index.includes(feedback.id)) {
      index.push(feedback.id);
      await AsyncStorage.setItem(INTERVIEW_FEEDBACK_INDEX_KEY, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Error saving interview feedback:', error);
    throw error;
  }
};

const getFeedbackIndex = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(INTERVIEW_FEEDBACK_INDEX_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading feedback index:', error);
    return [];
  }
};

export const getAllInterviewFeedback = async (): Promise<InterviewFeedback[]> => {
  try {
    const index = await getFeedbackIndex();
    const feedback: InterviewFeedback[] = [];
    for (const id of index) {
      const key = `${INTERVIEW_FEEDBACK_KEY_PREFIX}${id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        feedback.push(JSON.parse(stored) as InterviewFeedback);
      }
    }
    return feedback.sort((a, b) => new Date(b.interviewDate).getTime() - new Date(a.interviewDate).getTime());
  } catch (error) {
    console.error('Error loading interview feedback:', error);
    return [];
  }
};

export const getInterviewFeedbackByApplicationId = async (applicationId: string): Promise<InterviewFeedback[]> => {
  try {
    const allFeedback = await getAllInterviewFeedback();
    return allFeedback.filter(f => f.applicationId === applicationId);
  } catch (error) {
    console.error('Error getting interview feedback by application ID:', error);
    return [];
  }
};

export const deleteInterviewFeedback = async (id: string): Promise<void> => {
  try {
    const key = `${INTERVIEW_FEEDBACK_KEY_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);

    const index = await getFeedbackIndex();
    const updatedIndex = index.filter(fId => fId !== id);
    await AsyncStorage.setItem(INTERVIEW_FEEDBACK_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Error deleting interview feedback:', error);
    throw error;
  }
};


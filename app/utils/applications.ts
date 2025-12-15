import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDateKey } from './timeFormatter';

export interface JobApplication {
  id: string;
  positionTitle: string;
  company: string;
  source: string; // e.g., "LinkedIn", "Indeed", "Company Website", etc.
  sourceUrl?: string; // Hyperlink to the job posting
  appliedDate: string; // ISO 8601 date string (YYYY-MM-DDTHH:mm:ss.sssZ)
  status: 'applied' | 'rejected' | 'no-response'; // Status of the application
  notes?: string; // Optional notes about the application
}

const APPLICATIONS_KEY_PREFIX = 'application_';
const APPLICATIONS_INDEX_KEY = 'applications_index'; // Stores array of all application IDs

/**
 * Generate a unique ID for an application
 */
const generateApplicationId = (): string => {
  return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Save a job application
 */
export const saveApplication = async (application: JobApplication): Promise<void> => {
  try {
    // If no ID, generate one
    if (!application.id) {
      application.id = generateApplicationId();
    }

    const key = `${APPLICATIONS_KEY_PREFIX}${application.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(application));

    // Update index
    const index = await getApplicationsIndex();
    if (!index.includes(application.id)) {
      index.push(application.id);
      await AsyncStorage.setItem(APPLICATIONS_INDEX_KEY, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Error saving application:', error);
    throw error;
  }
};

/**
 * Get all application IDs from index
 */
const getApplicationsIndex = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(APPLICATIONS_INDEX_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error loading applications index:', error);
    return [];
  }
};

/**
 * Load all job applications
 */
export const getAllApplications = async (): Promise<JobApplication[]> => {
  try {
    const index = await getApplicationsIndex();
    const applications: JobApplication[] = [];

    for (const id of index) {
      const key = `${APPLICATIONS_KEY_PREFIX}${id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        applications.push(JSON.parse(stored) as JobApplication);
      }
    }

    // Sort by applied date (newest first)
    return applications.sort((a, b) => {
      return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
    });
  } catch (error) {
    console.error('Error loading applications:', error);
    return [];
  }
};

/**
 * Delete a job application
 */
export const deleteApplication = async (applicationId: string): Promise<void> => {
  try {
    const key = `${APPLICATIONS_KEY_PREFIX}${applicationId}`;
    await AsyncStorage.removeItem(key);

    // Update index
    const index = await getApplicationsIndex();
    const updatedIndex = index.filter(id => id !== applicationId);
    await AsyncStorage.setItem(APPLICATIONS_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Error deleting application:', error);
    throw error;
  }
};

/**
 * Search applications by company, position, or source
 * Returns applications that match any of the search terms
 */
export const searchApplications = async (searchTerm: string): Promise<JobApplication[]> => {
  try {
    const allApplications = await getAllApplications();
    const searchLower = searchTerm.toLowerCase().trim();

    if (!searchLower) {
      return allApplications;
    }

    return allApplications.filter(app => {
      return (
        app.company.toLowerCase().includes(searchLower) ||
        app.positionTitle.toLowerCase().includes(searchLower) ||
        app.source.toLowerCase().includes(searchLower) ||
        (app.notes && app.notes.toLowerCase().includes(searchLower))
      );
    });
  } catch (error) {
    console.error('Error searching applications:', error);
    return [];
  }
};

/**
 * Check if user has already applied to a position at a company
 * Useful to prevent duplicate applications
 */
export const hasAppliedToPosition = async (
  company: string,
  positionTitle: string
): Promise<boolean> => {
  try {
    const allApplications = await getAllApplications();
    const companyLower = company.toLowerCase().trim();
    const positionLower = positionTitle.toLowerCase().trim();

    return allApplications.some(app => {
      return (
        app.company.toLowerCase().trim() === companyLower &&
        app.positionTitle.toLowerCase().trim() === positionLower
      );
    });
  } catch (error) {
    console.error('Error checking application:', error);
    return false;
  }
};

/**
 * Get application statistics
 */
export interface ApplicationStats {
  total: number;
  applied: number;
  rejected: number;
  noResponse: number;
}

export const getApplicationStats = async (): Promise<ApplicationStats> => {
  try {
    const allApplications = await getAllApplications();
    const stats: ApplicationStats = {
      total: allApplications.length,
      applied: 0,
      rejected: 0,
      noResponse: 0,
    };

    allApplications.forEach(app => {
      if (app.status === 'applied') stats.applied++;
      else if (app.status === 'rejected') stats.rejected++;
      else if (app.status === 'no-response') stats.noResponse++;
    });

    return stats;
  } catch (error) {
    console.error('Error getting application stats:', error);
    return { total: 0, applied: 0, rejected: 0, noResponse: 0 };
  }
};


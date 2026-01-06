import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Reference {
  id: string;
  name: string; // Reference's full name
  title?: string; // Their job title/position
  company?: string; // Their company
  email?: string; // Email address
  phone?: string; // Phone number
  relationship?: string; // Relationship to you (e.g., "Former Manager", "Colleague", "Professor")
  notes?: string; // Optional notes about the reference
  applicationId?: string; // Optional link to a job application
  agreedToProvideReference?: boolean; // Whether they've agreed to provide a reference
  createdAt: string; // ISO 8601 date string (YYYY-MM-DDTHH:mm:ss.sssZ)
  updatedAt: string; // ISO 8601 date string (YYYY-MM-DDTHH:mm:ss.sssZ)
}

const REFERENCES_KEY_PREFIX = 'reference_';
const REFERENCES_INDEX_KEY = 'references_index'; // Stores array of all reference IDs

/**
 * Generate a unique ID for a reference
 */
const generateReferenceId = (): string => {
  return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all reference IDs from index
 */
const getReferencesIndex = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(REFERENCES_INDEX_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error loading references index:', error);
    return [];
  }
};

/**
 * Save a reference
 */
export const saveReference = async (reference: Reference): Promise<void> => {
  try {
    // If no ID, generate one
    if (!reference.id) {
      reference.id = generateReferenceId();
    }

    const now = new Date().toISOString();
    
    // If no createdAt, set it to now
    if (!reference.createdAt) {
      reference.createdAt = now;
    }
    
    // Always update updatedAt
    reference.updatedAt = now;

    const key = `${REFERENCES_KEY_PREFIX}${reference.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(reference));

    // Update index
    const index = await getReferencesIndex();
    if (!index.includes(reference.id)) {
      index.push(reference.id);
      await AsyncStorage.setItem(REFERENCES_INDEX_KEY, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Error saving reference:', error);
    throw error;
  }
};

/**
 * Load all references
 */
export const getAllReferences = async (): Promise<Reference[]> => {
  try {
    const index = await getReferencesIndex();
    const references: Reference[] = [];

    for (const id of index) {
      const key = `${REFERENCES_KEY_PREFIX}${id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        references.push(JSON.parse(stored) as Reference);
      }
    }

    // Sort by name (alphabetically)
    return references.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error loading references:', error);
    return [];
  }
};

/**
 * Get a reference by ID
 */
export const getReferenceById = async (id: string): Promise<Reference | null> => {
  try {
    const key = `${REFERENCES_KEY_PREFIX}${id}`;
    const referenceData = await AsyncStorage.getItem(key);
    if (referenceData) {
      return JSON.parse(referenceData) as Reference;
    }
    return null;
  } catch (error) {
    console.error('Error getting reference:', error);
    return null;
  }
};

/**
 * Get references by application ID
 */
export const getReferencesByApplicationId = async (applicationId: string): Promise<Reference[]> => {
  try {
    const allReferences = await getAllReferences();
    return allReferences.filter(ref => ref.applicationId === applicationId);
  } catch (error) {
    console.error('Error getting references by application ID:', error);
    return [];
  }
};

/**
 * Delete a reference
 */
export const deleteReference = async (referenceId: string): Promise<void> => {
  try {
    const key = `${REFERENCES_KEY_PREFIX}${referenceId}`;
    await AsyncStorage.removeItem(key);

    // Update index
    const index = await getReferencesIndex();
    const updatedIndex = index.filter(id => id !== referenceId);
    await AsyncStorage.setItem(REFERENCES_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Error deleting reference:', error);
    throw error;
  }
};

/**
 * Unlink references from an application (when application is deleted)
 */
export const unlinkReferencesFromApplication = async (applicationId: string): Promise<void> => {
  try {
    const references = await getReferencesByApplicationId(applicationId);
    for (const ref of references) {
      ref.applicationId = undefined;
      await saveReference(ref);
    }
  } catch (error) {
    console.error('Error unlinking references from application:', error);
    throw error;
  }
};


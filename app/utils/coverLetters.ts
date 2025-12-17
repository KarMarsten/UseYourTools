import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CoverLetterInfo {
  id: string;
  name: string; // Display name (e.g., "Cover Letter - TechCorp")
  company?: string; // Company name this cover letter was customized for
  isTemplate: boolean; // If true, this is a generic template; if false, it's customized for a company
  fileName: string; // Original filename
  fileUri: string; // Full path to the file
  mimeType?: string; // MIME type (e.g., "application/pdf", "text/plain")
  size?: number; // File size in bytes
  createdAt: string; // ISO 8601 date string
  updatedAt?: string; // ISO 8601 date string
  isActive?: boolean; // Whether this cover letter is currently active/being used
}

const COVER_LETTERS_DIR = `${FileSystem.documentDirectory}coverLetters/`;
const COVER_LETTERS_INDEX_KEY = 'cover_letters_index'; // Stores array of all cover letter metadata

/**
 * Ensure the cover letters directory exists
 */
const ensureCoverLettersDirectory = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(COVER_LETTERS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(COVER_LETTERS_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error creating cover letters directory:', error);
    throw error;
  }
};

/**
 * Generate a unique ID for a cover letter
 */
const generateCoverLetterId = (): string => {
  return `coverletter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all cover letter metadata from index
 */
const getCoverLettersIndex = async (): Promise<CoverLetterInfo[]> => {
  try {
    const stored = await AsyncStorage.getItem(COVER_LETTERS_INDEX_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error loading cover letters index:', error);
    return [];
  }
};

/**
 * Update the cover letters index
 */
const updateCoverLettersIndex = async (coverLetters: CoverLetterInfo[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(COVER_LETTERS_INDEX_KEY, JSON.stringify(coverLetters));
  } catch (error) {
    console.error('Error updating cover letters index:', error);
    throw error;
  }
};

/**
 * Pick a cover letter file using the document picker and save it
 * @param company - Optional company name if this is customized for a company
 * @param isTemplate - Whether this is a template (defaults to false if company is provided)
 * @returns The saved cover letter info, or null if cancelled
 */
export const pickAndSaveCoverLetter = async (
  company?: string,
  isTemplate?: boolean
): Promise<CoverLetterInfo | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'text/plain'],
      copyToCacheDirectory: true,
    });

    // Check if canceled
    if (result.canceled) {
      return null;
    }

    // Get the first selected file
    if (result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      const determinedIsTemplate = isTemplate ?? (company === undefined || company.trim() === '');
      const displayName = company && company.trim() 
        ? `Cover Letter - ${company.trim()}` 
        : file.name.replace(/\.[^/.]+$/, '');
      return await saveCoverLetter(file.uri, displayName, company, determinedIsTemplate);
    }

    return null;
  } catch (error) {
    console.error('Error picking cover letter:', error);
    throw error;
  }
};

/**
 * Save a cover letter (upload from device)
 */
export const saveCoverLetter = async (
  fileUri: string,
  name?: string,
  company?: string,
  isTemplate: boolean = false
): Promise<CoverLetterInfo> => {
  try {
    await ensureCoverLettersDirectory();

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    const id = generateCoverLetterId();
    const fileName = fileUri.split('/').pop() || `coverletter_${id}`;
    const newFileUri = `${COVER_LETTERS_DIR}${id}_${fileName}`;

    // Copy file to cover letters directory
    await FileSystem.copyAsync({
      from: fileUri,
      to: newFileUri,
    });

    // Get file info
    const newFileInfo = await FileSystem.getInfoAsync(newFileUri);
    const size = newFileInfo.exists && 'size' in newFileInfo ? newFileInfo.size : undefined;

    // Determine MIME type from extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    let mimeType: string | undefined;
    if (extension === 'pdf') {
      mimeType = 'application/pdf';
    } else if (extension === 'doc') {
      mimeType = 'application/msword';
    } else if (extension === 'docx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (extension === 'txt') {
      mimeType = 'text/plain';
    }

    const displayName = name || (company ? `Cover Letter - ${company}` : fileName.replace(/\.[^/.]+$/, ''));

    const coverLetterInfo: CoverLetterInfo = {
      id,
      name: displayName,
      company: company || undefined,
      isTemplate,
      fileName,
      fileUri: newFileUri,
      mimeType,
      size,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    // Update index
    const index = await getCoverLettersIndex();
    index.push(coverLetterInfo);
    await updateCoverLettersIndex(index);

    return coverLetterInfo;
  } catch (error) {
    console.error('Error saving cover letter:', error);
    throw error;
  }
};

/**
 * Get all cover letters
 */
export const getAllCoverLetters = async (): Promise<CoverLetterInfo[]> => {
  try {
    const index = await getCoverLettersIndex();
    // Sort by creation date (newest first)
    return index.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error('Error loading cover letters:', error);
    return [];
  }
};

/**
 * Get cover letter by ID
 */
export const getCoverLetterById = async (id: string): Promise<CoverLetterInfo | null> => {
  try {
    const index = await getCoverLettersIndex();
    return index.find((cl) => cl.id === id) || null;
  } catch (error) {
    console.error('Error loading cover letter:', error);
    return null;
  }
};

/**
 * Get cover letter templates (generic templates not customized for a company)
 */
export const getCoverLetterTemplates = async (): Promise<CoverLetterInfo[]> => {
  try {
    const allCoverLetters = await getAllCoverLetters();
    return allCoverLetters.filter((cl) => cl.isTemplate);
  } catch (error) {
    console.error('Error loading cover letter templates:', error);
    return [];
  }
};

/**
 * Get cover letters customized for a specific company
 */
export const getCoverLettersByCompany = async (company: string): Promise<CoverLetterInfo[]> => {
  try {
    const allCoverLetters = await getAllCoverLetters();
    return allCoverLetters.filter((cl) => cl.company?.toLowerCase() === company.toLowerCase());
  } catch (error) {
    console.error('Error loading cover letters by company:', error);
    return [];
  }
};

/**
 * Delete a cover letter
 */
export const deleteCoverLetter = async (id: string): Promise<void> => {
  try {
    const index = await getCoverLettersIndex();
    const coverLetter = index.find((cl) => cl.id === id);
    
    if (coverLetter) {
      // Delete file
      try {
        const fileInfo = await FileSystem.getInfoAsync(coverLetter.fileUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(coverLetter.fileUri, { idempotent: true });
        }
      } catch (fileError) {
        console.error('Error deleting cover letter file:', fileError);
        // Continue even if file deletion fails
      }

      // Remove from index
      const updatedIndex = index.filter((cl) => cl.id !== id);
      await updateCoverLettersIndex(updatedIndex);
    }
  } catch (error) {
    console.error('Error deleting cover letter:', error);
    throw error;
  }
};

/**
 * Rename a cover letter
 */
export const renameCoverLetter = async (id: string, newName: string): Promise<void> => {
  try {
    const index = await getCoverLettersIndex();
    const coverLetterIndex = index.findIndex((cl) => cl.id === id);
    
    if (coverLetterIndex !== -1) {
      index[coverLetterIndex].name = newName;
      index[coverLetterIndex].updatedAt = new Date().toISOString();
      await updateCoverLettersIndex(index);
    }
  } catch (error) {
    console.error('Error renaming cover letter:', error);
    throw error;
  }
};

/**
 * Update cover letter active/inactive status
 */
export const toggleCoverLetterActive = async (id: string): Promise<void> => {
  try {
    const index = await getCoverLettersIndex();
    const coverLetterIndex = index.findIndex((cl) => cl.id === id);
    
    if (coverLetterIndex !== -1) {
      index[coverLetterIndex].isActive = !index[coverLetterIndex].isActive;
      index[coverLetterIndex].updatedAt = new Date().toISOString();
      await updateCoverLettersIndex(index);
    }
  } catch (error) {
    console.error('Error toggling cover letter active status:', error);
    throw error;
  }
};

/**
 * Share a cover letter
 */
export const shareCoverLetter = async (id: string): Promise<void> => {
  try {
    const coverLetter = await getCoverLetterById(id);
    if (!coverLetter) {
      throw new Error('Cover letter not found');
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this platform');
    }

    await Sharing.shareAsync(coverLetter.fileUri, {
      mimeType: coverLetter.mimeType,
      dialogTitle: `Share ${coverLetter.name}`,
    });
  } catch (error) {
    console.error('Error sharing cover letter:', error);
    throw error;
  }
};

/**
 * Save a cover letter to device
 */
export const saveCoverLetterToDevice = async (id: string): Promise<void> => {
  try {
    const coverLetter = await getCoverLetterById(id);
    if (!coverLetter) {
      throw new Error('Cover letter not found');
    }

    if (Platform.OS === 'ios') {
      // On iOS, use Sharing API to save
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(coverLetter.fileUri, {
          mimeType: coverLetter.mimeType,
          dialogTitle: 'Save Cover Letter',
        });
      } else {
        throw new Error('Saving is not available on this platform');
      }
    } else {
      // On Android, copy to Downloads folder
      const downloadsDir = `${FileSystem.documentDirectory}../Download/`;
      const destUri = `${downloadsDir}${coverLetter.fileName}`;
      
      try {
        await FileSystem.copyAsync({
          from: coverLetter.fileUri,
          to: destUri,
        });
        // Note: On Android, you might need to use a file manager library
        // to save to Downloads folder properly
      } catch (copyError) {
        // Fallback to sharing
        await shareCoverLetter(id);
      }
    }
  } catch (error) {
    console.error('Error saving cover letter to device:', error);
    throw error;
  }
};

/**
 * Create a cover letter from a template (for a specific company)
 */
export const createCoverLetterFromTemplate = async (
  templateId: string,
  company: string,
  customName?: string
): Promise<CoverLetterInfo> => {
  try {
    const template = await getCoverLetterById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Copy the template file
    const id = generateCoverLetterId();
    const fileName = template.fileName;
    const newFileUri = `${COVER_LETTERS_DIR}${id}_${fileName}`;

    await FileSystem.copyAsync({
      from: template.fileUri,
      to: newFileUri,
    });

    const newFileInfo = await FileSystem.getInfoAsync(newFileUri);
    const size = newFileInfo.exists && 'size' in newFileInfo ? newFileInfo.size : undefined;

    const displayName = customName || `Cover Letter - ${company}`;

    const coverLetterInfo: CoverLetterInfo = {
      id,
      name: displayName,
      company,
      isTemplate: false, // This is a customized version, not a template
      fileName,
      fileUri: newFileUri,
      mimeType: template.mimeType,
      size,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    // Update index
    const index = await getCoverLettersIndex();
    index.push(coverLetterInfo);
    await updateCoverLettersIndex(index);

    return coverLetterInfo;
  } catch (error) {
    console.error('Error creating cover letter from template:', error);
    throw error;
  }
};


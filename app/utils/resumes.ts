import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ResumeInfo {
  id: string;
  name: string; // Display name (e.g., "Software Engineer Resume v2")
  fileName: string; // Original filename
  fileUri: string; // Full path to the file
  mimeType?: string; // MIME type (e.g., "application/pdf")
  size?: number; // File size in bytes
  createdAt: string; // ISO 8601 date string
  updatedAt?: string; // ISO 8601 date string
}

const RESUMES_DIR = `${FileSystem.documentDirectory}resumes/`;
const RESUMES_INDEX_KEY = 'resumes_index'; // Stores array of all resume metadata

/**
 * Ensure the resumes directory exists
 */
const ensureResumesDirectory = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(RESUMES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(RESUMES_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error creating resumes directory:', error);
    throw error;
  }
};

/**
 * Generate a unique ID for a resume
 */
const generateResumeId = (): string => {
  return `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all resume metadata from index
 */
const getResumesIndex = async (): Promise<ResumeInfo[]> => {
  try {
    const stored = await AsyncStorage.getItem(RESUMES_INDEX_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error loading resumes index:', error);
    return [];
  }
};

/**
 * Update the resumes index
 */
const updateResumesIndex = async (resumes: ResumeInfo[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(RESUMES_INDEX_KEY, JSON.stringify(resumes));
  } catch (error) {
    console.error('Error updating resumes index:', error);
    throw error;
  }
};

/**
 * Save a resume file
 * @param fileUri - URI of the file to save (from document picker or file system)
 * @param displayName - Optional display name, defaults to filename
 * @returns The saved resume info
 */
export const saveResume = async (
  fileUri: string,
  displayName?: string
): Promise<ResumeInfo> => {
  try {
    await ensureResumesDirectory();

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('Source file does not exist');
    }

    // Generate ID and destination path
    const id = generateResumeId();
    const fileName = fileUri.split('/').pop() || `resume_${id}.pdf`;
    const destinationUri = `${RESUMES_DIR}${id}_${fileName}`;

    // Copy file to app directory
    await FileSystem.copyAsync({
      from: fileUri,
      to: destinationUri,
    });

    // Get file stats
    const stats = await FileSystem.getInfoAsync(destinationUri);
    const fileSize = stats.exists && 'size' in stats ? stats.size : undefined;

    // Determine MIME type from extension
    let mimeType: string | undefined;
    if (fileName.endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      mimeType = 'application/msword';
    }

    const now = new Date().toISOString();
    const resumeInfo: ResumeInfo = {
      id,
      name: displayName || fileName,
      fileName,
      fileUri: destinationUri,
      mimeType,
      size: fileSize,
      createdAt: now,
      updatedAt: now,
    };

    // Update index
    const index = await getResumesIndex();
    index.push(resumeInfo);
    await updateResumesIndex(index);

    return resumeInfo;
  } catch (error) {
    console.error('Error saving resume:', error);
    throw error;
  }
};

/**
 * Pick a resume file using the document picker
 * @returns The saved resume info, or null if cancelled
 */
export const pickAndSaveResume = async (): Promise<ResumeInfo | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword'],
      copyToCacheDirectory: true,
    });

    // Check if canceled (newer API format)
    if (result.canceled) {
      return null;
    }

    // Get the first selected file
    if (result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      return await saveResume(file.uri, file.name);
    }

    return null;
  } catch (error) {
    console.error('Error picking resume:', error);
    throw error;
  }
};

/**
 * Get all saved resumes
 */
export const getAllResumes = async (): Promise<ResumeInfo[]> => {
  try {
    const index = await getResumesIndex();
    // Verify files still exist and remove any that don't
    const validResumes: ResumeInfo[] = [];
    
    for (const resume of index) {
      const fileInfo = await FileSystem.getInfoAsync(resume.fileUri);
      if (fileInfo.exists) {
        validResumes.push(resume);
      }
    }

    // Update index if any were removed
    if (validResumes.length !== index.length) {
      await updateResumesIndex(validResumes);
    }

    // Sort by creation date (newest first)
    return validResumes.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error('Error loading resumes:', error);
    return [];
  }
};

/**
 * Get a resume by ID
 */
export const getResumeById = async (id: string): Promise<ResumeInfo | null> => {
  try {
    const resumes = await getAllResumes();
    return resumes.find(r => r.id === id) || null;
  } catch (error) {
    console.error('Error getting resume:', error);
    return null;
  }
};

/**
 * Delete a resume
 */
export const deleteResume = async (id: string): Promise<void> => {
  try {
    const index = await getResumesIndex();
    const resume = index.find(r => r.id === id);
    
    if (resume) {
      // Delete file
      const fileInfo = await FileSystem.getInfoAsync(resume.fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(resume.fileUri, { idempotent: true });
      }

      // Update index
      const updatedIndex = index.filter(r => r.id !== id);
      await updateResumesIndex(updatedIndex);
    }
  } catch (error) {
    console.error('Error deleting resume:', error);
    throw error;
  }
};

/**
 * Share/export a resume file
 */
export const shareResume = async (resume: ResumeInfo): Promise<void> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(resume.fileUri);
    if (!fileInfo.exists) {
      throw new Error('Resume file does not exist');
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(resume.fileUri, {
        mimeType: resume.mimeType,
        dialogTitle: `Share ${resume.name}`,
      });
    } else {
      throw new Error('Sharing is not available on this platform');
    }
  } catch (error) {
    console.error('Error sharing resume:', error);
    throw error;
  }
};

/**
 * Update resume display name
 */
export const updateResumeName = async (id: string, newName: string): Promise<void> => {
  try {
    const index = await getResumesIndex();
    const resume = index.find(r => r.id === id);
    
    if (resume) {
      resume.name = newName;
      resume.updatedAt = new Date().toISOString();
      await updateResumesIndex(index);
    }
  } catch (error) {
    console.error('Error updating resume name:', error);
    throw error;
  }
};


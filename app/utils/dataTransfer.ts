import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { ResumeInfo } from './resumes';
import { CoverLetterInfo } from './coverLetters';

const EXPORT_VERSION = 1;
const RESUMES_INDEX_KEY = 'resumes_index';
const COVER_LETTERS_INDEX_KEY = 'cover_letters_index';
const RESUMES_DIR = `${FileSystem.documentDirectory}resumes/`;
const COVER_LETTERS_DIR = `${FileSystem.documentDirectory}coverLetters/`;

type ExportFile<T> = {
  id: string;
  fileName: string;
  mimeType?: string;
  dataBase64: string;
  metadata: T;
};

type ExportPayload = {
  version: number;
  exportedAt: string;
  asyncStorage: Record<string, string | null>;
  files: {
    resumes: ExportFile<ResumeInfo>[];
    coverLetters: ExportFile<CoverLetterInfo>[];
  };
};

const parseIndex = <T>(raw: string | null): T[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing index for export/import:', error);
    return [];
  }
};

const ensureDirectory = async (directory: string): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(directory);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }
};

const buildExportFileName = (): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `useyourtools_export_${timestamp}.json`;
};

const readFileAsBase64 = async (fileUri: string): Promise<string | null> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      return null;
    }
    return await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (error) {
    console.error('Error reading file for export:', error);
    return null;
  }
};

const exportFiles = async <T extends { id: string; fileName: string; fileUri: string; mimeType?: string }>(
  items: T[]
): Promise<ExportFile<T>[]> => {
  const exports: ExportFile<T>[] = [];
  for (const item of items) {
    const dataBase64 = await readFileAsBase64(item.fileUri);
    if (!dataBase64) {
      continue;
    }
    exports.push({
      id: item.id,
      fileName: item.fileName,
      mimeType: item.mimeType,
      dataBase64,
      metadata: item,
    });
  }
  return exports;
};

export const exportAppData = async (): Promise<string> => {
  const keys = await AsyncStorage.getAllKeys();
  const entries = await AsyncStorage.multiGet(keys);
  const asyncStorage: Record<string, string | null> = {};
  for (const [key, value] of entries) {
    asyncStorage[key] = value;
  }

  const resumesIndex = parseIndex<ResumeInfo>(asyncStorage[RESUMES_INDEX_KEY] ?? null);
  const coverLettersIndex = parseIndex<CoverLetterInfo>(asyncStorage[COVER_LETTERS_INDEX_KEY] ?? null);

  const exportPayload: ExportPayload = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    asyncStorage,
    files: {
      resumes: await exportFiles(resumesIndex),
      coverLetters: await exportFiles(coverLettersIndex),
    },
  };

  const exportPath = `${FileSystem.documentDirectory}${buildExportFileName()}`;
  await FileSystem.writeAsStringAsync(exportPath, JSON.stringify(exportPayload), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(exportPath, {
      mimeType: 'application/json',
      dialogTitle: 'Export UseYourTools Data',
    });
  }

  return exportPath;
};

const pickImportFile = async (): Promise<string | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled) {
    return null;
  }

  if (result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }

  return null;
};

const writeFileFromBase64 = async (fileUri: string, dataBase64: string): Promise<void> => {
  await FileSystem.writeAsStringAsync(fileUri, dataBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
};

export const importAppData = async (): Promise<void> => {
  const importUri = await pickImportFile();
  if (!importUri) {
    return;
  }

  const raw = await FileSystem.readAsStringAsync(importUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  let parsed: ExportPayload;
  try {
    parsed = JSON.parse(raw) as ExportPayload;
  } catch (error) {
    throw new Error('Invalid export file.');
  }

  if (!parsed || parsed.version !== EXPORT_VERSION || !parsed.asyncStorage) {
    throw new Error('Invalid export file.');
  }

  const keys = await AsyncStorage.getAllKeys();
  if (keys.length > 0) {
    await AsyncStorage.multiRemove(keys);
  }

  const asyncEntries = Object.entries(parsed.asyncStorage).filter(
    ([key, value]) => key !== RESUMES_INDEX_KEY && key !== COVER_LETTERS_INDEX_KEY && typeof value === 'string'
  ) as Array<[string, string]>;
  if (asyncEntries.length > 0) {
    await AsyncStorage.multiSet(asyncEntries);
  }

  await ensureDirectory(RESUMES_DIR);
  await ensureDirectory(COVER_LETTERS_DIR);

  const resumeExports = parsed.files?.resumes ?? [];
  const coverLetterExports = parsed.files?.coverLetters ?? [];

  const restoredResumes: ResumeInfo[] = [];
  for (const resume of resumeExports) {
    const fileUri = `${RESUMES_DIR}${resume.id}_${resume.fileName}`;
    await writeFileFromBase64(fileUri, resume.dataBase64);
    restoredResumes.push({
      ...resume.metadata,
      fileUri,
      fileName: resume.fileName,
    });
  }

  const restoredCoverLetters: CoverLetterInfo[] = [];
  for (const coverLetter of coverLetterExports) {
    const fileUri = `${COVER_LETTERS_DIR}${coverLetter.id}_${coverLetter.fileName}`;
    await writeFileFromBase64(fileUri, coverLetter.dataBase64);
    restoredCoverLetters.push({
      ...coverLetter.metadata,
      fileUri,
      fileName: coverLetter.fileName,
    });
  }

  await AsyncStorage.setItem(RESUMES_INDEX_KEY, JSON.stringify(restoredResumes));
  await AsyncStorage.setItem(COVER_LETTERS_INDEX_KEY, JSON.stringify(restoredCoverLetters));
};

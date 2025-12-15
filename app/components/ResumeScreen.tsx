import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { usePreferences } from '../context/PreferencesContext';
import {
  ResumeInfo,
  getAllResumes,
  pickAndSaveResume,
  deleteResume,
  shareResume,
  updateResumeName,
  toggleResumeActive,
} from '../utils/resumes';

interface ResumeScreenProps {
  onBack: () => void;
}

export default function ResumeScreen({ onBack }: ResumeScreenProps) {
  const [resumes, setResumes] = useState<ResumeInfo[]>([]);
  const [editingName, setEditingName] = useState<ResumeInfo | null>(null);
  const [newName, setNewName] = useState('');
  const [previewResume, setPreviewResume] = useState<ResumeInfo | null>(null);
  const [previewUri, setPreviewUri] = useState<string>('');
  const { colorScheme } = usePreferences();

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const allResumes = await getAllResumes();
      setResumes(allResumes);
    } catch (error) {
      console.error('Error loading resumes:', error);
      Alert.alert('Error', 'Failed to load resumes');
    }
  };

  const handlePickResume = async () => {
    try {
      const resume = await pickAndSaveResume();
      if (resume) {
        await loadResumes();
        Alert.alert('Success', `Resume "${resume.name}" saved successfully`);
      }
    } catch (error) {
      console.error('Error picking resume:', error);
      Alert.alert('Error', 'Failed to save resume. Please try again.');
    }
  };

  const handleDelete = (resume: ResumeInfo) => {
    Alert.alert(
      'Delete Resume',
      `Are you sure you want to delete "${resume.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteResume(resume.id);
              await loadResumes();
              Alert.alert('Success', 'Resume deleted');
            } catch (error) {
              console.error('Error deleting resume:', error);
              Alert.alert('Error', 'Failed to delete resume');
            }
          },
        },
      ]
    );
  };

  const handleShare = async (resume: ResumeInfo) => {
    try {
      await shareResume(resume);
    } catch (error) {
      console.error('Error sharing resume:', error);
      Alert.alert('Error', 'Failed to share resume');
    }
  };

  const handleRename = (resume: ResumeInfo) => {
    setEditingName(resume);
    setNewName(resume.name);
  };

  const saveRename = async () => {
    if (!editingName || !newName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      await updateResumeName(editingName.id, newName.trim());
      await loadResumes();
      setEditingName(null);
      setNewName('');
      Alert.alert('Success', 'Resume renamed');
    } catch (error) {
      console.error('Error renaming resume:', error);
      Alert.alert('Error', 'Failed to rename resume');
    }
  };

  const handlePreview = async (resume: ResumeInfo) => {
    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(resume.fileUri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Resume file not found');
        return;
      }

      // For PDF files, we can preview with WebView
      if (resume.mimeType === 'application/pdf') {
        setPreviewResume(resume);
        // Read file as base64 and embed in HTML for WebView
        try {
          const base64Content = await FileSystem.readAsStringAsync(resume.fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Create HTML with embedded PDF using data URI
          const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                  }
                  embed {
                    width: 100%;
                    height: 100vh;
                  }
                </style>
              </head>
              <body>
                <embed src="data:application/pdf;base64,${base64Content}" type="application/pdf" />
              </body>
            </html>
          `;
          setPreviewUri(htmlContent);
        } catch (readError) {
          console.error('Error reading file:', readError);
          Alert.alert('Error', 'Failed to read resume file for preview');
        }
      } else {
        // For non-PDF files, suggest sharing or opening in another app
        Alert.alert(
          'Preview Not Available',
          'PDF preview is available. For other file types, please use the Share button to open in another app.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error previewing resume:', error);
      Alert.alert('Error', 'Failed to preview resume');
    }
  };

  const handlePrint = async (resume: ResumeInfo) => {
    try {
      if (!resume) return;
      
      // Print the PDF file directly
      await Print.printAsync({
        uri: resume.fileUri,
      });
    } catch (error) {
      console.error('Error printing resume:', error);
      Alert.alert('Error', 'Failed to print resume');
    }
  };

  const handleShareFromPreview = async (resume: ResumeInfo) => {
    try {
      if (!resume) return;
      // Share opens the share sheet for sharing with other apps/people
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resume.fileUri, {
          mimeType: resume.mimeType || 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing resume:', error);
      Alert.alert('Error', 'Failed to share resume');
    }
  };

  const handleToggleActive = async (resume: ResumeInfo) => {
    try {
      await toggleResumeActive(resume.id);
      await loadResumes();
    } catch (error) {
      console.error('Error toggling resume active status:', error);
      Alert.alert('Error', 'Failed to update resume status');
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colorScheme.colors.text }]}>Resumes</Text>
        <TouchableOpacity style={styles.addButton} onPress={handlePickResume}>
          <Text style={[styles.addButtonText, { color: colorScheme.colors.primary }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.listContent}>
        {resumes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colorScheme.colors.textSecondary }]}>
              No resumes saved yet.{'\n'}Tap "+ Add" to save a resume file!
            </Text>
            <Text style={[styles.emptyHint, { color: colorScheme.colors.textSecondary }]}>
              Supported formats: PDF, DOC, DOCX
            </Text>
          </View>
        ) : (
          resumes.map((resume) => (
            <View
              key={resume.id}
              style={[styles.resumeCard, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
            >
              <View style={styles.resumeHeader}>
                <View style={styles.resumeHeaderTop}>
                  <Text style={[styles.resumeName, { color: colorScheme.colors.text }]}>
                    {resume.name}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.activeBadge,
                      {
                        backgroundColor: (resume.isActive ?? true) 
                          ? colorScheme.colors.primary + '20' 
                          : colorScheme.colors.textSecondary + '20',
                        borderColor: (resume.isActive ?? true)
                          ? colorScheme.colors.primary
                          : colorScheme.colors.textSecondary,
                      },
                    ]}
                    onPress={() => handleToggleActive(resume)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.activeBadgeText,
                        {
                          color: (resume.isActive ?? true)
                            ? colorScheme.colors.primary
                            : colorScheme.colors.textSecondary,
                        },
                      ]}
                    >
                      {(resume.isActive ?? true) ? '✓ Active' : '○ Inactive'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.resumeFileName, { color: colorScheme.colors.textSecondary }]}>
                  {resume.fileName}
                </Text>
              </View>

              <View style={styles.resumeDetails}>
                <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                  📄 Size: {formatFileSize(resume.size)}
                </Text>
                <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                  📅 Saved: {formatDate(resume.createdAt)}
                </Text>
                {resume.mimeType && (
                  <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                    📋 Type: {resume.mimeType}
                  </Text>
                )}
              </View>

              <View style={styles.resumeActions}>
                {resume.mimeType === 'application/pdf' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colorScheme.colors.primary }]}
                    onPress={() => handlePreview(resume)}
                  >
                    <Text style={styles.actionButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      Preview
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colorScheme.colors.secondary || '#6b5b4f' }]}
                  onPress={() => handleShare(resume)}
                >
                  <Text style={styles.actionButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    Share
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colorScheme.colors.secondary || '#6b5b4f' }]}
                  onPress={() => handleRename(resume)}
                >
                  <Text style={styles.actionButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    Rename
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(resume)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Preview Modal */}
      <Modal
        visible={previewResume !== null}
        animationType="slide"
        onRequestClose={() => {
          setPreviewResume(null);
          setPreviewUri('');
        }}
      >
        <View style={styles.previewContainer}>
          <View style={[styles.previewHeader, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
            <TouchableOpacity
              onPress={() => {
                setPreviewResume(null);
                setPreviewUri('');
              }}
              style={styles.previewCloseButton}
            >
              <Text style={[styles.previewCloseText, { color: colorScheme.colors.primary }]}>← Close</Text>
            </TouchableOpacity>
            <Text style={[styles.previewTitle, { color: colorScheme.colors.text }]} numberOfLines={1}>
              {previewResume?.name || 'Preview'}
            </Text>
            {previewResume && (
              <View style={styles.previewActions}>
                <TouchableOpacity
                  onPress={() => handlePrint(previewResume)}
                  style={[styles.previewActionButton, { backgroundColor: colorScheme.colors.primary }]}
                >
                  <Text style={styles.previewActionText}>🖨️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleShareFromPreview(previewResume)}
                  style={[styles.previewActionButton, { backgroundColor: colorScheme.colors.primary }]}
                >
                  <Text style={styles.previewActionText}>📤</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {previewUri ? (
            <WebView
              source={{ html: previewUri }}
              style={styles.previewWebView}
              startInLoadingState
              scalesPageToFit
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          ) : (
            <View style={styles.previewLoadingContainer}>
              <Text style={{ color: colorScheme.colors.text }}>Loading preview...</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={editingName !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingName(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
              Rename Resume
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colorScheme.colors.background, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter new name"
              placeholderTextColor={colorScheme.colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colorScheme.colors.background, borderColor: colorScheme.colors.border }]}
                onPress={() => {
                  setEditingName(null);
                  setNewName('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colorScheme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colorScheme.colors.primary }]}
                onPress={saveRename}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#E7D7C1',
    borderBottomWidth: 1,
    borderBottomColor: '#C9A66B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#8C6A4A',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b7355',
    flex: 1,
  },
  addButton: {
    marginLeft: 10,
  },
  addButtonText: {
    fontSize: 16,
    color: '#8C6A4A',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b5b4f',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#6b5b4f',
    textAlign: 'center',
  },
  resumeCard: {
    backgroundColor: '#E7D7C1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C9A66B',
  },
  resumeHeader: {
    marginBottom: 12,
  },
  resumeHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resumeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A3A2A',
    flex: 1,
    marginRight: 8,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resumeFileName: {
    fontSize: 14,
    color: '#6b5b4f',
  },
  resumeDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#6b5b4f',
    marginBottom: 4,
  },
  resumeActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8C6A4A',
    minWidth: 0,
  },
  actionButtonText: {
    color: '#f5f5dc',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  deleteButtonText: {
    color: '#d32f2f',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#E7D7C1',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3A2A',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#f5f5dc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#4A3A2A',
    borderWidth: 1,
    borderColor: '#C9A66B',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#f5f5dc',
  },
  previewHeader: {
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewCloseButton: {
    padding: 8,
    minWidth: 60,
  },
  previewCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8C6A4A',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A3A2A',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  previewWebView: {
    flex: 1,
  },
  previewLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 120,
    justifyContent: 'flex-end',
  },
  previewActionButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewActionText: {
    fontSize: 18,
  },
});


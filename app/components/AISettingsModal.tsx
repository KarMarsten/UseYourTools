import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import { loadPreferences, savePreferences, UserPreferences } from '../utils/preferences';

interface AISettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AISettingsModal({
  visible,
  onClose,
}: AISettingsModalProps) {
  const { colorScheme } = usePreferences();
  const [aiService, setAiService] = useState<'none' | 'openai' | 'gemini'>('none');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const prefs = await loadPreferences();
      setAiService(prefs.aiToneRewriting || 'none');
      setOpenaiKey(prefs.openaiApiKey || '');
      setGeminiKey(prefs.geminiApiKey || '');
    } catch (error) {
      console.error('Error loading AI settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const prefs = await loadPreferences();
      
      const updatedPrefs: UserPreferences = {
        ...prefs,
        aiToneRewriting: aiService,
        openaiApiKey: aiService === 'openai' ? openaiKey.trim() : undefined,
        geminiApiKey: aiService === 'gemini' ? geminiKey.trim() : undefined,
      };

      await savePreferences(updatedPrefs);
      Alert.alert('Success', 'AI settings saved');
      onClose();
    } catch (error) {
      console.error('Error saving AI settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestOpenAI = async () => {
    if (!openaiKey.trim()) {
      Alert.alert('Error', 'Please enter an OpenAI API key');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey.trim()}`,
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'OpenAI API key is valid');
      } else {
        Alert.alert('Error', 'Invalid API key. Please check your key and try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test API key. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestGemini = async () => {
    if (!geminiKey.trim()) {
      Alert.alert('Error', 'Please enter a Gemini API key');
      return;
    }

    try {
      setLoading(true);
      // Test with v1 endpoint by trying multiple models
      const modelsToTry = [
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
      ];

      let lastError: any = null;
      let success = false;

      for (const modelName of modelsToTry) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${geminiKey.trim()}`,
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
                        text: 'Test',
                      },
                    ],
                  },
                ],
              }),
            }
          );

          if (response.ok) {
            Alert.alert('Success', `Gemini API key is valid (using ${modelName})`);
            success = true;
            break;
          } else {
            const errorData = await response.json().catch(() => ({}));
            lastError = errorData;
            // If it's a 404, try next model; otherwise show error
            if (response.status !== 404) {
              const errorMessage = errorData.error?.message || 'Invalid API key';
              Alert.alert('Error', `Invalid API key: ${errorMessage}`);
              break;
            }
          }
        } catch (error: any) {
          lastError = error;
          continue;
        }
      }

      if (!success) {
        const errorMessage = lastError?.error?.message || lastError?.message || 'No available models found';
        Alert.alert('Error', `API key test failed: ${errorMessage}`);
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to test API key: ${error?.message || 'Please check your connection.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: colorScheme.colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colorScheme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
              AI Tone Rewriting Settings
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colorScheme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.description, { color: colorScheme.colors.textSecondary }]}>
              Use AI to dynamically rewrite emails based on tone. This provides more natural and comprehensive tone transformations than hardcoded rules.
            </Text>

            {/* AI Service Selection */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>AI Service</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    {
                      backgroundColor:
                        aiService === 'none'
                          ? colorScheme.colors.primary
                          : colorScheme.colors.background,
                      borderColor: colorScheme.colors.border,
                    },
                  ]}
                  onPress={() => setAiService('none')}
                >
                  <Text
                    style={[
                      styles.radioText,
                      {
                        color: aiService === 'none' ? '#FFFFFF' : colorScheme.colors.text,
                      },
                    ]}
                  >
                    None (Use hardcoded rules)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    {
                      backgroundColor:
                        aiService === 'openai'
                          ? colorScheme.colors.primary
                          : colorScheme.colors.background,
                      borderColor: colorScheme.colors.border,
                    },
                  ]}
                  onPress={() => setAiService('openai')}
                >
                  <Text
                    style={[
                      styles.radioText,
                      {
                        color: aiService === 'openai' ? '#FFFFFF' : colorScheme.colors.text,
                      },
                    ]}
                  >
                    OpenAI (GPT)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    {
                      backgroundColor:
                        aiService === 'gemini'
                          ? colorScheme.colors.primary
                          : colorScheme.colors.background,
                      borderColor: colorScheme.colors.border,
                    },
                  ]}
                  onPress={() => setAiService('gemini')}
                >
                  <Text
                    style={[
                      styles.radioText,
                      {
                        color: aiService === 'gemini' ? '#FFFFFF' : colorScheme.colors.text,
                      },
                    ]}
                  >
                    Google Gemini
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* OpenAI API Key */}
            {aiService === 'openai' && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: colorScheme.colors.text }]}>
                  OpenAI API Key
                </Text>
                <Text style={[styles.helpText, { color: colorScheme.colors.textSecondary }]}>
                  Get your API key from{' '}
                  <Text style={{ textDecorationLine: 'underline' }}>
                    https://platform.openai.com/api-keys
                  </Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme.colors.background,
                      borderColor: colorScheme.colors.border,
                      color: colorScheme.colors.text,
                    },
                  ]}
                  value={openaiKey}
                  onChangeText={setOpenaiKey}
                  placeholder="sk-..."
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={[styles.testButton, { borderColor: colorScheme.colors.border }]}
                  onPress={handleTestOpenAI}
                  disabled={loading}
                >
                  <Text style={[styles.testButtonText, { color: colorScheme.colors.text }]}>
                    Test API Key
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Gemini API Key */}
            {aiService === 'gemini' && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: colorScheme.colors.text }]}>
                  Gemini API Key
                </Text>
                <Text style={[styles.helpText, { color: colorScheme.colors.textSecondary }]}>
                  Get your API key from{' '}
                  <Text style={{ textDecorationLine: 'underline' }}>
                    https://makersuite.google.com/app/apikey
                  </Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme.colors.background,
                      borderColor: colorScheme.colors.border,
                      color: colorScheme.colors.text,
                    },
                  ]}
                  value={geminiKey}
                  onChangeText={setGeminiKey}
                  placeholder="AIza..."
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={[styles.testButton, { borderColor: colorScheme.colors.border }]}
                  onPress={handleTestGemini}
                  disabled={loading}
                >
                  <Text style={[styles.testButtonText, { color: colorScheme.colors.text }]}>
                    Test API Key
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.note, { color: colorScheme.colors.textSecondary }]}>
              Note: API keys are stored securely on your device. AI rewriting will automatically fall back to hardcoded rules if the API is unavailable.
            </Text>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionBar, { borderTopColor: colorScheme.colors.border }]}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: colorScheme.colors.primary },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 0.9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  radioGroup: {
    gap: 8,
  },
  radioOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  radioText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  testButton: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    borderWidth: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});


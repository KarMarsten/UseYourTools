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
import {
  TonePreset,
  saveTonePreset,
  deleteTonePreset,
} from '../utils/emailTemplates';

interface TonePresetEditorModalProps {
  visible: boolean;
  onClose: () => void;
  preset?: TonePreset | null; // If provided, edit mode; otherwise, create mode
  onSave: () => void;
}

export default function TonePresetEditorModal({
  visible,
  onClose,
  preset,
  onSave,
}: TonePresetEditorModalProps) {
  const { colorScheme } = usePreferences();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [replacements, setReplacements] = useState<Array<{ from: string; to: string; flags: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');

  useEffect(() => {
    if (visible) {
      if (preset && preset.isCustom) {
        // Edit mode
        setName(preset.name);
        setDescription(preset.description);
        setReplacements(preset.transformations?.replacements || []);
      } else {
        // Create mode
        setName('');
        setDescription('');
        setReplacements([]);
      }
      setEditingIndex(null);
      setFromText('');
      setToText('');
    }
  }, [visible, preset]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a preset name');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    try {
      setLoading(true);
      const newPreset: TonePreset = {
        id: preset?.id || '',
        name: name.trim(),
        description: description.trim(),
        isCustom: true,
        createdAt: preset?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        transformations: {
          replacements: replacements,
        },
      };

      await saveTonePreset(newPreset);
      onSave();
      onClose();
      Alert.alert('Success', preset ? 'Tone preset updated' : 'Tone preset created');
    } catch (error) {
      console.error('Error saving tone preset:', error);
      Alert.alert('Error', 'Failed to save tone preset');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!preset || !preset.isCustom) {
      return;
    }

    Alert.alert(
      'Delete Tone Preset',
      `Are you sure you want to delete "${preset.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTonePreset(preset.id as string);
              onSave();
              onClose();
              Alert.alert('Success', 'Tone preset deleted');
            } catch (error) {
              console.error('Error deleting tone preset:', error);
              Alert.alert('Error', 'Failed to delete tone preset');
            }
          },
        },
      ]
    );
  };

  const addReplacement = () => {
    if (!fromText.trim() || !toText.trim()) {
      Alert.alert('Error', 'Please enter both "from" and "to" text');
      return;
    }

    if (editingIndex !== null) {
      // Update existing
      const updated = [...replacements];
      updated[editingIndex] = { from: fromText, to: toText, flags: 'gi' };
      setReplacements(updated);
      setEditingIndex(null);
    } else {
      // Add new
      setReplacements([...replacements, { from: fromText, to: toText, flags: 'gi' }]);
    }
    setFromText('');
    setToText('');
  };

  const editReplacement = (index: number) => {
    const replacement = replacements[index];
    setFromText(replacement.from);
    setToText(replacement.to);
    setEditingIndex(index);
  };

  const removeReplacement = (index: number) => {
    Alert.alert(
      'Remove Replacement',
      'Are you sure you want to remove this replacement rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setReplacements(replacements.filter((_, i) => i !== index));
          },
        },
      ]
    );
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
              {preset ? 'Edit Tone Preset' : 'Create Tone Preset'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colorScheme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Preset Name */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>Preset Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme.colors.background,
                    borderColor: colorScheme.colors.border,
                    color: colorScheme.colors.text,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Very Formal"
                placeholderTextColor={colorScheme.colors.textSecondary}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>Description</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme.colors.background,
                    borderColor: colorScheme.colors.border,
                    color: colorScheme.colors.text,
                  },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the tone style"
                placeholderTextColor={colorScheme.colors.textSecondary}
              />
            </View>

            {/* Text Replacements */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>Text Replacements</Text>
              <Text style={[styles.helpText, { color: colorScheme.colors.textSecondary }]}>
                Define text replacements to transform the email tone
              </Text>

              {/* Add/Edit Replacement */}
              <View style={styles.replacementEditor}>
                <View style={styles.replacementRow}>
                  <Text style={[styles.replacementLabel, { color: colorScheme.colors.text }]}>From:</Text>
                  <TextInput
                    style={[
                      styles.replacementInput,
                      {
                        backgroundColor: colorScheme.colors.background,
                        borderColor: colorScheme.colors.border,
                        color: colorScheme.colors.text,
                      },
                    ]}
                    value={fromText}
                    onChangeText={setFromText}
                    placeholder="Text to find"
                    placeholderTextColor={colorScheme.colors.textSecondary}
                  />
                </View>
                <View style={styles.replacementRow}>
                  <Text style={[styles.replacementLabel, { color: colorScheme.colors.text }]}>To:</Text>
                  <TextInput
                    style={[
                      styles.replacementInput,
                      {
                        backgroundColor: colorScheme.colors.background,
                        borderColor: colorScheme.colors.border,
                        color: colorScheme.colors.text,
                      },
                    ]}
                    value={toText}
                    onChangeText={setToText}
                    placeholder="Replacement text"
                    placeholderTextColor={colorScheme.colors.textSecondary}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: colorScheme.colors.primary },
                  ]}
                  onPress={addReplacement}
                >
                  <Text style={styles.addButtonText}>
                    {editingIndex !== null ? 'Update' : 'Add'} Replacement
                  </Text>
                </TouchableOpacity>
                {editingIndex !== null && (
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: colorScheme.colors.border }]}
                    onPress={() => {
                      setEditingIndex(null);
                      setFromText('');
                      setToText('');
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: colorScheme.colors.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* List of Replacements */}
              {replacements.length > 0 && (
                <View style={styles.replacementsList}>
                  {replacements.map((replacement, index) => (
                    <View
                      key={index}
                      style={[
                        styles.replacementItem,
                        { backgroundColor: colorScheme.colors.background, borderColor: colorScheme.colors.border },
                      ]}
                    >
                      <View style={styles.replacementItemContent}>
                        <Text style={[styles.replacementItemText, { color: colorScheme.colors.text }]}>
                          "{replacement.from}" → "{replacement.to}"
                        </Text>
                      </View>
                      <View style={styles.replacementItemActions}>
                        <TouchableOpacity
                          onPress={() => editReplacement(index)}
                          style={styles.replacementActionButton}
                        >
                          <Text style={[styles.replacementActionText, { color: colorScheme.colors.primary }]}>
                            Edit
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeReplacement(index)}
                          style={styles.replacementActionButton}
                        >
                          <Text style={[styles.replacementActionText, { color: '#FF3B30' }]}>
                            Remove
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionBar, { borderTopColor: colorScheme.colors.border }]}>
            {preset && preset.isCustom && (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton, { borderColor: colorScheme.colors.border }]}
                onPress={handleDelete}
              >
                <Text style={[styles.buttonText, { color: '#FF3B30' }]}>Delete</Text>
              </TouchableOpacity>
            )}
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
                {loading ? 'Saving...' : preset ? 'Update' : 'Create'}
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
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  replacementEditor: {
    marginBottom: 16,
  },
  replacementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  replacementLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 60,
  },
  replacementInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  replacementsList: {
    marginTop: 12,
  },
  replacementItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  replacementItemContent: {
    marginBottom: 8,
  },
  replacementItemText: {
    fontSize: 14,
  },
  replacementItemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  replacementActionButton: {
    padding: 4,
  },
  replacementActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    borderWidth: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});


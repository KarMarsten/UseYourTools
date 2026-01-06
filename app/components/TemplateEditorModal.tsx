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
  EmailTemplate,
  EmailTemplateType,
  saveTemplate,
  deleteTemplate,
  EMAIL_VARIABLES,
} from '../utils/emailTemplates';

interface TemplateEditorModalProps {
  visible: boolean;
  onClose: () => void;
  template?: EmailTemplate | null; // If provided, edit mode; otherwise, create mode
  templateType: EmailTemplateType;
  onSave: () => void;
}

export default function TemplateEditorModal({
  visible,
  onClose,
  template,
  templateType,
  onSave,
}: TemplateEditorModalProps) {
  const { colorScheme } = usePreferences();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (template) {
        // Edit mode
        setName(template.name);
        setSubject(template.subject);
        setBody(template.body);
      } else {
        // Create mode
        setName('');
        setSubject('');
        setBody('');
      }
    }
  }, [visible, template]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Error', 'Please enter email body');
      return;
    }

    try {
      setLoading(true);
      const newTemplate: EmailTemplate = {
        id: template?.id || '',
        type: templateType,
        name: name.trim(),
        subject: subject.trim(),
        body: body.trim(),
        isDefault: false,
        createdAt: template?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveTemplate(newTemplate);
      onSave();
      onClose();
      Alert.alert('Success', template ? 'Template updated' : 'Template created');
    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Error', 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!template || template.isDefault) {
      return;
    }

    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTemplate(template.id);
              onSave();
              onClose();
              Alert.alert('Success', 'Template deleted');
            } catch (error) {
              console.error('Error deleting template:', error);
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const insertVariable = (variable: string) => {
    setBody((prev) => prev + variable);
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
              {template ? 'Edit Template' : 'Create Template'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colorScheme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Template Name */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>Template Name</Text>
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
                placeholder="e.g., Thank You - Personal"
                placeholderTextColor={colorScheme.colors.textSecondary}
              />
            </View>

            {/* Subject */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>Subject</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme.colors.background,
                    borderColor: colorScheme.colors.border,
                    color: colorScheme.colors.text,
                  },
                ]}
                value={subject}
                onChangeText={setSubject}
                placeholder="Email subject"
                placeholderTextColor={colorScheme.colors.textSecondary}
              />
            </View>

            {/* Body */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>Body</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colorScheme.colors.background,
                    borderColor: colorScheme.colors.border,
                    color: colorScheme.colors.text,
                  },
                ]}
                value={body}
                onChangeText={setBody}
                placeholder="Email body"
                placeholderTextColor={colorScheme.colors.textSecondary}
                multiline
                numberOfLines={15}
                textAlignVertical="top"
              />
            </View>

            {/* Available Variables */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>Available Variables</Text>
              <Text style={[styles.helpText, { color: colorScheme.colors.textSecondary }]}>
                Tap to insert into body
              </Text>
              <View style={styles.variablesContainer}>
                {EMAIL_VARIABLES.map((variable) => (
                  <TouchableOpacity
                    key={variable.key}
                    style={[
                      styles.variableButton,
                      {
                        backgroundColor: colorScheme.colors.background,
                        borderColor: colorScheme.colors.border,
                      },
                    ]}
                    onPress={() => insertVariable(variable.key)}
                  >
                    <Text style={[styles.variableText, { color: colorScheme.colors.text }]}>
                      {variable.key}
                    </Text>
                    <Text style={[styles.variableLabel, { color: colorScheme.colors.textSecondary }]}>
                      {variable.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionBar, { borderTopColor: colorScheme.colors.border }]}>
            {template && !template.isDefault && (
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
                {loading ? 'Saving...' : template ? 'Update' : 'Create'}
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
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 200,
  },
  variablesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variableButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 100,
  },
  variableText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  variableLabel: {
    fontSize: 11,
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


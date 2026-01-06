import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import { loadPreferences } from '../utils/preferences';
import {
  EmailTemplate,
  EmailTemplateType,
  getTemplatesByType,
  replaceVariables,
} from '../utils/emailTemplates';
import TemplateEditorModal from './TemplateEditorModal';
import { JobApplication } from '../utils/applications';
import { Event } from '../utils/events';
import { recordEmailSent } from '../utils/applications';
import { openEmail } from '../utils/eventActions';

interface EmailTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  application: JobApplication;
  emailType: EmailTemplateType;
  linkedEvent?: Event; // For thank-you emails, can link to interview event
  onEmailSent?: () => void;
}

export default function EmailTemplateModal({
  visible,
  onClose,
  application,
  emailType,
  linkedEvent,
  onEmailSent,
}: EmailTemplateModalProps) {
  const { colorScheme } = usePreferences();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const bodyInputRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      loadTemplates();
    }
  }, [visible, emailType]);

  useEffect(() => {
    const processTemplate = async () => {
      if (selectedTemplate && application) {
        // Build variables from application and event data
        const variables: Record<string, string> = {
          company: application.company || '',
          position: application.positionTitle || '',
          appliedDate: new Date(application.appliedDate).toLocaleDateString(),
          date: new Date().toLocaleDateString(),
          yourName: '', // User can fill this in manually or we could get from preferences
        };

        // Add interviewer name if we have a linked event
        if (linkedEvent?.contactName) {
          variables.interviewerName = linkedEvent.contactName;
        } else {
          variables.interviewerName = 'Hiring Manager';
        }

        // Replace variables in subject and body
        // Ensure template has content (safety check for corrupted/empty templates)
        const templateSubject = selectedTemplate.subject || '';
        const templateBody = selectedTemplate.body || '';
        
        // Replace variables in subject and body
        const processedSubject = replaceVariables(templateSubject, variables);
        const processedBody = replaceVariables(templateBody, variables);

        setSubject(processedSubject);
        setBody(processedBody);
      }

      // Try to get recipient email from event or leave empty
      if (linkedEvent?.email) {
        setRecipientEmail(linkedEvent.email);
      } else {
        setRecipientEmail('');
      }
    };

    processTemplate();
  }, [selectedTemplate, application, linkedEvent]);

  const loadTemplates = async () => {
    try {
      const templatesByType = await getTemplatesByType(emailType);
      setTemplates(templatesByType);
      
      // Auto-select first template
      if (templatesByType.length > 0) {
        setSelectedTemplate(templatesByType[0]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      Alert.alert('Error', 'Failed to load email templates');
    }
  };


  const handleTemplateSaved = () => {
    loadTemplates();
  };


  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateEditor(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowTemplateEditor(true);
  };


  const handleSendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      Alert.alert('Error', 'Please fill in both subject and body');
      return;
    }

    try {
      setLoading(true);

      // If no recipient email, still allow copying to clipboard
      if (!recipientEmail.trim()) {
        Alert.alert(
          'No Email Address',
          'No recipient email address provided. The email content has been copied to your clipboard. You can paste it into your email client manually.',
          [
            {
              text: 'OK',
              onPress: async () => {
                try {
                  const Clipboard = await import('expo-clipboard');
                  const emailContent = `Subject: ${subject}\n\n${body}`;
                  await Clipboard.setStringAsync(emailContent);
                } catch (error) {
                  console.error('Error copying to clipboard:', error);
                }
              },
            },
          ]
        );
        setLoading(false);
        return;
      }

      // Get email client preference
      const prefs = await loadPreferences();
      const emailClientPreference = prefs.emailClient || 'default';
      
      // Open email client with pre-filled content
      const emailSubject = encodeURIComponent(subject);
      const emailBody = encodeURIComponent(body);
      
      let emailUrl: string;
      if (emailClientPreference === 'gmail') {
        // Gmail app URL scheme
        if (Platform.OS === 'ios') {
          // iOS Gmail app
          emailUrl = `googlegmail://co?to=${encodeURIComponent(recipientEmail)}&subject=${emailSubject}&body=${emailBody}`;
        } else {
          // Android Gmail app
          emailUrl = `intent://send?to=${encodeURIComponent(recipientEmail)}&subject=${emailSubject}&body=${emailBody}#Intent;scheme=mailto;package=com.google.android.gm;end`;
        }
      } else {
        // Default email client (mailto:)
        emailUrl = `mailto:${recipientEmail}?subject=${emailSubject}&body=${emailBody}`;
      }
      
      // Try to open the preferred email client
      try {
        // Check if we can open the URL (this requires the scheme to be in LSApplicationQueriesSchemes)
        const canOpen = await Linking.canOpenURL(emailUrl);
        if (canOpen) {
          await Linking.openURL(emailUrl);
        } else {
          // Fallback to default mailto if Gmail is not available
          if (emailClientPreference === 'gmail') {
            const mailtoUrl = `mailto:${recipientEmail}?subject=${emailSubject}&body=${emailBody}`;
            const canOpenDefault = await Linking.canOpenURL(mailtoUrl);
            if (canOpenDefault) {
              await Linking.openURL(mailtoUrl);
              Alert.alert(
                'Gmail Not Available',
                'Gmail app not found. Opened default email client instead.',
                [{ text: 'OK' }]
              );
            } else {
              // Fallback to clipboard if no email client is available
              const Clipboard = await import('expo-clipboard');
              const emailContent = `Subject: ${subject}\n\n${body}`;
              await Clipboard.setStringAsync(emailContent);
              Alert.alert(
                'No Email Client',
                'No email client found. Email content has been copied to your clipboard.',
                [{ text: 'OK' }]
              );
              setLoading(false);
              return;
            }
          } else {
            // Fallback to clipboard if no email client is available
            const Clipboard = await import('expo-clipboard');
            const emailContent = `Subject: ${subject}\n\n${body}`;
            await Clipboard.setStringAsync(emailContent);
            Alert.alert(
              'No Email Client',
              'No email client found. Email content has been copied to your clipboard.',
              [{ text: 'OK' }]
            );
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error opening email client:', error);
        // Fallback to clipboard on error
        try {
          const Clipboard = await import('expo-clipboard');
          const emailContent = `Subject: ${subject}\n\n${body}`;
          await Clipboard.setStringAsync(emailContent);
          Alert.alert(
            'Error Opening Email',
            'Failed to open email client. Email content has been copied to your clipboard.',
            [{ text: 'OK' }]
          );
        } catch (clipboardError) {
          Alert.alert('Error', 'Failed to open email client and copy to clipboard');
        }
        setLoading(false);
        return;
      }

      // Record that email was sent
      await recordEmailSent(
        application.id,
        emailType,
        recipientEmail,
        selectedTemplate?.id
      );
      // If this is a thank-you email linked to an interview event, mark thank-you as sent
      try {
        if (emailType === 'thank-you' && linkedEvent?.id) {
          const { setEventThankYouStatus } = await import('../utils/events');
          await setEventThankYouStatus(linkedEvent.id, 'sent');
        }
      } catch (e) {
        // non-fatal
      }

      Alert.alert(
        'Email Opened',
        'Your email client should now be open with the message ready to send. The email has been recorded in your application history.',
        [
          {
            text: 'OK',
            onPress: () => {
              onEmailSent?.();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to open email client');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const Clipboard = await import('expo-clipboard');
      const emailContent = `Subject: ${subject}\n\n${body}`;
      await Clipboard.setStringAsync(emailContent);
      Alert.alert('Copied', 'Email content copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled={Platform.OS === 'ios'}
      >
        <View style={[styles.modalContent, { backgroundColor: colorScheme.colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colorScheme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
              {emailType === 'thank-you' && 'Send Thank You Note'}
              {emailType === 'follow-up' && 'Send Follow-Up Email'}
              {emailType === 'decline-offer' && 'Decline Job Offer'}
              {emailType === 'acceptance' && 'Accept Job Offer'}
              {emailType === 'rejection-response' && 'Respond to Rejection'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colorScheme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            <ScrollView 
              ref={scrollViewRef}
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={true}
            >
            {/* Template Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.label, { color: colorScheme.colors.text }]}>Email Template</Text>
                <TouchableOpacity
                  onPress={handleCreateTemplate}
                  style={[styles.addButton, { backgroundColor: colorScheme.colors.primary }]}
                >
                  <Text style={styles.addButtonText}>+ New</Text>
                </TouchableOpacity>
              </View>
              {templates.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {templates.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={[
                        styles.templateOption,
                        {
                          backgroundColor:
                            selectedTemplate?.id === template.id
                              ? colorScheme.colors.primary
                              : colorScheme.colors.background,
                          borderColor:
                            selectedTemplate?.id === template.id
                              ? colorScheme.colors.primary
                              : colorScheme.colors.border,
                        },
                      ]}
                      onPress={() => setSelectedTemplate(template)}
                      onLongPress={() => !template.isDefault && handleEditTemplate(template)}
                    >
                      <Text
                        style={[
                          styles.templateOptionText,
                          {
                            color:
                              selectedTemplate?.id === template.id
                                ? '#FFFFFF'
                                : colorScheme.colors.text,
                          },
                        ]}
                      >
                        {template.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Recipient Email */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>Recipient Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme.colors.background,
                    borderColor: colorScheme.colors.border,
                    color: colorScheme.colors.text,
                  },
                ]}
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                placeholder="email@example.com"
                placeholderTextColor={colorScheme.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={true}
                enablesReturnKeyAutomatically={true}
              />
            </View>

            {/* Subject */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>Subject</Text>
              <Text style={[styles.helpText, { color: colorScheme.colors.textSecondary }]}>
                You can edit this before sending
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
                value={subject}
                onChangeText={setSubject}
                placeholder="Email subject"
                placeholderTextColor={colorScheme.colors.textSecondary}
                returnKeyType="next"
                editable={true}
                enablesReturnKeyAutomatically={true}
              />
            </View>

            </ScrollView>

            {/* Body - Outside ScrollView for better scrolling */}
            <View style={[
              styles.bodySection,
              { borderTopColor: colorScheme.colors.border },
            ]}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>Body</Text>
              <Text style={[styles.helpText, { color: colorScheme.colors.textSecondary }]}>
                You can edit this before sending
              </Text>
              <View style={[
                styles.textAreaContainer,
                {
                  borderColor: colorScheme.colors.border,
                  backgroundColor: colorScheme.colors.background,
                },
              ]}>
                <ScrollView
                  style={styles.textAreaScrollView}
                  contentContainerStyle={styles.textAreaScrollContent}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                >
                  <TextInput
                    ref={bodyInputRef}
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: colorScheme.colors.background,
                        color: colorScheme.colors.text,
                      },
                    ]}
                    value={body}
                    onChangeText={setBody}
                    placeholder="Email body"
                    placeholderTextColor={colorScheme.colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                    blurOnSubmit={false}
                    scrollEnabled={false}
                    returnKeyType="default"
                    editable={true}
                    enablesReturnKeyAutomatically={false}
                  />
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.actionBar, { borderTopColor: colorScheme.colors.border }]}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: colorScheme.colors.border }]}
              onPress={handleCopyToClipboard}
            >
              <Text style={[styles.buttonText, { color: colorScheme.colors.text }]}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: colorScheme.colors.primary },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSendEmail}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Opening...' : 'Open Email Client'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Template Editor Modal */}
      <TemplateEditorModal
        visible={showTemplateEditor}
        onClose={() => {
          setShowTemplateEditor(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        templateType={emailType}
        onSave={handleTemplateSaved}
      />

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
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
  },
  bodySection: {
    padding: 16,
    paddingTop: 0,
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: 'transparent', // Will be set dynamically
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 8,
    height: 300,
    overflow: 'hidden',
    marginTop: 8,
  },
  textAreaScrollView: {
    flex: 1,
  },
  textAreaScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  templateOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  templateOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toneOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  toneOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 300,
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
  secondaryButton: {
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


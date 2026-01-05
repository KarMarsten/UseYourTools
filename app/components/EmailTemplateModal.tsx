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
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import { loadPreferences } from '../utils/preferences';
import {
  EmailTemplate,
  EmailTemplateType,
  getAllTemplates,
  getTemplatesByType,
  replaceVariables,
  EMAIL_VARIABLES,
} from '../utils/emailTemplates';
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

  useEffect(() => {
    if (visible) {
      loadTemplates();
    }
  }, [visible, emailType]);

  useEffect(() => {
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
      const processedSubject = replaceVariables(selectedTemplate.subject, variables);
      const processedBody = replaceVariables(selectedTemplate.body, variables);

      setSubject(processedSubject);
      setBody(processedBody);

      // Try to get recipient email from event or leave empty
      if (linkedEvent?.email) {
        setRecipientEmail(linkedEvent.email);
      } else {
        setRecipientEmail('');
      }
    }
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
                  const { Clipboard } = await import('expo-clipboard');
                  const emailContent = `Subject: ${subject}\n\n${body}`;
                  await Clipboard.setStringAsync(emailContent);
                  onClose();
                } catch (error) {
                  console.error('Error copying to clipboard:', error);
                  onClose();
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
              Alert.alert('Error', 'No email client found on this device');
              return;
            }
          } else {
            Alert.alert('Error', 'No email client found on this device');
            return;
          }
        }
      } catch (error) {
        console.error('Error opening email client:', error);
        Alert.alert('Error', 'Failed to open email client');
        return;
      }

      // Record that email was sent
      await recordEmailSent(
        application.id,
        emailType,
        recipientEmail,
        selectedTemplate?.id
      );

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
      const { Clipboard } = await import('expo-clipboard');
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
      >
        <View style={[styles.modalContent, { backgroundColor: colorScheme.colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colorScheme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
              {emailType === 'thank-you' && 'Send Thank You Note'}
              {emailType === 'follow-up' && 'Send Follow-Up Email'}
              {emailType === 'decline-offer' && 'Decline Job Offer'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colorScheme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Template Selection */}
            {templates.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: colorScheme.colors.text }]}>Email Template</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
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
              </View>
            )}

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
                numberOfLines={10}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

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
  templateScroll: {
    marginTop: 8,
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


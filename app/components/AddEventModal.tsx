import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Event } from '../utils/events';
import { formatTimeRange } from '../utils/timeFormatter';

interface AddEventModalProps {
  visible: boolean;
  dateKey: string;
  onClose: () => void;
  onSave: (event: Event) => void;
  colorScheme: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
  };
  use12Hour: boolean;
  event?: Event; // Optional event for editing
}

export default function AddEventModal({
  visible,
  dateKey,
  onClose,
  onSave,
  colorScheme,
  use12Hour,
  event,
}: AddEventModalProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [startTime, setStartTime] = useState(event?.startTime || '');
  const [endTime, setEndTime] = useState(event?.endTime || '');
  const [type, setType] = useState<'interview' | 'appointment' | 'reminder'>(event?.type || 'reminder');
  const [notes, setNotes] = useState(event?.notes || '');
  const [address, setAddress] = useState(event?.address || '');
  const [contactName, setContactName] = useState(event?.contactName || '');
  const [email, setEmail] = useState(event?.email || '');
  const [phone, setPhone] = useState(event?.phone || '');
  const [company, setCompany] = useState(event?.company || '');
  const [jobTitle, setJobTitle] = useState(event?.jobTitle || '');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible && event) {
      setTitle(event.title || '');
      setStartTime(event.startTime || '');
      setEndTime(event.endTime || '');
      setType(event.type || 'reminder');
      setNotes(event.notes || '');
      setAddress(event.address || '');
      setContactName(event.contactName || '');
      setEmail(event.email || '');
      setPhone(event.phone || '');
      setCompany(event.company || '');
      setJobTitle(event.jobTitle || '');
    } else if (!visible) {
      // Reset when closing
      setTitle('');
      setStartTime('');
      setEndTime('');
      setType('reminder');
      setNotes('');
      setAddress('');
      setContactName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setJobTitle('');
    }
  }, [visible, event]);

  const handleSave = () => {
    // Validate inputs
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the event');
      return;
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      Alert.alert('Error', 'Please enter a valid start time (HH:MM format)');
      return;
    }

    // End time is only required for interviews and appointments
    if (type !== 'reminder') {
      if (!endTime || !timeRegex.test(endTime)) {
        Alert.alert('Error', 'Please enter a valid end time (HH:MM format)');
        return;
      }

      // Validate that end time is after start time
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      if (endTotal <= startTotal) {
        Alert.alert('Error', 'End time must be after start time');
        return;
      }
    }

    const savedEvent: Event = {
      id: event?.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dateKey,
      title: title.trim(),
      startTime,
      endTime: type !== 'reminder' ? endTime : undefined,
      type,
      notes: notes.trim() || undefined,
      address: (type !== 'reminder' && address.trim()) ? address.trim() : undefined,
      contactName: (type !== 'reminder' && contactName.trim()) ? contactName.trim() : undefined,
      email: (type !== 'reminder' && email.trim()) ? email.trim() : undefined,
      phone: (type !== 'reminder' && phone.trim()) ? phone.trim() : undefined,
      company: (type !== 'reminder' && company.trim()) ? company.trim() : undefined,
      jobTitle: (type !== 'reminder' && jobTitle.trim()) ? jobTitle.trim() : undefined,
    };

    onSave(savedEvent);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colorScheme.surface }]}>
          <Text style={[styles.modalTitle, { color: colorScheme.text }]}>
            {event ? 'Edit Event' : 'Add Event'}
          </Text>
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colorScheme.text }]}>Title</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme.background,
                  borderColor: colorScheme.border,
                  color: colorScheme.text,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Interview with Company X"
              placeholderTextColor={colorScheme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colorScheme.text }]}>Type</Text>
            <View style={styles.typeContainer}>
              {(['interview', 'appointment', 'reminder'] as const).map((eventType) => (
                <TouchableOpacity
                  key={eventType}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor:
                        type === eventType ? colorScheme.primary : colorScheme.background,
                      borderColor: colorScheme.border,
                    },
                  ]}
                  onPress={() => setType(eventType)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      {
                        color: type === eventType ? colorScheme.background : colorScheme.text,
                      },
                    ]}
                  >
                    {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Text style={[styles.label, { color: colorScheme.text }]}>Start Time</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme.background,
                    borderColor: colorScheme.border,
                    color: colorScheme.text,
                  },
                ]}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                placeholderTextColor={colorScheme.textSecondary}
              />
              <Text style={[styles.hint, { color: colorScheme.textSecondary }]}>
                24-hour format (HH:MM)
              </Text>
            </View>

            {type !== 'reminder' && (
              <View style={styles.timeInput}>
                <Text style={[styles.label, { color: colorScheme.text }]}>End Time</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme.background,
                      borderColor: colorScheme.border,
                      color: colorScheme.text,
                    },
                  ]}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="10:00"
                  placeholderTextColor={colorScheme.textSecondary}
                />
                <Text style={[styles.hint, { color: colorScheme.textSecondary }]}>
                  24-hour format (HH:MM)
                </Text>
              </View>
            )}
          </View>

          {/* Notes field for all event types */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colorScheme.text }]}>Notes</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colorScheme.background,
                  borderColor: colorScheme.border,
                  color: colorScheme.text,
                },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor={colorScheme.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Additional fields for interviews and appointments */}
          {type !== 'reminder' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colorScheme.text }]}>Company</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme.background,
                      borderColor: colorScheme.border,
                      color: colorScheme.text,
                    },
                  ]}
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Company Name"
                  placeholderTextColor={colorScheme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colorScheme.text }]}>Job Title</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme.background,
                      borderColor: colorScheme.border,
                      color: colorScheme.text,
                    },
                  ]}
                  value={jobTitle}
                  onChangeText={setJobTitle}
                  placeholder="Software Engineer"
                  placeholderTextColor={colorScheme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colorScheme.text }]}>Contact Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme.background,
                      borderColor: colorScheme.border,
                      color: colorScheme.text,
                    },
                  ]}
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder="John Doe"
                  placeholderTextColor={colorScheme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colorScheme.text }]}>Address</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme.background,
                      borderColor: colorScheme.border,
                      color: colorScheme.text,
                    },
                  ]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="123 Main St, City, State"
                  placeholderTextColor={colorScheme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colorScheme.text }]}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme.background,
                      borderColor: colorScheme.border,
                      color: colorScheme.text,
                    },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="john.doe@example.com"
                  placeholderTextColor={colorScheme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colorScheme.text }]}>Phone</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme.background,
                      borderColor: colorScheme.border,
                      color: colorScheme.text,
                    },
                  ]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={colorScheme.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colorScheme.border }]}
              onPress={handleCancel}
            >
              <Text style={[styles.buttonText, { color: colorScheme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: colorScheme.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, { color: colorScheme.background }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  scrollView: {
    maxHeight: 600,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timeInput: {
    flex: 1,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});


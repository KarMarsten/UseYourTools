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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Event } from '../utils/events';
import { formatTimeRange, formatTime12Hour } from '../utils/timeFormatter';

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
  viewMode?: boolean; // If true, show in read-only view mode with edit button
  onEdit?: () => void; // Callback when edit button is pressed in view mode
}

export default function AddEventModal({
  visible,
  dateKey,
  onClose,
  onSave,
  colorScheme,
  use12Hour,
  event,
  viewMode = false,
  onEdit,
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

  // Time picker states
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Parse time to components (for 12-hour or 24-hour display)
  const parseTimeForDisplay = (time24: string): { hour: number; minute: number; period: 'AM' | 'PM' | null } => {
    if (!time24 || !time24.includes(':')) {
      return { hour: use12Hour ? 12 : 9, minute: 0, period: use12Hour ? 'AM' : null };
    }
    const [hours24, minutes] = time24.split(':').map(Number);
    if (use12Hour) {
      const hour12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
      const period = hours24 >= 12 ? 'PM' : 'AM';
      return { hour: hour12, minute: minutes, period };
    } else {
      return { hour: hours24, minute: minutes, period: null };
    }
  };

  // Convert display time back to 24-hour format
  const convertTo24Hour = (hour: number, minute: number, period: 'AM' | 'PM' | null): string => {
    let hour24 = hour;
    if (use12Hour && period) {
      if (period === 'AM' && hour === 12) {
        hour24 = 0;
      } else if (period === 'PM' && hour !== 12) {
        hour24 = hour + 12;
      }
    }
    return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  // Get display time string
  const getDisplayTime = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return '';
    if (use12Hour) {
      return formatTime12Hour(time24);
    }
    return time24;
  };

  const [startHour, setStartHour] = useState(() => parseTimeForDisplay(event?.startTime || '').hour);
  const [startMinute, setStartMinute] = useState(() => parseTimeForDisplay(event?.startTime || '').minute);
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM' | null>(() => parseTimeForDisplay(event?.startTime || '').period);
  
  const [endHour, setEndHour] = useState(() => parseTimeForDisplay(event?.endTime || '').hour);
  const [endMinute, setEndMinute] = useState(() => parseTimeForDisplay(event?.endTime || '').minute);
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM' | null>(() => parseTimeForDisplay(event?.endTime || '').period);

  // Update time components when startTime/endTime changes from props
  useEffect(() => {
    if (startTime) {
      const parsed = parseTimeForDisplay(startTime);
      setStartHour(parsed.hour);
      setStartMinute(parsed.minute);
      setStartPeriod(parsed.period);
    } else {
      setStartHour(use12Hour ? 12 : 9);
      setStartMinute(0);
      setStartPeriod(use12Hour ? 'AM' : null);
    }
  }, [startTime, use12Hour]);

  useEffect(() => {
    if (endTime) {
      const parsed = parseTimeForDisplay(endTime);
      setEndHour(parsed.hour);
      setEndMinute(parsed.minute);
      setEndPeriod(parsed.period);
    } else {
      setEndHour(use12Hour ? 1 : 10);
      setEndMinute(0);
      setEndPeriod(use12Hour ? 'PM' : null);
    }
  }, [endTime, use12Hour]);

  // Update time string when components change
  const updateStartTime = (hour: number, minute: number, period: 'AM' | 'PM' | null) => {
    const time24 = convertTo24Hour(hour, minute, period);
    setStartTime(time24);
  };

  const updateEndTime = (hour: number, minute: number, period: 'AM' | 'PM' | null) => {
    const time24 = convertTo24Hour(hour, minute, period);
    setEndTime(time24);
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible && event) {
      // Populate form with event data when editing
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
    } else if (visible && !event) {
      // Reset to empty values when opening to add new event
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
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.modalContent, { backgroundColor: colorScheme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colorScheme.text }]}>
              {viewMode ? event?.title || 'Event' : event ? 'Edit Event' : 'Add Event'}
            </Text>
            {viewMode && onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                style={styles.editButton}
              >
                <Text style={[styles.editButtonText, { color: colorScheme.primary }]}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colorScheme.text }]}>Title</Text>
            {viewMode ? (
              <Text style={[styles.viewText, { color: colorScheme.text }]}>
                {event?.title || 'No title'}
              </Text>
            ) : (
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
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colorScheme.text }]}>Type</Text>
            {viewMode ? (
              <Text style={[styles.viewText, { color: colorScheme.text }]}>
                {event?.type ? event.type.charAt(0).toUpperCase() + event.type.slice(1) : 'N/A'}
              </Text>
            ) : (
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
            )}
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Text style={[styles.label, { color: colorScheme.text }]}>Start Time</Text>
              {viewMode ? (
                <Text style={[styles.viewText, { color: colorScheme.text }]}>
                  {event?.startTime ? getDisplayTime(event.startTime) : 'N/A'}
                </Text>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.timePickerButton,
                    {
                      backgroundColor: colorScheme.background,
                      borderColor: colorScheme.border,
                    },
                  ]}
                  onPress={() => {
                    setShowEndTimePicker(false);
                    setShowStartTimePicker(true);
                  }}
                >
                  <Text style={[styles.timePickerText, { color: colorScheme.text }]}>
                    {startTime ? getDisplayTime(startTime) : 'Select time'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {(viewMode ? event?.type !== 'reminder' : type !== 'reminder') && (
              <View style={styles.timeInput}>
                <Text style={[styles.label, { color: colorScheme.text }]}>End Time</Text>
                {viewMode ? (
                  <Text style={[styles.viewText, { color: colorScheme.text }]}>
                    {event?.endTime ? getDisplayTime(event.endTime) : 'N/A'}
                  </Text>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.timePickerButton,
                      {
                        backgroundColor: colorScheme.background,
                        borderColor: colorScheme.border,
                      },
                    ]}
                    onPress={() => {
                      setShowStartTimePicker(false);
                      setShowEndTimePicker(true);
                    }}
                  >
                    <Text style={[styles.timePickerText, { color: colorScheme.text }]}>
                      {endTime ? getDisplayTime(endTime) : 'Select time'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Notes field for all event types */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colorScheme.text }]}>Notes</Text>
            {viewMode ? (
              <Text style={[styles.viewText, { color: colorScheme.text }]}>
                {event?.notes || 'No notes'}
              </Text>
            ) : (
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
            )}
          </View>

          {/* Additional fields for interviews and appointments */}
          {(viewMode ? event?.type !== 'reminder' : type !== 'reminder') && (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colorScheme.text }]}>Company</Text>
                {viewMode ? (
                  <Text style={[styles.viewText, { color: colorScheme.text }]}>
                    {event?.company || 'N/A'}
                  </Text>
                ) : (
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
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colorScheme.text }]}>Job Title</Text>
                {viewMode ? (
                  <Text style={[styles.viewText, { color: colorScheme.text }]}>
                    {event?.jobTitle || 'N/A'}
                  </Text>
                ) : (
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
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colorScheme.text }]}>Contact Name</Text>
                {viewMode ? (
                  <Text style={[styles.viewText, { color: colorScheme.text }]}>
                    {event?.contactName || 'N/A'}
                  </Text>
                ) : (
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
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colorScheme.text }]}>Address</Text>
                {viewMode ? (
                  <Text style={[styles.viewText, { color: colorScheme.text }]}>
                    {event?.address || 'N/A'}
                  </Text>
                ) : (
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
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colorScheme.text }]}>Email</Text>
                {viewMode ? (
                  <Text style={[styles.viewText, { color: colorScheme.text }]}>
                    {event?.email || 'N/A'}
                  </Text>
                ) : (
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
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colorScheme.text }]}>Phone</Text>
                {viewMode ? (
                  <Text style={[styles.viewText, { color: colorScheme.text }]}>
                    {event?.phone || 'N/A'}
                  </Text>
                ) : (
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
                )}
              </View>
            </>
          )}
          </ScrollView>

          {/* Time picker dropdowns rendered outside ScrollView */}
          {showStartTimePicker && (
            <TimePickerDropdown
              hour={startHour}
              minute={startMinute}
              period={startPeriod}
              use12Hour={use12Hour}
              colorScheme={colorScheme}
              onSelect={(h, m, p) => {
                setStartHour(h);
                setStartMinute(m);
                setStartPeriod(p);
                updateStartTime(h, m, p);
                setShowStartTimePicker(false);
              }}
              onClose={() => setShowStartTimePicker(false)}
            />
          )}

          {showEndTimePicker && (
            <TimePickerDropdown
              hour={endHour}
              minute={endMinute}
              period={endPeriod}
              use12Hour={use12Hour}
              colorScheme={colorScheme}
              onSelect={(h, m, p) => {
                setEndHour(h);
                setEndMinute(m);
                setEndPeriod(p);
                updateEndTime(h, m, p);
                setShowEndTimePicker(false);
              }}
              onClose={() => setShowEndTimePicker(false)}
            />
          )}

          {viewMode ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: colorScheme.primary }]}
                onPress={handleCancel}
              >
                <Text style={[styles.buttonText, { color: colorScheme.background }]}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
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
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Time Picker Dropdown Component
interface TimePickerDropdownProps {
  hour: number;
  minute: number;
  period: 'AM' | 'PM' | null;
  use12Hour: boolean;
  colorScheme: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
  };
  onSelect: (hour: number, minute: number, period: 'AM' | 'PM' | null) => void;
  onClose: () => void;
}

const TimePickerDropdown = ({
  hour,
  minute,
  period,
  use12Hour,
  colorScheme,
  onSelect,
  onClose,
}: TimePickerDropdownProps) => {
  const hours = use12Hour 
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods: ('AM' | 'PM')[] = ['AM', 'PM'];

  const [selectedHour, setSelectedHour] = useState(hour);
  const [selectedMinute, setSelectedMinute] = useState(minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM' | null>(period || 'AM');

  const handleConfirm = () => {
    onSelect(selectedHour, selectedMinute, selectedPeriod);
  };

  return (
    <View style={styles.dropdownOverlay}>
      <TouchableOpacity style={styles.dropdownBackdrop} onPress={onClose} />
      <View style={[styles.dropdownContainer, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border }]}>
        <View style={styles.dropdownRow}>
          <View style={styles.dropdownColumn}>
            <Text style={[styles.dropdownLabel, { color: colorScheme.text }]}>Hour</Text>
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
              {hours.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.dropdownItem,
                    selectedHour === h && { backgroundColor: colorScheme.primary },
                  ]}
                  onPress={() => setSelectedHour(h)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      { color: selectedHour === h ? colorScheme.background : colorScheme.text },
                    ]}
                  >
                    {String(h).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.dropdownColumn}>
            <Text style={[styles.dropdownLabel, { color: colorScheme.text }]}>Minute</Text>
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
              {minutes.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.dropdownItem,
                    selectedMinute === m && { backgroundColor: colorScheme.primary },
                  ]}
                  onPress={() => setSelectedMinute(m)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      { color: selectedMinute === m ? colorScheme.background : colorScheme.text },
                    ]}
                  >
                    {String(m).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {use12Hour && (
            <View style={styles.dropdownColumn}>
              <Text style={[styles.dropdownLabel, { color: colorScheme.text }]}>Period</Text>
              <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                {periods.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.dropdownItem,
                      selectedPeriod === p && { backgroundColor: colorScheme.primary },
                    ]}
                    onPress={() => setSelectedPeriod(p)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: selectedPeriod === p ? colorScheme.background : colorScheme.text },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.dropdownButtons}>
          <TouchableOpacity
            style={[styles.dropdownButton, { borderColor: colorScheme.border }]}
            onPress={onClose}
          >
            <Text style={[styles.dropdownButtonText, { color: colorScheme.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dropdownButton, { backgroundColor: colorScheme.primary }]}
            onPress={handleConfirm}
          >
            <Text style={[styles.dropdownButtonText, { color: colorScheme.background }]}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewText: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
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
  timePickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  timePickerText: {
    fontSize: 16,
  },
  dropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    maxHeight: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  dropdownColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  dropdownScroll: {
    maxHeight: 200,
    width: '100%',
  },
  dropdownItem: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  dropdownButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
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


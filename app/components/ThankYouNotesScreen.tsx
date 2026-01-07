import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import { getAllEvents, Event, setEventThankYouStatus } from '../utils/events';
import { getDateKey, formatTime12Hour } from '../utils/timeFormatter';
import { getApplicationById, JobApplication } from '../utils/applications';
import EmailTemplateModal from './EmailTemplateModal';

interface ThankYouNotesScreenProps {
  onBack: () => void;
}

export default function ThankYouNotesScreen({ onBack }: ThankYouNotesScreenProps) {
  const { colorScheme } = usePreferences();
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
  
  const [pendingThankYouNotes, setPendingThankYouNotes] = useState<Array<{ event: Event; application?: JobApplication }>>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);

  useEffect(() => {
    loadPendingThankYouNotes();
  }, []);

  const loadPendingThankYouNotes = async () => {
    try {
      const allEvents = await getAllEvents();
      const interviewEvents = allEvents.filter(
        e => e.type === 'interview' && 
        (!e.thankYouNoteStatus || e.thankYouNoteStatus === 'pending')
      );

      // Sort by date (most recent first)
      interviewEvents.sort((a, b) => {
        const dateA = new Date(a.dateKey);
        const dateB = new Date(b.dateKey);
        return dateB.getTime() - dateA.getTime();
      });

      // Load application details for each event
      const notesWithApps = await Promise.all(
        interviewEvents.map(async (event) => {
          let application: JobApplication | undefined;
          if (event.applicationId) {
            try {
              application = await getApplicationById(event.applicationId);
            } catch (error) {
              console.error('Error loading application:', error);
            }
          }
          return { event, application };
        })
      );

      setPendingThankYouNotes(notesWithApps);
    } catch (error) {
      console.error('Error loading pending thank you notes:', error);
    }
  };

  const handleMarkAsSent = async (eventId: string) => {
    try {
      await setEventThankYouStatus(eventId, 'sent');
      await loadPendingThankYouNotes();
      Alert.alert('Success', 'Thank you note marked as sent');
    } catch (error) {
      console.error('Error marking thank you note as sent:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleMarkAsSkipped = async (eventId: string) => {
    Alert.alert(
      'Skip Thank You Note',
      'Are you sure you want to skip sending a thank you note for this interview?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            try {
              await setEventThankYouStatus(eventId, 'skipped');
              await loadPendingThankYouNotes();
              Alert.alert('Success', 'Thank you note marked as skipped');
            } catch (error) {
              console.error('Error marking thank you note as skipped:', error);
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const handleSendThankYouNote = (event: Event, application?: JobApplication) => {
    setSelectedEvent(event);
    setSelectedApplication(application || null);
    setShowEmailModal(true);
  };

  const formatDate = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatEventTime = (event: Event): string => {
    if (event.endTime) {
      return `${formatTime12Hour(event.startTime)} - ${formatTime12Hour(event.endTime)}`;
    }
    return formatTime12Hour(event.startTime);
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border, paddingTop: statusBarHeight + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colorScheme.colors.text }]}>Pending Thank You Notes</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {pendingThankYouNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colorScheme.colors.textSecondary }]}>
              🎉 All caught up!{'\n'}No pending thank you notes.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryContainer}>
              <Text style={[styles.summaryText, { color: colorScheme.colors.textSecondary }]}>
                {pendingThankYouNotes.length} pending thank you note{pendingThankYouNotes.length !== 1 ? 's' : ''}
              </Text>
            </View>
            {pendingThankYouNotes.map(({ event, application }) => (
              <View
                key={event.id}
                style={[styles.noteCard, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
              >
                <View style={styles.noteHeader}>
                  <Text style={[styles.noteTitle, { color: colorScheme.colors.text }]}>
                    {event.title}
                  </Text>
                  <Text style={[styles.noteDate, { color: colorScheme.colors.textSecondary }]}>
                    {formatDate(event.dateKey)} • {formatEventTime(event)}
                  </Text>
                </View>

                {application && (
                  <View style={styles.applicationInfo}>
                    <Text style={[styles.companyText, { color: colorScheme.colors.text }]}>
                      {application.company}
                    </Text>
                    <Text style={[styles.positionText, { color: colorScheme.colors.textSecondary }]}>
                      {application.positionTitle}
                    </Text>
                  </View>
                )}

                {event.company && (
                  <Text style={[styles.companyText, { color: colorScheme.colors.text }]}>
                    {event.company}
                  </Text>
                )}

                {event.contactName && (
                  <Text style={[styles.contactText, { color: colorScheme.colors.textSecondary }]}>
                    Interviewer: {event.contactName}
                  </Text>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.sendButton, { backgroundColor: colorScheme.colors.primary }]}
                    onPress={() => handleSendThankYouNote(event, application)}
                  >
                    <Text style={styles.actionButtonText}>✉️ Send Thank You Note</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.markButton, { borderColor: colorScheme.colors.border }]}
                    onPress={() => handleMarkAsSent(event.id)}
                  >
                    <Text style={[styles.markButtonText, { color: colorScheme.colors.primary }]}>
                      ✔️ Mark as Sent
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.skipButton]}
                    onPress={() => handleMarkAsSkipped(event.id)}
                  >
                    <Text style={[styles.skipButtonText, { color: colorScheme.colors.textSecondary }]}>
                      Skip
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {showEmailModal && selectedEvent && (
        <EmailTemplateModal
          visible={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setSelectedEvent(null);
            setSelectedApplication(null);
            loadPendingThankYouNotes();
          }}
          application={selectedApplication || undefined}
          emailType="thank-you"
          linkedEvent={selectedEvent}
          onEmailSent={() => {
            if (selectedEvent) {
              handleMarkAsSent(selectedEvent.id);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 12,
    paddingTop: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  summaryContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  noteCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  noteHeader: {
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 14,
  },
  applicationInfo: {
    marginBottom: 8,
  },
  companyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  positionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  sendButton: {
    flex: 1,
    minWidth: '100%',
  },
  markButton: {
    borderWidth: 1,
    flex: 1,
  },
  skipButton: {
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  markButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipButtonText: {
    fontSize: 14,
  },
});


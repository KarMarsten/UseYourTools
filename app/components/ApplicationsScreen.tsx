import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import {
  JobApplication,
  getAllApplications,
  saveApplication,
  deleteApplication,
  searchApplications,
  getApplicationStats,
  hasAppliedToPosition,
  ApplicationStats,
} from '../utils/applications';
import { Event, getEventById } from '../utils/events';
import { getDateKey } from '../utils/timeFormatter';

interface ApplicationsScreenProps {
  onBack: () => void;
  onNavigateToCalendar?: () => void;
  onSelectDate?: (date: Date) => void;
}

export default function ApplicationsScreen({ onBack, onNavigateToCalendar, onSelectDate }: ApplicationsScreenProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    applied: 0,
    rejected: 0,
    interview: 0,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'applied' | 'rejected' | 'interview'>('all');

  // Form state
  const [positionTitle, setPositionTitle] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm format
  const [status, setStatus] = useState<'applied' | 'rejected' | 'no-response' | 'interview'>('applied');
  const [notes, setNotes] = useState('');

  const { colorScheme, preferences } = usePreferences();

  useEffect(() => {
    loadApplications();
    loadStats();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      performSearch(searchTerm);
    } else {
      loadApplications();
    }
  }, [searchTerm, filterStatus]);

  const loadApplications = async () => {
    try {
      let allApps = await getAllApplications();
      
      // Apply status filter
      if (filterStatus !== 'all') {
        allApps = allApps.filter(app => app.status === filterStatus);
      }
      
      setApplications(allApps);
    } catch (error) {
      console.error('Error loading applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getApplicationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const performSearch = async (term: string) => {
    try {
      let results = await searchApplications(term);
      
      // Apply status filter
      if (filterStatus !== 'all') {
        results = results.filter(app => app.status === filterStatus);
      }
      
      setApplications(results);
    } catch (error) {
      console.error('Error searching applications:', error);
    }
  };

  const resetForm = () => {
    setPositionTitle('');
    setCompany('');
    setSource('');
    setSourceUrl('');
    // Set default date to current date/time in user's preferred timezone
    const now = new Date();
    const timezone = preferences?.timezoneMode === 'custom' && preferences?.timezone
      ? preferences.timezone
      : undefined;
    
    let formattedDate: string;
    if (timezone) {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const year = parts.find(p => p.type === 'year')?.value || '';
      const month = parts.find(p => p.type === 'month')?.value || '';
      const day = parts.find(p => p.type === 'day')?.value || '';
      const hour = parts.find(p => p.type === 'hour')?.value || '';
      const minute = parts.find(p => p.type === 'minute')?.value || '';
      formattedDate = `${year}-${month}-${day}T${hour}:${minute}`;
    } else {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    setAppliedDate(formattedDate);
    setStatus('applied');
    setNotes('');
    setEditingApplication(null);
    setShowAddForm(false);
  };

  const handleEdit = (app: JobApplication) => {
    setEditingApplication(app);
    setPositionTitle(app.positionTitle);
    setCompany(app.company);
    setSource(app.source);
    setSourceUrl(app.sourceUrl || '');
    // Convert ISO date to local datetime format for input, respecting user's timezone preference
    const date = new Date(app.appliedDate);
    const timezone = preferences?.timezoneMode === 'custom' && preferences?.timezone
      ? preferences.timezone
      : undefined;
    
    // Format the date in the user's preferred timezone for the input field
    let formattedDate: string;
    if (timezone) {
      // Use Intl.DateTimeFormat to format in the specified timezone
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(date);
      const year = parts.find(p => p.type === 'year')?.value || '';
      const month = parts.find(p => p.type === 'month')?.value || '';
      const day = parts.find(p => p.type === 'day')?.value || '';
      const hour = parts.find(p => p.type === 'hour')?.value || '';
      const minute = parts.find(p => p.type === 'minute')?.value || '';
      formattedDate = `${year}-${month}-${day}T${hour}:${minute}`;
    } else {
      // Use device timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    setAppliedDate(formattedDate);
    setStatus(app.status);
    setNotes(app.notes || '');
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!positionTitle.trim() || !company.trim() || !source.trim()) {
      Alert.alert('Error', 'Please fill in position title, company, and source');
      return;
    }

    // Check for duplicates (only if not editing the same application)
    if (!editingApplication) {
      const alreadyApplied = await hasAppliedToPosition(company, positionTitle);
      if (alreadyApplied) {
        Alert.alert(
          'Duplicate Application',
          'You have already applied to this position. Are you sure you want to add it again?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Anyway', onPress: () => saveApplicationData() },
          ]
        );
        return;
      }
    }

    await saveApplicationData();
  };

  const saveApplicationData = async () => {
    try {
      // Convert local datetime to ISO string
      // The input format (YYYY-MM-DDTHH:mm) is interpreted as local time by Date constructor
      const dateObj = new Date(appliedDate);
      const isoDate = dateObj.toISOString();

      const application: JobApplication = {
        id: editingApplication?.id || `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        positionTitle: positionTitle.trim(),
        company: company.trim(),
        source: source.trim(),
        sourceUrl: sourceUrl.trim() || undefined,
        appliedDate: isoDate,
        status,
        notes: notes.trim() || undefined,
        eventId: editingApplication?.eventId, // Preserve existing eventId
      };

      await saveApplication(application);
      await loadApplications();
      await loadStats();
      resetForm();
      Alert.alert('Success', editingApplication ? 'Application updated' : 'Application saved');
    } catch (error) {
      console.error('Error saving application:', error);
      Alert.alert('Error', 'Failed to save application');
    }
  };

  const handleStatusChange = async (app: JobApplication, newStatus: 'applied' | 'rejected' | 'interview') => {
    try {
      const updatedApp: JobApplication = {
        ...app,
        status: newStatus,
      };
      await saveApplication(updatedApp);
      await loadApplications();
      await loadStats();
      Alert.alert('Success', `Status changed to ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Error changing status:', error);
      Alert.alert('Error', 'Failed to change status');
    }
  };

  const handleDelete = (app: JobApplication) => {
    Alert.alert(
      'Delete Application',
      `Are you sure you want to delete this application to ${app.company}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApplication(app.id);
              await loadApplications();
              await loadStats();
              Alert.alert('Success', 'Application deleted');
            } catch (error) {
              console.error('Error deleting application:', error);
              Alert.alert('Error', 'Failed to delete application');
            }
          },
        },
      ]
    );
  };

  const handleOpenLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const timezone = preferences?.timezoneMode === 'custom' && preferences?.timezone
      ? preferences.timezone
      : undefined; // undefined means use device timezone
    
    const use12Hour = preferences?.use12HourClock ?? false;
    
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: use12Hour,
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'applied':
        return colorScheme.colors.primary;
      case 'rejected':
        return '#d32f2f';
      case 'no-response':
        return '#f57c00';
      case 'interview':
        return '#1976d2'; // Blue color for interviews
      default:
        return colorScheme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'applied':
        return 'Applied';
      case 'rejected':
        return 'Rejected';
      case 'no-response':
        return 'No Response';
      case 'interview':
        return 'Interview';
      default:
        return status;
    }
  };

  if (showAddForm) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colorScheme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
          <TouchableOpacity onPress={resetForm} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colorScheme.colors.text }]}>
            {editingApplication ? 'Edit Application' : 'Add Application'}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Position Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={positionTitle}
              onChangeText={setPositionTitle}
              placeholder="e.g., Software Engineer"
              placeholderTextColor={colorScheme.colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Company *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={company}
              onChangeText={setCompany}
              placeholder="e.g., Tech Company Inc."
              placeholderTextColor={colorScheme.colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Source *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={source}
              onChangeText={setSource}
              placeholder="e.g., LinkedIn, Indeed, Company Website"
              placeholderTextColor={colorScheme.colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Job Posting URL</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={sourceUrl}
              onChangeText={setSourceUrl}
              placeholder="https://..."
              placeholderTextColor={colorScheme.colors.textSecondary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Applied Date & Time</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={appliedDate}
              onChangeText={setAppliedDate}
              placeholder="YYYY-MM-DDTHH:mm"
              placeholderTextColor={colorScheme.colors.textSecondary}
            />
            <Text style={[styles.hint, { color: colorScheme.colors.textSecondary }]}>
              Defaults to current date/time. Format: YYYY-MM-DDTHH:mm
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Status</Text>
            <View style={styles.statusButtons}>
              {(['applied', 'rejected', 'no-response', 'interview'] as const).map((stat) => (
                <TouchableOpacity
                  key={stat}
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: status === stat ? colorScheme.colors.primary : colorScheme.colors.surface,
                      borderColor: colorScheme.colors.border,
                    },
                  ]}
                  onPress={() => setStatus(stat)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      { color: status === stat ? '#fff' : colorScheme.colors.text },
                    ]}
                  >
                    {getStatusLabel(stat)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor={colorScheme.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colorScheme.colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Application</Text>
          </TouchableOpacity>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colorScheme.colors.text }]}>Job Applications</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowAddForm(true);
          }}
        >
          <Text style={[styles.addButtonText, { color: colorScheme.colors.primary }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colorScheme.colors.text }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colorScheme.colors.textSecondary }]}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colorScheme.colors.primary }]}>{stats.applied}</Text>
          <Text style={[styles.statLabel, { color: colorScheme.colors.textSecondary }]}>Applied</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#d32f2f' }]}>{stats.rejected}</Text>
          <Text style={[styles.statLabel, { color: colorScheme.colors.textSecondary }]}>Rejected</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#1976d2' }]}>{stats.interview}</Text>
          <Text style={[styles.statLabel, { color: colorScheme.colors.textSecondary }]}>Interview</Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={[styles.searchContainer, { backgroundColor: colorScheme.colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colorScheme.colors.background, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search by company, position, or source..."
          placeholderTextColor={colorScheme.colors.textSecondary}
        />
        <View style={styles.filterButtons}>
          {(['all', 'applied', 'rejected', 'interview'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filterStatus === filter ? colorScheme.colors.primary : colorScheme.colors.background,
                  borderColor: colorScheme.colors.border,
                },
              ]}
              onPress={() => setFilterStatus(filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  { color: filterStatus === filter ? '#fff' : colorScheme.colors.text },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {filter === 'all' ? 'All' : getStatusLabel(filter)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Applications List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.listContent}>
        {applications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colorScheme.colors.textSecondary }]}>
              {searchTerm ? 'No applications found' : 'No applications yet. Tap "+ Add" to get started!'}
            </Text>
          </View>
        ) : (
          applications.map((app) => (
            <View
              key={app.id}
              style={[styles.applicationCard, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
            >
              <View style={styles.applicationHeader}>
                <View style={styles.applicationTitleRow}>
                  <Text style={[styles.positionTitle, { color: colorScheme.colors.text }]}>
                    {app.positionTitle}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(app.status) + '20' },
                    ]}
                    onPress={() => {
                      // Get available status options (excluding current status and no-response)
                      const availableStatuses = (['applied', 'rejected', 'interview'] as const).filter(
                        s => s !== app.status
                      );
                      
                      Alert.alert(
                        'Change Status',
                        `Change status for ${app.company}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          ...availableStatuses.map((newStatus) => ({
                            text: getStatusLabel(newStatus),
                            onPress: () => handleStatusChange(app, newStatus),
                          })),
                        ]
                      );
                    }}
                  >
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(app.status) }]}>
                      {getStatusLabel(app.status)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.companyName, { color: colorScheme.colors.primary }]}>
                  {app.company}
                </Text>
              </View>

              <View style={styles.applicationDetails}>
                <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                  📍 Source: {app.source}
                </Text>
                <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                  📅 Applied: {formatDate(app.appliedDate)}
                </Text>
                {app.sourceUrl && (
                  <TouchableOpacity onPress={() => handleOpenLink(app.sourceUrl!)}>
                    <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                      🔗 View Job Posting
                    </Text>
                  </TouchableOpacity>
                )}
                {app.notes && (
                  <Text style={[styles.notesText, { color: colorScheme.colors.textSecondary }]}>
                    Notes: {app.notes}
                  </Text>
                )}
                {app.status === 'interview' && app.eventId && (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const event = await getEventById(app.eventId!);
                        if (event && onSelectDate) {
                          // Parse the dateKey to create a Date object
                          const [year, month, day] = event.dateKey.split('-').map(Number);
                          const eventDate = new Date(year, month - 1, day);
                          onSelectDate(eventDate);
                          // Navigation happens automatically via onSelectDate -> dailyPlanner
                        } else {
                          Alert.alert('Error', 'Interview event not found');
                        }
                      } catch (error) {
                        console.error('Error loading event:', error);
                        Alert.alert('Error', 'Failed to load interview event');
                      }
                    }}
                  >
                    <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                      📅 View Interview Event
                    </Text>
                  </TouchableOpacity>
                )}
                {app.status === 'interview' && !app.eventId && (
                  <TouchableOpacity
                    onPress={async () => {
                      if (onNavigateToCalendar) {
                        Alert.alert(
                          'Create Interview Event',
                          'To create an interview event, go to the Calendar, select the interview date, and create a new Interview event. The event can be linked to this application.',
                          [{ text: 'OK' }]
                        );
                        onNavigateToCalendar();
                      }
                    }}
                  >
                    <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                      ➕ Create Interview Event
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.applicationActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colorScheme.colors.primary }]}
                  onPress={() => handleEdit(app)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(app)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b7355',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b5b4f',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#C9A66B',
  },
  searchInput: {
    backgroundColor: '#f5f5dc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C9A66B',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'nowrap',
  },
  filterButton: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 65,
  },
  filterButtonText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  formContent: {
    padding: 20,
    paddingBottom: 150,
  },
  applicationCard: {
    backgroundColor: '#E7D7C1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C9A66B',
  },
  applicationHeader: {
    marginBottom: 12,
  },
  applicationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  positionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A3A2A',
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8C6A4A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  applicationDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#6b5b4f',
    marginBottom: 4,
  },
  linkText: {
    fontSize: 14,
    color: '#8C6A4A',
    marginTop: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6b5b4f',
    marginTop: 8,
    fontStyle: 'italic',
  },
  applicationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#8C6A4A',
  },
  actionButtonText: {
    color: '#f5f5dc',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  deleteButtonText: {
    color: '#d32f2f',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b5b4f',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3A2A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#E7D7C1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#4A3A2A',
    borderWidth: 1,
    borderColor: '#C9A66B',
  },
  textArea: {
    backgroundColor: '#E7D7C1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#4A3A2A',
    borderWidth: 1,
    borderColor: '#C9A66B',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#6b5b4f',
    marginTop: 4,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#8C6A4A',
  },
  saveButtonText: {
    color: '#f5f5dc',
    fontSize: 18,
    fontWeight: '600',
  },
});


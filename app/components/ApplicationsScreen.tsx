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

interface ApplicationsScreenProps {
  onBack: () => void;
}

export default function ApplicationsScreen({ onBack }: ApplicationsScreenProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    applied: 0,
    rejected: 0,
    noResponse: 0,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'applied' | 'rejected' | 'no-response'>('all');

  // Form state
  const [positionTitle, setPositionTitle] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm format
  const [status, setStatus] = useState<'applied' | 'rejected' | 'no-response'>('applied');
  const [notes, setNotes] = useState('');

  const { colorScheme } = usePreferences();

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
    setAppliedDate(new Date().toISOString().slice(0, 16));
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
    // Convert ISO date to local datetime format for input
    const date = new Date(app.appliedDate);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    setAppliedDate(localDate.toISOString().slice(0, 16));
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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
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
      default:
        return status;
    }
  };

  if (showAddForm) {
    return (
      <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
          <TouchableOpacity onPress={resetForm} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colorScheme.colors.text }]}>
            {editingApplication ? 'Edit Application' : 'Add Application'}
          </Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContent}>
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
              {(['applied', 'rejected', 'no-response'] as const).map((stat) => (
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
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colorScheme.colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Application</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
          <Text style={[styles.statValue, { color: '#f57c00' }]}>{stats.noResponse}</Text>
          <Text style={[styles.statLabel, { color: colorScheme.colors.textSecondary }]}>No Response</Text>
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
          {(['all', 'applied', 'rejected', 'no-response'] as const).map((filter) => (
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
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(app.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(app.status) }]}>
                      {getStatusLabel(app.status)}
                    </Text>
                  </View>
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
    gap: 8,
  },
  filterButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  formContent: {
    padding: 20,
    paddingBottom: 40,
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
    textDecorationLine: 'underline',
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


import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import {
  JobOffer,
  getAllOffers,
  saveOffer,
  deleteOffer,
  getOfferById,
} from '../utils/offers';
import {
  JobApplication,
  getAllApplications,
  getApplicationById,
} from '../utils/applications';

interface OffersScreenProps {
  onBack: () => void;
  onViewApplication?: (applicationId: string) => void;
  initialApplicationId?: string; // Pre-select this application when creating a new offer
}

export default function OffersScreen({ onBack, onViewApplication, initialApplicationId }: OffersScreenProps) {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<JobOffer | null>(null);

  // Form state
  const [applicationId, setApplicationId] = useState<string>(initialApplicationId || '');
  const [salaryRange, setSalaryRange] = useState('');
  const [benefits, setBenefits] = useState('');
  const [workLocation, setWorkLocation] = useState<'remote' | 'hybrid' | 'onsite'>('remote');
  const [notes, setNotes] = useState('');

  const { colorScheme, preferences } = usePreferences();
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

  useEffect(() => {
    loadOffers();
    loadApplications();
    // If we have an initialApplicationId, open the form automatically
    if (initialApplicationId) {
      setShowAddForm(true);
    }
  }, [initialApplicationId]);

  const loadOffers = async () => {
    try {
      const allOffers = await getAllOffers();
      setOffers(allOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
      Alert.alert('Error', 'Failed to load offers');
    }
  };

  const loadApplications = async () => {
    try {
      const allApps = await getAllApplications();
      setApplications(allApps);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const resetForm = () => {
    setApplicationId(initialApplicationId || '');
    setSalaryRange('');
    setBenefits('');
    setWorkLocation('remote');
    setNotes('');
    setEditingOffer(null);
    setShowAddForm(false);
  };

  const handleEdit = (offer: JobOffer) => {
    setEditingOffer(offer);
    setApplicationId(offer.applicationId);
    setSalaryRange(offer.salaryRange || '');
    setBenefits(offer.benefits || '');
    setWorkLocation(offer.workLocation);
    setNotes(offer.notes || '');
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!applicationId.trim()) {
      Alert.alert('Error', 'Please select a job application');
      return;
    }

    try {
      const offer: JobOffer = {
        id: editingOffer?.id || '',
        applicationId: applicationId.trim(),
        salaryRange: salaryRange.trim() || undefined,
        benefits: benefits.trim() || undefined,
        workLocation,
        notes: notes.trim() || undefined,
        createdAt: editingOffer?.createdAt || new Date().toISOString(),
      };

      await saveOffer(offer);
      await loadOffers();
      resetForm();
      Alert.alert('Success', editingOffer ? 'Offer updated' : 'Offer saved');
    } catch (error) {
      console.error('Error saving offer:', error);
      Alert.alert('Error', 'Failed to save offer');
    }
  };

  const handleDelete = (offer: JobOffer) => {
    Alert.alert(
      'Delete Offer',
      'Are you sure you want to delete this offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOffer(offer.id);
              await loadOffers();
              Alert.alert('Success', 'Offer deleted');
            } catch (error) {
              console.error('Error deleting offer:', error);
              Alert.alert('Error', 'Failed to delete offer');
            }
          },
        },
      ]
    );
  };

  const getApplicationForOffer = (applicationId: string): JobApplication | undefined => {
    return applications.find(app => app.id === applicationId);
  };

  const getWorkLocationLabel = (location: 'remote' | 'hybrid' | 'onsite'): string => {
    switch (location) {
      case 'remote':
        return 'Remote';
      case 'hybrid':
        return 'Hybrid';
      case 'onsite':
        return 'Onsite';
      default:
        return location;
    }
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const timezone = preferences?.timezoneMode === 'custom' && preferences?.timezone
      ? preferences.timezone
      : undefined;
    
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

  if (showAddForm) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colorScheme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border, paddingTop: statusBarHeight + 12 }]}>
          <TouchableOpacity onPress={resetForm} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colorScheme.colors.text }]}>
            {editingOffer ? 'Edit Offer' : 'Add Offer'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Job Application *</Text>
            <TouchableOpacity
              style={[styles.pickerButton, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
              onPress={() => {
                if (applications.length === 0) {
                  Alert.alert('No Applications', 'Please add a job application first');
                  return;
                }
                const options = applications.map(app => `${app.company} - ${app.positionTitle}`);
                const currentIndex = applicationId 
                  ? applications.findIndex(app => app.id === applicationId)
                  : -1;
                Alert.alert(
                  'Select Application',
                  '',
                  options.map((name, index) => ({
                    text: name,
                    onPress: () => {
                      setApplicationId(applications[index].id);
                    },
                    style: index === currentIndex ? 'default' : undefined,
                  }))
                );
              }}
            >
              <Text style={[styles.pickerButtonText, { color: applicationId ? colorScheme.colors.text : colorScheme.colors.textSecondary }]}>
                {applicationId 
                  ? (() => {
                      const app = applications.find(a => a.id === applicationId);
                      return app ? `${app.company} - ${app.positionTitle}` : 'Select application...';
                    })()
                  : 'Select application...'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Salary Range (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={salaryRange}
              onChangeText={setSalaryRange}
              placeholder="e.g., $80,000 - $100,000"
              placeholderTextColor={colorScheme.colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Benefits (Optional)</Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border },
              ]}
              value={benefits}
              onChangeText={setBenefits}
              placeholder="Health insurance, 401k, PTO, etc."
              placeholderTextColor={colorScheme.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Work Location</Text>
            <View style={styles.locationButtons}>
              {(['remote', 'hybrid', 'onsite'] as const).map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[
                    styles.locationButton,
                    {
                      backgroundColor: workLocation === loc ? colorScheme.colors.primary : colorScheme.colors.surface,
                      borderColor: colorScheme.colors.border,
                    },
                  ]}
                  onPress={() => setWorkLocation(loc)}
                >
                  <Text
                    style={[
                      styles.locationButtonText,
                      { color: workLocation === loc ? '#fff' : colorScheme.colors.text },
                    ]}
                  >
                    {getWorkLocationLabel(loc)}
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
              placeholder="Additional notes about the offer..."
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
            <Text style={styles.saveButtonText}>Save Offer</Text>
          </TouchableOpacity>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border, paddingTop: statusBarHeight + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colorScheme.colors.text }]}>Job Offers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (applications.length === 0) {
              Alert.alert('No Applications', 'Please add a job application first before creating an offer');
              return;
            }
            setShowAddForm(true);
          }}
        >
          <Text style={[styles.addButtonText, { color: colorScheme.colors.primary }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {offers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colorScheme.colors.textSecondary }]}>
              No offers yet. Tap "+ Add" to create an offer.
            </Text>
          </View>
        ) : (
          offers.map((offer) => {
            const application = getApplicationForOffer(offer.applicationId);
            return (
              <View
                key={offer.id}
                style={[
                  styles.offerCard,
                  {
                    backgroundColor: colorScheme.colors.surface,
                    borderColor: colorScheme.colors.border,
                  },
                ]}
              >
                <View style={styles.offerHeader}>
                  <View style={styles.offerHeaderLeft}>
                    <Text style={[styles.offerCompany, { color: colorScheme.colors.text }]}>
                      {application?.company || 'Unknown Company'}
                    </Text>
                    <Text style={[styles.offerPosition, { color: colorScheme.colors.textSecondary }]}>
                      {application?.positionTitle || 'Unknown Position'}
                    </Text>
                  </View>
                  <View style={styles.offerActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(offer)}
                    >
                      <Text style={[styles.editButtonText, { color: colorScheme.colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(offer)}
                    >
                      <Text style={[styles.deleteButtonText, { color: '#d32f2f' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {application && onViewApplication && (
                  <TouchableOpacity
                    style={styles.applicationLink}
                    onPress={() => onViewApplication(application.id)}
                  >
                    <Text style={[styles.applicationLinkText, { color: colorScheme.colors.primary }]}>
                      View Application →
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.offerDetails}>
                  {offer.salaryRange && (
                    <View style={styles.offerDetailRow}>
                      <Text style={[styles.offerDetailLabel, { color: colorScheme.colors.textSecondary }]}>Salary:</Text>
                      <Text style={[styles.offerDetailValue, { color: colorScheme.colors.text }]}>{offer.salaryRange}</Text>
                    </View>
                  )}
                  <View style={styles.offerDetailRow}>
                    <Text style={[styles.offerDetailLabel, { color: colorScheme.colors.textSecondary }]}>Location:</Text>
                    <Text style={[styles.offerDetailValue, { color: colorScheme.colors.text }]}>{getWorkLocationLabel(offer.workLocation)}</Text>
                  </View>
                  {offer.benefits && (
                    <View style={styles.offerDetailRow}>
                      <Text style={[styles.offerDetailLabel, { color: colorScheme.colors.textSecondary }]}>Benefits:</Text>
                      <Text style={[styles.offerDetailValue, { color: colorScheme.colors.text }]}>{offer.benefits}</Text>
                    </View>
                  )}
                  {offer.notes && (
                    <View style={styles.offerDetailRow}>
                      <Text style={[styles.offerDetailLabel, { color: colorScheme.colors.textSecondary }]}>Notes:</Text>
                      <Text style={[styles.offerDetailValue, { color: colorScheme.colors.text }]}>{offer.notes}</Text>
                    </View>
                  )}
                  <Text style={[styles.offerDate, { color: colorScheme.colors.textSecondary }]}>
                    Added: {formatDate(offer.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  addButton: {
    marginLeft: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  formContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  offerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  offerCompany: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  offerPosition: {
    fontSize: 16,
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applicationLink: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  applicationLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  offerDetails: {
    marginTop: 8,
  },
  offerDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  offerDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 80,
  },
  offerDetailValue: {
    fontSize: 14,
    flex: 1,
  },
  offerDate: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  formGroup: {
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
    minHeight: 100,
  },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  locationButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});


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
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import {
  Reference,
  getAllReferences,
  saveReference,
  deleteReference,
  getReferenceById,
} from '../utils/references';
import {
  JobApplication,
  getAllApplications,
  getApplicationById,
} from '../utils/applications';
import { openPhoneNumber, openEmail } from '../utils/eventActions';

interface ReferencesScreenProps {
  onBack: () => void;
  onViewApplication?: (applicationId: string) => void;
  initialApplicationId?: string; // Pre-select this application when creating a new reference
}

export default function ReferencesScreen({ onBack, onViewApplication, initialApplicationId }: ReferencesScreenProps) {
  const [references, setReferences] = useState<Reference[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReference, setEditingReference] = useState<Reference | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');
  const [applicationId, setApplicationId] = useState<string>(initialApplicationId || '');
  const [agreedToProvideReference, setAgreedToProvideReference] = useState(false);

  const { colorScheme, preferences } = usePreferences();
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

  useEffect(() => {
    loadReferences();
    loadApplications();
    // If we have an initialApplicationId, open the form automatically
    if (initialApplicationId) {
      setShowAddForm(true);
    }
  }, [initialApplicationId]);

  const loadReferences = async () => {
    try {
      const allReferences = await getAllReferences();
      setReferences(allReferences);
    } catch (error) {
      console.error('Error loading references:', error);
      Alert.alert('Error', 'Failed to load references');
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
    setName('');
    setTitle('');
    setCompany('');
    setEmail('');
    setPhone('');
    setRelationship('');
    setNotes('');
    setApplicationId(initialApplicationId || '');
    setAgreedToProvideReference(false);
    setEditingReference(null);
    setShowAddForm(false);
  };

  const handleEdit = (reference: Reference) => {
    setEditingReference(reference);
    setName(reference.name);
    setTitle(reference.title || '');
    setCompany(reference.company || '');
    setEmail(reference.email || '');
    setPhone(reference.phone || '');
    setRelationship(reference.relationship || '');
    setNotes(reference.notes || '');
    setApplicationId(reference.applicationId || '');
    setAgreedToProvideReference(reference.agreedToProvideReference || false);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter the reference\'s name');
      return;
    }

    try {
      const reference: Reference = {
        id: editingReference?.id || '',
        name: name.trim(),
        title: title.trim() || undefined,
        company: company.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        relationship: relationship.trim() || undefined,
        notes: notes.trim() || undefined,
        applicationId: applicationId.trim() || undefined,
        agreedToProvideReference,
        createdAt: editingReference?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveReference(reference);
      await loadReferences();
      resetForm();
      Alert.alert('Success', editingReference ? 'Reference updated' : 'Reference saved');
    } catch (error) {
      console.error('Error saving reference:', error);
      Alert.alert('Error', 'Failed to save reference');
    }
  };

  const handleDelete = (reference: Reference) => {
    Alert.alert(
      'Delete Reference',
      'Are you sure you want to delete this reference?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReference(reference.id);
              await loadReferences();
              Alert.alert('Success', 'Reference deleted');
            } catch (error) {
              console.error('Error deleting reference:', error);
              Alert.alert('Error', 'Failed to delete reference');
            }
          },
        },
      ]
    );
  };

  const getApplicationForReference = (applicationId?: string): JobApplication | undefined => {
    if (!applicationId) return undefined;
    return applications.find(app => app.id === applicationId);
  };

  const handlePhonePress = (phone: string) => {
    if (phone) {
      openPhoneNumber(phone);
    }
  };

  const handleEmailPress = async (email: string) => {
    if (email) {
      await openEmail(email);
    }
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
            {editingReference ? 'Edit Reference' : 'Add Reference'}
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
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colorScheme.colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Title/Position (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Senior Software Engineer"
              placeholderTextColor={colorScheme.colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Company (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={company}
              onChangeText={setCompany}
              placeholder="Company name"
              placeholderTextColor={colorScheme.colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Email (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={colorScheme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Phone (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 123-4567"
              placeholderTextColor={colorScheme.colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Relationship (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={relationship}
              onChangeText={setRelationship}
              placeholder="e.g., Former Manager, Colleague, Professor"
              placeholderTextColor={colorScheme.colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Job Application (Optional)</Text>
            <TouchableOpacity
              style={[styles.pickerButton, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
              onPress={() => {
                if (applications.length === 0) {
                  Alert.alert('No Applications', 'No job applications available to link');
                  return;
                }
                const options = ['None', ...applications.map(app => `${app.company} - ${app.positionTitle}`)];
                const currentIndex = applicationId 
                  ? applications.findIndex(app => app.id === applicationId) + 1
                  : 0;
                Alert.alert(
                  'Select Application',
                  '',
                  options.map((name, index) => ({
                    text: name,
                    onPress: () => {
                      if (index === 0) {
                        setApplicationId('');
                      } else {
                        setApplicationId(applications[index - 1].id);
                      }
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
                  : 'None (optional)'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreedToProvideReference(!agreedToProvideReference)}
            >
              <View style={[
                styles.checkbox,
                {
                  backgroundColor: agreedToProvideReference ? colorScheme.colors.primary : colorScheme.colors.surface,
                  borderColor: colorScheme.colors.border,
                }
              ]}>
                {agreedToProvideReference && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, { color: colorScheme.colors.text }]}>
                They have agreed to provide a reference
              </Text>
            </TouchableOpacity>
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
              placeholder="Additional notes about this reference..."
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
            <Text style={styles.saveButtonText}>Save Reference</Text>
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
        <Text style={[styles.title, { color: colorScheme.colors.text }]}>References</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={[styles.addButtonText, { color: colorScheme.colors.primary }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {references.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colorScheme.colors.textSecondary }]}>
              No references yet. Tap "+ Add" to add a reference.
            </Text>
          </View>
        ) : (
          references.map((reference) => {
            const application = getApplicationForReference(reference.applicationId);
            return (
              <View
                key={reference.id}
                style={[
                  styles.referenceCard,
                  {
                    backgroundColor: colorScheme.colors.surface,
                    borderColor: colorScheme.colors.border,
                  },
                ]}
              >
                <View style={styles.referenceHeader}>
                  <View style={styles.referenceHeaderLeft}>
                    <Text style={[styles.referenceName, { color: colorScheme.colors.text }]}>
                      {reference.name}
                    </Text>
                    {reference.title && reference.company && (
                      <Text style={[styles.referenceTitle, { color: colorScheme.colors.textSecondary }]}>
                        {reference.title} at {reference.company}
                      </Text>
                    )}
                    {reference.relationship && (
                      <Text style={[styles.referenceRelationship, { color: colorScheme.colors.textSecondary }]}>
                        {reference.relationship}
                      </Text>
                    )}
                  </View>
                  <View style={styles.referenceActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(reference)}
                    >
                      <Text style={[styles.editButtonText, { color: colorScheme.colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(reference)}
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
                      Linked to: {application.company} - {application.positionTitle} →
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.referenceDetails}>
                  {reference.email && (
                    <TouchableOpacity
                      style={styles.contactRow}
                      onPress={() => handleEmailPress(reference.email!)}
                    >
                      <Text style={[styles.contactLabel, { color: colorScheme.colors.textSecondary }]}>Email:</Text>
                      <Text style={[styles.contactValue, { color: colorScheme.colors.primary }]}>{reference.email}</Text>
                    </TouchableOpacity>
                  )}
                  {reference.phone && (
                    <TouchableOpacity
                      style={styles.contactRow}
                      onPress={() => handlePhonePress(reference.phone!)}
                    >
                      <Text style={[styles.contactLabel, { color: colorScheme.colors.textSecondary }]}>Phone:</Text>
                      <Text style={[styles.contactValue, { color: colorScheme.colors.primary }]}>{reference.phone}</Text>
                    </TouchableOpacity>
                  )}
                  {reference.agreedToProvideReference && (
                    <View style={styles.agreedBadge}>
                      <Text style={[styles.agreedBadgeText, { color: '#388e3c' }]}>✓ Agreed to provide reference</Text>
                    </View>
                  )}
                  {reference.notes && (
                    <View style={styles.notesRow}>
                      <Text style={[styles.notesLabel, { color: colorScheme.colors.textSecondary }]}>Notes:</Text>
                      <Text style={[styles.notesValue, { color: colorScheme.colors.text }]}>{reference.notes}</Text>
                    </View>
                  )}
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
  referenceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  referenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  referenceHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  referenceName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  referenceTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  referenceRelationship: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  referenceActions: {
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
  referenceDetails: {
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 60,
  },
  contactValue: {
    fontSize: 14,
    flex: 1,
    textDecorationLine: 'underline',
  },
  agreedBadge: {
    marginTop: 8,
    paddingVertical: 4,
  },
  agreedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesRow: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesValue: {
    fontSize: 14,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    flex: 1,
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


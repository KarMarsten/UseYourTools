import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Modal,
  Keyboard,
  findNodeHandle,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { Event, getAllEvents, saveEvent } from '../utils/events';
import { getDateKey, formatTime12Hour } from '../utils/timeFormatter';
import { openEmail } from '../utils/eventActions';
import AddEventModal from './AddEventModal';
import { linkApplicationToEvent, unlinkApplicationFromEvent } from '../utils/applications';
import { scheduleEventNotification } from '../utils/eventNotifications';
import { 
  getAllResumes, 
  ResumeInfo, 
  pickAndSaveResume, 
  deleteResume, 
  shareResume, 
  updateResumeName, 
  toggleResumeActive 
} from '../utils/resumes';
import { 
  getAllCoverLetters, 
  CoverLetterInfo, 
  pickAndSaveCoverLetter, 
  deleteCoverLetter, 
  shareCoverLetter, 
  renameCoverLetter, 
  toggleCoverLetterActive 
} from '../utils/coverLetters';
import { 
  createApplicationFollowUp, 
  createInterviewFollowUp, 
  getAllFollowUpReminders, 
  getFollowUpRemindersForApplication,
  completeFollowUpReminder,
  completeFollowUpReminderAndCreateNext,
  FollowUpReminder,
  deleteFollowUpRemindersForApplication 
} from '../utils/followUpReminders';
import EmailTemplateModal from './EmailTemplateModal';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';

interface ApplicationsScreenProps {
  onBack: () => void;
  onSelectDate?: (date: Date, applicationId?: string) => void;
  onCreateOffer?: (applicationId: string) => void;
  onCreateReference?: (applicationId: string) => void;
  onNavigateToInterviewPrep?: (companyName?: string, applicationId?: string) => void;
  initialApplicationId?: string;
}

interface DraggableKanbanCardProps {
  app: JobApplication;
  currentStatus: string;
  statusChangeTime: Date;
  timezone?: string;
  use12Hour: boolean;
  draggedCard: { app: JobApplication; status: string } | null;
  dragPosition: { x: number; y: number };
  columnRefs: React.MutableRefObject<Map<string, View>>;
  cardRefs: React.MutableRefObject<Map<string, { x: number; y: number; width: number; height: number }>>;
  colorScheme: any;
  onDragStart: (app: JobApplication, status: string) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onPress: () => void;
}

const DraggableKanbanCard: React.FC<DraggableKanbanCardProps> = ({
  app,
  currentStatus,
  statusChangeTime,
  timezone,
  use12Hour,
  draggedCard,
  dragPosition,
  columnRefs,
  cardRefs,
  colorScheme,
  onDragStart,
  onDragMove,
  onDragEnd,
  onPress,
}) => {
  const isDragging = draggedCard?.app.id === app.id;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartTime = useRef<number>(0);
  
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => {
        touchStartTime.current = Date.now();
        return false;
      },
      onStartShouldSetPanResponderCapture: () => {
        // Don't capture on start - let ScrollView handle initial scrolling
        touchStartTime.current = Date.now();
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // If already dragging, always capture
        if (draggedCard?.app.id === app.id) {
          return true;
        }
        
        const timeSinceStart = Date.now() - touchStartTime.current;
        const moved = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        
        // Capture if long press (200ms) OR moved (5px) - low threshold for quick response
        if (timeSinceStart > 200 || moved) {
          return true;
        }
        
        return false;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // If already dragging, always capture
        if (draggedCard?.app.id === app.id) {
          return true;
        }
        
        const timeSinceStart = Date.now() - touchStartTime.current;
        const moved = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        
        // Capture if long press or moved - this prevents ScrollView from scrolling
        return timeSinceStart > 200 || moved;
      },
      onPanResponderGrant: (evt) => {
        touchStartTime.current = Date.now();
        // Set a timer for long press to start drag
        longPressTimer.current = setTimeout(() => {
          if (!draggedCard) {
            onDragStart(app, currentStatus);
          }
        }, 200);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Clear long press timer if user moves
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        
        const timeSinceStart = Date.now() - touchStartTime.current;
        const moved = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        
        // Start dragging if: long press (200ms) OR moved (5px)
        const shouldStartDrag = !draggedCard && (timeSinceStart > 200 || moved);
        if (shouldStartDrag) {
          onDragStart(app, currentStatus);
          // Immediately update drag position after starting
          onDragMove(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        } else if (draggedCard?.app.id === app.id) {
          // Update drag position if already dragging
          onDragMove(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Clear long press timer
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        
        // If it was a quick tap and not a drag, trigger onPress
        const timeSinceStart = Date.now() - touchStartTime.current;
        const moved = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        
        if (!draggedCard && !moved && timeSinceStart < 500) {
          // It was a tap, trigger onPress
          setTimeout(() => {
            onPress();
          }, 50);
          return;
        }
        
        if (draggedCard?.app.id === app.id) {
          // Only call onDragEnd if there was actual movement (not just a tap)
          const moved = Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
          if (moved) {
            onDragEnd(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
          }
          // If it was just a tap, the modal is already shown via onPress
        }
      },
      onPanResponderTerminate: () => {
        // Clear long press timer
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        // Reset if drag is terminated
        if (draggedCard?.app.id === app.id) {
          onDragEnd(0, 0);
        }
      },
    });
  }, [app, currentStatus, draggedCard, onDragStart, onDragMove, onDragEnd, onPress]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      onLayout={(event) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        // Get absolute position
        event.target.measure((fx, fy, fwidth, fheight, pageX, pageY) => {
          cardRefs.current.set(app.id, { x: pageX, y: pageY, width, height });
        });
      }}
      style={[
        styles.kanbanCard,
        {
          backgroundColor: colorScheme.colors.background,
          borderColor: isDragging ? colorScheme.colors.primary : colorScheme.colors.border,
          borderWidth: isDragging ? 2 : 1,
          opacity: isDragging ? 0.7 : 1,
          transform: isDragging && dragPosition.x > 0 && dragPosition.y > 0 ? [
            { translateX: dragPosition.x - 150 }, // Approximate card center offset
            { translateY: dragPosition.y - 50 },
          ] : [],
          zIndex: isDragging ? 1000 : 1,
          position: isDragging ? 'absolute' : 'relative',
        }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (!draggedCard) {
            onPress();
          }
        }}
        disabled={!!draggedCard}
      >
        <Text style={[styles.kanbanCardCompany, { color: colorScheme.colors.text }]} numberOfLines={1}>
          {app.company}
        </Text>
        <Text style={[styles.kanbanCardTitle, { color: colorScheme.colors.textSecondary }]} numberOfLines={2}>
          {app.positionTitle}
        </Text>
        <Text style={[styles.kanbanCardDate, { color: colorScheme.colors.textSecondary }]}>
          Updated: {statusChangeTime.toLocaleDateString('en-US', {
            timeZone: timezone,
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })} {statusChangeTime.toLocaleTimeString('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: use12Hour,
          })}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ApplicationsScreen({ onBack, onSelectDate, onCreateOffer, onCreateReference, onNavigateToInterviewPrep, initialApplicationId }: ApplicationsScreenProps) {
  const [activeTab, setActiveTab] = useState<'applications' | 'resumes' | 'coverLetters'>('applications');
  
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [allApplications, setAllApplications] = useState<JobApplication[]>([]); // Store all applications for kanban view
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
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null); // null means "all weeks"
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list'); // View mode: list or kanban
  const [expandedKanbanColumns, setExpandedKanbanColumns] = useState<Set<string>>(new Set()); // Track which kanban columns are expanded
  const [draggedCard, setDraggedCard] = useState<{ app: JobApplication; status: string } | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0, cardX: 0, cardY: 0 });
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const columnRefs = useRef<Map<string, View>>(new Map());
  const columnPositions = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());
  const cardRefs = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());
  const kanbanScrollViewRef = useRef<ScrollView>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const kanbanScrollX = useRef(0);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [addNoteApplication, setAddNoteApplication] = useState<JobApplication | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [showCompletionDatePicker, setShowCompletionDatePicker] = useState(false);
  const [completionDateReminderId, setCompletionDateReminderId] = useState<string | null>(null);
  const [selectedCompletionDate, setSelectedCompletionDate] = useState<Date>(new Date());
  const [completionDateInput, setCompletionDateInput] = useState('');
  const [creatingEventForApplication, setCreatingEventForApplication] = useState<JobApplication | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [showLinkEventModal, setShowLinkEventModal] = useState(false);
  const [linkingEventForApplication, setLinkingEventForApplication] = useState<JobApplication | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailType, setEmailType] = useState<'thank-you' | 'follow-up' | 'decline-offer' | 'acceptance' | 'rejection-response'>('thank-you');
  const [emailApplication, setEmailApplication] = useState<JobApplication | null>(null);
  const [emailLinkedEvent, setEmailLinkedEvent] = useState<Event | null>(null);
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  const applicationsScrollViewRef = useRef<ScrollView>(null);
  const applicationRefs = useRef<Map<string, View>>(new Map());

  // Form state
  const [positionTitle, setPositionTitle] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(new Date().getMinutes());
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM' | null>(() => {
    const hour = new Date().getHours();
    return hour >= 12 ? 'PM' : 'AM';
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateInputText, setDateInputText] = useState('');
  const [status, setStatus] = useState<'applied' | 'rejected' | 'interview'>('applied');
  const [notes, setNotes] = useState('');
  const [rejectedReason, setRejectedReason] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState<string | undefined>(undefined);
  
  // Resume and cover letter lists
  const [resumes, setResumes] = useState<ResumeInfo[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetterInfo[]>([]);
  
  // Follow-up reminders
  const [followUpReminders, setFollowUpReminders] = useState<FollowUpReminder[]>([]);
  
  // Resume management state
  const [editingResumeName, setEditingResumeName] = useState<ResumeInfo | null>(null);
  const [newResumeName, setNewResumeName] = useState('');
  const [previewResume, setPreviewResume] = useState<ResumeInfo | null>(null);
  const [previewResumeUri, setPreviewResumeUri] = useState<string>('');
  
  // Cover letter management state
  const [editingCoverLetterName, setEditingCoverLetterName] = useState<CoverLetterInfo | null>(null);
  const [newCoverLetterName, setNewCoverLetterName] = useState('');
  const [previewCoverLetter, setPreviewCoverLetter] = useState<CoverLetterInfo | null>(null);
  const [previewCoverLetterUri, setPreviewCoverLetterUri] = useState<string>('');
  const [showAddCoverLetterModal, setShowAddCoverLetterModal] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);

  const { colorScheme, preferences } = usePreferences();

  // Week filter persistence key
  const WEEK_FILTER_KEY = 'applications_week_filter';

  // Helper function to get the start of a week (Sunday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    // Extract date components to avoid timezone issues
    const year = d.getFullYear();
    const month = d.getMonth();
    const dayOfMonth = d.getDate();
    const dayOfWeek = d.getDay();
    const diff = dayOfMonth - dayOfWeek; // Subtract days to get to Sunday
    const weekStart = new Date(year, month, diff, 0, 0, 0, 0);
    return weekStart;
  };

  // Helper function to get the end of a week (Saturday)
  const getWeekEnd = (date: Date): Date => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  };

  // Check if a date falls within a given week
  const isDateInWeek = (date: Date, weekStart: Date): boolean => {
    const weekEnd = getWeekEnd(weekStart);
    return date >= weekStart && date <= weekEnd;
  };

  // Helper function to get the week start date for a given label
  const getWeekForLabel = (label: string): Date | null => {
    if (label === 'All Weeks') {
      return null;
    }
    
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    
    if (label === 'This Week') {
      return currentWeekStart;
    } else if (label === 'Last Week') {
      const lastWeekStart = new Date(currentWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      return lastWeekStart;
    } else if (label === '2 Weeks Ago') {
      const twoWeeksAgoStart = new Date(currentWeekStart);
      twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 14);
      return twoWeeksAgoStart;
    } else if (label === '3 Weeks Ago') {
      const threeWeeksAgoStart = new Date(currentWeekStart);
      threeWeeksAgoStart.setDate(threeWeeksAgoStart.getDate() - 21);
      return threeWeeksAgoStart;
    }
    
    return null;
  };

  // Load persisted week filter
  const loadPersistedWeekFilter = async () => {
    try {
      const stored = await AsyncStorage.getItem(WEEK_FILTER_KEY);
      if (stored) {
        const weekDate = new Date(stored);
        if (!isNaN(weekDate.getTime())) {
          setSelectedWeek(weekDate);
        }
      }
    } catch (error) {
      console.error('Error loading persisted week filter:', error);
    }
  };

  // Save week filter to persistence
  const saveWeekFilter = async (week: Date | null) => {
    try {
      if (week) {
        await AsyncStorage.setItem(WEEK_FILTER_KEY, week.toISOString());
      } else {
        await AsyncStorage.removeItem(WEEK_FILTER_KEY);
      }
    } catch (error) {
      console.error('Error saving week filter:', error);
    }
  };

  useEffect(() => {
    loadPersistedWeekFilter();
    loadApplications();
    loadStats();
    loadAllEvents();
    loadResumesAndCoverLetters();
    loadFollowUpReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up auto-scroll interval when drag ends
  useEffect(() => {
    if (!draggedCard && autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
    // Cleanup on unmount
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [draggedCard]);

  // Handle scrolling to initial application when it's provided
  useEffect(() => {
    if (initialApplicationId && applications.length > 0) {
      setExpandedApplicationId(initialApplicationId);
    }
  }, [initialApplicationId, applications.length]);

  // Persist week filter when it changes
  useEffect(() => {
    saveWeekFilter(selectedWeek);
  }, [selectedWeek]);

  const loadFollowUpReminders = async () => {
    try {
      const reminders = await getAllFollowUpReminders();
      setFollowUpReminders(reminders);
    } catch (error) {
      console.error('Error loading follow-up reminders:', error);
    }
  };

  const loadResumesAndCoverLetters = async () => {
    try {
      const allResumes = await getAllResumes();
      const allCoverLetters = await getAllCoverLetters();
      setResumes(allResumes);
      setCoverLetters(allCoverLetters);
    } catch (error) {
      console.error('Error loading resumes and cover letters:', error);
    }
  };

  // Resume management handlers
  const handlePickResume = async () => {
    try {
      const resume = await pickAndSaveResume();
      if (resume) {
        await loadResumesAndCoverLetters();
        Alert.alert('Success', `Resume "${resume.name}" saved successfully`);
      }
    } catch (error) {
      console.error('Error picking resume:', error);
      Alert.alert('Error', 'Failed to save resume. Please try again.');
    }
  };

  const handleDeleteResume = (resume: ResumeInfo) => {
    Alert.alert(
      'Delete Resume',
      `Are you sure you want to delete "${resume.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteResume(resume.id);
              await loadResumesAndCoverLetters();
              Alert.alert('Success', 'Resume deleted');
            } catch (error) {
              console.error('Error deleting resume:', error);
              Alert.alert('Error', 'Failed to delete resume');
            }
          },
        },
      ]
    );
  };

  const handleShareResume = async (resume: ResumeInfo) => {
    try {
      await shareResume(resume);
    } catch (error) {
      console.error('Error sharing resume:', error);
      Alert.alert('Error', 'Failed to share resume');
    }
  };

  const handleRenameResume = (resume: ResumeInfo) => {
    setEditingResumeName(resume);
    setNewResumeName(resume.name);
  };

  const saveRenameResume = async () => {
    if (!editingResumeName || !newResumeName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    try {
      await updateResumeName(editingResumeName.id, newResumeName.trim());
      await loadResumesAndCoverLetters();
      setEditingResumeName(null);
      setNewResumeName('');
      Alert.alert('Success', 'Resume renamed');
    } catch (error) {
      console.error('Error renaming resume:', error);
      Alert.alert('Error', 'Failed to rename resume');
    }
  };

  const handlePreviewResume = async (resume: ResumeInfo) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(resume.fileUri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Resume file not found');
        return;
      }
      if (resume.mimeType === 'application/pdf') {
        setPreviewResume(resume);
        try {
          const base64Content = await FileSystem.readAsStringAsync(resume.fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                  body { margin: 0; padding: 0; overflow: hidden; }
                  embed { width: 100%; height: 100vh; }
                </style>
              </head>
              <body>
                <embed src="data:application/pdf;base64,${base64Content}" type="application/pdf" />
              </body>
            </html>
          `;
          setPreviewResumeUri(htmlContent);
        } catch (readError) {
          console.error('Error reading file:', readError);
          Alert.alert('Error', 'Failed to read resume file for preview');
        }
      } else {
        Alert.alert('Preview Not Available', 'PDF preview is available. For other file types, please use the Share button to open in another app.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error previewing resume:', error);
      Alert.alert('Error', 'Failed to preview resume');
    }
  };

  const handlePrintResume = async (resume: ResumeInfo) => {
    try {
      await Print.printAsync({ uri: resume.fileUri });
    } catch (error) {
      console.error('Error printing resume:', error);
      Alert.alert('Error', 'Failed to print resume');
    }
  };

  const handleShareFromPreviewResume = async (resume: ResumeInfo) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resume.fileUri, {
          mimeType: resume.mimeType || 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing resume:', error);
      Alert.alert('Error', 'Failed to share resume');
    }
  };

  const handleToggleResumeActive = async (resume: ResumeInfo) => {
    try {
      await toggleResumeActive(resume.id);
      await loadResumesAndCoverLetters();
    } catch (error) {
      console.error('Error toggling resume active status:', error);
      Alert.alert('Error', 'Failed to update resume status');
    }
  };

  // Cover letter management handlers
  const handlePickCoverLetter = async () => {
    try {
      const company = newCompany.trim() || undefined;
      const coverLetter = await pickAndSaveCoverLetter(company, isTemplate);
      if (coverLetter) {
        await loadResumesAndCoverLetters();
        setShowAddCoverLetterModal(false);
        setNewCompany('');
        setIsTemplate(false);
        Alert.alert('Success', `Cover letter "${coverLetter.name}" saved successfully`);
      }
    } catch (error) {
      console.error('Error picking cover letter:', error);
      Alert.alert('Error', 'Failed to save cover letter. Please try again.');
    }
  };

  const handleDeleteCoverLetter = (coverLetter: CoverLetterInfo) => {
    Alert.alert(
      'Delete Cover Letter',
      `Are you sure you want to delete "${coverLetter.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCoverLetter(coverLetter.id);
              await loadResumesAndCoverLetters();
              Alert.alert('Success', 'Cover letter deleted');
            } catch (error) {
              console.error('Error deleting cover letter:', error);
              Alert.alert('Error', 'Failed to delete cover letter');
            }
          },
        },
      ]
    );
  };

  const handleShareCoverLetter = async (coverLetter: CoverLetterInfo) => {
    try {
      await shareCoverLetter(coverLetter.id);
    } catch (error) {
      console.error('Error sharing cover letter:', error);
      Alert.alert('Error', 'Failed to share cover letter');
    }
  };

  const handleRenameCoverLetter = (coverLetter: CoverLetterInfo) => {
    setEditingCoverLetterName(coverLetter);
    setNewCoverLetterName(coverLetter.name);
  };

  const saveRenameCoverLetter = async () => {
    if (!editingCoverLetterName || !newCoverLetterName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    try {
      await renameCoverLetter(editingCoverLetterName.id, newCoverLetterName.trim());
      await loadResumesAndCoverLetters();
      setEditingCoverLetterName(null);
      setNewCoverLetterName('');
      Alert.alert('Success', 'Cover letter renamed');
    } catch (error) {
      console.error('Error renaming cover letter:', error);
      Alert.alert('Error', 'Failed to rename cover letter');
    }
  };

  const handlePreviewCoverLetter = async (coverLetter: CoverLetterInfo) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(coverLetter.fileUri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Cover letter file not found');
        return;
      }
      if (coverLetter.mimeType === 'application/pdf') {
        setPreviewCoverLetter(coverLetter);
        try {
          const base64Content = await FileSystem.readAsStringAsync(coverLetter.fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                  body { margin: 0; padding: 0; overflow: hidden; }
                  embed { width: 100%; height: 100vh; }
                </style>
              </head>
              <body>
                <embed src="data:application/pdf;base64,${base64Content}" type="application/pdf" />
              </body>
            </html>
          `;
          setPreviewCoverLetterUri(htmlContent);
        } catch (readError) {
          console.error('Error reading file:', readError);
          Alert.alert('Error', 'Failed to read cover letter file for preview');
        }
      } else {
        Alert.alert('Preview Not Available', 'PDF preview is available. For other file types, please use the Share button to open in another app.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error previewing cover letter:', error);
      Alert.alert('Error', 'Failed to preview cover letter');
    }
  };

  const handlePrintCoverLetter = async (coverLetter: CoverLetterInfo) => {
    try {
      await Print.printAsync({ uri: coverLetter.fileUri });
    } catch (error) {
      console.error('Error printing cover letter:', error);
      Alert.alert('Error', 'Failed to print cover letter');
    }
  };

  const handleShareFromPreviewCoverLetter = async (coverLetter: CoverLetterInfo) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(coverLetter.fileUri, {
          mimeType: coverLetter.mimeType || 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing cover letter:', error);
      Alert.alert('Error', 'Failed to share cover letter');
    }
  };

  const handleToggleCoverLetterActive = async (coverLetter: CoverLetterInfo) => {
    try {
      await toggleCoverLetterActive(coverLetter.id);
      await loadResumesAndCoverLetters();
    } catch (error) {
      console.error('Error toggling cover letter active status:', error);
      Alert.alert('Error', 'Failed to update cover letter status');
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Get the effective date for an application display/sorting
   * For rejected applications with interviews, use the interview date
   * Otherwise use the appliedDate
   */
  const getEffectiveApplicationDate = (app: JobApplication): Date => {
    // If rejected and has interview events, use the interview date
    if (app.status === 'rejected' && app.eventIds && app.eventIds.length > 0) {
      // Find the first interview event
      const interviewEvent = allEvents.find(e => app.eventIds!.includes(e.id));
      if (interviewEvent) {
        const [year, month, day] = interviewEvent.dateKey.split('-').map(Number);
        // Use the interview date at noon (12:00) to maintain consistent time for display
        const interviewDate = new Date(year, month - 1, day, 12, 0, 0, 0);
        return interviewDate;
      }
    }
    // Otherwise use the appliedDate
    return new Date(app.appliedDate);
  };

  const formatDateShort = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const loadAllEvents = async () => {
    try {
      const events = await getAllEvents();
      setAllEvents(events);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleSaveEvent = async (event: Event) => {
    try {
      // Schedule notification 10 minutes before event
      const notificationId = await scheduleEventNotification(event);
      if (notificationId) {
        event.notificationId = notificationId;
      }

      // Link event to application if creating from application
      if (creatingEventForApplication && event.type === 'interview') {
        event.applicationId = creatingEventForApplication.id;
        
        // Auto-update application status to 'interview' if it's currently 'applied'
        if (creatingEventForApplication.status === 'applied') {
          const previousStatus = creatingEventForApplication.status;
          const updatedApp: JobApplication = {
            ...creatingEventForApplication,
            status: 'interview',
          };
          await saveApplication(updatedApp, previousStatus);
        }
      }

      await saveEvent(event);

      // Link is handled by saveEvent's bi-directional linking
      if (creatingEventForApplication && event.type === 'interview') {
        await loadApplications(); // Reload to show the new event and status change
        await loadStats(); // Reload stats to reflect status change
        await loadAllEvents(); // Reload events list
      }

      setShowEventModal(false);
      setCreatingEventForApplication(null);
      Alert.alert('Success', 'Interview event created successfully');
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save interview event');
    }
  };

  useEffect(() => {
    if (searchTerm.trim()) {
      performSearch(searchTerm);
    } else {
      loadApplications();
    }
  }, [searchTerm, filterStatus, selectedWeek]);

  const loadApplications = async () => {
    try {
      const allApps = await getAllApplications();
      setAllApplications(allApps); // Store all applications for kanban view
      
      // Apply status filter
      let filteredApps = allApps;
      if (filterStatus !== 'all') {
        filteredApps = filteredApps.filter(app => app.status === filterStatus);
      }
      
      // Apply week filter
      if (selectedWeek) {
        const weekStart = getWeekStart(selectedWeek);
        filteredApps = filteredApps.filter(app => {
          // Extract date components to avoid timezone issues
          const appliedDateUTC = new Date(app.appliedDate);
          const appliedDate = new Date(
            appliedDateUTC.getFullYear(),
            appliedDateUTC.getMonth(),
            appliedDateUTC.getDate(),
            0, 0, 0, 0
          );
          return isDateInWeek(appliedDate, weekStart);
        });
      }
      
      setApplications(filteredApps);
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
      
      // Apply week filter
      if (selectedWeek) {
        const weekStart = getWeekStart(selectedWeek);
        results = results.filter(app => {
          // Extract date components to avoid timezone issues
          const appliedDateUTC = new Date(app.appliedDate);
          const appliedDate = new Date(
            appliedDateUTC.getFullYear(),
            appliedDateUTC.getMonth(),
            appliedDateUTC.getDate(),
            0, 0, 0, 0
          );
          return isDateInWeek(appliedDate, weekStart);
        });
      }
      
      // Sort by effective date (newest first)
      results.sort((a, b) => {
        const dateA = getEffectiveApplicationDate(a);
        const dateB = getEffectiveApplicationDate(b);
        return dateB.getTime() - dateA.getTime();
      });
      
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
    
    // This code is no longer needed - using selectedDate/selectedHour/selectedMinute instead
    setStatus('applied');
    setNotes('');
    setRejectedReason('');
    setSelectedResumeId(undefined);
    setSelectedCoverLetterId(undefined);
    setEditingApplication(null);
    setShowAddForm(false);
  };

  const handleEdit = (app: JobApplication) => {
    setEditingApplication(app);
    setPositionTitle(app.positionTitle);
    setCompany(app.company);
    setSource(app.source);
    setSourceUrl(app.sourceUrl || '');
    // Convert ISO date to local date and time
    const date = new Date(app.appliedDate);
    setSelectedDate(date);
    
    // Parse time based on 12/24 hour preference
    const use12Hour = preferences?.use12HourClock ?? false;
    const hours24 = date.getHours();
    const minutes = date.getMinutes();
    
    if (use12Hour) {
      const hour12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
      const period = hours24 >= 12 ? 'PM' : 'AM';
      setSelectedHour(hour12);
      setSelectedPeriod(period);
    } else {
      setSelectedHour(hours24);
      setSelectedPeriod(null);
    }
    setSelectedMinute(minutes);
    
    // Map 'no-response' to 'applied' since 'no-response' is no longer available as an option
    setStatus(app.status === 'no-response' ? 'applied' : app.status);
    setNotes(app.notes || '');
    setRejectedReason(app.rejectedReason || '');
    setSelectedResumeId(app.resumeId);
    setSelectedCoverLetterId(app.coverLetterId);
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
      // Convert selected date and time to ISO string
      const use12Hour = preferences?.use12HourClock ?? false;
      let hour24 = selectedHour;
      if (use12Hour && selectedPeriod) {
        if (selectedPeriod === 'AM' && selectedHour === 12) {
          hour24 = 0;
        } else if (selectedPeriod === 'PM' && selectedHour !== 12) {
          hour24 = selectedHour + 12;
        }
      }
      
      const dateObj = new Date(selectedDate);
      dateObj.setHours(hour24, selectedMinute, 0, 0);
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
        rejectedReason: status === 'rejected' ? rejectedReason.trim() || undefined : undefined,
        eventIds: editingApplication?.eventIds || ((editingApplication as any)?.eventId ? [(editingApplication as any).eventId] : []), // Preserve existing eventIds (migrate from eventId if needed)
        resumeId: selectedResumeId || undefined,
        coverLetterId: selectedCoverLetterId || undefined,
      };

      // If status changed to rejected, automatically complete any application follow-up reminders
      if (application.status === 'rejected' && editingApplication && editingApplication.status !== 'rejected') {
        try {
          const appReminders = await getFollowUpRemindersForApplication(application.id);
          const applicationReminders = appReminders.filter(r => r.type === 'application' && !r.completed);
          for (const reminder of applicationReminders) {
            await completeFollowUpReminder(reminder.id);
          }
        } catch (error) {
          console.error('Error completing follow-up reminders:', error);
          // Don't fail the save if reminder completion fails
        }
      }

      const previousStatus = editingApplication?.status;
      await saveApplication(application, previousStatus);
      
      // Create follow-up reminder if this is a new application with status "applied"
      if (!editingApplication && application.status === 'applied' && preferences?.followUpDaysAfterApplication) {
        try {
          await createApplicationFollowUp(
            application.id,
            application.company,
            application.positionTitle,
            preferences.followUpDaysAfterApplication
          );
        } catch (error) {
          console.error('Error creating application follow-up reminder:', error);
          // Don't fail the save if reminder creation fails
        }
      }
      
      // Reload reminders after saving
      await loadFollowUpReminders();
      
      await loadApplications();
      await loadStats();
      resetForm();
      Alert.alert('Success', editingApplication ? 'Application updated' : 'Application saved');
    } catch (error) {
      console.error('Error saving application:', error);
      Alert.alert('Error', 'Failed to save application');
    }
  };

  const handleStatusChange = async (app: JobApplication, newStatus: 'applied' | 'rejected' | 'interview' | 'no-response') => {
    try {
      const previousStatus = app.status;
      const updatedApp: JobApplication = {
        ...app,
        status: newStatus,
      };
      await saveApplication(updatedApp, previousStatus);
      
      // If status changed to rejected, automatically complete any application follow-up reminders
      if (newStatus === 'rejected') {
        try {
          const appReminders = await getFollowUpRemindersForApplication(app.id);
          const applicationReminders = appReminders.filter(r => r.type === 'application' && !r.completed);
          for (const reminder of applicationReminders) {
            await completeFollowUpReminder(reminder.id);
          }
        } catch (error) {
          console.error('Error completing follow-up reminders:', error);
          // Don't fail the status change if reminder completion fails
        }
      }
      
      await loadApplications();
      await loadStats();
      await loadFollowUpReminders(); // Reload reminders to reflect changes
      Alert.alert('Success', `Status changed to ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Error changing status:', error);
      Alert.alert('Error', 'Failed to change status');
    }
  };

  const handleCompleteFollowUp = async (reminderId: string) => {
    try {
      const nextReminder = await completeFollowUpReminderAndCreateNext(reminderId, true);
      await loadFollowUpReminders();
      await loadApplications(); // Reload to refresh any follow-up displays
      
      if (nextReminder) {
        Alert.alert(
          'Follow-up Completed',
          `Next follow-up scheduled for ${new Date(nextReminder.dueDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error completing follow-up reminder:', error);
      Alert.alert('Error', 'Failed to complete follow-up reminder');
    }
  };

  const handleMarkFollowUpCompleted = async (reminderId: string, completedDate?: Date) => {
    try {
      await completeFollowUpReminder(reminderId, completedDate);
      await loadFollowUpReminders();
      await loadApplications(); // Reload to refresh any follow-up displays
      const dateStr = completedDate 
        ? completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'today';
      Alert.alert('Success', `Follow-up marked as completed on ${dateStr}`);
    } catch (error) {
      console.error('Error marking follow-up as completed:', error);
      Alert.alert('Error', 'Failed to mark follow-up as completed');
    }
  };

  const handleSelectCompletionDate = (reminderId: string) => {
    setCompletionDateReminderId(reminderId);
    const today = new Date();
    setSelectedCompletionDate(today);
    // Initialize input with today's date in YYYY-MM-DD format
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setCompletionDateInput(`${year}-${month}-${day}`);
    setShowCompletionDatePicker(true);
  };

  const handleConfirmCompletionDate = async () => {
    if (completionDateReminderId) {
      // Parse the input date
      const dateMatch = completionDateInput.match(/(\d{4})-(\d{2})-(\d{2})/) || completionDateInput.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      let dateToUse = selectedCompletionDate;
      
      if (dateMatch) {
        let year, month, day;
        if (dateMatch[0].includes('/')) {
          // MM/DD/YYYY format
          month = parseInt(dateMatch[1], 10) - 1;
          day = parseInt(dateMatch[2], 10);
          year = parseInt(dateMatch[3], 10);
        } else {
          // YYYY-MM-DD format
          year = parseInt(dateMatch[1], 10);
          month = parseInt(dateMatch[2], 10) - 1;
          day = parseInt(dateMatch[3], 10);
        }
        const parsedDate = new Date(year, month, day);
        if (!isNaN(parsedDate.getTime())) {
          dateToUse = parsedDate;
        }
      }
      
      await handleMarkFollowUpCompleted(completionDateReminderId, dateToUse);
      setShowCompletionDatePicker(false);
      setCompletionDateReminderId(null);
      setCompletionDateInput('');
    }
  };

  const handleAddNote = (app: JobApplication) => {
    setAddNoteApplication(app);
    setNewNoteText('');
    setShowAddNoteModal(true);
  };

  const handleSaveNote = async () => {
    if (!addNoteApplication || !newNoteText.trim()) {
      Alert.alert('Error', 'Please enter a note');
      return;
    }

    try {
      const now = new Date();
      const timezone = preferences?.timezoneMode === 'custom' && preferences?.timezone
        ? preferences.timezone
        : undefined;
      const use12Hour = preferences?.use12HourClock ?? false;
      
      const dateStr = now.toLocaleDateString('en-US', {
        timeZone: timezone,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: use12Hour,
      });
      
      const timestamp = `${dateStr} at ${timeStr}`;
      const noteEntry = `[${timestamp}] ${newNoteText.trim()}`;
      
      const updatedNotes = addNoteApplication.notes
        ? `${addNoteApplication.notes}\n${noteEntry}`
        : noteEntry;
      
      const updatedApplication = {
        ...addNoteApplication,
        notes: updatedNotes,
      };
      
      await saveApplication(updatedApplication, addNoteApplication.status);
      await loadApplications();
      
      setShowAddNoteModal(false);
      setAddNoteApplication(null);
      setNewNoteText('');
      
      Alert.alert('Success', 'Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note');
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
              // Delete associated follow-up reminders
              await deleteFollowUpRemindersForApplication(app.id);
              await deleteApplication(app.id);
              await loadApplications();
              await loadStats();
              await loadFollowUpReminders();
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

  // Format date for display (e.g., "December 20, 2025")
  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time for display
  const formatTimeDisplay = (hour: number, minute: number, period: 'AM' | 'PM' | null): string => {
    const use12Hour = preferences?.use12HourClock ?? false;
    if (use12Hour && period) {
      return `${hour}:${String(minute).padStart(2, '0')}${period}`;
    } else {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
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
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Resume Used (Optional)</Text>
            <TouchableOpacity
              style={[styles.pickerButton, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
              onPress={() => {
                const options = ['None', ...resumes.map(r => r.name)];
                const currentIndex = selectedResumeId 
                  ? resumes.findIndex(r => r.id === selectedResumeId) + 1
                  : 0;
                Alert.alert(
                  'Select Resume',
                  '',
                  options.map((name, index) => ({
                    text: name,
                    onPress: () => {
                      if (index === 0) {
                        setSelectedResumeId(undefined);
                      } else {
                        setSelectedResumeId(resumes[index - 1].id);
                      }
                    },
                    style: index === currentIndex ? 'default' : undefined,
                  }))
                );
              }}
            >
              <Text style={[styles.pickerButtonText, { color: selectedResumeId ? colorScheme.colors.text : colorScheme.colors.textSecondary }]}>
                {selectedResumeId 
                  ? resumes.find(r => r.id === selectedResumeId)?.name || 'Select resume...'
                  : 'None'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Cover Letter Used (Optional)</Text>
            <TouchableOpacity
              style={[styles.pickerButton, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
              onPress={() => {
                const options = ['None', ...coverLetters.map(cl => cl.name)];
                const currentIndex = selectedCoverLetterId 
                  ? coverLetters.findIndex(cl => cl.id === selectedCoverLetterId) + 1
                  : 0;
                Alert.alert(
                  'Select Cover Letter',
                  '',
                  options.map((name, index) => ({
                    text: name,
                    onPress: () => {
                      if (index === 0) {
                        setSelectedCoverLetterId(undefined);
                      } else {
                        setSelectedCoverLetterId(coverLetters[index - 1].id);
                      }
                    },
                    style: index === currentIndex ? 'default' : undefined,
                  }))
                );
              }}
            >
              <Text style={[styles.pickerButtonText, { color: selectedCoverLetterId ? colorScheme.colors.text : colorScheme.colors.textSecondary }]}>
                {selectedCoverLetterId 
                  ? coverLetters.find(cl => cl.id === selectedCoverLetterId)?.name || 'Select cover letter...'
                  : 'None'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Applied Date</Text>
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                {
                  backgroundColor: colorScheme.colors.surface,
                  borderColor: colorScheme.colors.border,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.datePickerText, { color: colorScheme.colors.text }]}>
                {formatDateDisplay(selectedDate)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Applied Time</Text>
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                {
                  backgroundColor: colorScheme.colors.surface,
                  borderColor: colorScheme.colors.border,
                },
              ]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.datePickerText, { color: colorScheme.colors.text }]}>
                {formatTimeDisplay(selectedHour, selectedMinute, selectedPeriod)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colorScheme.colors.text }]}>Status</Text>
            <View style={styles.statusButtons}>
              {(['applied', 'rejected', 'interview'] as const).map((stat) => (
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

          {status === 'rejected' && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>Rejection Reason (Optional)</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border },
                ]}
                value={rejectedReason}
                onChangeText={setRejectedReason}
                placeholder="e.g., Not a good fit, Overqualified, etc."
                placeholderTextColor={colorScheme.colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}

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

          {editingApplication && onCreateOffer && (
            <TouchableOpacity
              style={[styles.createOfferButton, { backgroundColor: colorScheme.colors.accent, marginBottom: 12 }]}
              onPress={() => onCreateOffer(editingApplication.id)}
            >
              <Text style={styles.createOfferButtonText}>🎁 Create Offer</Text>
            </TouchableOpacity>
          )}
          {editingApplication && onCreateReference && (
            <TouchableOpacity
              style={[styles.createOfferButton, { backgroundColor: colorScheme.colors.secondary, marginBottom: 12 }]}
              onPress={() => onCreateReference(editingApplication.id)}
            >
              <Text style={styles.createOfferButtonText}>📞 Add Reference</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colorScheme.colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Application</Text>
          </TouchableOpacity>
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowDatePicker(false);
            setDateInputText('');
          }}
          onShow={() => Keyboard.dismiss()}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalOverlayTouchable} 
              onPress={() => {
                setShowDatePicker(false);
                setDateInputText('');
              }} 
              activeOpacity={1} 
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              style={styles.modalContentContainer}
            >
              <View style={[styles.modalContent, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
                <Text style={[styles.modalTitle, { color: colorScheme.colors.text, marginBottom: 12 }]}>Select Date</Text>
                <Text style={[styles.hint, { color: colorScheme.colors.textSecondary, marginBottom: 12 }]}>
                  Current: {formatDateDisplay(selectedDate)}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme.colors.background,
                      borderColor: colorScheme.colors.border,
                      color: colorScheme.colors.text,
                      marginBottom: 12,
                    },
                  ]}
                  value={dateInputText}
                  onChangeText={setDateInputText}
                  placeholder="YYYY-MM-DD or MM/DD/YYYY"
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  keyboardType="numbers-and-punctuation"
                  autoFocus={true}
                />
                <Text style={[styles.hint, { color: colorScheme.colors.textSecondary, marginBottom: 0 }]}>
                  Tip: You can type either 2025-12-20 or 12/20/2025.
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, { borderColor: colorScheme.colors.border }]}
                    onPress={() => {
                      setShowDatePicker(false);
                      setDateInputText('');
                    }}
                  >
                    <Text style={[styles.modalButtonText, { color: colorScheme.colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colorScheme.colors.primary }]}
                    onPress={() => {
                      let year: number | undefined;
                      let month: number | undefined;
                      let day: number | undefined;

                      const isoMatch = dateInputText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                      const usMatch = dateInputText.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

                      if (isoMatch) {
                        year = Number(isoMatch[1]);
                        month = Number(isoMatch[2]);
                        day = Number(isoMatch[3]);
                      } else if (usMatch) {
                        month = Number(usMatch[1]);
                        day = Number(usMatch[2]);
                        year = Number(usMatch[3]);
                      }

                      if (year && month && day) {
                        const newDate = new Date(year, month - 1, day);
                        if (!isNaN(newDate.getTime())) {
                          // Preserve the selected hour and minute from state
                          const use12Hour = preferences?.use12HourClock ?? false;
                          let hour24 = selectedHour;
                          if (use12Hour && selectedPeriod) {
                            if (selectedPeriod === 'AM' && selectedHour === 12) {
                              hour24 = 0;
                            } else if (selectedPeriod === 'PM' && selectedHour !== 12) {
                              hour24 = selectedHour + 12;
                            }
                          }
                          newDate.setHours(hour24, selectedMinute, 0, 0);
                          setSelectedDate(newDate);
                          setShowDatePicker(false);
                          setDateInputText('');
                        } else {
                          Alert.alert('Invalid Date', 'Please enter a valid date');
                        }
                      } else if (dateInputText.trim() === '') {
                        // If empty, just close without changing
                        setShowDatePicker(false);
                        setDateInputText('');
                      } else {
                        Alert.alert('Invalid Format', 'Please enter the date as YYYY-MM-DD or MM/DD/YYYY');
                      }
                    }}
                  >
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <TimePickerModal
          hour={selectedHour}
          minute={selectedMinute}
          period={selectedPeriod}
          use12Hour={preferences?.use12HourClock ?? false}
          colorScheme={colorScheme.colors}
          onSelect={(hour, minute, period) => {
            setSelectedHour(hour);
            setSelectedMinute(minute);
            setSelectedPeriod(period);
            setShowTimePicker(false);
          }}
          onClose={() => setShowTimePicker(false)}
        />
      )}
      </KeyboardAvoidingView>
    );
  }

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'resumes':
        return 'Resumes';
      case 'coverLetters':
        return 'Cover Letters';
      default:
        return 'Job Applications';
    }
  };

  const handleAddButtonPress = () => {
    if (activeTab === 'resumes') {
      handlePickResume();
    } else if (activeTab === 'coverLetters') {
      setShowAddCoverLetterModal(true);
    } else {
      resetForm();
      setShowAddForm(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colorScheme.colors.text }]}>{getHeaderTitle()}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddButtonPress}>
          <Text style={[styles.addButtonText, { color: colorScheme.colors.primary }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'applications' && styles.activeTab, { borderBottomColor: colorScheme.colors.primary }]}
          onPress={() => setActiveTab('applications')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'applications' ? colorScheme.colors.primary : colorScheme.colors.textSecondary }]}>
            Applications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resumes' && styles.activeTab, { borderBottomColor: colorScheme.colors.primary }]}
          onPress={() => setActiveTab('resumes')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'resumes' ? colorScheme.colors.primary : colorScheme.colors.textSecondary }]}>
            Resumes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'coverLetters' && styles.activeTab, { borderBottomColor: colorScheme.colors.primary }]}
          onPress={() => setActiveTab('coverLetters')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'coverLetters' ? colorScheme.colors.primary : colorScheme.colors.textSecondary }]}>
            Cover Letters
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditional Content Based on Active Tab */}
      {activeTab === 'applications' && (
        <>
          {/* Stats - Clickable */}
          <View style={[styles.statsContainer, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
            <TouchableOpacity 
              style={[
                styles.statItem,
                filterStatus === 'all' && { backgroundColor: colorScheme.colors.primary + '20', borderRadius: 8, padding: 8 }
              ]}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[styles.statValue, { color: filterStatus === 'all' ? colorScheme.colors.primary : colorScheme.colors.text }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: filterStatus === 'all' ? colorScheme.colors.primary : colorScheme.colors.textSecondary }]}>Total</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.statItem,
                filterStatus === 'applied' && { backgroundColor: colorScheme.colors.primary + '20', borderRadius: 8, padding: 8 }
              ]}
              onPress={() => setFilterStatus('applied')}
            >
              <Text style={[styles.statValue, { color: filterStatus === 'applied' ? colorScheme.colors.primary : colorScheme.colors.text }]}>{stats.applied}</Text>
              <Text style={[styles.statLabel, { color: filterStatus === 'applied' ? colorScheme.colors.primary : colorScheme.colors.textSecondary }]}>Applied</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.statItem,
                filterStatus === 'rejected' && { backgroundColor: colorScheme.colors.primary + '20', borderRadius: 8, padding: 8 }
              ]}
              onPress={() => setFilterStatus('rejected')}
            >
              <Text style={[styles.statValue, { color: filterStatus === 'rejected' ? colorScheme.colors.primary : colorScheme.colors.text }]}>{stats.rejected}</Text>
              <Text style={[styles.statLabel, { color: filterStatus === 'rejected' ? colorScheme.colors.primary : colorScheme.colors.textSecondary }]}>Rejected</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.statItem,
                filterStatus === 'interview' && { backgroundColor: colorScheme.colors.primary + '20', borderRadius: 8, padding: 8 }
              ]}
              onPress={() => setFilterStatus('interview')}
            >
              <Text style={[styles.statValue, { color: filterStatus === 'interview' ? colorScheme.colors.primary : colorScheme.colors.text }]}>{stats.interview}</Text>
              <Text style={[styles.statLabel, { color: filterStatus === 'interview' ? colorScheme.colors.primary : colorScheme.colors.textSecondary }]}>Interview</Text>
            </TouchableOpacity>
          </View>

          {/* Search and View Toggle */}
          <View style={[styles.searchContainer, { backgroundColor: colorScheme.colors.surface }]}>
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colorScheme.colors.background, color: colorScheme.colors.text, borderColor: colorScheme.colors.border, flex: 1 }]}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search by company, position, or source..."
                placeholderTextColor={colorScheme.colors.textSecondary}
              />
              <TouchableOpacity
                style={[styles.viewToggleButton, { backgroundColor: colorScheme.colors.background, borderColor: colorScheme.colors.border }]}
                onPress={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
              >
                <Text style={[styles.viewToggleText, { color: colorScheme.colors.text }]}>
                  {viewMode === 'list' ? '📋' : '📝'} {viewMode === 'list' ? 'Kanban' : 'List'}
                </Text>
              </TouchableOpacity>
            </View>
        <View style={styles.weekFilterContainer}>
          <Text style={[styles.weekFilterLabel, { color: colorScheme.colors.textSecondary }]}>Week:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekFilterScroll}>
            {['All Weeks', 'This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago'].map((weekLabel) => {
              const weekDate = getWeekForLabel(weekLabel);
              const isSelected = selectedWeek === null 
                ? weekLabel === 'All Weeks'
                : weekDate !== null && selectedWeek.getTime() === weekDate.getTime();
              
              return (
                <TouchableOpacity
                  key={weekLabel}
                  style={[
                    styles.weekFilterButton,
                    {
                      backgroundColor: isSelected ? colorScheme.colors.primary : colorScheme.colors.background,
                      borderColor: colorScheme.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedWeek(weekDate)}
                >
                  <Text
                    style={[
                      styles.weekFilterButtonText,
                      { color: isSelected ? '#fff' : colorScheme.colors.text },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {weekLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Applications List or Kanban Board */}
      {viewMode === 'kanban' ? (
        <>
        <ScrollView 
          ref={kanbanScrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={styles.kanbanScrollView}
          contentContainerStyle={styles.kanbanContent}
          scrollEnabled={!draggedCard}
          onScroll={(event) => {
            kanbanScrollX.current = event.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
        >
          {(['applied', 'interview', 'rejected', 'no-response'] as const).map((status) => {
            // For kanban view, use allApplications and filter by status and search term only (ignore status filter)
            const allStatusApps = (() => {
              let filtered = allApplications.filter(app => app.status === status);
              
              // Apply search filter if present
              if (searchTerm.trim()) {
                const searchLower = searchTerm.toLowerCase();
                filtered = filtered.filter(app => 
                  app.company.toLowerCase().includes(searchLower) ||
                  app.positionTitle.toLowerCase().includes(searchLower) ||
                  app.source.toLowerCase().includes(searchLower)
                );
              }
              
              // Apply week filter if present
              if (selectedWeek) {
                const weekStart = getWeekStart(selectedWeek);
                filtered = filtered.filter(app => {
                  const appliedDateUTC = new Date(app.appliedDate);
                  const appliedDate = new Date(
                    appliedDateUTC.getFullYear(),
                    appliedDateUTC.getMonth(),
                    appliedDateUTC.getDate(),
                    0, 0, 0, 0
                  );
                  return isDateInWeek(appliedDate, weekStart);
                });
              }
              
              return filtered;
            })().sort((a, b) => {
              // Sort by last updated or status change timestamp, most recent first
              const aDate = a.statusChangeTimestamps?.[status] || a.lastUpdated || a.appliedDate;
              const bDate = b.statusChangeTimestamps?.[status] || b.lastUpdated || b.appliedDate;
              return new Date(bDate).getTime() - new Date(aDate).getTime();
            });
            
            const isExpanded = expandedKanbanColumns.has(status);
            const cardsPerColumn = preferences?.kanbanCardsPerColumn || 5;
            const statusApps = isExpanded 
              ? allStatusApps 
              : allStatusApps.slice(0, cardsPerColumn);
            
            const statusLabel = getStatusLabel(status);
            const statusColor = getStatusColor(status);
            
            return (
              <View 
                key={status} 
                ref={(ref) => {
                  if (ref) {
                    columnRefs.current.set(status, ref);
                  } else {
                    columnRefs.current.delete(status);
                    columnPositions.current.delete(status);
                  }
                }}
                onLayout={(event) => {
                  const { x, y, width, height } = event.nativeEvent.layout;
                  // Get absolute position
                  const colRef = columnRefs.current.get(status);
                  if (colRef) {
                    colRef.measure((fx, fy, fwidth, fheight, pageX, pageY) => {
                      columnPositions.current.set(status, { x: pageX, y: pageY, width, height });
                    });
                  }
                }}
                style={[
                  styles.kanbanColumn, 
                  { 
                    backgroundColor: colorScheme.colors.surface, 
                    borderColor: dragOverColumn === status ? colorScheme.colors.primary : colorScheme.colors.border,
                    borderWidth: dragOverColumn === status ? 2 : 1,
                  }
                ]}
              >
                <View style={[styles.kanbanColumnHeader, { borderBottomColor: colorScheme.colors.border }]}>
                  <Text style={[styles.kanbanColumnTitle, { color: colorScheme.colors.text }]}>
                    {statusLabel}
                  </Text>
                  <Text style={[styles.kanbanColumnCount, { color: colorScheme.colors.textSecondary }]}>
                    {allStatusApps.length}
                  </Text>
                </View>
                <ScrollView 
                  style={styles.kanbanColumnContent}
                  contentContainerStyle={styles.kanbanColumnContentContainer}
                  scrollEnabled={!draggedCard}
                  nestedScrollEnabled={true}
                >
                  {statusApps.length === 0 ? (
                    <View style={styles.kanbanEmptyColumn}>
                      <Text style={[styles.kanbanEmptyText, { color: colorScheme.colors.textSecondary }]}>
                        No applications
                      </Text>
                    </View>
                  ) : (
                    statusApps.map((app) => {
                      const statusChangeDate = app.statusChangeTimestamps?.[status] || app.lastUpdated || app.appliedDate;
                      const statusChangeTime = new Date(statusChangeDate);
                      const timezone = preferences?.timezoneMode === 'custom' && preferences?.timezone
                        ? preferences.timezone
                        : undefined;
                      const use12Hour = preferences?.use12HourClock ?? false;
                      
                      return (
                        <DraggableKanbanCard
                          key={app.id}
                          app={app}
                          currentStatus={status}
                          statusChangeTime={statusChangeTime}
                          timezone={timezone}
                          use12Hour={use12Hour}
                          draggedCard={draggedCard}
                          dragPosition={dragPosition}
                          columnRefs={columnRefs}
                          cardRefs={cardRefs}
                          colorScheme={colorScheme}
                          onDragStart={(app, status) => {
                            const cardPos = cardRefs.current.get(app.id);
                            if (cardPos) {
                              setDragStartPosition({ 
                                x: dragPosition.x || cardPos.x + cardPos.width / 2, 
                                y: dragPosition.y || cardPos.y + cardPos.height / 2,
                                cardX: cardPos.x,
                                cardY: cardPos.y,
                              });
                            }
                            setDraggedCard({ app, status });
                            // Show column selector immediately when dragging starts
                            setShowColumnSelector(true);
                          }}
                          onDragMove={(x, y) => {
                            setDragPosition({ x, y });
                            
                            // Auto-scroll when dragging near screen edges (less aggressive)
                            const screenWidth = Dimensions.get('window').width;
                            const edgeThreshold = 30; // Distance from edge to trigger scroll (reduced from 50)
                            const scrollSpeed = 3; // Pixels to scroll per interval (reduced from 10)
                            
                            // Clear existing auto-scroll interval
                            if (autoScrollIntervalRef.current) {
                              clearInterval(autoScrollIntervalRef.current);
                              autoScrollIntervalRef.current = null;
                            }
                            
                            // Check if near left edge (only if dragging for a bit)
                            if (x < edgeThreshold && kanbanScrollViewRef.current && draggedCard) {
                              autoScrollIntervalRef.current = setInterval(() => {
                                const newScrollX = Math.max(0, kanbanScrollX.current - scrollSpeed);
                                kanbanScrollX.current = newScrollX;
                                kanbanScrollViewRef.current?.scrollTo({
                                  x: newScrollX,
                                  animated: false,
                                });
                              }, 50); // Slower interval (reduced from 16ms)
                            }
                            // Check if near right edge (only if dragging for a bit)
                            else if (x > screenWidth - edgeThreshold && kanbanScrollViewRef.current && draggedCard) {
                              autoScrollIntervalRef.current = setInterval(() => {
                                const newScrollX = kanbanScrollX.current + scrollSpeed;
                                kanbanScrollX.current = newScrollX;
                                kanbanScrollViewRef.current?.scrollTo({
                                  x: newScrollX,
                                  animated: false,
                                });
                              }, 50); // Slower interval (reduced from 16ms)
                            }
                            
                            // Check which column we're over using stored positions
                            const columns = ['applied', 'interview', 'rejected', 'no-response'] as const;
                            
                            // First check stored positions (faster)
                            let foundColumn: string | null = null;
                            for (const colStatus of columns) {
                              const pos = columnPositions.current.get(colStatus);
                              if (pos &&
                                  x >= pos.x &&
                                  x <= pos.x + pos.width &&
                                  y >= pos.y &&
                                  y <= pos.y + pos.height) {
                                foundColumn = colStatus;
                                setDragOverColumn(colStatus);
                                break;
                              }
                            }
                            
                            // Update column positions continuously (for scrolling scenarios)
                            for (const colStatus of columns) {
                              const colRef = columnRefs.current.get(colStatus);
                              if (colRef) {
                                colRef.measure((fx, fy, width, height, pageX, pageY) => {
                                  columnPositions.current.set(colStatus, { x: pageX, y: pageY, width, height });
                                  
                                  // Check if we're over this column (use updated position)
                                  if (
                                      x >= pageX &&
                                      x <= pageX + width &&
                                      y >= pageY &&
                                      y <= pageY + height) {
                                    setDragOverColumn(colStatus);
                                  }
                                });
                              }
                            }
                          }}
                          onDragEnd={(x, y) => {
                            // Clear auto-scroll interval
                            if (autoScrollIntervalRef.current) {
                              clearInterval(autoScrollIntervalRef.current);
                              autoScrollIntervalRef.current = null;
                            }
                            
                            // Get the dragged card info
                            const currentDraggedCard = draggedCard;
                            if (!currentDraggedCard) {
                              setDraggedCard(null);
                              setDragOverColumn(null);
                              setDragPosition({ x: 0, y: 0 });
                              return;
                            }
                            
                            const draggedApp = currentDraggedCard.app;
                            const draggedStatus = currentDraggedCard.status;
                            
                            // Check if dropped over a different column
                            const columns = ['applied', 'interview', 'rejected', 'no-response'] as const;
                            let droppedOnStatus: string | null = null;
                            
                            // Use the dragOverColumn if it was set, otherwise check positions
                            if (dragOverColumn && dragOverColumn !== draggedStatus) {
                              droppedOnStatus = dragOverColumn;
                            } else {
                              // Check stored positions first
                              for (const colStatus of columns) {
                                const pos = columnPositions.current.get(colStatus);
                                if (pos &&
                                    x >= pos.x &&
                                    x <= pos.x + pos.width &&
                                    y >= pos.y &&
                                    y <= pos.y + pos.height &&
                                    colStatus !== draggedStatus) {
                                  droppedOnStatus = colStatus;
                                  break;
                                }
                              }
                              
                              // If not found in stored positions, measure directly
                              if (!droppedOnStatus) {
                                const measurePromises: Promise<void>[] = [];
                                for (const colStatus of columns) {
                                  const colRef = columnRefs.current.get(colStatus);
                                  if (colRef) {
                                    const promise = new Promise<void>((resolve) => {
                                      colRef.measure((fx, fy, width, height, pageX, pageY) => {
                                        if (
                                          x >= pageX &&
                                          x <= pageX + width &&
                                          y >= pageY &&
                                          y <= pageY + height &&
                                          colStatus !== draggedStatus &&
                                          !droppedOnStatus
                                        ) {
                                          droppedOnStatus = colStatus;
                                        }
                                        resolve();
                                      });
                                    });
                                    measurePromises.push(promise);
                                  }
                                }
                                
                                // Wait for all measurements to complete
                                Promise.all(measurePromises).then(() => {
                                  if (droppedOnStatus && droppedOnStatus !== draggedApp.status) {
                                    handleStatusChange(draggedApp, droppedOnStatus as 'applied' | 'rejected' | 'interview' | 'no-response');
                                    // Close modal if successfully dropped on column
                                    setDraggedCard(null);
                                    setDragOverColumn(null);
                                    setDragPosition({ x: 0, y: 0 });
                                    setShowColumnSelector(false);
                                  }
                                  // If no column was dropped on, keep modal open for manual selection
                                });
                                return;
                              }
                            }
                            
                            // Handle drop immediately if we found a column
                            if (droppedOnStatus && droppedOnStatus !== draggedApp.status) {
                              handleStatusChange(draggedApp, droppedOnStatus as 'applied' | 'rejected' | 'interview' | 'no-response');
                              // Close modal if successfully dropped on column
                              setDraggedCard(null);
                              setDragOverColumn(null);
                              setDragPosition({ x: 0, y: 0 });
                              setShowColumnSelector(false);
                            }
                            // If no column was dropped on, keep modal open for manual selection
                            // Don't reset draggedCard - let user select from dropdown
                          }}
                          onPress={() => {
                            // Show modal with edit and move options instead of immediately editing
                            if (!draggedCard) {
                              setDraggedCard({ app, status });
                              setShowColumnSelector(true);
                            }
                          }}
                        />
                      );
                    })
                  )}
                  {allStatusApps.length > cardsPerColumn && (
                    <TouchableOpacity
                      style={styles.kanbanMoreIndicator}
                      onPress={() => {
                        const newExpanded = new Set(expandedKanbanColumns);
                        if (isExpanded) {
                          newExpanded.delete(status);
                        } else {
                          newExpanded.add(status);
                        }
                        setExpandedKanbanColumns(newExpanded);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.kanbanMoreText, { color: colorScheme.colors.primary }]}>
                        {isExpanded 
                          ? 'Show less' 
                          : `+${allStatusApps.length - cardsPerColumn} more`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
        
        {/* Column Selector Modal - appears when dragging */}
        {draggedCard && showColumnSelector && (
          <Modal
            transparent={true}
            visible={showColumnSelector}
            animationType="fade"
            onRequestClose={() => {
              // Don't close on back button - require explicit cancel
            }}
          >
            <View style={styles.columnSelectorOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => {
                  // Close modal and cancel drag
                  setDraggedCard(null);
                  setDragOverColumn(null);
                  setDragPosition({ x: 0, y: 0 });
                  setShowColumnSelector(false);
                }}
              />
              <View
                style={[
                  styles.columnSelectorContainer,
                  {
                    backgroundColor: colorScheme.colors.surface,
                    borderColor: colorScheme.colors.border,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: [{ translateX: -100 }, { translateY: -150 }],
                  },
                ]}
                onStartShouldSetResponder={() => true}
              >
                <Text
                  style={[
                    styles.columnSelectorTitle,
                    { color: colorScheme.colors.text },
                  ]}
                >
                  {draggedCard.app.company}
                </Text>
                <Text
                  style={[
                    styles.columnSelectorSubtitle,
                    { color: colorScheme.colors.textSecondary },
                  ]}
                >
                  {draggedCard.app.positionTitle}
                </Text>
                
                {/* Edit Option */}
                <TouchableOpacity
                  style={[
                    styles.columnSelectorOption,
                    {
                      backgroundColor: 'transparent',
                      borderColor: colorScheme.colors.border,
                      marginTop: 8,
                    },
                  ]}
                  onPress={() => {
                    const appToEdit = draggedCard.app;
                    setDraggedCard(null);
                    setDragOverColumn(null);
                    setDragPosition({ x: 0, y: 0 });
                    setShowColumnSelector(false);
                    handleEdit(appToEdit);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.columnSelectorOptionText,
                      { color: colorScheme.colors.text },
                    ]}
                  >
                    ✏️ Edit Application
                  </Text>
                </TouchableOpacity>
                
                <View
                  style={[
                    styles.columnSelectorDivider,
                    { backgroundColor: colorScheme.colors.border },
                  ]}
                />
                
                <Text
                  style={[
                    styles.columnSelectorSectionTitle,
                    { color: colorScheme.colors.textSecondary },
                  ]}
                >
                  Move to:
                </Text>
                {(['applied', 'interview', 'rejected', 'no-response'] as const)
                  .filter((status) => status !== draggedCard.status)
                  .map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.columnSelectorOption,
                        {
                          backgroundColor:
                            dragOverColumn === status
                              ? colorScheme.colors.primary + '20'
                              : 'transparent',
                          borderColor: colorScheme.colors.border,
                        },
                      ]}
                      onPress={() => {
                        handleStatusChange(
                          draggedCard.app,
                          status as 'applied' | 'rejected' | 'interview' | 'no-response'
                        );
                        setDraggedCard(null);
                        setDragOverColumn(null);
                        setDragPosition({ x: 0, y: 0 });
                        setShowColumnSelector(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.columnSelectorOptionText,
                          {
                            color:
                              dragOverColumn === status
                                ? colorScheme.colors.primary
                                : colorScheme.colors.text,
                          },
                        ]}
                      >
                        {getStatusLabel(status)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                <TouchableOpacity
                  style={[
                    styles.columnSelectorCancel,
                    { borderTopColor: colorScheme.colors.border },
                  ]}
                  onPress={() => {
                    setDraggedCard(null);
                    setDragOverColumn(null);
                    setDragPosition({ x: 0, y: 0 });
                    setShowColumnSelector(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.columnSelectorCancelText,
                      { color: colorScheme.colors.textSecondary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        </>
      ) : (
        <ScrollView 
          ref={applicationsScrollViewRef}
          style={styles.scrollView} 
          contentContainerStyle={styles.listContent}
        >
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
              ref={(ref) => {
                if (ref) {
                  applicationRefs.current.set(app.id, ref);
                } else {
                  applicationRefs.current.delete(app.id);
                }
              }}
              onLayout={() => {
                // Scroll to initial application after layout
                if (initialApplicationId === app.id && applicationsScrollViewRef.current) {
                  setTimeout(() => {
                    const ref = applicationRefs.current.get(app.id);
                    if (ref && applicationsScrollViewRef.current) {
                      ref.measureLayout(
                        applicationsScrollViewRef.current as any,
                        (x, y) => {
                          if (applicationsScrollViewRef.current) {
                            applicationsScrollViewRef.current.scrollTo({ y: Math.max(0, y - 20), animated: true });
                          }
                        },
                        () => {}
                      );
                    }
                  }, 200);
                }
              }}
              style={[
                styles.applicationCard, 
                { 
                  backgroundColor: colorScheme.colors.surface, 
                  borderColor: initialApplicationId === app.id ? colorScheme.colors.primary : colorScheme.colors.border,
                  borderWidth: initialApplicationId === app.id ? 2 : 1,
                }
              ]}
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
                <TouchableOpacity
                  onPress={() => {
                    if (onNavigateToInterviewPrep) {
                      onNavigateToInterviewPrep(app.company, app.id);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.companyName, { color: colorScheme.colors.primary }]}>
                    {app.company}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.applicationDetails}>
                <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                  📍 Source: {app.source}
                </Text>
                <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                  {(() => {
                    const effectiveDate = getEffectiveApplicationDate(app);
                    const isUsingInterviewDate = app.status === 'rejected' && app.eventIds && app.eventIds.length > 0;
                    const dateLabel = isUsingInterviewDate ? '📅 Interview Date' : '📅 Applied';
                    const timezone = preferences?.timezoneMode === 'custom' && preferences?.timezone
                      ? preferences.timezone
                      : undefined;
                    const use12Hour = preferences?.use12HourClock ?? false;
                    const dateStr = effectiveDate.toLocaleDateString('en-US', {
                      timeZone: timezone,
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const timeStr = effectiveDate.toLocaleTimeString('en-US', {
                      timeZone: timezone,
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: use12Hour,
                    });
                    return `${dateLabel}: ${dateStr}, ${timeStr}`;
                  })()}
                </Text>
                {app.sourceUrl && (
                  <TouchableOpacity onPress={() => handleOpenLink(app.sourceUrl!)}>
                    <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                      🔗 View Job Posting
                    </Text>
                  </TouchableOpacity>
                )}
                {app.resumeId && (
                  <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                    📄 Resume: {resumes.find(r => r.id === app.resumeId)?.name || 'Unknown'}
                  </Text>
                )}
                {app.coverLetterId && (
                  <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                    ✉️ Cover Letter: {coverLetters.find(cl => cl.id === app.coverLetterId)?.name || 'Unknown'}
                  </Text>
                )}
                {app.status === 'rejected' && app.rejectedReason && (
                  <View style={[styles.rejectionReasonContainer, { backgroundColor: colorScheme.colors.background, borderLeftColor: '#d32f2f', borderColor: colorScheme.colors.border }]}>
                    <Text style={[styles.rejectionReasonLabel, { color: colorScheme.colors.text }]}>
                      Rejection Reason:
                    </Text>
                    <Text style={[styles.rejectionReasonText, { color: colorScheme.colors.textSecondary }]}>
                      {app.rejectedReason}
                    </Text>
                  </View>
                )}
                {app.notes && (
                  <Text style={[styles.notesText, { color: colorScheme.colors.textSecondary }]}>
                    Notes: {app.notes}
                  </Text>
                )}
                {/* Sent Emails History */}
                {app.sentEmails && app.sentEmails.length > 0 && (
                  <View style={styles.sentEmailsContainer}>
                    <Text style={[styles.sentEmailsLabel, { color: colorScheme.colors.text }]}>
                      Sent Emails:
                    </Text>
                    {app.sentEmails.map((sentEmail, index) => {
                      const sentDate = new Date(sentEmail.sentDate);
                      const emailTypeLabels: Record<string, string> = {
                        'thank-you': '✉️ Thank You',
                        'follow-up': '📧 Follow-Up',
                        'decline-offer': '🙏 Decline Offer',
                        'acceptance': '✅ Accept Offer',
                        'rejection-response': '📝 Rejection Response',
                      };
                      return (
                        <View key={index} style={[styles.sentEmailItem, { backgroundColor: colorScheme.colors.background, borderColor: colorScheme.colors.border }]}>
                          <Text style={[styles.sentEmailText, { color: colorScheme.colors.text }]}>
                            {emailTypeLabels[sentEmail.type]} - {sentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {sentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </Text>
                          {sentEmail.recipientEmail && (
                            <Text style={[styles.sentEmailDetail, { color: colorScheme.colors.textSecondary }]}>
                              To: {sentEmail.recipientEmail}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
                {/* Follow-up Reminders */}
                {(() => {
                  // Filter reminders: exclude application follow-ups if status is rejected
                  const appReminders = followUpReminders.filter(r => {
                    if (r.applicationId !== app.id || r.completed) return false;
                    // Don't show application follow-up reminders if the application is rejected
                    if (app.status === 'rejected' && r.type === 'application') return false;
                    return true;
                  });
                  if (appReminders.length > 0) {
                    return (
                      <View style={styles.followUpRemindersContainer}>
                        <Text style={[styles.followUpRemindersLabel, { color: colorScheme.colors.text }]}>
                          Follow-Up Reminders:
                        </Text>
                        {appReminders.map((reminder) => {
                          const dueDate = new Date(reminder.dueDate);
                          const now = new Date();
                          const isOverdue = dueDate < now;
                          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <TouchableOpacity
                              key={reminder.id}
                              style={[
                                styles.followUpReminderItem,
                                isOverdue && styles.followUpReminderOverdue,
                                { backgroundColor: isOverdue ? '#ffebee' : colorScheme.colors.background }
                              ]}
                              onPress={() => {
                                Alert.alert(
                                  reminder.type === 'application' ? 'Application Follow-Up' : 'Interview Follow-Up',
                                  reminder.type === 'application'
                                    ? `Follow up with ${reminder.company} to check if the ${reminder.positionTitle} position is still open.`
                                    : `Follow up with ${reminder.company} about next steps for the ${reminder.positionTitle} position.`,
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                      text: 'Mark as Completed (Today)',
                                      onPress: () => handleMarkFollowUpCompleted(reminder.id),
                                    },
                                    {
                                      text: 'Mark as Completed (Select Date)',
                                      onPress: () => handleSelectCompletionDate(reminder.id),
                                    },
                                    {
                                      text: 'Complete & Create Next',
                                      onPress: () => handleCompleteFollowUp(reminder.id),
                                    },
                                  ]
                                );
                              }}
                            >
                              <Text style={[styles.followUpReminderText, { color: isOverdue ? '#d32f2f' : colorScheme.colors.text }]}>
                                {reminder.type === 'application' ? '📋' : '💼'} {reminder.type === 'application' ? 'Application' : 'Interview'} Follow-Up
                                {isOverdue ? ` (Overdue ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''})` : ` (Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''})`}
                                {' - '}
                                {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  }
                  return null;
                })()}
                {((app.status === 'interview' || (app.status === 'rejected' && app.eventIds && app.eventIds.length > 0)) && ((app.eventIds && app.eventIds.length > 0) || (app as any).eventId)) && (
                  <View style={styles.interviewEventsContainer}>
                    <Text style={[styles.interviewEventsLabel, { color: colorScheme.colors.text }]}>
                      Interview Events:
                    </Text>
                    {((app.eventIds || ((app as any).eventId ? [(app as any).eventId] : [])) as string[]).map((eventId) => {
                      const event = allEvents.find(e => e.id === eventId);
                      if (!event) return null;
                      const [year, month, day] = event.dateKey.split('-').map(Number);
                      const eventDate = new Date(year, month - 1, day);
                      const formattedDate = eventDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      });
                      const timeDisplay = event.startTime 
                        ? (preferences?.use12HourClock 
                            ? formatTime12Hour(event.startTime)
                            : event.startTime)
                        : '';
      return (
                        <View key={eventId} style={styles.interviewEventItem}>
                          <TouchableOpacity
                            onPress={async () => {
                              if (onSelectDate) {
                                onSelectDate(eventDate);
                              }
                            }}
                            style={{ flex: 1 }}
                          >
                            <Text style={[styles.interviewEventText, { color: colorScheme.colors.text }]}>
                              📅 {formattedDate} {timeDisplay && `at ${timeDisplay}`}
                            </Text>
                            {event.contactName && (
                              <Text style={[styles.interviewEventText, { color: colorScheme.colors.text, marginTop: 4 }]}>
                                👤 {event.contactName}
                              </Text>
                            )}
                            {event.email && (
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  openEmail(event.email!);
                                }}
                                style={{ marginTop: 4 }}
                              >
                                <Text style={[styles.interviewEventText, { color: colorScheme.colors.primary }]}>
                                  ✉️ {event.email}
                                </Text>
                              </TouchableOpacity>
                            )}
            {/* Thank You Note Status and Actions */}
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.interviewEventText, { color: colorScheme.colors.textSecondary }]}>
                Thank You Note: {event.thankYouNoteStatus ? event.thankYouNoteStatus.toUpperCase() : 'PENDING'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={async (e) => {
                    e.stopPropagation();
                    try {
                      const { setEventThankYouStatus } = await import('../utils/events');
                      await setEventThankYouStatus(event.id, 'sent');
                      await loadAllEvents(); // refresh events after update
                    } catch {}
                  }}
                >
                  <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>✔️ Mark as Sent</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async (e) => {
                    e.stopPropagation();
                    try {
                      const { setEventThankYouStatus } = await import('../utils/events');
                      await setEventThankYouStatus(event.id, 'skipped');
                      await loadAllEvents(); // refresh events after update
                    } catch {}
                  }}
                >
                  <Text style={[styles.linkText, { color: colorScheme.colors.textSecondary }]}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setEmailApplication(app);
                    setEmailType('thank-you');
                    // store linked event for modal
                    setEmailLinkedEvent(event);
                    setShowEmailModal(true);
                  }}
                >
                  <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>✉️ Send Thank You</Text>
                </TouchableOpacity>
              </View>
            </View>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleUnlinkEvent(app.id, eventId)}
                            style={styles.unlinkButton}
                          >
                            <Text style={[styles.unlinkButtonText, { color: '#d32f2f' }]}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
                {/* Interview Event Actions - Show for all applications */}
                <View style={styles.eventActionsContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      setCreatingEventForApplication(app);
                      setShowEventModal(true);
                    }}
                  >
                    <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                      ➕ Schedule Interview
                    </Text>
                  </TouchableOpacity>
                  {app.status === 'interview' && (
                    <TouchableOpacity
                      onPress={() => {
                        setLinkingEventForApplication(app);
                        setShowLinkEventModal(true);
                      }}
                    >
                      <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                        🔗 Link to Existing Event
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {onCreateOffer && (
                  <TouchableOpacity
                    onPress={() => onCreateOffer(app.id)}
                  >
                    <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                      🎁 Create Offer
                    </Text>
                  </TouchableOpacity>
                )}
                {onCreateReference && (
                  <TouchableOpacity
                    onPress={() => onCreateReference(app.id)}
                  >
                    <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                      📞 Add Reference
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleAddNote(app)}
                >
                  <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                    📝 Add Note
                  </Text>
                </TouchableOpacity>
                {/* Email Template Actions */}
                {preferences?.enableEmailTemplates !== false && (
                  <View style={styles.emailActionsContainer}>
                    {app.status === 'interview' && (
                      <TouchableOpacity
                        onPress={() => {
                          setEmailApplication(app);
                          setEmailType('thank-you');
                          setShowEmailModal(true);
                        }}
                      >
                        <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                          ✉️ Send Thank You Note
                        </Text>
                      </TouchableOpacity>
                    )}
                    {app.status === 'applied' && (
                      <TouchableOpacity
                        onPress={() => {
                          setEmailApplication(app);
                          setEmailType('follow-up');
                          setShowEmailModal(true);
                        }}
                      >
                        <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                          📧 Send Follow-Up Email
                        </Text>
                      </TouchableOpacity>
                    )}
                    {app.status === 'interview' && (
                      <>
                        <TouchableOpacity
                          onPress={() => {
                            setEmailApplication(app);
                            setEmailType('acceptance');
                            setShowEmailModal(true);
                          }}
                        >
                          <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                            ✅ Accept Offer
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setEmailApplication(app);
                            setEmailType('decline-offer');
                            setShowEmailModal(true);
                          }}
                        >
                          <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                            🙏 Decline Offer (Professional)
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {app.status === 'rejected' && (
                      <TouchableOpacity
                        onPress={() => {
                          setEmailApplication(app);
                          setEmailType('rejection-response');
                          setShowEmailModal(true);
                        }}
                      >
                        <Text style={[styles.linkText, { color: colorScheme.colors.primary }]}>
                          📝 Respond to Rejection
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
      )}
        </>
      )}

      {activeTab === 'resumes' && (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.listContent}>
          {resumes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colorScheme.colors.textSecondary }]}>
                No resumes saved yet.{'\n'}Tap "+ Add" to save a resume file!
              </Text>
              <Text style={[styles.emptyHint, { color: colorScheme.colors.textSecondary }]}>
                Supported formats: PDF, DOC, DOCX
              </Text>
            </View>
          ) : (
            resumes.map((resume) => (
              <View
                key={resume.id}
                style={[styles.documentCard, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
              >
                <View style={styles.documentHeader}>
                  <View style={styles.documentHeaderTop}>
                    <Text style={[styles.documentName, { color: colorScheme.colors.text }]}>
                      {resume.name}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.activeBadge,
                        {
                          backgroundColor: (resume.isActive ?? true) 
                            ? colorScheme.colors.primary + '20' 
                            : colorScheme.colors.textSecondary + '20',
                          borderColor: (resume.isActive ?? true)
                            ? colorScheme.colors.primary
                            : colorScheme.colors.textSecondary,
                        },
                      ]}
                      onPress={() => handleToggleResumeActive(resume)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.activeBadgeText,
                          {
                            color: (resume.isActive ?? true)
                              ? colorScheme.colors.primary
                              : colorScheme.colors.textSecondary,
                          },
                        ]}
                      >
                        {(resume.isActive ?? true) ? '✓ Active' : '○ Inactive'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.documentFileName, { color: colorScheme.colors.textSecondary }]}>
                    {resume.fileName}
                  </Text>
                </View>

                <View style={styles.documentDetails}>
                  <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                    📄 Size: {formatFileSize(resume.size)}
                  </Text>
                  <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                    📅 Saved: {formatDateShort(resume.createdAt)}
                  </Text>
                </View>

                <View style={styles.documentActions}>
                  {resume.mimeType === 'application/pdf' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colorScheme.colors.primary }]}
                      onPress={() => handlePreviewResume(resume)}
                    >
                      <Text style={styles.actionButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                        Preview
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colorScheme.colors.secondary || '#6b5b4f' }]}
                    onPress={() => handleShareResume(resume)}
                  >
                    <Text style={styles.actionButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      Share
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colorScheme.colors.secondary || '#6b5b4f' }]}
                    onPress={() => handleRenameResume(resume)}
                  >
                    <Text style={styles.actionButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      Rename
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteResume(resume)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'coverLetters' && (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.listContent}>
          {coverLetters.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colorScheme.colors.textSecondary }]}>
                No cover letters saved yet.{'\n'}Tap "+ Add" to save a cover letter file!
              </Text>
              <Text style={[styles.emptyHint, { color: colorScheme.colors.textSecondary }]}>
                Supported formats: PDF, DOC, DOCX, TXT
              </Text>
            </View>
          ) : (
            coverLetters.map((coverLetter) => (
              <View
                key={coverLetter.id}
                style={[styles.documentCard, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
              >
                <View style={styles.documentHeader}>
                  <View style={styles.documentHeaderTop}>
                    <View style={styles.nameContainer}>
                      <Text style={[styles.documentName, { color: colorScheme.colors.text }]}>
                        {coverLetter.name}
                      </Text>
                      {coverLetter.isTemplate && (
                        <View style={[styles.templateBadge, { backgroundColor: colorScheme.colors.accent + '30', borderColor: colorScheme.colors.accent }]}>
                          <Text style={[styles.templateBadgeText, { color: colorScheme.colors.accent }]}>
                            Template
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.activeBadge,
                        {
                          backgroundColor: (coverLetter.isActive ?? true) 
                            ? colorScheme.colors.primary + '20' 
                            : colorScheme.colors.textSecondary + '20',
                          borderColor: (coverLetter.isActive ?? true)
                            ? colorScheme.colors.primary
                            : colorScheme.colors.textSecondary,
                        },
                      ]}
                      onPress={() => handleToggleCoverLetterActive(coverLetter)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.activeBadgeText,
                          {
                            color: (coverLetter.isActive ?? true)
                              ? colorScheme.colors.primary
                              : colorScheme.colors.textSecondary,
                          },
                        ]}
                      >
                        {(coverLetter.isActive ?? true) ? '✓ Active' : '○ Inactive'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {coverLetter.company && !coverLetter.isTemplate && (
                    <Text style={[styles.companyText, { color: colorScheme.colors.textSecondary }]}>
                      For: {coverLetter.company}
                    </Text>
                  )}
                  <Text style={[styles.documentFileName, { color: colorScheme.colors.textSecondary }]}>
                    {coverLetter.fileName}
                  </Text>
                </View>

                <View style={styles.documentDetails}>
                  <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                    📄 Size: {formatFileSize(coverLetter.size)}
                  </Text>
                  <Text style={[styles.detailText, { color: colorScheme.colors.textSecondary }]}>
                    📅 Saved: {formatDateShort(coverLetter.createdAt)}
                  </Text>
                </View>

                <View style={styles.documentActions}>
                  {coverLetter.mimeType === 'application/pdf' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colorScheme.colors.primary }]}
                      onPress={() => handlePreviewCoverLetter(coverLetter)}
                    >
                      <Text style={styles.actionButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                        Preview
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colorScheme.colors.secondary || '#6b5b4f' }]}
                    onPress={() => handleShareCoverLetter(coverLetter)}
                  >
                    <Text style={styles.actionButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      Share
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colorScheme.colors.secondary || '#6b5b4f' }]}
                    onPress={() => handleRenameCoverLetter(coverLetter)}
                  >
                    <Text style={styles.actionButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      Rename
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteCoverLetter(coverLetter)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Event Modal for creating interview events */}
      {creatingEventForApplication && (
        <AddEventModal
          visible={showEventModal}
          initialDate={new Date()}
          onClose={() => {
            setShowEventModal(false);
            setCreatingEventForApplication(null);
          }}
          onSave={handleSaveEvent}
          colorScheme={colorScheme.colors}
          use12Hour={preferences?.use12HourClock ?? false}
          initialApplicationData={{
            id: creatingEventForApplication.id,
            company: creatingEventForApplication.company,
            positionTitle: creatingEventForApplication.positionTitle,
          }}
          allowDateSelection={true}
        />
      )}

      {/* Modal for linking to existing events */}
      <Modal
        visible={showLinkEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowLinkEventModal(false);
          setLinkingEventForApplication(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
                Link to Existing Event
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowLinkEventModal(false);
                  setLinkingEventForApplication(null);
                }}
              >
                <Text style={[styles.modalCloseButton, { color: colorScheme.colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {allEvents.length === 0 ? (
                <Text style={[styles.modalEmptyText, { color: colorScheme.colors.textSecondary }]}>
                  No events found. Create an event first.
                </Text>
              ) : (
                allEvents
                  .filter(event => {
                    // Filter out events already linked to this application
                    if (!linkingEventForApplication) return false;
                    const linkedEventIds = linkingEventForApplication.eventIds || [];
                    return !linkedEventIds.includes(event.id);
                  })
                  .map((event) => {
                    const [year, month, day] = event.dateKey.split('-').map(Number);
                    const eventDate = new Date(year, month - 1, day);
                    const formattedDate = eventDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const timeDisplay = event.startTime
                      ? preferences?.use12HourClock
                        ? formatTime12Hour(event.startTime)
                        : event.startTime
                      : '';
                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={[styles.eventLinkItem, { borderColor: colorScheme.colors.border }]}
                        onPress={() => {
                          if (linkingEventForApplication) {
                            handleLinkToExistingEvent(linkingEventForApplication.id, event.id);
                          }
                        }}
                      >
                        <Text style={[styles.eventLinkTitle, { color: colorScheme.colors.text }]}>
                          {event.title}
                        </Text>
                        <Text style={[styles.eventLinkDetails, { color: colorScheme.colors.textSecondary }]}>
                          📅 {formattedDate} {timeDisplay && `at ${timeDisplay}`}
                          {event.company && ` • ${event.company}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Resume Preview Modal */}
      <Modal
        visible={previewResume !== null}
        animationType="slide"
        onRequestClose={() => {
          setPreviewResume(null);
          setPreviewResumeUri('');
        }}
      >
        <View style={styles.previewContainer}>
          <View style={[styles.previewHeader, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
            <TouchableOpacity
              onPress={() => {
                setPreviewResume(null);
                setPreviewResumeUri('');
              }}
              style={styles.previewCloseButton}
            >
              <Text style={[styles.previewCloseText, { color: colorScheme.colors.primary }]}>← Close</Text>
            </TouchableOpacity>
            <Text style={[styles.previewTitle, { color: colorScheme.colors.text }]} numberOfLines={1}>
              {previewResume?.name || 'Preview'}
            </Text>
            {previewResume && (
              <View style={styles.previewActions}>
                <TouchableOpacity
                  onPress={() => handlePrintResume(previewResume)}
                  style={[styles.previewActionButton, { backgroundColor: colorScheme.colors.primary }]}
                >
                  <Text style={styles.previewActionText}>🖨️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleShareFromPreviewResume(previewResume)}
                  style={[styles.previewActionButton, { backgroundColor: colorScheme.colors.primary }]}
                >
                  <Text style={styles.previewActionText}>📤</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {previewResumeUri ? (
            <WebView
              source={{ html: previewResumeUri }}
              style={styles.previewWebView}
              startInLoadingState
              scalesPageToFit
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          ) : (
            <View style={styles.previewLoadingContainer}>
              <Text style={{ color: colorScheme.colors.text }}>Loading preview...</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Cover Letter Preview Modal */}
      <Modal
        visible={previewCoverLetter !== null}
        animationType="slide"
        onRequestClose={() => {
          setPreviewCoverLetter(null);
          setPreviewCoverLetterUri('');
        }}
      >
        <View style={styles.previewContainer}>
          <View style={[styles.previewHeader, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
            <TouchableOpacity
              onPress={() => {
                setPreviewCoverLetter(null);
                setPreviewCoverLetterUri('');
              }}
              style={styles.previewCloseButton}
            >
              <Text style={[styles.previewCloseText, { color: colorScheme.colors.primary }]}>← Close</Text>
            </TouchableOpacity>
            <Text style={[styles.previewTitle, { color: colorScheme.colors.text }]} numberOfLines={1}>
              {previewCoverLetter?.name || 'Preview'}
            </Text>
            {previewCoverLetter && (
              <View style={styles.previewActions}>
                <TouchableOpacity
                  onPress={() => handlePrintCoverLetter(previewCoverLetter)}
                  style={[styles.previewActionButton, { backgroundColor: colorScheme.colors.primary }]}
                >
                  <Text style={styles.previewActionText}>🖨️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleShareFromPreviewCoverLetter(previewCoverLetter)}
                  style={[styles.previewActionButton, { backgroundColor: colorScheme.colors.primary }]}
                >
                  <Text style={styles.previewActionText}>📤</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {previewCoverLetterUri ? (
            <WebView
              source={{ html: previewCoverLetterUri }}
              style={styles.previewWebView}
              startInLoadingState
              scalesPageToFit
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          ) : (
            <View style={styles.previewLoadingContainer}>
              <Text style={{ color: colorScheme.colors.text }}>Loading preview...</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Resume Rename Modal */}
      <Modal
        visible={editingResumeName !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingResumeName(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
              Rename Resume
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colorScheme.colors.background, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={newResumeName}
              onChangeText={setNewResumeName}
              placeholder="Enter new name"
              placeholderTextColor={colorScheme.colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colorScheme.colors.background, borderColor: colorScheme.colors.border }]}
                onPress={() => {
                  setEditingResumeName(null);
                  setNewResumeName('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colorScheme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colorScheme.colors.primary }]}
                onPress={saveRenameResume}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cover Letter Rename Modal */}
      <Modal
        visible={editingCoverLetterName !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingCoverLetterName(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
              Rename Cover Letter
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colorScheme.colors.background, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
              value={newCoverLetterName}
              onChangeText={setNewCoverLetterName}
              placeholder="Enter new name"
              placeholderTextColor={colorScheme.colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colorScheme.colors.background, borderColor: colorScheme.colors.border }]}
                onPress={() => {
                  setEditingCoverLetterName(null);
                  setNewCoverLetterName('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colorScheme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colorScheme.colors.primary }]}
                onPress={saveRenameCoverLetter}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Cover Letter Modal */}
      <Modal
        visible={showAddCoverLetterModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddCoverLetterModal(false);
          setNewCompany('');
          setIsTemplate(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
              Add Cover Letter
            </Text>
            <Text style={[styles.modalSubtitle, { color: colorScheme.colors.textSecondary }]}>
              Is this a template or customized for a company?
            </Text>
            
            <TouchableOpacity
              style={[
                styles.optionButton,
                { 
                  backgroundColor: isTemplate ? colorScheme.colors.primary + '20' : colorScheme.colors.background,
                  borderColor: isTemplate ? colorScheme.colors.primary : colorScheme.colors.border,
                }
              ]}
              onPress={() => {
                setIsTemplate(true);
                setNewCompany('');
              }}
            >
              <Text style={[styles.optionButtonText, { color: colorScheme.colors.text }]}>
                Template (Generic, reusable)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                { 
                  backgroundColor: !isTemplate ? colorScheme.colors.primary + '20' : colorScheme.colors.background,
                  borderColor: !isTemplate ? colorScheme.colors.primary : colorScheme.colors.border,
                }
              ]}
              onPress={() => setIsTemplate(false)}
            >
              <Text style={[styles.optionButtonText, { color: colorScheme.colors.text }]}>
                For Specific Company
              </Text>
            </TouchableOpacity>

            {!isTemplate && (
              <TextInput
                style={[styles.modalInput, { backgroundColor: colorScheme.colors.background, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                value={newCompany}
                onChangeText={setNewCompany}
                placeholder="Company name (optional)"
                placeholderTextColor={colorScheme.colors.textSecondary}
                autoCapitalize="words"
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colorScheme.colors.background, borderColor: colorScheme.colors.border }]}
                onPress={() => {
                  setShowAddCoverLetterModal(false);
                  setNewCompany('');
                  setIsTemplate(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colorScheme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colorScheme.colors.primary }]}
                onPress={handlePickCoverLetter}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Pick File</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Template Modal */}
      {emailApplication && (
        <EmailTemplateModal
          visible={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setEmailApplication(null);
            setEmailLinkedEvent(null);
          }}
          application={emailApplication}
          emailType={emailType}
          linkedEvent={
            emailLinkedEvent
              ? emailLinkedEvent
              : (emailApplication.eventIds && emailApplication.eventIds.length > 0
                  ? allEvents.find(e => e.id === emailApplication.eventIds![0] && e.type === 'interview')
                  : undefined)
          }
          onEmailSent={() => {
            loadApplications(); // Reload to show updated email tracking
            loadAllEvents();
          }}
        />
      )}
      {/* Add Note Modal */}
      <Modal
        visible={showAddNoteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowAddNoteModal(false);
          setAddNoteApplication(null);
          setNewNoteText('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colorScheme.colors.border, flexDirection: 'column', alignItems: 'flex-start' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
                  Add Note
                </Text>
                {addNoteApplication && (
                  <Text style={[styles.modalSubtitle, { color: colorScheme.colors.textSecondary, marginTop: 4 }]}>
                    {addNoteApplication.company} - {addNoteApplication.positionTitle}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>
                Note
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colorScheme.colors.background,
                    borderColor: colorScheme.colors.border,
                    color: colorScheme.colors.text,
                  }
                ]}
                value={newNoteText}
                onChangeText={setNewNoteText}
                placeholder="Enter your note..."
                placeholderTextColor={colorScheme.colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
            </View>
            <View style={[styles.modalFooter, { borderTopColor: colorScheme.colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colorScheme.colors.border }]}
                onPress={() => {
                  setShowAddNoteModal(false);
                  setAddNoteApplication(null);
                  setNewNoteText('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colorScheme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colorScheme.colors.primary }]}
                onPress={handleSaveNote}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Add Note
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Completion Date Picker Modal */}
      <Modal
        visible={showCompletionDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowCompletionDatePicker(false);
          setCompletionDateReminderId(null);
          setCompletionDateInput('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colorScheme.colors.border, flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
                Select Completion Date
              </Text>
              <Text style={[styles.modalSubtitle, { color: colorScheme.colors.textSecondary, marginTop: 4 }]}>
                When was this follow-up completed?
              </Text>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: colorScheme.colors.text }]}>
                Date (YYYY-MM-DD or MM/DD/YYYY)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colorScheme.colors.background,
                    borderColor: colorScheme.colors.border,
                    color: colorScheme.colors.text,
                  }
                ]}
                value={completionDateInput}
                onChangeText={(text) => {
                  setCompletionDateInput(text);
                  // Try to parse and update the date preview as user types
                  const dateMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/) || text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                  if (dateMatch) {
                    let year, month, day;
                    if (dateMatch[0].includes('/')) {
                      // MM/DD/YYYY format
                      month = parseInt(dateMatch[1], 10) - 1;
                      day = parseInt(dateMatch[2], 10);
                      year = parseInt(dateMatch[3], 10);
                    } else {
                      // YYYY-MM-DD format
                      year = parseInt(dateMatch[1], 10);
                      month = parseInt(dateMatch[2], 10) - 1;
                      day = parseInt(dateMatch[3], 10);
                    }
                    const newDate = new Date(year, month, day);
                    if (!isNaN(newDate.getTime())) {
                      setSelectedCompletionDate(newDate);
                    }
                  }
                }}
                placeholder="YYYY-MM-DD or MM/DD/YYYY"
                placeholderTextColor={colorScheme.colors.textSecondary}
                keyboardType="numeric"
                autoFocus
              />
              <Text style={[styles.hint, { color: colorScheme.colors.textSecondary, marginTop: 8 }]}>
                {(() => {
                  const dateMatch = completionDateInput.match(/(\d{4})-(\d{2})-(\d{2})/) || completionDateInput.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                  if (dateMatch) {
                    let year, month, day;
                    if (dateMatch[0].includes('/')) {
                      month = parseInt(dateMatch[1], 10) - 1;
                      day = parseInt(dateMatch[2], 10);
                      year = parseInt(dateMatch[3], 10);
                    } else {
                      year = parseInt(dateMatch[1], 10);
                      month = parseInt(dateMatch[2], 10) - 1;
                      day = parseInt(dateMatch[3], 10);
                    }
                    const parsedDate = new Date(year, month, day);
                    if (!isNaN(parsedDate.getTime())) {
                      return `Selected: ${parsedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                    }
                  }
                  return 'Enter date in YYYY-MM-DD or MM/DD/YYYY format';
                })()}
              </Text>
            </View>
            <View style={[styles.modalFooter, { borderTopColor: colorScheme.colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colorScheme.colors.border }]}
                onPress={() => {
                  setShowCompletionDatePicker(false);
                  setCompletionDateReminderId(null);
                  setCompletionDateInput('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colorScheme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colorScheme.colors.primary }]}
                onPress={handleConfirmCompletionDate}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Mark as Completed
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Time Picker Modal Component
interface TimePickerModalProps {
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

const TimePickerModal = ({
  hour,
  minute,
  period,
  use12Hour,
  colorScheme,
  onSelect,
  onClose,
}: TimePickerModalProps) => {
  const [selectedHour, setSelectedHour] = useState(hour);
  const [selectedMinute, setSelectedMinute] = useState(minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM' | null>(period || 'AM');

  const hours = use12Hour 
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods: ('AM' | 'PM')[] = ['AM', 'PM'];

  const handleConfirm = () => {
    onSelect(selectedHour, selectedMinute, selectedPeriod);
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={[styles.modalContent, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border }]}>
          <View style={styles.timePickerRow}>
            <View style={styles.timePickerColumn}>
              <Text style={[styles.timePickerLabel, { color: colorScheme.text }]}>Hour</Text>
              <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                {hours.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.timePickerItem,
                      selectedHour === h && { backgroundColor: colorScheme.primary },
                    ]}
                    onPress={() => setSelectedHour(h)}
                  >
                    <Text
                      style={[
                        styles.timePickerItemText,
                        { color: selectedHour === h ? colorScheme.background : colorScheme.text },
                      ]}
                    >
                      {String(h).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.timePickerColumn}>
              <Text style={[styles.timePickerLabel, { color: colorScheme.text }]}>Minute</Text>
              <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                {minutes.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.timePickerItem,
                      selectedMinute === m && { backgroundColor: colorScheme.primary },
                    ]}
                    onPress={() => setSelectedMinute(m)}
                  >
                    <Text
                      style={[
                        styles.timePickerItemText,
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
              <View style={styles.timePickerColumn}>
                <Text style={[styles.timePickerLabel, { color: colorScheme.text }]}>Period</Text>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {periods.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.timePickerItem,
                        selectedPeriod === p && { backgroundColor: colorScheme.primary },
                      ]}
                      onPress={() => setSelectedPeriod(p)}
                    >
                      <Text
                        style={[
                          styles.timePickerItemText,
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

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { borderColor: colorScheme.border }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: colorScheme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colorScheme.primary }]}
              onPress={handleConfirm}
            >
              <Text style={[styles.modalButtonText, { color: '#fff' }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
    minHeight: 80,
  },
  backButton: {
    width: 80,
    alignItems: 'flex-start',
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
    textAlign: 'center',
  },
  addButton: {
    width: 80,
    alignItems: 'flex-end',
  },
  addButtonText: {
    fontSize: 16,
    color: '#8C6A4A',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
    includeFontPadding: false,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    includeFontPadding: false,
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
  weekFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  weekFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  weekFilterScroll: {
    flex: 1,
  },
  weekFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekFilterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
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
  rejectionReasonContainer: {
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
  },
  rejectionReasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  rejectionReasonText: {
    fontSize: 14,
    lineHeight: 20,
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
  interviewEventsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  interviewEventsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  interviewEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  unlinkButton: {
    marginLeft: 8,
    padding: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unlinkButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventActionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  emailActionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  interviewEventText: {
    fontSize: 14,
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
  createOfferButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createOfferButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerButton: {
    backgroundColor: '#E7D7C1',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C9A66B',
  },
  pickerButtonText: {
    fontSize: 16,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerButton: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
  },
  timePickerButton: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  timePickerText: {
    fontSize: 16,
    color: '#4A3A2A',
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  timePickerScroll: {
    maxHeight: 200,
    width: '100%',
  },
  timePickerItem: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
  },
  timePickerItemText: {
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    backgroundColor: '#E7D7C1',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  documentCard: {
    backgroundColor: '#E7D7C1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C9A66B',
  },
  documentHeader: {
    marginBottom: 12,
  },
  documentHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  documentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A3A2A',
    marginRight: 8,
  },
  templateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  templateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  companyText: {
    fontSize: 14,
    color: '#6b5b4f',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  documentFileName: {
    fontSize: 14,
    color: '#6b5b4f',
  },
  documentDetails: {
    marginBottom: 12,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 6,
  },
  emptyHint: {
    fontSize: 14,
    color: '#6b5b4f',
    textAlign: 'center',
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b5b4f',
    marginBottom: 16,
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 12,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#f5f5dc',
  },
  previewHeader: {
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewCloseButton: {
    padding: 8,
    minWidth: 60,
  },
  previewCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8C6A4A',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A3A2A',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  previewWebView: {
    flex: 1,
  },
  previewLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 120,
    justifyContent: 'flex-end',
  },
  previewActionButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewActionText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  modalContentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  modalContent: {
    backgroundColor: '#E7D7C1',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: '80%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3A2A',
  },
  modalInput: {
    backgroundColor: '#f5f5dc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#4A3A2A',
    borderWidth: 1,
    borderColor: '#C9A66B',
    marginBottom: 16,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingTop: 4,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 40,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sentEmailsContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  sentEmailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  sentEmailItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  sentEmailText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  sentEmailDetail: {
    fontSize: 12,
  },
  followUpRemindersContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  followUpRemindersLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  followUpReminderItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#C9A66B',
  },
  followUpReminderOverdue: {
    borderColor: '#d32f2f',
    borderWidth: 2,
  },
  followUpReminderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Interview Prep Styles
  interviewPrepMenu: {
    padding: 16,
  },
  interviewPrepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  interviewPrepSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  interviewPrepMenuItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  interviewPrepMenuItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  interviewPrepMenuItemDesc: {
    fontSize: 14,
  },
  interviewPrepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  interviewPrepSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  categoryFilter: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionsList: {
    padding: 16,
  },
  questionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  questionCategory: {
    fontSize: 12,
  },
  starCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
  },
  starQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  starSections: {
    gap: 8,
  },
  starLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  starValue: {
    fontSize: 14,
    marginLeft: 8,
  },
  researchCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
  },
  researchCompany: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  researchPosition: {
    fontSize: 14,
    marginBottom: 12,
  },
  researchNotes: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
  },
  researchLinks: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  researchLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
  },
  feedbackCompany: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  feedbackPosition: {
    fontSize: 14,
    marginBottom: 4,
  },
  feedbackDate: {
    fontSize: 12,
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  feedbackValue: {
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 8,
  },
  practiceSetup: {
    padding: 16,
  },
  practiceInstructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  practiceActive: {
    padding: 16,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  modalButtonPrimary: {
    borderWidth: 0,
  },
  modalCloseButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalEmptyText: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  eventLinkItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  eventLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventLinkDetails: {
    fontSize: 14,
  },
  practiceQuestionCard: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    minHeight: 150,
    justifyContent: 'center',
  },
  practiceQuestionText: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  practiceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  practiceButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  practiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  kanbanScrollView: {
    flex: 1,
  },
  kanbanContent: {
    paddingHorizontal: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  kanbanColumn: {
    width: 280,
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: '90%',
    flexDirection: 'column',
    flexShrink: 0,
  },
  kanbanColumnHeader: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kanbanColumnTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  kanbanColumnCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  kanbanColumnContent: {
    flex: 1,
  },
  kanbanColumnContentContainer: {
    padding: 8,
  },
  kanbanEmptyColumn: {
    padding: 20,
    alignItems: 'center',
  },
  kanbanEmptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  kanbanCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    minHeight: 100,
  },
  kanbanCardCompany: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  kanbanCardTitle: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  kanbanCardDate: {
    fontSize: 12,
    marginTop: 'auto',
  },
  kanbanMoreIndicator: {
    padding: 8,
    alignItems: 'center',
  },
  kanbanMoreText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  columnSelectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnSelectorContainer: {
    minWidth: 220,
    maxWidth: 280,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  columnSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  columnSelectorSubtitle: {
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  columnSelectorDivider: {
    height: 1,
    marginVertical: 8,
  },
  columnSelectorSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  columnSelectorOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
  },
  columnSelectorOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  columnSelectorCancel: {
    padding: 12,
    borderTopWidth: 1,
    marginTop: 8,
    alignItems: 'center',
  },
  columnSelectorCancelText: {
    fontSize: 14,
  },
});


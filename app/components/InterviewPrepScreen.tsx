import React, { useState, useEffect, useRef } from 'react';
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
  StatusBar,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import {
  InterviewQuestion,
  STARResponse,
  CompanyResearch,
  InterviewFeedback,
  getAllQuestions,
  getQuestionsByCategory,
  getAllSTARResponses,
  saveSTARResponse,
  deleteSTARResponse,
  getAllCompanyResearch,
  saveCompanyResearch,
  deleteCompanyResearch,
  getAllInterviewFeedback,
  saveInterviewFeedback,
  deleteInterviewFeedback,
} from '../utils/interviewPrep';
import { getAllApplications, JobApplication } from '../utils/applications';

interface InterviewPrepScreenProps {
  onBack: () => void;
  initialCompanyName?: string;
  initialApplicationId?: string;
  onNavigateToApplication?: (applicationId: string) => void;
}

export default function InterviewPrepScreen({ onBack, initialCompanyName, initialApplicationId, onNavigateToApplication }: InterviewPrepScreenProps) {
  const { colorScheme } = usePreferences();
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

  const [interviewPrepView, setInterviewPrepView] = useState<'menu' | 'questions' | 'star' | 'research' | 'feedback' | 'practice'>('menu');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [starResponses, setStarResponses] = useState<STARResponse[]>([]);
  const [companyResearch, setCompanyResearch] = useState<CompanyResearch[]>([]);
  const [interviewFeedback, setInterviewFeedback] = useState<InterviewFeedback[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [practiceTimer, setPracticeTimer] = useState<number>(0);
  const [isPracticeModeActive, setIsPracticeModeActive] = useState<boolean>(false);
  const [currentPracticeQuestion, setCurrentPracticeQuestion] = useState<InterviewQuestion | null>(null);
  const practiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // STAR form state
  const [showSTARForm, setShowSTARForm] = useState<boolean>(false);
  const [editingSTAR, setEditingSTAR] = useState<STARResponse | null>(null);
  const [starQuestion, setStarQuestion] = useState<string>('');
  const [starSituation, setStarSituation] = useState<string>('');
  const [starTask, setStarTask] = useState<string>('');
  const [starAction, setStarAction] = useState<string>('');
  const [starResult, setStarResult] = useState<string>('');
  const [showQuestionDropdown, setShowQuestionDropdown] = useState<boolean>(false);
  
  // Company Research form state
  const [showResearchForm, setShowResearchForm] = useState<boolean>(false);
  const [editingResearch, setEditingResearch] = useState<CompanyResearch | null>(null);
  const [researchCompanyName, setResearchCompanyName] = useState<string>('');
  const [researchPositionTitle, setResearchPositionTitle] = useState<string>('');
  const [researchNotes, setResearchNotes] = useState<string>('');
  const [researchWebsite, setResearchWebsite] = useState<string>('');
  const [researchLinkedIn, setResearchLinkedIn] = useState<string>('');
  const [researchGlassdoor, setResearchGlassdoor] = useState<string>('');
  const [selectedApplicationsForResearch, setSelectedApplicationsForResearch] = useState<string[]>([]);
  const [showApplicationSelector, setShowApplicationSelector] = useState<boolean>(false);
  const [hasAutoPopulated, setHasAutoPopulated] = useState<boolean>(false);
  
  // Interview Feedback form state
  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false);
  const [editingFeedback, setEditingFeedback] = useState<InterviewFeedback | null>(null);
  const [feedbackCompanyName, setFeedbackCompanyName] = useState<string>('');
  const [feedbackPositionTitle, setFeedbackPositionTitle] = useState<string>('');
  const [feedbackInterviewDate, setFeedbackInterviewDate] = useState<Date>(new Date());
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackStrengths, setFeedbackStrengths] = useState<string>('');
  const [feedbackAreasForImprovement, setFeedbackAreasForImprovement] = useState<string>('');
  const [selectedApplicationForFeedback, setSelectedApplicationForFeedback] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadInterviewPrepData();
    loadApplications();
  }, []);

  // Auto-navigate to research view if company name is provided
  useEffect(() => {
    if (initialCompanyName && initialApplicationId) {
      // Wait for data to load before checking
      if (applications.length === 0 || companyResearch === undefined) {
        return;
      }
      
      // Check if research already exists for this company/application
      const existingResearch = companyResearch.find(
        r => r.companyName.toLowerCase() === initialCompanyName.toLowerCase() && r.applicationId === initialApplicationId
      );
      
      if (existingResearch) {
        // Navigate to research view and show existing research
        setInterviewPrepView('research');
      } else {
        // Navigate to research view and pre-fill form
        setInterviewPrepView('research');
        setResearchCompanyName(initialCompanyName);
        setSelectedApplicationsForResearch([initialApplicationId]);
        // Find the application to get position title
        const app = applications.find(a => a.id === initialApplicationId);
        if (app) {
          setResearchPositionTitle(app.positionTitle);
        }
        setShowResearchForm(true);
      }
    }
  }, [initialCompanyName, initialApplicationId, applications, companyResearch]);

  // Auto-populate company URLs when company name is entered
  useEffect(() => {
    if (showResearchForm && researchCompanyName.trim() && !editingResearch && !hasAutoPopulated) {
      // Only auto-populate once when company name is first entered and fields are empty
      const companySlug = researchCompanyName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const companyDomain = companySlug.replace(/-/g, '');
      
      // Only populate if fields are currently empty
      if (!researchLinkedIn.trim() && !researchGlassdoor.trim() && !researchWebsite.trim() && companySlug) {
        // Auto-populate LinkedIn URL
        setResearchLinkedIn(`https://www.linkedin.com/company/${companySlug}`);
        
        // Auto-populate Glassdoor URL (search URL format)
        setResearchGlassdoor(`https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(researchCompanyName.trim())}`);
        
        // Auto-populate website URL (simple .com guess)
        if (companyDomain) {
          setResearchWebsite(`https://www.${companyDomain}.com`);
        }
        
        setHasAutoPopulated(true);
      }
    }
  }, [researchCompanyName, showResearchForm, editingResearch, hasAutoPopulated, researchLinkedIn, researchGlassdoor, researchWebsite]);

  useEffect(() => {
    if (interviewPrepView !== 'practice') {
      // Clean up practice mode when leaving practice view
      setIsPracticeModeActive(false);
      setPracticeTimer(0);
      setCurrentPracticeQuestion(null);
      if (practiceTimerRef.current) {
        clearInterval(practiceTimerRef.current);
        practiceTimerRef.current = null;
      }
    }
  }, [interviewPrepView]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (practiceTimerRef.current) {
        clearInterval(practiceTimerRef.current);
      }
    };
  }, []);

  const loadInterviewPrepData = async () => {
    try {
      const [allQuestions, allSTAR, allResearch, allFeedback] = await Promise.all([
        getAllQuestions(),
        getAllSTARResponses(),
        getAllCompanyResearch(),
        getAllInterviewFeedback(),
      ]);
      setQuestions(allQuestions);
      setStarResponses(allSTAR);
      setCompanyResearch(allResearch);
      setInterviewFeedback(allFeedback);
    } catch (error) {
      console.error('Error loading interview prep data:', error);
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

  const resetSTARForm = () => {
    setStarQuestion('');
    setStarSituation('');
    setStarTask('');
    setStarAction('');
    setStarResult('');
    setEditingSTAR(null);
    setShowSTARForm(false);
    setShowQuestionDropdown(false);
  };

  const handleEditSTAR = (star: STARResponse) => {
    setEditingSTAR(star);
    setStarQuestion(star.question);
    setStarSituation(star.situation);
    setStarTask(star.task);
    setStarAction(star.action);
    setStarResult(star.result);
    setShowSTARForm(true);
  };

  const handleSaveSTAR = async () => {
    if (!starQuestion.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    try {
      const starResponse: STARResponse = {
        id: editingSTAR?.id || '',
        question: starQuestion.trim(),
        situation: starSituation.trim(),
        task: starTask.trim(),
        action: starAction.trim(),
        result: starResult.trim(),
        createdAt: editingSTAR?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveSTARResponse(starResponse);
      await loadInterviewPrepData();
      resetSTARForm();
      Alert.alert('Success', editingSTAR ? 'STAR response updated' : 'STAR response saved');
    } catch (error) {
      console.error('Error saving STAR response:', error);
      Alert.alert('Error', 'Failed to save STAR response');
    }
  };

  const handleDeleteSTAR = (star: STARResponse) => {
    Alert.alert(
      'Delete STAR Response',
      `Are you sure you want to delete this STAR response?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSTARResponse(star.id);
              await loadInterviewPrepData();
              Alert.alert('Success', 'STAR response deleted');
            } catch (error) {
              console.error('Error deleting STAR response:', error);
              Alert.alert('Error', 'Failed to delete STAR response');
            }
          },
        },
      ]
    );
  };

  // Company Research handlers
  const resetResearchForm = () => {
    setResearchCompanyName('');
    setResearchPositionTitle('');
    setResearchNotes('');
    setResearchWebsite('');
    setResearchLinkedIn('');
    setResearchGlassdoor('');
    setSelectedApplicationsForResearch([]);
    setEditingResearch(null);
    setShowResearchForm(false);
    setHasAutoPopulated(false);
  };

  const handleEditResearch = (research: CompanyResearch) => {
    setEditingResearch(research);
    setResearchCompanyName(research.companyName);
    setResearchPositionTitle(research.positionTitle || '');
    setResearchNotes(research.researchNotes);
    setResearchWebsite(research.website || '');
    setResearchLinkedIn(research.linkedinUrl || '');
    setResearchGlassdoor(research.glassdoorUrl || '');
    setSelectedApplicationsForResearch(research.applicationIds || []);
    setHasAutoPopulated(true); // Prevent auto-population when editing
    setShowResearchForm(true);
  };

  const handleSaveResearch = async () => {
    if (!researchCompanyName.trim()) {
      Alert.alert('Error', 'Please enter a company name');
      return;
    }
    if (selectedApplicationsForResearch.length === 0) {
      Alert.alert('Error', 'Please select at least one job application');
      return;
    }

    try {
      const research: CompanyResearch = {
        id: editingResearch?.id || '',
        applicationIds: selectedApplicationsForResearch,
        companyName: researchCompanyName.trim(),
        positionTitle: researchPositionTitle.trim(),
        researchNotes: researchNotes.trim(),
        website: researchWebsite.trim() || undefined,
        linkedinUrl: researchLinkedIn.trim() || undefined,
        glassdoorUrl: researchGlassdoor.trim() || undefined,
        createdAt: editingResearch?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveCompanyResearch(research);
      await loadInterviewPrepData();
      resetResearchForm();
      Alert.alert('Success', editingResearch ? 'Company research updated' : 'Company research saved');
    } catch (error) {
      console.error('Error saving company research:', error);
      Alert.alert('Error', 'Failed to save company research');
    }
  };

  const handleDeleteResearch = (research: CompanyResearch) => {
    Alert.alert(
      'Delete Company Research',
      `Are you sure you want to delete this company research?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCompanyResearch(research.id);
              await loadInterviewPrepData();
              Alert.alert('Success', 'Company research deleted');
            } catch (error) {
              console.error('Error deleting company research:', error);
              Alert.alert('Error', 'Failed to delete company research');
            }
          },
        },
      ]
    );
  };

  // Interview Feedback handlers
  const resetFeedbackForm = () => {
    setFeedbackCompanyName('');
    setFeedbackPositionTitle('');
    setFeedbackInterviewDate(new Date());
    setFeedbackText('');
    setFeedbackStrengths('');
    setFeedbackAreasForImprovement('');
    setSelectedApplicationForFeedback(undefined);
    setEditingFeedback(null);
    setShowFeedbackForm(false);
  };

  const handleEditFeedback = (feedback: InterviewFeedback) => {
    setEditingFeedback(feedback);
    setFeedbackCompanyName(feedback.companyName);
    setFeedbackPositionTitle(feedback.positionTitle || '');
    setFeedbackInterviewDate(new Date(feedback.interviewDate));
    setFeedbackText(feedback.feedback);
    setFeedbackStrengths(feedback.strengths || '');
    setFeedbackAreasForImprovement(feedback.areasForImprovement || '');
    setSelectedApplicationForFeedback(feedback.applicationId);
    setShowFeedbackForm(true);
  };

  const handleSaveFeedback = async () => {
    if (!feedbackCompanyName.trim()) {
      Alert.alert('Error', 'Please enter a company name');
      return;
    }
    if (!selectedApplicationForFeedback) {
      Alert.alert('Error', 'Please select a job application');
      return;
    }
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter feedback');
      return;
    }

    try {
      const feedback: InterviewFeedback = {
        id: editingFeedback?.id || '',
        applicationId: selectedApplicationForFeedback!,
        companyName: feedbackCompanyName.trim(),
        positionTitle: feedbackPositionTitle.trim() || '',
        interviewDate: feedbackInterviewDate.toISOString(),
        feedback: feedbackText.trim(),
        strengths: feedbackStrengths.trim() || undefined,
        areasForImprovement: feedbackAreasForImprovement.trim() || undefined,
        createdAt: editingFeedback?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveInterviewFeedback(feedback);
      await loadInterviewPrepData();
      resetFeedbackForm();
      Alert.alert('Success', editingFeedback ? 'Interview feedback updated' : 'Interview feedback saved');
    } catch (error) {
      console.error('Error saving interview feedback:', error);
      Alert.alert('Error', 'Failed to save interview feedback');
    }
  };

  const handleDeleteFeedback = (feedback: InterviewFeedback) => {
    Alert.alert(
      'Delete Interview Feedback',
      `Are you sure you want to delete this interview feedback?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInterviewFeedback(feedback.id);
              await loadInterviewPrepData();
              Alert.alert('Success', 'Interview feedback deleted');
            } catch (error) {
              console.error('Error deleting interview feedback:', error);
              Alert.alert('Error', 'Failed to delete interview feedback');
            }
          },
        },
      ]
    );
  };

  const getApplicationDisplay = (appId: string) => {
    const app = applications.find(a => a.id === appId);
    return app ? `${app.positionTitle} at ${app.company}` : 'Unknown Application';
  };

  const formatDateShort = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getEffectiveApplicationDate = (app: JobApplication): Date => {
    // If the application was rejected and has interview events, use the latest interview date
    if (app.status === 'rejected' && app.eventIds && app.eventIds.length > 0) {
      // For now, just use appliedDate - we'd need to load events to get interview dates
      return new Date(app.appliedDate);
    }
    // Otherwise use the appliedDate
    return new Date(app.appliedDate);
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border, paddingTop: statusBarHeight + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colorScheme.colors.text }]}>Interview Prep 🎤</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {interviewPrepView === 'menu' && (
          <View style={styles.interviewPrepMenu}>
            <Text style={[styles.interviewPrepTitle, { color: colorScheme.colors.text }]}>
              Interview Preparation Tools 🎤
            </Text>
            <Text style={[styles.interviewPrepSubtitle, { color: colorScheme.colors.textSecondary }]}>
              Preparation is key to interview success
            </Text>

            <TouchableOpacity
              style={[styles.interviewPrepMenuItem, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
              onPress={() => setInterviewPrepView('questions')}
            >
              <Text style={[styles.interviewPrepMenuItemTitle, { color: colorScheme.colors.text }]}>
                📚 Question Bank
              </Text>
              <Text style={[styles.interviewPrepMenuItemDesc, { color: colorScheme.colors.textSecondary }]}>
                Common questions by role/industry
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.interviewPrepMenuItem, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
              onPress={() => setInterviewPrepView('star')}
            >
              <Text style={[styles.interviewPrepMenuItemTitle, { color: colorScheme.colors.text }]}>
                ⭐ STAR Method Template
              </Text>
              <Text style={[styles.interviewPrepMenuItemDesc, { color: colorScheme.colors.textSecondary }]}>
                Prepare behavioral question answers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.interviewPrepMenuItem, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
              onPress={() => setInterviewPrepView('research')}
            >
              <Text style={[styles.interviewPrepMenuItemTitle, { color: colorScheme.colors.text }]}>
                🔍 Company Research
              </Text>
              <Text style={[styles.interviewPrepMenuItemDesc, { color: colorScheme.colors.textSecondary }]}>
                Research notes linked to applications
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.interviewPrepMenuItem, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
              onPress={() => setInterviewPrepView('feedback')}
            >
              <Text style={[styles.interviewPrepMenuItemTitle, { color: colorScheme.colors.text }]}>
                📝 Interview Feedback
              </Text>
              <Text style={[styles.interviewPrepMenuItemDesc, { color: colorScheme.colors.textSecondary }]}>
                Notes and feedback after interviews
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.interviewPrepMenuItem, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
              onPress={() => setInterviewPrepView('practice')}
            >
              <Text style={[styles.interviewPrepMenuItemTitle, { color: colorScheme.colors.text }]}>
                ⏱️ Practice Mode
              </Text>
              <Text style={[styles.interviewPrepMenuItemDesc, { color: colorScheme.colors.textSecondary }]}>
                Practice with timer
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Question Bank View */}
        {interviewPrepView === 'questions' && (
          <View>
            <View style={[styles.interviewPrepHeader, { borderBottomColor: colorScheme.colors.border }]}>
              <TouchableOpacity onPress={() => setInterviewPrepView('menu')}>
                <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
              </TouchableOpacity>
              <Text style={[styles.interviewPrepSectionTitle, { color: colorScheme.colors.text }]}>Question Bank</Text>
              <View style={{ width: 60 }} />
            </View>

            <View style={styles.categoryFilter}>
              {['all', 'Behavioral', 'Technical', 'Situational'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: selectedCategory === cat ? colorScheme.colors.primary : colorScheme.colors.surface,
                      borderColor: colorScheme.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      { color: selectedCategory === cat ? '#fff' : colorScheme.colors.text },
                    ]}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.questionsList}>
              {questions
                .filter(q => selectedCategory === 'all' || q.category === selectedCategory)
                .map((question) => (
                  <View
                    key={question.id}
                    style={[styles.questionCard, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
                  >
                    <Text style={[styles.questionText, { color: colorScheme.colors.text }]}>
                      {question.question}
                    </Text>
                    <View style={styles.questionMeta}>
                      <Text style={[styles.questionCategory, { color: colorScheme.colors.textSecondary }]}>
                        {question.category}
                      </Text>
                      {question.industry && (
                        <Text style={[styles.questionCategory, { color: colorScheme.colors.textSecondary }]}>
                          • {question.industry}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* STAR Method View */}
        {interviewPrepView === 'star' && (
          <View>
            <View style={[styles.interviewPrepHeader, { borderBottomColor: colorScheme.colors.border }]}>
              <TouchableOpacity onPress={() => setInterviewPrepView('menu')}>
                <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
              </TouchableOpacity>
              <Text style={[styles.interviewPrepSectionTitle, { color: colorScheme.colors.text }]}>STAR Method</Text>
              <TouchableOpacity
                onPress={() => {
                  resetSTARForm();
                  setShowSTARForm(true);
                }}
              >
                <Text style={[styles.addButtonText, { color: colorScheme.colors.primary }]}>+ New</Text>
              </TouchableOpacity>
            </View>

            {starResponses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colorScheme.colors.textSecondary }]}>
                  No STAR responses yet.{'\n'}Create one to prepare for behavioral questions!
                </Text>
              </View>
            ) : (
              starResponses.map((star) => (
                <View
                  key={star.id}
                  style={[styles.starCard, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
                >
                  <Text style={[styles.starQuestion, { color: colorScheme.colors.text }]}>{star.question}</Text>
                  <View style={styles.starSections}>
                    <Text style={[styles.starLabel, { color: colorScheme.colors.text }]}>Situation:</Text>
                    <Text style={[styles.starValue, { color: colorScheme.colors.textSecondary }]}>{star.situation || 'Not set'}</Text>
                    <Text style={[styles.starLabel, { color: colorScheme.colors.text }]}>Task:</Text>
                    <Text style={[styles.starValue, { color: colorScheme.colors.textSecondary }]}>{star.task || 'Not set'}</Text>
                    <Text style={[styles.starLabel, { color: colorScheme.colors.text }]}>Action:</Text>
                    <Text style={[styles.starValue, { color: colorScheme.colors.textSecondary }]}>{star.action || 'Not set'}</Text>
                    <Text style={[styles.starLabel, { color: colorScheme.colors.text }]}>Result:</Text>
                    <Text style={[styles.starValue, { color: colorScheme.colors.textSecondary }]}>{star.result || 'Not set'}</Text>
                  </View>
                  <View style={styles.starActions}>
                    <TouchableOpacity
                      style={[styles.starActionButton, { backgroundColor: colorScheme.colors.primary }]}
                      onPress={() => handleEditSTAR(star)}
                    >
                      <Text style={styles.starActionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.starActionButton, { backgroundColor: '#d32f2f' }]}
                      onPress={() => handleDeleteSTAR(star)}
                    >
                      <Text style={styles.starActionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Company Research View */}
        {interviewPrepView === 'research' && (
          <View>
            <View style={[styles.interviewPrepHeader, { borderBottomColor: colorScheme.colors.border }]}>
              <TouchableOpacity onPress={() => setInterviewPrepView('menu')}>
                <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
              </TouchableOpacity>
              <Text style={[styles.interviewPrepSectionTitle, { color: colorScheme.colors.text }]}>Company Research</Text>
              <TouchableOpacity
                onPress={() => {
                  resetResearchForm();
                  setShowResearchForm(true);
                }}
              >
                <Text style={[styles.addButtonText, { color: colorScheme.colors.primary }]}>+ New</Text>
              </TouchableOpacity>
            </View>

            {companyResearch.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colorScheme.colors.textSecondary }]}>
                  No company research notes yet.{'\n'}Create research notes linked to your applications!
                </Text>
              </View>
            ) : (
              companyResearch.map((research) => (
                <View
                  key={research.id}
                  style={[styles.researchCard, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
                >
                  <Text style={[styles.researchCompany, { color: colorScheme.colors.text }]}>{research.companyName}</Text>
                  <Text style={[styles.researchPosition, { color: colorScheme.colors.textSecondary }]}>{research.positionTitle}</Text>
                  {research.applicationIds && research.applicationIds.length > 0 && (
                    <View style={styles.linkedApplicationsContainer}>
                      <Text style={[styles.linkedApplicationsLabel, { color: colorScheme.colors.textSecondary }]}>
                        Linked Applications:
                      </Text>
                      {research.applicationIds.map((appId) => {
                        const app = applications.find(a => a.id === appId);
                        if (app) {
                          const appliedDate = getEffectiveApplicationDate(app);
                          return (
                            <TouchableOpacity
                              key={appId}
                              onPress={() => {
                                if (onNavigateToApplication) {
                                  onNavigateToApplication(appId);
                                }
                              }}
                              style={styles.applicationLink}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.applicationLinkText, { color: colorScheme.colors.primary }]}>
                                📋 {app.positionTitle} • Applied {formatDateShort(appliedDate.toISOString())}
                              </Text>
                            </TouchableOpacity>
                          );
                        }
                        return null;
                      })}
                    </View>
                  )}
                  {research.researchNotes && research.researchNotes.trim() && (
                    <Text style={[styles.researchNotes, { color: colorScheme.colors.text }]}>{research.researchNotes}</Text>
                  )}
                  <View style={styles.researchLinks}>
                    {research.website && (
                      <TouchableOpacity onPress={() => Linking.openURL(research.website!)}>
                        <Text style={[styles.researchLink, { color: colorScheme.colors.primary }]}>🌐 Website</Text>
                      </TouchableOpacity>
                    )}
                    {research.linkedinUrl && (
                      <TouchableOpacity onPress={() => Linking.openURL(research.linkedinUrl!)}>
                        <Text style={[styles.researchLink, { color: colorScheme.colors.primary }]}>💼 LinkedIn</Text>
                      </TouchableOpacity>
                    )}
                    {research.glassdoorUrl && (
                      <TouchableOpacity onPress={() => Linking.openURL(research.glassdoorUrl!)}>
                        <Text style={[styles.researchLink, { color: colorScheme.colors.primary }]}>⭐ Glassdoor</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.researchActions}>
                    <TouchableOpacity
                      style={[styles.researchActionButton, { backgroundColor: colorScheme.colors.primary }]}
                      onPress={() => handleEditResearch(research)}
                    >
                      <Text style={styles.researchActionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.researchActionButton, { backgroundColor: '#d32f2f' }]}
                      onPress={() => handleDeleteResearch(research)}
                    >
                      <Text style={styles.researchActionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Interview Feedback View */}
        {interviewPrepView === 'feedback' && (
          <View>
            <View style={[styles.interviewPrepHeader, { borderBottomColor: colorScheme.colors.border }]}>
              <TouchableOpacity onPress={() => setInterviewPrepView('menu')}>
                <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
              </TouchableOpacity>
              <Text style={[styles.interviewPrepSectionTitle, { color: colorScheme.colors.text }]}>Interview Feedback</Text>
              <TouchableOpacity
                onPress={() => {
                  resetFeedbackForm();
                  setShowFeedbackForm(true);
                }}
              >
                <Text style={[styles.addButtonText, { color: colorScheme.colors.primary }]}>+ New</Text>
              </TouchableOpacity>
            </View>

            {interviewFeedback.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colorScheme.colors.textSecondary }]}>
                  No interview feedback yet.{'\n'}Add feedback after your interviews!
                </Text>
              </View>
            ) : (
              interviewFeedback.map((feedback) => (
                <View
                  key={feedback.id}
                  style={[styles.feedbackCard, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
                >
                  <Text style={[styles.feedbackCompany, { color: colorScheme.colors.text }]}>{feedback.companyName}</Text>
                  <Text style={[styles.feedbackPosition, { color: colorScheme.colors.textSecondary }]}>{feedback.positionTitle}</Text>
                  <Text style={[styles.feedbackDate, { color: colorScheme.colors.textSecondary }]}>
                    {new Date(feedback.interviewDate).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.feedbackText, { color: colorScheme.colors.text }]}>{feedback.feedback}</Text>
                  {feedback.strengths && (
                    <View>
                      <Text style={[styles.feedbackLabel, { color: colorScheme.colors.text }]}>Strengths:</Text>
                      <Text style={[styles.feedbackValue, { color: colorScheme.colors.textSecondary }]}>{feedback.strengths}</Text>
                    </View>
                  )}
                  {feedback.areasForImprovement && (
                    <View>
                      <Text style={[styles.feedbackLabel, { color: colorScheme.colors.text }]}>Areas for Improvement:</Text>
                      <Text style={[styles.feedbackValue, { color: colorScheme.colors.textSecondary }]}>{feedback.areasForImprovement}</Text>
                    </View>
                  )}
                  <View style={styles.feedbackActions}>
                    <TouchableOpacity
                      style={[styles.feedbackActionButton, { backgroundColor: colorScheme.colors.primary }]}
                      onPress={() => handleEditFeedback(feedback)}
                    >
                      <Text style={styles.feedbackActionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.feedbackActionButton, { backgroundColor: '#d32f2f' }]}
                      onPress={() => handleDeleteFeedback(feedback)}
                    >
                      <Text style={styles.feedbackActionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Practice Mode View */}
        {interviewPrepView === 'practice' && (
          <View>
            <View style={[styles.interviewPrepHeader, { borderBottomColor: colorScheme.colors.border }]}>
              <TouchableOpacity onPress={() => {
                setIsPracticeModeActive(false);
                setPracticeTimer(0);
                setCurrentPracticeQuestion(null);
                if (practiceTimerRef.current) {
                  clearInterval(practiceTimerRef.current);
                  practiceTimerRef.current = null;
                }
                setInterviewPrepView('menu');
              }}>
                <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
              </TouchableOpacity>
              <Text style={[styles.interviewPrepSectionTitle, { color: colorScheme.colors.text }]}>Practice Mode</Text>
              <View style={{ width: 60 }} />
            </View>

            {!isPracticeModeActive && !currentPracticeQuestion ? (
              <View style={styles.practiceSetup}>
                <Text style={[styles.practiceInstructions, { color: colorScheme.colors.textSecondary }]}>
                  Select a question category to start practicing:
                </Text>
                <View style={styles.categoryFilter}>
                  {['Behavioral', 'Technical', 'Situational'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor: colorScheme.colors.primary,
                          borderColor: colorScheme.colors.border,
                        },
                      ]}
                      onPress={async () => {
                        const categoryQuestions = await getQuestionsByCategory(cat);
                        if (categoryQuestions.length > 0) {
                          const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
                          setCurrentPracticeQuestion(randomQuestion);
                          setIsPracticeModeActive(true);
                          setPracticeTimer(0);
                          // Start timer
                          if (practiceTimerRef.current) {
                            clearInterval(practiceTimerRef.current);
                          }
                          practiceTimerRef.current = setInterval(() => {
                            setPracticeTimer(prev => prev + 1);
                          }, 1000) as any;
                        } else {
                          Alert.alert('No Questions', `No ${cat} questions available`);
                        }
                      }}
                    >
                      <Text style={[styles.categoryButtonText, { color: '#fff' }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : isPracticeModeActive && currentPracticeQuestion ? (
              <View style={styles.practiceActive}>
                <View style={styles.timerContainer}>
                  <Text style={[styles.timerText, { color: colorScheme.colors.primary }]}>
                    {Math.floor(practiceTimer / 60)}:{(practiceTimer % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
                <View style={[styles.practiceQuestionCard, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
                  <Text style={[styles.practiceQuestionText, { color: colorScheme.colors.text }]}>
                    {currentPracticeQuestion.question}
                  </Text>
                </View>
                <View style={styles.practiceActions}>
                  <TouchableOpacity
                    style={[styles.practiceButton, { backgroundColor: colorScheme.colors.accent }]}
                    onPress={() => {
                      const categoryQuestions = questions.filter(q => q.category === currentPracticeQuestion.category);
                      if (categoryQuestions.length > 0) {
                        const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
                        setCurrentPracticeQuestion(randomQuestion);
                        setPracticeTimer(0);
                      }
                    }}
                  >
                    <Text style={styles.practiceButtonText}>Next Question</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.practiceButton, { backgroundColor: colorScheme.colors.secondary || '#6b5b4f' }]}
                    onPress={() => {
                      setIsPracticeModeActive(false);
                      setPracticeTimer(0);
                      setCurrentPracticeQuestion(null);
                      if (practiceTimerRef.current) {
                        clearInterval(practiceTimerRef.current);
                        practiceTimerRef.current = null;
                      }
                    }}
                  >
                    <Text style={styles.practiceButtonText}>End Practice</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* STAR Form Modal */}
      {showSTARForm && (
        <Modal
          visible={showSTARForm}
          animationType="slide"
          transparent={false}
          onRequestClose={resetSTARForm}
        >
          <KeyboardAvoidingView
            style={[styles.modalContainer, { backgroundColor: colorScheme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[styles.modalHeader, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
              <TouchableOpacity onPress={resetSTARForm} style={styles.modalBackButton}>
                <Text style={[styles.modalBackButtonText, { color: colorScheme.colors.primary }]}>← Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
                {editingSTAR ? 'Edit STAR Response' : 'New STAR Response'}
              </Text>
              <TouchableOpacity onPress={handleSaveSTAR} style={styles.modalSaveButton}>
                <Text style={[styles.modalSaveButtonText, { color: colorScheme.colors.primary }]}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Question *</Text>
                <View style={styles.selectQuestionContainer}>
                  <TextInput
                    style={[styles.starFormInput, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                    value={starQuestion}
                    onChangeText={setStarQuestion}
                    onFocus={() => setShowQuestionDropdown(false)}
                    placeholder="e.g., Tell me about a time you handled a difficult situation"
                    placeholderTextColor={colorScheme.colors.textSecondary}
                    multiline
                    numberOfLines={2}
                  />
                  <TouchableOpacity
                    style={[styles.selectQuestionButton, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
                    onPress={() => {
                      setShowQuestionDropdown(!showQuestionDropdown);
                    }}
                  >
                    <Text style={[styles.selectQuestionButtonText, { color: colorScheme.colors.text }]}>📚 Select from Bank</Text>
                  </TouchableOpacity>
                </View>
                {showQuestionDropdown && (
                  <View style={[styles.questionDropdown, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
                    <ScrollView style={styles.questionDropdownScroll} nestedScrollEnabled={true}>
                      {questions.filter(q => q.category === 'Behavioral').map((question) => (
                        <TouchableOpacity
                          key={question.id}
                          style={[styles.questionDropdownItem, { borderBottomColor: colorScheme.colors.border }]}
                          onPress={() => {
                            setStarQuestion(question.question);
                            setShowQuestionDropdown(false);
                          }}
                        >
                          <Text style={[styles.questionDropdownItemText, { color: colorScheme.colors.text }]}>
                            {question.question}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {questions.filter(q => q.category === 'Behavioral').length === 0 && (
                        <View style={styles.questionDropdownItem}>
                          <Text style={[styles.questionDropdownItemText, { color: colorScheme.colors.textSecondary }]}>
                            No behavioral questions found
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Situation</Text>
                <TextInput
                  style={[styles.starFormTextArea, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={starSituation}
                  onChangeText={setStarSituation}
                  placeholder="Describe the situation or context..."
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Task</Text>
                <TextInput
                  style={[styles.starFormTextArea, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={starTask}
                  onChangeText={setStarTask}
                  placeholder="What was your task or responsibility?"
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Action</Text>
                <TextInput
                  style={[styles.starFormTextArea, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={starAction}
                  onChangeText={setStarAction}
                  placeholder="What actions did you take?"
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Result</Text>
                <TextInput
                  style={[styles.starFormTextArea, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={starResult}
                  onChangeText={setStarResult}
                  placeholder="What was the outcome or result?"
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Company Research Form Modal */}
      {showResearchForm && (
        <Modal
          visible={showResearchForm}
          animationType="slide"
          transparent={false}
          onRequestClose={resetResearchForm}
        >
          <KeyboardAvoidingView
            style={[styles.modalContainer, { backgroundColor: colorScheme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[styles.modalHeader, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
              <TouchableOpacity onPress={resetResearchForm} style={styles.modalBackButton}>
                <Text style={[styles.modalBackButtonText, { color: colorScheme.colors.primary }]}>← Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
                {editingResearch ? 'Edit Company Research' : 'New Company Research'}
              </Text>
              <TouchableOpacity onPress={handleSaveResearch} style={styles.modalSaveButton}>
                <Text style={[styles.modalSaveButtonText, { color: colorScheme.colors.primary }]}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Job Applications *</Text>
                <Text style={[styles.helperText, { color: colorScheme.colors.textSecondary, marginBottom: 8 }]}>
                  Select one or more applications for this company
                </Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
                  onPress={() => {
                    if (applications.length === 0) {
                      Alert.alert('No Applications', 'Please add a job application first');
                      return;
                    }
                    setShowApplicationSelector(true);
                  }}
                >
                  <Text style={[styles.pickerButtonText, { color: selectedApplicationsForResearch.length > 0 ? colorScheme.colors.text : colorScheme.colors.textSecondary }]}>
                    {selectedApplicationsForResearch.length > 0
                      ? `${selectedApplicationsForResearch.length} application${selectedApplicationsForResearch.length > 1 ? 's' : ''} selected`
                      : 'Select applications...'}
                  </Text>
                </TouchableOpacity>
                {selectedApplicationsForResearch.length > 0 && (
                  <View style={styles.selectedApplicationsList}>
                    {selectedApplicationsForResearch.map((appId) => {
                      const app = applications.find(a => a.id === appId);
                      return app ? (
                        <View key={appId} style={[styles.selectedApplicationChip, { backgroundColor: colorScheme.colors.primary + '20', borderColor: colorScheme.colors.primary }]}>
                          <Text style={[styles.selectedApplicationChipText, { color: colorScheme.colors.primary }]}>
                            {app.positionTitle}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedApplicationsForResearch(prev => prev.filter(id => id !== appId));
                            }}
                            style={styles.removeApplicationButton}
                          >
                            <Text style={[styles.removeApplicationButtonText, { color: colorScheme.colors.primary }]}>×</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null;
                    })}
                  </View>
                )}
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Company Name *</Text>
                <TextInput
                  style={[styles.starFormInput, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={researchCompanyName}
                  onChangeText={setResearchCompanyName}
                  placeholder="Enter company name"
                  placeholderTextColor={colorScheme.colors.textSecondary}
                />
                {researchCompanyName.trim() && !editingResearch && (
                  <Text style={[styles.helperText, { color: colorScheme.colors.textSecondary }]}>
                    URLs will be auto-populated below
                  </Text>
                )}
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Position Title *</Text>
                <TextInput
                  style={[styles.starFormInput, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={researchPositionTitle}
                  onChangeText={setResearchPositionTitle}
                  placeholder="Enter position title"
                  placeholderTextColor={colorScheme.colors.textSecondary}
                />
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Research Notes (Optional)</Text>
                <TextInput
                  style={[styles.starFormTextArea, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={researchNotes}
                  onChangeText={setResearchNotes}
                  placeholder="Enter your research notes about the company..."
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Website URL (Optional)</Text>
                <TextInput
                  style={[styles.starFormInput, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={researchWebsite}
                  onChangeText={setResearchWebsite}
                  placeholder="https://..."
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>LinkedIn URL (Optional)</Text>
                <TextInput
                  style={[styles.starFormInput, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={researchLinkedIn}
                  onChangeText={setResearchLinkedIn}
                  placeholder="https://linkedin.com/..."
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Glassdoor URL (Optional)</Text>
                <TextInput
                  style={[styles.starFormInput, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={researchGlassdoor}
                  onChangeText={setResearchGlassdoor}
                  placeholder="https://glassdoor.com/..."
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Application Selector Modal */}
      {showApplicationSelector && (
        <Modal
          visible={showApplicationSelector}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowApplicationSelector(false)}
        >
          <KeyboardAvoidingView
            style={[styles.modalContainer, { backgroundColor: colorScheme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={[styles.modalHeader, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
              <TouchableOpacity onPress={() => setShowApplicationSelector(false)} style={styles.modalBackButton}>
                <Text style={[styles.modalBackButtonText, { color: colorScheme.colors.primary }]}>← Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
                Select Applications
              </Text>
              <TouchableOpacity
                onPress={() => setShowApplicationSelector(false)}
                style={styles.modalSaveButton}
              >
                <Text style={[styles.modalSaveButtonText, { color: colorScheme.colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
            >
              {applications.length === 0 ? (
                <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
                  No applications available
                </Text>
              ) : (
                applications.map((app) => {
                  const isSelected = selectedApplicationsForResearch.includes(app.id);
                  return (
                    <TouchableOpacity
                      key={app.id}
                      style={[
                        styles.applicationSelectorItem,
                        {
                          backgroundColor: colorScheme.colors.surface,
                          borderColor: colorScheme.colors.border,
                        },
                        isSelected && {
                          backgroundColor: colorScheme.colors.primary + '20',
                          borderColor: colorScheme.colors.primary,
                        },
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedApplicationsForResearch(prev => prev.filter(id => id !== app.id));
                        } else {
                          setSelectedApplicationsForResearch(prev => [...prev, app.id]);
                        }
                      }}
                    >
                      <Text style={[styles.applicationSelectorCheckbox, { color: isSelected ? colorScheme.colors.primary : colorScheme.colors.border }]}>
                        {isSelected ? '✓' : '○'}
                      </Text>
                      <View style={styles.applicationSelectorContent}>
                        <Text style={[styles.applicationSelectorTitle, { color: colorScheme.colors.text }]}>
                          {app.positionTitle}
                        </Text>
                        <Text style={[styles.applicationSelectorCompany, { color: colorScheme.colors.textSecondary }]}>
                          {app.company}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Interview Feedback Form Modal */}
      {showFeedbackForm && (
        <Modal
          visible={showFeedbackForm}
          animationType="slide"
          transparent={false}
          onRequestClose={resetFeedbackForm}
        >
          <KeyboardAvoidingView
            style={[styles.modalContainer, { backgroundColor: colorScheme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[styles.modalHeader, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
              <TouchableOpacity onPress={resetFeedbackForm} style={styles.modalBackButton}>
                <Text style={[styles.modalBackButtonText, { color: colorScheme.colors.primary }]}>← Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colorScheme.colors.text }]}>
                {editingFeedback ? 'Edit Interview Feedback' : 'New Interview Feedback'}
              </Text>
              <TouchableOpacity onPress={handleSaveFeedback} style={styles.modalSaveButton}>
                <Text style={[styles.modalSaveButtonText, { color: colorScheme.colors.primary }]}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Job Application *</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
                  onPress={() => {
                    if (applications.length === 0) {
                      Alert.alert('No Applications', 'Please add a job application first');
                      return;
                    }
                    const options = applications.map(app => getApplicationDisplay(app.id));
                    const currentIndex = selectedApplicationForFeedback
                      ? applications.findIndex(app => app.id === selectedApplicationForFeedback)
                      : -1;
                    Alert.alert(
                      'Select Application',
                      '',
                      options.map((name, index) => ({
                        text: name,
                        onPress: () => setSelectedApplicationForFeedback(applications[index].id),
                        style: index === currentIndex ? 'default' : undefined,
                      }))
                    );
                  }}
                >
                  <Text style={[styles.pickerButtonText, { color: selectedApplicationForFeedback ? colorScheme.colors.text : colorScheme.colors.textSecondary }]}>
                    {selectedApplicationForFeedback
                      ? getApplicationDisplay(selectedApplicationForFeedback)
                      : 'Select an application...'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Company Name *</Text>
                <TextInput
                  style={[styles.starFormInput, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={feedbackCompanyName}
                  onChangeText={setFeedbackCompanyName}
                  placeholder="Enter company name"
                  placeholderTextColor={colorScheme.colors.textSecondary}
                />
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Position Title (Optional)</Text>
                <TextInput
                  style={[styles.starFormInput, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={feedbackPositionTitle}
                  onChangeText={setFeedbackPositionTitle}
                  placeholder="Enter position title"
                  placeholderTextColor={colorScheme.colors.textSecondary}
                />
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Interview Date *</Text>
                <TouchableOpacity
                  style={[styles.datePickerButton, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
                  onPress={() => {
                    const year = feedbackInterviewDate.getFullYear();
                    const month = feedbackInterviewDate.getMonth() + 1;
                    const day = feedbackInterviewDate.getDate();
                    Alert.prompt(
                      'Enter Interview Date',
                      'Format: YYYY-MM-DD or MM/DD/YYYY',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'OK',
                          onPress: (input) => {
                            if (!input) return;
                            const parts = input.includes('/') ? input.split('/') : input.split('-');
                            if (parts.length === 3) {
                              let y, m, d;
                              if (input.includes('/')) {
                                // MM/DD/YYYY
                                m = parseInt(parts[0], 10);
                                d = parseInt(parts[1], 10);
                                y = parseInt(parts[2], 10);
                              } else {
                                // YYYY-MM-DD
                                y = parseInt(parts[0], 10);
                                m = parseInt(parts[1], 10);
                                d = parseInt(parts[2], 10);
                              }
                              if (y && m && d) {
                                const newDate = new Date(y, m - 1, d);
                                if (!isNaN(newDate.getTime())) {
                                  setFeedbackInterviewDate(newDate);
                                }
                              }
                            }
                          },
                        },
                      ],
                      'plain-text',
                      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    );
                  }}
                >
                  <Text style={[styles.datePickerText, { color: colorScheme.colors.text }]}>
                    {feedbackInterviewDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Feedback *</Text>
                <TextInput
                  style={[styles.starFormTextArea, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  placeholder="Enter your feedback about the interview..."
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Strengths (Optional)</Text>
                <TextInput
                  style={[styles.starFormTextArea, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={feedbackStrengths}
                  onChangeText={setFeedbackStrengths}
                  placeholder="What went well?"
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.starFormGroup}>
                <Text style={[styles.starFormLabel, { color: colorScheme.colors.text }]}>Areas for Improvement (Optional)</Text>
                <TextInput
                  style={[styles.starFormTextArea, { backgroundColor: colorScheme.colors.surface, color: colorScheme.colors.text, borderColor: colorScheme.colors.border }]}
                  value={feedbackAreasForImprovement}
                  onChangeText={setFeedbackAreasForImprovement}
                  placeholder="What could be improved?"
                  placeholderTextColor={colorScheme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
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
    paddingBottom: 40,
  },
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
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  applicationLink: {
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 4,
  },
  linkedApplicationsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  linkedApplicationsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  applicationLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedApplicationsList: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedApplicationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  selectedApplicationChipText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  removeApplicationButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeApplicationButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  applicationSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  applicationSelectorCheckbox: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  applicationSelectorContent: {
    flex: 1,
  },
  applicationSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  applicationSelectorCompany: {
    fontSize: 14,
  },
  researchActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  researchActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  researchActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  feedbackActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  feedbackActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  feedbackActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  starActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  starActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  starActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerButton: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  datePickerButton: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  datePickerText: {
    fontSize: 16,
  },
  // STAR Form Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  modalBackButton: {
    padding: 8,
  },
  modalBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  modalSaveButton: {
    padding: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
    paddingBottom: 40,
  },
  starFormGroup: {
    marginBottom: 20,
  },
  starFormLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  selectQuestionContainer: {
    marginBottom: 8,
  },
  selectQuestionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    alignItems: 'center',
  },
  selectQuestionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionDropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
  },
  questionDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  questionDropdownHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionDropdownCloseButton: {
    padding: 4,
  },
  questionDropdownCloseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  questionDropdownScroll: {
    maxHeight: 160,
  },
  questionDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  questionDropdownItemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  starFormInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 60,
  },
  starFormTextArea: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
  },
});


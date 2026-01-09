import { StyleSheet, Text, View, LogBox } from 'react-native';
import { useState, useEffect, Component, ErrorInfo, ReactNode, useMemo, useCallback } from 'react';
import HomeScreen from './components/HomeScreen';
import CalendarScreen from './components/CalendarScreen';
import DailyPlannerScreen from './components/DailyPlannerScreen';
import SetupScreen from './components/SetupScreen';
import ReportsScreen from './components/ReportsScreen';
import ViewReportScreen from './components/ViewReportScreen';
import ApplicationsScreen from './components/ApplicationsScreen';
import OffersScreen from './components/OffersScreen';
import ReferencesScreen from './components/ReferencesScreen';
import AboutScreen from './components/AboutScreen';
import InterviewPrepScreen from './components/InterviewPrepScreen';
import ThankYouNotesScreen from './components/ThankYouNotesScreen';
import { PreferencesProvider } from './context/PreferencesContext';
import { loadPreferences } from './utils/preferences';

// Suppress harmless warnings
LogBox.ignoreLogs([
  'The app is running using the Legacy Architecture',
  'Failed to open debugger',
]);

// Error Boundary Component
const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8b7355',
    marginBottom: 10,
  },
  error: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
});

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>UseYourTools</Text>
          <Text style={errorStyles.error}>Something went wrong</Text>
          <Text style={errorStyles.error}>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

type Screen = 'home' | 'calendar' | 'dailyPlanner' | 'setup' | 'reports' | 'viewReport' | 'applications' | 'offers' | 'references' | 'about' | 'interviewPrep' | 'thankYouNotes';

interface InterviewPrepParams {
  companyName?: string;
  applicationId?: string;
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | undefined>(undefined);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);
  const [reportHtml, setReportHtml] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>('');
  const [interviewPrepParams, setInterviewPrepParams] = useState<InterviewPrepParams>({});

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const preferences = await loadPreferences();
      if (!preferences.hasCompletedSetup) {
        setCurrentScreen('setup');
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
    }
  };

  // Memoize callbacks to prevent unnecessary re-renders
  const handleSelectDate = useCallback((date: Date, applicationId?: string) => {
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    setSelectedDate(normalizedDate);
    setSelectedApplicationId(applicationId);
    setCurrentScreen('dailyPlanner');
  }, []);

  const handleSetupComplete = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleViewSettings = useCallback(() => {
    setCurrentScreen('setup');
  }, []);

  const handleBackToHome = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleBackToCalendar = useCallback(() => {
    setCurrentScreen('calendar');
  }, []);

  const handleViewReports = useCallback(() => {
    setCurrentScreen('reports');
  }, []);

  const handleViewReport = useCallback((html: string, title: string) => {
    setReportHtml(html);
    setReportTitle(title);
    setCurrentScreen('viewReport');
  }, []);

  const handleBackToReports = useCallback(() => {
    setCurrentScreen('reports');
  }, []);

  const handleViewApplications = useCallback((applicationId?: string) => {
    if (applicationId) {
      setSelectedApplicationId(applicationId);
    }
    setCurrentScreen('applications');
  }, []);

  const handleViewOffers = useCallback(() => {
    setCurrentScreen('offers');
  }, []);

  const handleViewReferences = useCallback(() => {
    setCurrentScreen('references');
  }, []);

  const handleNavigateToDailyPlanner = useCallback((date?: Date) => {
    // Set to provided date or today's date and navigate to daily planner
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);
    setSelectedDate(targetDate);
    setCurrentScreen('dailyPlanner');
  }, []);

  // Memoize navigation callbacks
  const navigateToCalendar = useCallback(() => setCurrentScreen('calendar'), []);
  const navigateToInterviewPrep = useCallback(() => setCurrentScreen('interviewPrep'), []);
  const navigateToThankYouNotes = useCallback(() => setCurrentScreen('thankYouNotes'), []);
  const navigateToAbout = useCallback(() => setCurrentScreen('about'), []);

  // Memoize the daily planner back handler - must be defined before early returns
  const handleDailyPlannerBack = useCallback(() => {
    if (!selectedDate) {
      handleBackToHome();
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDate.getTime() === today.getTime();
    
    if (selectedApplicationId || !isToday) {
      // Came from calendar/applications (specific date selected)
      setCurrentScreen('calendar');
      setCalendarRefreshTrigger(prev => prev + 1);
    } else {
      // Came from home (today's planner accessed directly)
      setCurrentScreen('home');
    }
    setSelectedApplicationId(undefined); // Clear application context
  }, [selectedDate, selectedApplicationId, handleBackToHome]);

  const handleDateChange = useCallback((newDate: Date) => {
    setSelectedDate(newDate);
  }, []);

  const handleCreateOffer = useCallback((applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setCurrentScreen('offers');
  }, []);

  const handleCreateReference = useCallback((applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setCurrentScreen('references');
  }, []);

  const handleNavigateToInterviewPrepFromApps = useCallback((companyName?: string, applicationId?: string) => {
    setInterviewPrepParams({ companyName, applicationId });
    setCurrentScreen('interviewPrep');
  }, []);

  const handleOffersBack = useCallback(() => {
    setSelectedApplicationId(undefined);
    handleBackToHome();
  }, [handleBackToHome]);

  const handleViewApplicationFromOffers = useCallback((applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setCurrentScreen('applications');
  }, []);

  const handleReferencesBack = useCallback(() => {
    setSelectedApplicationId(undefined);
    handleBackToHome();
  }, [handleBackToHome]);

  const handleViewApplicationFromReferences = useCallback((applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setCurrentScreen('applications');
  }, []);

  const handleInterviewPrepBack = useCallback(() => {
    setInterviewPrepParams({});
    handleBackToHome();
  }, [handleBackToHome]);

  const handleNavigateToApplicationFromInterviewPrep = useCallback((applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setCurrentScreen('applications');
  }, []);

  // Early returns for different screens
  if (currentScreen === 'setup') {
    return <SetupScreen onComplete={handleSetupComplete} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'home') {
    return (
      <HomeScreen
        onNavigateToCalendar={navigateToCalendar}
        onNavigateToDailyPlanner={handleNavigateToDailyPlanner}
        onNavigateToApplications={handleViewApplications}
        onNavigateToOffers={handleViewOffers}
        onNavigateToReferences={handleViewReferences}
        onNavigateToReports={handleViewReports}
        onNavigateToInterviewPrep={navigateToInterviewPrep}
        onNavigateToThankYouNotes={navigateToThankYouNotes}
        onNavigateToSettings={handleViewSettings}
        onNavigateToAbout={navigateToAbout}
      />
    );
  }

  if (currentScreen === 'calendar') {
    return <CalendarScreen onSelectDate={handleSelectDate} onBack={handleBackToHome} onSettings={handleViewSettings} refreshTrigger={calendarRefreshTrigger} />;
  }

  if (currentScreen === 'reports') {
    return <ReportsScreen onBack={handleBackToHome} onViewReport={handleViewReport} />;
  }

  if (currentScreen === 'viewReport') {
    return <ViewReportScreen html={reportHtml} title={reportTitle} onBack={handleBackToReports} />;
  }

  if (currentScreen === 'dailyPlanner' && selectedDate) {
    return (
      <DailyPlannerScreen
        date={selectedDate}
        onBack={handleDailyPlannerBack}
        onDateChange={handleDateChange}
        initialApplicationId={selectedApplicationId}
        onNavigateToApplication={handleViewApplications}
      />
    );
  }

  if (currentScreen === 'applications') {
    return (
      <ApplicationsScreen
        onBack={handleBackToHome}
        onSelectDate={handleSelectDate}
        onCreateOffer={handleCreateOffer}
        onCreateReference={handleCreateReference}
        onNavigateToInterviewPrep={handleNavigateToInterviewPrepFromApps}
        initialApplicationId={selectedApplicationId}
      />
    );
  }

  if (currentScreen === 'offers') {
    return (
      <OffersScreen
        onBack={handleOffersBack}
        onViewApplication={handleViewApplicationFromOffers}
        initialApplicationId={selectedApplicationId}
      />
    );
  }

  if (currentScreen === 'references') {
    return (
      <ReferencesScreen
        onBack={handleReferencesBack}
        onViewApplication={handleViewApplicationFromReferences}
        initialApplicationId={selectedApplicationId}
      />
    );
  }

  if (currentScreen === 'about') {
    return <AboutScreen onBack={handleBackToHome} />;
  }

  if (currentScreen === 'interviewPrep') {
    return (
      <InterviewPrepScreen
        onBack={handleInterviewPrepBack}
        initialCompanyName={interviewPrepParams.companyName}
        initialApplicationId={interviewPrepParams.applicationId}
        onNavigateToApplication={handleNavigateToApplicationFromInterviewPrep}
      />
    );
  }

  if (currentScreen === 'thankYouNotes') {
    return <ThankYouNotesScreen onBack={handleBackToHome} />;
  }

  // Fallback to home if no screen matches (should never happen)
  return (
    <HomeScreen
      onNavigateToCalendar={navigateToCalendar}
      onNavigateToDailyPlanner={handleNavigateToDailyPlanner}
      onNavigateToApplications={handleViewApplications}
      onNavigateToOffers={handleViewOffers}
      onNavigateToReferences={handleViewReferences}
      onNavigateToReports={handleViewReports}
      onNavigateToInterviewPrep={navigateToInterviewPrep}
      onNavigateToThankYouNotes={navigateToThankYouNotes}
      onNavigateToSettings={handleViewSettings}
      onNavigateToAbout={navigateToAbout}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PreferencesProvider>
        <AppContent />
      </PreferencesProvider>
    </ErrorBoundary>
  );
}

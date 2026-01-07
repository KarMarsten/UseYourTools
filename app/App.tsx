import { StyleSheet, Text, View, LogBox } from 'react-native';
import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
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

  const handleSelectDate = (date: Date, applicationId?: string) => {
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    setSelectedDate(normalizedDate);
    setSelectedApplicationId(applicationId);
    setCurrentScreen('dailyPlanner');
  };


  const handleSetupComplete = () => {
    setCurrentScreen('home');
  };

  const handleViewSettings = () => {
    setCurrentScreen('setup');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleBackToCalendar = () => {
    setCurrentScreen('calendar');
  };

  const handleViewReports = () => {
    setCurrentScreen('reports');
  };

  const handleViewReport = (html: string, title: string) => {
    setReportHtml(html);
    setReportTitle(title);
    setCurrentScreen('viewReport');
  };

  const handleBackToReports = () => {
    setCurrentScreen('reports');
  };

  const handleViewApplications = (applicationId?: string) => {
    if (applicationId) {
      setSelectedApplicationId(applicationId);
    }
    setCurrentScreen('applications');
  };

  const handleViewOffers = () => {
    setCurrentScreen('offers');
  };

  const handleViewReferences = () => {
    setCurrentScreen('references');
  };


  const handleNavigateToDailyPlanner = (date?: Date) => {
    // Set to provided date or today's date and navigate to daily planner
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);
    setSelectedDate(targetDate);
    setCurrentScreen('dailyPlanner');
  };

  if (currentScreen === 'setup') {
    return <SetupScreen onComplete={handleSetupComplete} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'home') {
    return (
    <HomeScreen
      onNavigateToCalendar={() => setCurrentScreen('calendar')}
      onNavigateToDailyPlanner={handleNavigateToDailyPlanner}
        onNavigateToApplications={handleViewApplications}
        onNavigateToOffers={handleViewOffers}
        onNavigateToReferences={handleViewReferences}
        onNavigateToReports={handleViewReports}
      onNavigateToInterviewPrep={() => setCurrentScreen('interviewPrep')}
      onNavigateToThankYouNotes={() => setCurrentScreen('thankYouNotes')}
      onNavigateToSettings={handleViewSettings}
      onNavigateToAbout={() => setCurrentScreen('about')}
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
    // Determine where we came from: if selectedApplicationId exists, we came from calendar/applications
    // Otherwise, if it's today's date, we likely came from home
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDate.getTime() === today.getTime();
    
    return (
      <DailyPlannerScreen
        date={selectedDate}
        onBack={() => {
          if (selectedApplicationId || !isToday) {
            // Came from calendar/applications (specific date selected)
            setCurrentScreen('calendar');
            setCalendarRefreshTrigger(prev => prev + 1);
          } else {
            // Came from home (today's planner accessed directly)
            setCurrentScreen('home');
          }
          setSelectedApplicationId(undefined); // Clear application context
        }}
        onDateChange={(newDate) => {
          setSelectedDate(newDate);
        }}
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
        onCreateOffer={(applicationId: string) => {
          setSelectedApplicationId(applicationId);
          setCurrentScreen('offers');
        }}
        onCreateReference={(applicationId: string) => {
          setSelectedApplicationId(applicationId);
          setCurrentScreen('references');
        }}
        onNavigateToInterviewPrep={(companyName?: string, applicationId?: string) => {
          setInterviewPrepParams({ companyName, applicationId });
          setCurrentScreen('interviewPrep');
        }}
        initialApplicationId={selectedApplicationId}
      />
    );
  }

  if (currentScreen === 'offers') {
    return (
      <OffersScreen
        onBack={() => {
          setSelectedApplicationId(undefined);
          handleBackToHome();
        }}
        onViewApplication={(applicationId: string) => {
          setSelectedApplicationId(applicationId);
          setCurrentScreen('applications');
        }}
        initialApplicationId={selectedApplicationId}
      />
    );
  }

  if (currentScreen === 'references') {
    return (
      <ReferencesScreen
        onBack={() => {
          setSelectedApplicationId(undefined);
          handleBackToHome();
        }}
        onViewApplication={(applicationId: string) => {
          setSelectedApplicationId(applicationId);
          setCurrentScreen('applications');
        }}
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
        onBack={() => {
          setInterviewPrepParams({});
          handleBackToHome();
        }}
        initialCompanyName={interviewPrepParams.companyName}
        initialApplicationId={interviewPrepParams.applicationId}
        onNavigateToApplication={(applicationId: string) => {
          setSelectedApplicationId(applicationId);
          setCurrentScreen('applications');
        }}
      />
    );
  }

  if (currentScreen === 'thankYouNotes') {
    return <ThankYouNotesScreen onBack={handleBackToHome} />;
  }

  // Fallback to home if no screen matches (should never happen)
  return (
    <HomeScreen
      onNavigateToCalendar={() => setCurrentScreen('calendar')}
      onNavigateToDailyPlanner={handleNavigateToDailyPlanner}
        onNavigateToApplications={handleViewApplications}
        onNavigateToOffers={handleViewOffers}
        onNavigateToReferences={handleViewReferences}
        onNavigateToReports={handleViewReports}
      onNavigateToInterviewPrep={() => setCurrentScreen('interviewPrep')}
      onNavigateToThankYouNotes={() => setCurrentScreen('thankYouNotes')}
      onNavigateToSettings={handleViewSettings}
      onNavigateToAbout={() => setCurrentScreen('about')}
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

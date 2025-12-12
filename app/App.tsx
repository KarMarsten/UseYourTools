import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TouchableOpacity } from 'react-native';
import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import CalendarScreen from './components/CalendarScreen';
import DailyPlannerScreen from './components/DailyPlannerScreen';
import SetupScreen from './components/SetupScreen';
import ReportsScreen from './components/ReportsScreen';
import ViewReportScreen from './components/ViewReportScreen';
import { PreferencesProvider, usePreferences } from './context/PreferencesContext';
import { loadPreferences } from './utils/preferences';

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

type Screen = 'home' | 'calendar' | 'dailyPlanner' | 'setup' | 'reports' | 'viewReport';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [reportHtml, setReportHtml] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>('');
  const { colorScheme } = usePreferences();

  useEffect(() => {
    checkSetupStatus();
    setMounted(true);
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

  const handleViewCalendar = () => {
    setCurrentScreen('calendar');
  };

  const handleSelectDate = (date: Date) => {
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    setSelectedDate(normalizedDate);
    setCurrentScreen('dailyPlanner');
  };

  const handleBackToCalendarFromPlanner = () => {
    setCurrentScreen('calendar');
    // Trigger calendar refresh to update entry indicators
    setCalendarRefreshTrigger(prev => prev + 1);
  };

  const handleViewSetup = () => {
    setCurrentScreen('setup');
  };

  const handleSetupComplete = () => {
    setCurrentScreen('calendar');
  };

  const handleViewSettings = () => {
    setCurrentScreen('setup');
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

  if (currentScreen === 'setup') {
    return <SetupScreen onComplete={handleSetupComplete} onBack={handleBackToCalendar} />;
  }

  if (currentScreen === 'calendar') {
    return <CalendarScreen onSelectDate={handleSelectDate} onSettings={handleViewSettings} onReports={handleViewReports} refreshTrigger={calendarRefreshTrigger} />;
  }

  if (currentScreen === 'reports') {
    return <ReportsScreen onBack={handleBackToCalendar} onViewReport={handleViewReport} />;
  }

  if (currentScreen === 'viewReport') {
    return <ViewReportScreen html={reportHtml} title={reportTitle} onBack={handleBackToReports} />;
  }

  if (currentScreen === 'dailyPlanner' && selectedDate) {
    return <DailyPlannerScreen date={selectedDate} onBack={handleBackToCalendarFromPlanner} />;
  }

  const dynamicStyles = {
    container: { backgroundColor: colorScheme.colors.background },
    title: { color: colorScheme.colors.text },
    subtitle: { color: colorScheme.colors.textSecondary },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>UseYourTools</Text>
      <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Structured Daily Planner for Job Hunters</Text>
      {mounted && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.promptsButton, { backgroundColor: colorScheme.colors.primary }]} 
            onPress={handleViewCalendar}
          >
            <Text style={styles.promptsButtonText}>📅 Open Planner</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.promptsButton, { backgroundColor: colorScheme.colors.accent }]} 
            onPress={handleViewSetup}
          >
            <Text style={styles.promptsButtonText}>⚙️ Setup</Text>
          </TouchableOpacity>
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
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
  subtitle: {
    fontSize: 18,
    color: '#a0826d',
    marginBottom: 30,
  },
  counter: {
    fontSize: 24,
    color: '#6b5b4f',
    marginBottom: 20,
  },
  error: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  promptsButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#4A3A2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  promptsButtonText: {
    color: '#f5f5dc',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <PreferencesProvider>
        <AppContent />
      </PreferencesProvider>
    </ErrorBoundary>
  );
}

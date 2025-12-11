import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TouchableOpacity } from 'react-native';
import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import PromptsScreen from './components/PromptsScreen';
import PromptDetailScreen from './components/PromptDetailScreen';
import { Prompt } from './prompts';

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

type Screen = 'home' | 'prompts' | 'promptDetail';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleViewPrompts = () => {
    setCurrentScreen('prompts');
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setCurrentScreen('promptDetail');
  };

  const handleBackToPrompts = () => {
    setCurrentScreen('prompts');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedPrompt(null);
  };

  if (currentScreen === 'prompts') {
    return <PromptsScreen onSelectPrompt={handleSelectPrompt} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'promptDetail' && selectedPrompt) {
    return <PromptDetailScreen prompt={selectedPrompt} onBack={handleBackToPrompts} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>UseYourTools</Text>
      <Text style={styles.subtitle}>Digital Earth-Tone Planner</Text>
      {mounted && (
        <TouchableOpacity style={styles.promptsButton} onPress={handleViewPrompts}>
          <Text style={styles.promptsButtonText}>🌿 View Prompts</Text>
        </TouchableOpacity>
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
  promptsButton: {
    backgroundColor: '#8C6A4A',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
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
      <AppContent />
    </ErrorBoundary>
  );
}

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';

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

function AppContent() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePress = () => {
    setCount(count + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>UseYourTools</Text>
      <Text style={styles.subtitle}>Digital Earth-Tone Planner</Text>
      {mounted && (
        <>
          <Text style={styles.counter}>Count: {count}</Text>
          <Button title="Increment" onPress={handlePress} />
        </>
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
});

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

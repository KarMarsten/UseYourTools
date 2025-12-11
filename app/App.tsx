import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';

// #region agent log
let FileSystem: any = null;
try {
  FileSystem = require('expo-file-system/legacy');
} catch (importError) {
  console.log('expo-file-system not available, using console logging only');
}

const logDebug = async (location: string, message: string, data: any, hypothesisId: string) => {
  const payload = {
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now()
  };
  
  // Always log to console first for immediate visibility
  console.log('DEBUG_LOG:', JSON.stringify(payload));
  
  // Try HTTP logging
  try {
    const response = await fetch('http://127.0.0.1:7242/ingest/04eaf3a1-6825-403d-a9f2-7e6341bdf8ef', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (fetchError: any) {
    // Fallback to file logging if HTTP fails and FileSystem is available
    if (FileSystem && FileSystem.documentDirectory) {
      try {
        const logPath = `${FileSystem.documentDirectory}debug.log`;
        let existingContent = '';
        try {
          existingContent = await FileSystem.readAsStringAsync(logPath);
        } catch (readError) {
          // File doesn't exist yet, that's okay
        }
        const logLine = JSON.stringify(payload) + '\n';
        await FileSystem.writeAsStringAsync(logPath, existingContent + logLine);
      } catch (fileError: any) {
        console.log('FileSystem logging failed:', fileError?.message || fileError);
      }
    }
  }
};
// #endregion

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
    logDebug('App.tsx:ErrorBoundary', 'React error caught', { 
      error: error.message, 
      stack: error.stack,
      componentStack: errorInfo.componentStack 
    }, 'ERROR').catch(() => {});
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
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // #region agent log
    try {
      logDebug('App.tsx:useEffect', 'App mounted', { count: 0, FileSystemAvailable: !!FileSystem }, 'A').catch((err) => {
        console.error('Logging error on mount:', err);
        setError(`Logging error: ${err.message}`);
      });
    } catch (err: any) {
      console.error('Error in mount effect:', err);
      setInitError(`Initialization error: ${err?.message || err}`);
    }
    // #endregion
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // #region agent log
      logDebug('App.tsx:useEffect[count]', 'Count changed', { count, mounted }, 'C').catch(() => {});
      // #endregion
    }
  }, [count, mounted]);

  const handlePress = () => {
    // #region agent log
    logDebug('App.tsx:handlePress', 'Button pressed', { countBefore: count }, 'B').catch(() => {});
    // #endregion
    const newCount = count + 1;
    setCount(newCount);
    // #region agent log
    logDebug('App.tsx:handlePress', 'Count updated', { countAfter: newCount }, 'B').catch(() => {});
    // #endregion
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>UseYourTools</Text>
      <Text style={styles.subtitle}>Digital Earth-Tone Planner</Text>
      {initError && (
        <Text style={styles.error}>Init Error: {initError}</Text>
      )}
      {error && (
        <Text style={styles.error}>Runtime Error: {error}</Text>
      )}
      {!mounted && !initError && (
        <Text style={styles.counter}>Loading...</Text>
      )}
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

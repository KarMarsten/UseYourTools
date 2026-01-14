import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { usePreferences } from '../context/PreferencesContext';

interface ViewReportScreenProps {
  html: string;
  title: string;
  onBack: () => void;
}

export default function ViewReportScreen({ html, title, onBack }: ViewReportScreenProps) {
  const { colorScheme } = usePreferences();

  const dynamicStyles = {
    container: { backgroundColor: colorScheme.colors.background },
    header: { backgroundColor: colorScheme.colors.surface },
    title: { color: colorScheme.colors.text },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colorScheme.colors.text }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, dynamicStyles.title]} numberOfLines={2} ellipsizeMode="tail">{title || 'Report'}</Text>
      </View>
      
      <WebView
        source={{ html }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colorScheme.colors.primary} />
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flexShrink: 1,
    minHeight: 30,
    lineHeight: 30,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
});


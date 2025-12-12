import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Prompt } from '../prompts';

interface PromptDetailScreenProps {
  prompt: Prompt;
  onBack: () => void;
}

export default function PromptDetailScreen({ prompt, onBack }: PromptDetailScreenProps) {
  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(prompt.content);
      Alert.alert('Copied!', 'Prompt content copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
          <Text style={styles.copyButtonText}>Copy</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{prompt.title}</Text>
        <Text style={styles.description}>{prompt.description}</Text>
        <View style={styles.divider} />
        <Text style={styles.content}>{prompt.content}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#E7D7C1',
    borderBottomWidth: 1,
    borderBottomColor: '#C9A66B',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#8C6A4A',
    fontWeight: '600',
  },
  copyButton: {
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: '#8C6A4A',
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 16,
    color: '#f5f5dc',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A3A2A',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#6b5b4f',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#C9A66B',
    marginVertical: 20,
  },
  content: {
    fontSize: 14,
    color: '#4A3A2A',
    lineHeight: 22,
    fontFamily: 'monospace',
  },
});


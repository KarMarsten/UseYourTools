import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { prompts, Prompt } from '../prompts';

interface PromptsScreenProps {
  onSelectPrompt: (prompt: Prompt) => void;
  onBack?: () => void;
}

export default function PromptsScreen({ onSelectPrompt, onBack }: PromptsScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Home</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={styles.title}>🌿 Prompts</Text>
          <Text style={styles.subtitle}>Select a prompt to view</Text>
        </View>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {prompts.map((prompt) => (
          <TouchableOpacity
            key={prompt.id}
            style={styles.promptCard}
            onPress={() => onSelectPrompt(prompt)}
            activeOpacity={0.7}
          >
            <Text style={styles.promptTitle}>{prompt.title}</Text>
            <Text style={styles.promptDescription}>{prompt.description}</Text>
          </TouchableOpacity>
        ))}
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
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#E7D7C1',
    borderBottomWidth: 1,
    borderBottomColor: '#C9A66B',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#8C6A4A',
    fontWeight: '600',
  },
  headerContent: {
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8b7355',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0826d',
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  promptCard: {
    backgroundColor: '#E7D7C1',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C9A66B',
    shadowColor: '#4A3A2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A3A2A',
    marginBottom: 8,
  },
  promptDescription: {
    fontSize: 14,
    color: '#6b5b4f',
    lineHeight: 20,
  },
});


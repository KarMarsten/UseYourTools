import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { TIME_BLOCKS, TimeBlock } from '../utils/plannerData';
import { UserPreferences, savePreferences, loadPreferences } from '../utils/preferences';
import { generateTimeBlocks } from '../utils/timeBlockGenerator';

interface SetupScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

export default function SetupScreen({ onComplete, onBack }: SetupScreenProps) {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [timeBlockOrder, setTimeBlockOrder] = useState<string[]>(TIME_BLOCKS.map(b => b.id));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const prefs = await loadPreferences();
      setStartTime(prefs.startTime);
      setEndTime(prefs.endTime);
      setTimeBlockOrder(prefs.timeBlockOrder);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGeneratedBlocksPreview = () => {
    try {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return [];
      }

      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes >= endMinutes) {
        return [];
      }

      // Ensure we have enough block definitions for the preview
      const blockCount = Math.floor((endMinutes - startMinutes) / 120);
      const availableBlocks = timeBlockOrder.length;
      
      if (availableBlocks < blockCount) {
        // Not enough blocks, return empty to show error
        return [];
      }

      const tempPreferences: UserPreferences = {
        startTime,
        endTime,
        timeBlockOrder,
        hasCompletedSetup: false,
      };

      return generateTimeBlocks(tempPreferences);
    } catch {
      return [];
    }
  };

  const handleSave = async () => {
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert('Invalid Time', 'Please enter times in HH:MM format (24-hour).');
      return;
    }

    // Validate start < end
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes >= endMinutes) {
      Alert.alert('Invalid Time', 'Start time must be before end time.');
      return;
    }

    // Check that we have enough block definitions for the generated blocks
    const generatedCount = Math.floor((endMinutes - startMinutes) / 120);
    if (timeBlockOrder.length < generatedCount) {
      Alert.alert(
        'Not Enough Blocks',
        `Your day will have ${generatedCount} time blocks, but you only have ${timeBlockOrder.length} block definitions. Please add more blocks or adjust your time range.`
      );
      return;
    }

    try {
      const preferences: UserPreferences = {
        startTime,
        endTime,
        timeBlockOrder,
        hasCompletedSetup: true,
      };
      await savePreferences(preferences);
      Alert.alert('Success', 'Preferences saved!', [
        { text: 'OK', onPress: onComplete }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences.');
    }
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...timeBlockOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setTimeBlockOrder(newOrder);
  };

  const moveBlockDown = (index: number) => {
    if (index === timeBlockOrder.length - 1) return;
    const newOrder = [...timeBlockOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setTimeBlockOrder(newOrder);
  };

  const getTimeBlockById = (id: string): TimeBlock | undefined => {
    return TIME_BLOCKS.find(block => block.id === id);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Cancel</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>🌿 Setup Planner</Text>
        <Text style={styles.subtitle}>Customize your daily schedule</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Day Times</Text>
          <Text style={styles.sectionDescription}>
            Your day will be divided into 2-hour blocks between these times
          </Text>
          <View style={styles.timeInputContainer}>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <TextInput
                style={styles.timeInputField}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="08:00"
                placeholderTextColor="#a0826d"
              />
              <Text style={styles.timeHint}>24-hour format (HH:MM)</Text>
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>End Time</Text>
              <TextInput
                style={styles.timeInputField}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="22:00"
                placeholderTextColor="#a0826d"
              />
              <Text style={styles.timeHint}>24-hour format (HH:MM)</Text>
            </View>
          </View>
          {(() => {
            const preview = getGeneratedBlocksPreview();
            if (preview.length > 0) {
              return (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewTitle}>Preview: {preview.length} time blocks</Text>
                  {preview.slice(0, 3).map((block, idx) => (
                    <Text key={idx} style={styles.previewText}>
                      {block.time} - {block.title}
                    </Text>
                  ))}
                  {preview.length > 3 && (
                    <Text style={styles.previewText}>...</Text>
                  )}
                </View>
              );
            }
            return null;
          })()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Block Labels</Text>
          <Text style={styles.sectionDescription}>
            Reorder your time block labels. These will be assigned to 2-hour slots in order (first block = first 2 hours, etc.)
          </Text>
          {timeBlockOrder.map((blockId, index) => {
            const block = getTimeBlockById(blockId);
            if (!block) return null;

            return (
              <View key={blockId} style={styles.blockItem}>
                <View style={styles.blockContent}>
                  <Text style={styles.blockTitle}>🌿 {block.title}</Text>
                  {block.description && (
                    <Text style={styles.blockDescription}>{block.description}</Text>
                  )}
                  <Text style={styles.blockTime}>{block.time}</Text>
                </View>
                <View style={styles.blockActions}>
                  <TouchableOpacity
                    style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                    onPress={() => moveBlockUp(index)}
                    disabled={index === 0}
                  >
                    <Text style={styles.moveButtonText}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.moveButton,
                      index === timeBlockOrder.length - 1 && styles.moveButtonDisabled
                    ]}
                    onPress={() => moveBlockDown(index)}
                    disabled={index === timeBlockOrder.length - 1}
                  >
                    <Text style={styles.moveButtonText}>↓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8b7355',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b5b4f',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A3A2A',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b5b4f',
    marginBottom: 16,
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3A2A',
    marginBottom: 8,
  },
  timeInputField: {
    backgroundColor: '#E7D7C1',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: '#4A3A2A',
    borderWidth: 1,
    borderColor: '#C9A66B',
    textAlign: 'center',
  },
  timeHint: {
    fontSize: 12,
    color: '#6b5b4f',
    marginTop: 4,
    textAlign: 'center',
  },
  previewContainer: {
    marginTop: 16,
    backgroundColor: '#f5f5dc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9A66B',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A3A2A',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 12,
    color: '#6b5b4f',
    marginBottom: 4,
  },
  blockItem: {
    flexDirection: 'row',
    backgroundColor: '#E7D7C1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C9A66B',
    alignItems: 'center',
  },
  blockContent: {
    flex: 1,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3A2A',
    marginBottom: 4,
  },
  blockDescription: {
    fontSize: 14,
    color: '#6b5b4f',
    marginBottom: 4,
  },
  blockTime: {
    fontSize: 12,
    color: '#8C6A4A',
    fontWeight: '500',
  },
  blockActions: {
    flexDirection: 'column',
    gap: 8,
  },
  moveButton: {
    backgroundColor: '#8C6A4A',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moveButtonDisabled: {
    backgroundColor: '#a0826d',
    opacity: 0.5,
  },
  moveButtonText: {
    color: '#f5f5dc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#8C6A4A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4A3A2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#f5f5dc',
    fontSize: 18,
    fontWeight: '600',
  },
});


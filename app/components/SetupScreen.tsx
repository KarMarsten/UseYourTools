import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { TIME_BLOCKS, TimeBlock } from '../utils/plannerData';
import { UserPreferences, savePreferences, loadPreferences } from '../utils/preferences';
import { generateTimeBlocks, GeneratedTimeBlock } from '../utils/timeBlockGenerator';

interface SetupScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

export default function SetupScreen({ onComplete, onBack }: SetupScreenProps) {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00'); // Will be auto-updated when start time changes
  const [timeBlockOrder, setTimeBlockOrder] = useState<string[]>(TIME_BLOCKS.map(b => b.id));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  // Auto-update end time when start time changes (9 hours later)
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    
    // Try to parse the time, even if incomplete
    const parts = newStartTime.split(':');
    if (parts.length === 2) {
      const startHours = parseInt(parts[0]) || 0;
      const startMinutes = parseInt(parts[1]) || 0;
      
      // Validate ranges
      if (startHours >= 0 && startHours < 24 && startMinutes >= 0 && startMinutes < 60) {
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = startTotalMinutes + (9 * 60); // Add 9 hours
        
        let endHours = Math.floor(endTotalMinutes / 60);
        const endMins = endTotalMinutes % 60;
        
        // Handle day wrap-around (if end time goes past midnight)
        if (endHours >= 24) {
          endHours = endHours % 24;
        }
        
        const newEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
        setEndTime(newEndTime);
      }
    }
  };

  const loadUserPreferences = async () => {
    try {
      const prefs = await loadPreferences();
      setStartTime(prefs.startTime);
      // When loading, calculate end time from start time (9 hours later) if not already set
      const [hours, minutes] = prefs.startTime.split(':').map(Number);
      const startTotalMinutes = hours * 60 + minutes;
      const endTotalMinutes = startTotalMinutes + (9 * 60);
      let endHours = Math.floor(endTotalMinutes / 60);
      const endMins = endTotalMinutes % 60;
      if (endHours >= 24) {
        endHours = endHours % 24;
      }
      const calculatedEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
      setEndTime(calculatedEndTime);
      setTimeBlockOrder(prefs.timeBlockOrder);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoize the generated blocks preview so it updates when startTime, endTime, or timeBlockOrder changes
  const generatedBlocksPreview = useMemo((): GeneratedTimeBlock[] => {
    try {
      // Try to parse times even if format is incomplete
      const startParts = startTime.split(':');
      const endParts = endTime.split(':');
      
      if (startParts.length !== 2 || endParts.length !== 2) {
        return [];
      }

      const startH = parseInt(startParts[0]) || 0;
      const startM = parseInt(startParts[1]) || 0;
      const endH = parseInt(endParts[0]) || 0;
      const endM = parseInt(endParts[1]) || 0;
      
      // Validate ranges
      if (startH < 0 || startH >= 24 || startM < 0 || startM >= 60 ||
          endH < 0 || endH >= 24 || endM < 0 || endM >= 60) {
        return [];
      }

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
        startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
        endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
        timeBlockOrder,
        hasCompletedSetup: false,
      };

      return generateTimeBlocks(tempPreferences);
    } catch {
      return [];
    }
  }, [startTime, endTime, timeBlockOrder]);

  const handleSave = async () => {
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      Alert.alert('Invalid Time', 'Please enter start time in HH:MM format (24-hour).');
      return;
    }

    // Ensure end time is 9 hours after start time
    const [saveStartHours, saveStartMinutes] = startTime.split(':').map(Number);
    const saveStartTotalMinutes = saveStartHours * 60 + saveStartMinutes;
    const saveEndTotalMinutes = saveStartTotalMinutes + (9 * 60);
    let finalEndHours = Math.floor(saveEndTotalMinutes / 60);
    const finalEndMins = saveEndTotalMinutes % 60;
    if (finalEndHours >= 24) {
      finalEndHours = finalEndHours % 24;
    }
    const finalEndTime = `${String(finalEndHours).padStart(2, '0')}:${String(finalEndMins).padStart(2, '0')}`;
    
    // Check that we have enough block definitions for the generated blocks
    const generatedCount = Math.floor((saveEndTotalMinutes - saveStartTotalMinutes) / 120);
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
        endTime: finalEndTime, // Always save as 9 hours after start
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
                onChangeText={handleStartTimeChange}
                placeholder="08:00"
                placeholderTextColor="#a0826d"
              />
              <Text style={styles.timeHint}>24-hour format (HH:MM)</Text>
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>End Time (auto)</Text>
              <TextInput
                style={[styles.timeInputField, styles.timeInputFieldReadOnly]}
                value={endTime}
                editable={false}
                placeholder="22:00"
                placeholderTextColor="#a0826d"
              />
              <Text style={styles.timeHint}>Automatically set to 9 hours after start</Text>
            </View>
          </View>
          {generatedBlocksPreview.length > 0 && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Preview: {generatedBlocksPreview.length} time blocks</Text>
              {generatedBlocksPreview.slice(0, 3).map((block, idx) => (
                <Text key={idx} style={styles.previewText}>
                  {block.time} - {block.title}
                </Text>
              ))}
              {generatedBlocksPreview.length > 3 && (
                <Text style={styles.previewText}>...</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Block Labels</Text>
          <Text style={styles.sectionDescription}>
            Reorder your time block labels. These will be assigned to 2-hour slots in order (first block = first 2 hours, etc.)
          </Text>
          {timeBlockOrder.map((blockId, index) => {
            const block = getTimeBlockById(blockId);
            if (!block) return null;
            
            // Get the generated time for this block from preview
            const generatedBlock = generatedBlocksPreview[index];
            const displayTime = generatedBlock ? generatedBlock.time : block.time;

            return (
              <View key={blockId} style={styles.blockItem}>
                <View style={styles.blockContent}>
                  <Text style={styles.blockTitle}>🌿 {block.title}</Text>
                  {block.description && (
                    <Text style={styles.blockDescription}>{block.description}</Text>
                  )}
                  <Text style={styles.blockTime}>{displayTime}</Text>
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
  timeInputFieldReadOnly: {
    backgroundColor: '#f5f5dc',
    opacity: 0.7,
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


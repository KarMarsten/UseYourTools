import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDayThemeForDate, getDayName } from '../utils/plannerData';
import { loadPreferences } from '../utils/preferences';
import { generateTimeBlocks, GeneratedTimeBlock } from '../utils/timeBlockGenerator';

interface DailyPlannerScreenProps {
  date: Date;
  onBack: () => void;
}

interface DayEntries {
  [timeBlockId: string]: string;
}

export default function DailyPlannerScreen({ date, onBack }: DailyPlannerScreenProps) {
  const [entries, setEntries] = useState<DayEntries>({});
  const [timeBlocks, setTimeBlocks] = useState<GeneratedTimeBlock[]>([]);
  const dateKey = date.toISOString().split('T')[0];
  const dayTheme = getDayThemeForDate(date);
  const dayName = getDayName(date);

  useEffect(() => {
    loadEntries();
    loadCustomTimeBlocks();
  }, [date]);

  const loadCustomTimeBlocks = async () => {
    try {
      const preferences = await loadPreferences();
      // Generate time blocks based on start/end times
      const generatedBlocks = generateTimeBlocks(preferences);
      setTimeBlocks(generatedBlocks);
    } catch (error) {
      console.error('Error loading custom time blocks:', error);
      // Fallback to default blocks if preferences are invalid
      const defaultPrefs = {
        startTime: '08:00',
        endTime: '22:00',
        timeBlockOrder: [],
        hasCompletedSetup: false,
      };
      setTimeBlocks(generateTimeBlocks(defaultPrefs));
    }
  };

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(`planner_${dateKey}`);
      if (stored) {
        setEntries(JSON.parse(stored));
      } else {
        setEntries({});
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const saveEntry = async (timeBlockId: string, text: string) => {
    const newEntries = { ...entries, [timeBlockId]: text };
    setEntries(newEntries);
    try {
      await AsyncStorage.setItem(`planner_${dateKey}`, JSON.stringify(newEntries));
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Calendar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayName}>{dayName}</Text>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
          <View style={styles.themeContainer}>
            <Text style={styles.themeLabel}>🌿</Text>
            <Text style={styles.themeText}>{dayTheme.theme}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {timeBlocks.map((block) => (
          <View key={block.id} style={styles.timeBlock}>
            <View style={styles.timeBlockHeader}>
              <Text style={styles.timeText}>{block.time}</Text>
              <View style={styles.timeBlockTitleContainer}>
                <Text style={styles.timeBlockTitle}>🌿 {block.title}</Text>
                {block.description && (
                  <Text style={styles.timeBlockDescription}>• {block.description}</Text>
                )}
              </View>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="Write your plans here..."
                placeholderTextColor="#a0826d"
                value={entries[block.id] || ''}
                onChangeText={(text) => saveEntry(block.id, text)}
              />
              <View style={styles.handwritingLines}>
                <View style={styles.line} />
                <View style={styles.line} />
              </View>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  dayHeader: {
    marginBottom: 20,
  },
  dayName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A3A2A',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#6b5b4f',
    marginBottom: 16,
  },
  themeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C9A66B',
    padding: 12,
    borderRadius: 8,
  },
  themeLabel: {
    fontSize: 18,
    marginRight: 8,
  },
  themeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3A2A',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#C9A66B',
    marginVertical: 20,
  },
  timeBlock: {
    marginBottom: 24,
    backgroundColor: '#E7D7C1',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C9A66B',
  },
  timeBlockHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8C6A4A',
    width: 90,
    marginRight: 12,
  },
  timeBlockTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  timeBlockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3A2A',
    marginRight: 8,
  },
  timeBlockDescription: {
    fontSize: 14,
    color: '#6b5b4f',
    fontStyle: 'italic',
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: '#f5f5dc',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#4A3A2A',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#C9A66B',
    marginBottom: 8,
  },
  handwritingLines: {
    marginTop: 4,
  },
  line: {
    height: 1,
    backgroundColor: '#A67C52',
    marginBottom: 8,
    opacity: 0.5,
  },
});


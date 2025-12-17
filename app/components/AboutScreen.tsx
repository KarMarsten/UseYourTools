import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';

interface AboutScreenProps {
  onBack: () => void;
}

export default function AboutScreen({ onBack }: AboutScreenProps) {
  const { colorScheme } = usePreferences();
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border, paddingTop: statusBarHeight + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colorScheme.colors.text }]}>About</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.appTitle, { color: colorScheme.colors.text }]}>UseYourTools 🎯</Text>
          <Text style={[styles.subtitle, { color: colorScheme.colors.textSecondary }]}>
            Tools for Job Hunters
          </Text>
          <Text style={[styles.description, { color: colorScheme.colors.text }]}>
            A comprehensive mobile app to help you organize your job search. Track applications, manage resumes and cover letters, compare job offers, and keep everything in one place.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>✨ What's Inside</Text>
          
          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>📅 Calendar & Daily Planner</Text>
            <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
              Plan your week with customizable time blocks and daily themes. Create interviews, appointments, and reminders. Swipe between days to navigate quickly. All events sync with your device calendar.
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>💼 Job Applications</Text>
            <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
              Track every application with position details, status, and notes. Add rejection reasons for unemployment reporting. Search and filter to stay organized. Create interview events directly from applications.
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>🎁 Job Offers</Text>
            <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
              Compare offers side-by-side. Track salary, benefits, and work location (remote, hybrid, or onsite). Create offers directly from your job applications.
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>🎤 Interview Preparation</Text>
            <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
              Prepare for interviews with a question bank, STAR method templates (select questions from the bank or type your own), company research notes, interview feedback tracking, and practice mode with timer.
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>📄 Resumes & Cover Letters</Text>
            <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
              Keep all your documents organized. Preview, share, and manage multiple versions. Mark them as active or inactive for easy organization.
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>📊 Reports</Text>
            <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
              Generate PDF reports for your weekly schedule or unemployment filing. Weekly reports include all your time blocks and events. Unemployment reports include interviews and rejected applications.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>🎨 Make It Yours</Text>
          <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
            Choose your favorite color theme:
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            🌿 Earth-Tone (warm browns and tans)
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            🌊 Cheerful Nature (greens and blues)
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            ☀️ Sunny Sky (vibrant oranges and yellows)
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            💜 Imagination Run Wild (purples and pinks)
          </Text>
          <Text style={[styles.text, { color: colorScheme.colors.textSecondary, marginTop: 12 }]}>
            Customize your schedule, time format, and preferences to fit your workflow.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>💡 Quick Tips</Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Swipe left/right in the daily planner to move between days
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Tap addresses, phone numbers, and emails in events to interact with them
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Use the Job Offers screen to compare multiple offers at once
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Add rejection reasons to help with unemployment reporting
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Use Interview Prep tools to prepare STAR responses with questions from the bank
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Practice answering questions with the timer in Practice Mode
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Long-press the About or Settings icons for helpful tooltips
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>🔒 Your Privacy</Text>
          <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
            All your data stays on your device. We don't use servers or cloud storage. Your job search information is yours alone.
          </Text>
        </View>

        <View style={[styles.footer, { borderTopColor: colorScheme.colors.border }]}>
          <Text style={[styles.footerText, { color: colorScheme.colors.textSecondary }]}>
            Made with ❤️ for job seekers everywhere
          </Text>
          <Text style={[styles.footerText, { color: colorScheme.colors.textSecondary, marginTop: 8 }]}>
            Happy Job Hunting! 🎯✨
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 12,
    paddingTop: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    textAlign: 'center',
  },
});

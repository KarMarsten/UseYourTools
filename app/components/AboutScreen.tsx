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
            A comprehensive mobile app built specifically for job seekers. Organize your job search activities, track applications, manage resumes, and keep everything in one place.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>✨ Features</Text>
          
          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>🏠 Home Screen</Text>
            <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
              The central hub providing quick access to all tools:
            </Text>
            <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
              • Job Sites sidebar: Quick links to popular job search platforms
            </Text>
            <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
              • Tools section: Access to Daily Planner, Calendar, Job Applications, Resumes, and Reports
            </Text>
            <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
              • Clean, modern interface that adapts to your chosen color theme
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>📅 Calendar & Daily Planner</Text>
            <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
              Monthly calendar showing all events and planned activities. Customizable time blocks that adapt to your schedule. Daily themes for focused planning. Persistent notes saved automatically. Swipe left/right to navigate between days. View events with clickable email, phone, and address fields.
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>💼 Job Applications</Text>
            <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
              Comprehensive tracking system with search, statistics, duplicate detection, quick links, filtering, and interview event creation. Human-readable date and time pickers for applied dates. Track application status (Applied, Rejected, Interview) with easy status updates.
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>📄 Resumes</Text>
            <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
              Organize all your resume versions. Preview, share, save, rename, and manage active/inactive status. Support for PDF, DOC, and DOCX files.
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>⚙️ Settings & Customization</Text>
            <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
              Choose from four beautiful color themes. Customize your schedule, time preferences, map app, timezone, and calendar sync.
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>📊 Reports</Text>
            <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
              Generate professional PDF reports including weekly schedules and unemployment reports formatted for filing.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>💡 Tips & Tricks</Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Always return to home to access any tool
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Use search to quickly find if you've already applied somewhere
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Track all rounds of interviews for a single application
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Tap the status badge on any application to quickly change status
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • End time automatically sets to 30 minutes later - but you can always change it
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Name resumes descriptively and mark active ones for easy identification
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Get reminders 10 minutes before each event
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Tap any address to get directions instantly
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • In event view mode, tap email, phone, or address to interact with them
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • Long-press the About (ℹ️) or Settings (⚙️) icons for tooltips
          </Text>
          <Text style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
            • All data stays on your device - nothing is sent to servers
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>🛠️ Technical Details</Text>
          <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
            Built with React Native 0.79.6, Expo SDK 53, and TypeScript. All data stored locally on device (privacy-first). No external servers or cloud storage required. Platform support for iOS (15.1+) and Android.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>📝 License</Text>
          <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
            This project is licensed under the MIT License.
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
    marginBottom: 32,
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
    marginBottom: 16,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
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


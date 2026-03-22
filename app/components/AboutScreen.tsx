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

type FeatureBlock = { title: string; bullets: string[] };

/** Scannable feature list — keep in sync with README at a high level only */
const FEATURE_BLOCKS: FeatureBlock[] = [
  {
    title: '📅 Calendar & Daily Planner',
    bullets: [
      'Time blocks, daily themes, and swipe between days.',
      'Sync interviews, appointments, and reminders with your device calendar.',
      'Link events to applications; see thank-you and follow-up items for the day you are viewing.',
    ],
  },
  {
    title: '💼 Job Applications',
    bullets: [
      'Status, notes, rejection reasons, search/filter, list or kanban.',
      'Drag cards on the board to update status; link interviews and company research.',
      'Follow-up reminders (rejected applications are excluded where noted in the app).',
    ],
  },
  {
    title: '🎁 Job Offers',
    bullets: [
      'Compare salary, benefits, and location (remote / hybrid / onsite).',
      'Create offers from an application when it makes sense.',
    ],
  },
  {
    title: '👤 Reference Management',
    bullets: [
      'Store contacts, link references to applications, reach out via email or phone.',
    ],
  },
  {
    title: '🎤 Interview Preparation',
    bullets: [
      'Question bank, STAR templates, company research, feedback, and practice mode with a timer.',
      'Open company research from an application via the company name.',
    ],
  },
  {
    title: '✉️ Email Templates',
    bullets: [
      'Thank-you, follow-up, accept/decline templates with placeholders.',
      'Track sent mail and thank-you timing; dedicated Thank You Notes list and home reminders.',
    ],
  },
  {
    title: '📄 Resumes & Cover Letters',
    bullets: [
      'Multiple versions, preview/share, active flags, link to applications.',
    ],
  },
  {
    title: '🔁 Data Transfer',
    bullets: [
      'Export/import JSON backup — applications, events, preferences, and stored documents.',
    ],
  },
  {
    title: '📊 Reports',
    bullets: [
      'PDF weekly schedule, unemployment, and job-applications-by-week reports.',
    ],
  },
];

const QUICK_TIPS: string[] = [
  'Swipe left/right in the daily planner to change days.',
  'Tap addresses, phone numbers, and emails in events to open Maps, phone, or mail.',
  'Link events and applications — updates stay in sync.',
  'Use Job Offers to compare multiple offers side by side.',
  'Add rejection reasons where it helps with unemployment reporting.',
  'Use Interview Prep for STAR answers, the question bank, and the practice timer.',
  'Long-press the About (ℹ️) or Settings (⚙️) icons for a quick label.',
  'Settings → Data Transfer for backup and moving to another device.',
];

const THEME_BULLETS: string[] = [
  '🌿 Earth-Tone — warm browns and tans',
  '🌊 Cheerful Nature — greens and blues',
  '☀️ Sunny Sky — oranges and yellows',
  '💜 Imagination Run Wild — purples and pinks',
  '✨ Modern — indigo, purple, pink; optional dark mode',
];

export default function AboutScreen({ onBack }: AboutScreenProps) {
  const { colorScheme } = usePreferences();
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colorScheme.colors.surface,
            borderBottomColor: colorScheme.colors.border,
            paddingTop: statusBarHeight + 12,
          },
        ]}
      >
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
            Organize your job search on your phone: applications, calendar, offers, interviews, documents,
            and reports. Available on iOS and Android.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>✨ What’s inside</Text>
          {FEATURE_BLOCKS.map((block) => (
            <View key={block.title} style={styles.subsection}>
              <Text style={[styles.subsectionTitle, { color: colorScheme.colors.text }]}>{block.title}</Text>
              {block.bullets.map((line) => (
                <Text
                  key={`${block.title}-${line}`}
                  style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}
                >
                  • {line}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>🎨 Themes</Text>
          <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
            Pick a color theme and adjust schedule and time format in Settings.
          </Text>
          {THEME_BULLETS.map((line) => (
            <Text key={line} style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>💡 Quick tips</Text>
          {QUICK_TIPS.map((line) => (
            <Text key={line} style={[styles.bullet, { color: colorScheme.colors.textSecondary }]}>
              • {line}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>📱 Platforms</Text>
          <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
            iOS and Android — same features, including documents, calendar sync, and notifications.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>🔒 Privacy</Text>
          <Text style={[styles.text, { color: colorScheme.colors.textSecondary }]}>
            Your data stays on your device. No account or cloud storage from the app. Use Data Transfer when
            you want to move your backup between devices.
          </Text>
        </View>

        <View style={[styles.footer, { borderTopColor: colorScheme.colors.border }]}>
          <Text style={[styles.footerText, { color: colorScheme.colors.textSecondary }]}>
            Made with ❤️ for job seekers everywhere
          </Text>
          <Text style={[styles.footerText, { color: colorScheme.colors.textSecondary, marginTop: 8 }]}>
            Happy job hunting! 🎯✨
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

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import { getAllApplications, JobApplication } from '../utils/applications';
import { getAllEvents, Event } from '../utils/events';
import {
  getAllCompanyResearch,
  getAllInterviewFeedback,
  getAllSTARResponses,
  CompanyResearch,
  InterviewFeedback,
  STARResponse,
} from '../utils/interviewPrep';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDateKey } from '../utils/timeFormatter';

interface UniversalSearchScreenProps {
  onBack: () => void;
  onNavigateToApplication?: (applicationId: string) => void;
  onNavigateToEvent?: (eventId: string) => void;
  onNavigateToInterviewPrep?: (companyName?: string, applicationId?: string) => void;
}

type SearchResultType = 'application' | 'event' | 'company-research' | 'interview-feedback' | 'star-response';

interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  data: JobApplication | Event | CompanyResearch | InterviewFeedback | STARResponse;
}

const RECENT_SEARCHES_KEY = 'universal_search_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export default function UniversalSearchScreen({
  onBack,
  onNavigateToApplication,
  onNavigateToEvent,
  onNavigateToInterviewPrep,
}: UniversalSearchScreenProps) {
  const { colorScheme } = usePreferences();
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<SearchResultType | 'all'>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch(searchQuery);
      generateSuggestions(searchQuery);
      setShowSuggestions(true);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, selectedFilter]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const trimmedQuery = query.trim().toLowerCase();
      if (trimmedQuery.length === 0) return;

      const updated = [trimmedQuery, ...recentSearches.filter(s => s !== trimmedQuery)].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const generateSuggestions = async (query: string) => {
    try {
      const lowerQuery = query.toLowerCase();
      const allSuggestions = new Set<string>();

      // Get suggestions from all data sources
      const [applications, events, companyResearch, interviewFeedback] = await Promise.all([
        getAllApplications(),
        getAllEvents(),
        getAllCompanyResearch(),
        getAllInterviewFeedback(),
      ]);

      // Company names
      applications.forEach(app => {
        if (app.company.toLowerCase().includes(lowerQuery)) {
          allSuggestions.add(app.company);
        }
      });
      events.forEach(event => {
        if (event.company?.toLowerCase().includes(lowerQuery)) {
          allSuggestions.add(event.company);
        }
      });
      companyResearch.forEach(research => {
        if (research.companyName.toLowerCase().includes(lowerQuery)) {
          allSuggestions.add(research.companyName);
        }
      });
      interviewFeedback.forEach(feedback => {
        if (feedback.companyName.toLowerCase().includes(lowerQuery)) {
          allSuggestions.add(feedback.companyName);
        }
      });

      // Position titles
      applications.forEach(app => {
        if (app.positionTitle.toLowerCase().includes(lowerQuery)) {
          allSuggestions.add(app.positionTitle);
        }
      });
      companyResearch.forEach(research => {
        if (research.positionTitle.toLowerCase().includes(lowerQuery)) {
          allSuggestions.add(research.positionTitle);
        }
      });
      interviewFeedback.forEach(feedback => {
        if (feedback.positionTitle.toLowerCase().includes(lowerQuery)) {
          allSuggestions.add(feedback.positionTitle);
        }
      });

      // Interviewer names
      interviewFeedback.forEach(feedback => {
        if (feedback.interviewerNames?.toLowerCase().includes(lowerQuery)) {
          feedback.interviewerNames.split(',').forEach(name => {
            const trimmed = name.trim();
            if (trimmed.toLowerCase().includes(lowerQuery)) {
              allSuggestions.add(trimmed);
            }
          });
        }
      });
      events.forEach(event => {
        if (event.contactName?.toLowerCase().includes(lowerQuery)) {
          allSuggestions.add(event.contactName);
        }
      });

      setSuggestions(Array.from(allSuggestions).slice(0, 10));
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const performSearch = async (query: string) => {
    try {
      const lowerQuery = query.toLowerCase();
      const results: SearchResult[] = [];

      const [applications, events, companyResearch, interviewFeedback, starResponses] = await Promise.all([
        getAllApplications(),
        getAllEvents(),
        getAllCompanyResearch(),
        getAllInterviewFeedback(),
        getAllSTARResponses(),
      ]);

      // Search Applications
      if (selectedFilter === 'all' || selectedFilter === 'application') {
        applications.forEach(app => {
          const matchesCompany = app.company.toLowerCase().includes(lowerQuery);
          const matchesPosition = app.positionTitle.toLowerCase().includes(lowerQuery);
          const matchesNotes = app.notes?.toLowerCase().includes(lowerQuery);
          const matchesSource = app.source?.toLowerCase().includes(lowerQuery);

          if (matchesCompany || matchesPosition || matchesNotes || matchesSource) {
            results.push({
              type: 'application',
              id: app.id,
              title: `${app.company} - ${app.positionTitle}`,
              subtitle: `Applied: ${new Date(app.appliedDate).toLocaleDateString()}`,
              data: app,
            });
          }
        });
      }

      // Search Events
      if (selectedFilter === 'all' || selectedFilter === 'event') {
        events.forEach(event => {
          const matchesCompany = event.company?.toLowerCase().includes(lowerQuery);
          const matchesTitle = event.title.toLowerCase().includes(lowerQuery);
          const matchesJobTitle = event.jobTitle?.toLowerCase().includes(lowerQuery);
          const matchesContactName = event.contactName?.toLowerCase().includes(lowerQuery);
          const matchesNotes = event.notes?.toLowerCase().includes(lowerQuery);

          if (matchesCompany || matchesTitle || matchesJobTitle || matchesContactName || matchesNotes) {
            const [year, month, day] = event.dateKey.split('-').map(Number);
            const eventDate = new Date(year, month - 1, day);
            results.push({
              type: 'event',
              id: event.id,
              title: event.title,
              subtitle: `${event.company || 'Event'} • ${eventDate.toLocaleDateString()}`,
              data: event,
            });
          }
        });
      }

      // Search Company Research
      if (selectedFilter === 'all' || selectedFilter === 'company-research') {
        companyResearch.forEach(research => {
          const matchesCompany = research.companyName.toLowerCase().includes(lowerQuery);
          const matchesPosition = research.positionTitle.toLowerCase().includes(lowerQuery);
          const matchesNotes = research.researchNotes?.toLowerCase().includes(lowerQuery);

          if (matchesCompany || matchesPosition || matchesNotes) {
            results.push({
              type: 'company-research',
              id: research.id,
              title: `${research.companyName} - ${research.positionTitle}`,
              subtitle: `Research Notes`,
              data: research,
            });
          }
        });
      }

      // Search Interview Feedback
      if (selectedFilter === 'all' || selectedFilter === 'interview-feedback') {
        interviewFeedback.forEach(feedback => {
          const matchesCompany = feedback.companyName.toLowerCase().includes(lowerQuery);
          const matchesPosition = feedback.positionTitle.toLowerCase().includes(lowerQuery);
          const matchesInterviewer = feedback.interviewerNames?.toLowerCase().includes(lowerQuery);
          const matchesFeedback = feedback.feedback?.toLowerCase().includes(lowerQuery);
          const matchesStrengths = feedback.strengths?.toLowerCase().includes(lowerQuery);
          const matchesImprovements = feedback.areasForImprovement?.toLowerCase().includes(lowerQuery);

          if (matchesCompany || matchesPosition || matchesInterviewer || matchesFeedback || matchesStrengths || matchesImprovements) {
            results.push({
              type: 'interview-feedback',
              id: feedback.id,
              title: `${feedback.companyName} - ${feedback.positionTitle}`,
              subtitle: `Interview: ${new Date(feedback.interviewDate).toLocaleDateString()}`,
              data: feedback,
            });
          }
        });
      }

      // Search STAR Responses
      if (selectedFilter === 'all' || selectedFilter === 'star-response') {
        starResponses.forEach(response => {
          const matchesQuestion = response.question.toLowerCase().includes(lowerQuery);
          const matchesSituation = response.situation?.toLowerCase().includes(lowerQuery);
          const matchesTask = response.task?.toLowerCase().includes(lowerQuery);
          const matchesAction = response.action?.toLowerCase().includes(lowerQuery);
          const matchesResult = response.result?.toLowerCase().includes(lowerQuery);

          if (matchesQuestion || matchesSituation || matchesTask || matchesAction || matchesResult) {
            results.push({
              type: 'star-response',
              id: response.id,
              title: response.question,
              subtitle: 'STAR Response',
              data: response,
            });
          }
        });
      }

      // Sort results by relevance (exact matches first, then partial matches)
      results.sort((a, b) => {
        const aExact = a.title.toLowerCase() === lowerQuery || a.subtitle.toLowerCase().includes(lowerQuery);
        const bExact = b.title.toLowerCase() === lowerQuery || b.subtitle.toLowerCase().includes(lowerQuery);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Error performing search:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      saveRecentSearch(query);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    saveRecentSearch(suggestion);
  };

  const handleResultPress = (result: SearchResult) => {
    if (result.type === 'application' && onNavigateToApplication) {
      onNavigateToApplication(result.id);
    } else if (result.type === 'event' && onNavigateToEvent) {
      onNavigateToEvent(result.id);
    } else if ((result.type === 'company-research' || result.type === 'interview-feedback') && onNavigateToInterviewPrep) {
      const research = result.data as CompanyResearch | InterviewFeedback;
      const applicationId = 'applicationIds' in research && research.applicationIds.length > 0
        ? research.applicationIds[0]
        : 'applicationId' in research
        ? research.applicationId
        : undefined;
      onNavigateToInterviewPrep(research.companyName, applicationId);
    }
  };

  const getResultIcon = (type: SearchResultType) => {
    switch (type) {
      case 'application':
        return '💼';
      case 'event':
        return '📅';
      case 'company-research':
        return '🔍';
      case 'interview-feedback':
        return '📝';
      case 'star-response':
        return '⭐';
      default:
        return '📄';
    }
  };

  const filterButtons: Array<{ label: string; value: SearchResultType | 'all' }> = [
    { label: 'All', value: 'all' },
    { label: 'Applications', value: 'application' },
    { label: 'Events', value: 'event' },
    { label: 'Research', value: 'company-research' },
    { label: 'Feedback', value: 'interview-feedback' },
    { label: 'STAR', value: 'star-response' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border, paddingTop: statusBarHeight }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colorScheme.colors.text }]}>🔍 Universal Search</Text>
        
        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: colorScheme.colors.background, borderColor: colorScheme.colors.border }]}>
          <TextInput
            style={[styles.searchInput, { color: colorScheme.colors.text }]}
            placeholder="Search applications, events, notes..."
            placeholderTextColor={colorScheme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(searchQuery)}
          />
        </View>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filterButtons.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedFilter === filter.value ? colorScheme.colors.primary : colorScheme.colors.secondary,
                }
              ]}
              onPress={() => setSelectedFilter(filter.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  { color: selectedFilter === filter.value ? '#FFF8E7' : colorScheme.colors.text }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && searchQuery.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
            <Text style={[styles.suggestionsTitle, { color: colorScheme.colors.textSecondary }]}>Suggestions</Text>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <Text style={[styles.suggestionText, { color: colorScheme.colors.text }]}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Searches */}
        {searchQuery.length === 0 && recentSearches.length > 0 && (
          <View style={[styles.recentSearchesContainer, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
            <Text style={[styles.recentSearchesTitle, { color: colorScheme.colors.text }]}>Recent Searches</Text>
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentSearchItem}
                onPress={() => handleSuggestionSelect(search)}
              >
                <Text style={[styles.recentSearchText, { color: colorScheme.colors.text }]}>🔍 {search}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search Results */}
        {searchQuery.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.resultsTitle, { color: colorScheme.colors.text }]}>
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </Text>
            {searchResults.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={[styles.noResultsText, { color: colorScheme.colors.textSecondary }]}>
                  No results found for "{searchQuery}"
                </Text>
              </View>
            ) : (
              searchResults.map((result) => (
                <TouchableOpacity
                  key={`${result.type}-${result.id}`}
                  style={[styles.resultItem, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}
                  onPress={() => handleResultPress(result)}
                >
                  <Text style={[styles.resultIcon, { color: colorScheme.colors.primary }]}>
                    {getResultIcon(result.type)}
                  </Text>
                  <View style={styles.resultContent}>
                    <Text style={[styles.resultTitle, { color: colorScheme.colors.text }]} numberOfLines={1}>
                      {result.title}
                    </Text>
                    <Text style={[styles.resultSubtitle, { color: colorScheme.colors.textSecondary }]} numberOfLines={1}>
                      {result.subtitle}
                    </Text>
                  </View>
                  <Text style={[styles.resultArrow, { color: colorScheme.colors.primary }]}>→</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    marginTop: 8,
  },
  filterContent: {
    paddingRight: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 0,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  suggestionsContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  suggestionText: {
    fontSize: 14,
  },
  recentSearchesContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  recentSearchesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  recentSearchItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  recentSearchText: {
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  noResults: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 13,
  },
  resultArrow: {
    fontSize: 18,
    marginLeft: 8,
  },
});

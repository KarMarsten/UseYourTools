import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import { Event } from '../utils/events';
import { JobApplication } from '../utils/applications';
import { getDateKey } from '../utils/timeFormatter';

interface ActivityStatsVisualizationScreenProps {
  periodType: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  events?: Event[];
  applications?: JobApplication[];
  onBack: () => void;
}

type ViewType = 'table' | 'line' | 'bar';

interface DayStats {
  dateKey: string;
  date: Date;
  applications: number;
  interviews: number;
  events: number;
}

export default function ActivityStatsVisualizationScreen({
  periodType,
  startDate,
  events: initialEvents,
  applications: initialApplications,
  onBack,
}: ActivityStatsVisualizationScreenProps) {
  const { colorScheme } = usePreferences();
  const windowDimensions = useWindowDimensions();
  const isLandscape = windowDimensions.width > windowDimensions.height;
  const [viewType, setViewType] = useState<ViewType>('table');
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [loadedEvents, loadedApplications] = await Promise.all([
        getAllEvents(),
        getAllApplications(),
      ]);
      setEvents(loadedEvents);
      setApplications(loadedApplications);
    };
    loadData();
  }, []);

  const getDateRange = () => {
    if (periodType === 'daily') {
      return { start: startDate, end: startDate, label: startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) };
    } else if (periodType === 'weekly') {
      const weekStart = new Date(startDate);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day;
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return {
        start: weekStart,
        end: weekEnd,
        label: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      };
    } else {
      const monthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      return {
        start: monthStart,
        end: monthEnd,
        label: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
    }
  };

  const { start, end, label } = getDateRange();

  // Calculate statistics by day
  const statsData = useMemo(() => {
    const statsByDay: Record<string, {
      applications: number;
      interviews: number;
      events: number;
    }> = {};

    // Process applications
    applications.forEach(app => {
      const appliedDate = new Date(app.appliedDate);
      appliedDate.setHours(0, 0, 0, 0);
      if (appliedDate >= start && appliedDate <= end) {
        const dateKey = getDateKey(appliedDate);
        if (!statsByDay[dateKey]) {
          statsByDay[dateKey] = { applications: 0, interviews: 0, events: 0 };
        }
        statsByDay[dateKey].applications++;
      }
    });

    // Process events
    events.forEach(event => {
      const [year, month, day] = event.dateKey.split('-').map(Number);
      const eventDate = new Date(year, month - 1, day);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate >= start && eventDate <= end) {
        const dateKey = event.dateKey;
        if (!statsByDay[dateKey]) {
          statsByDay[dateKey] = { applications: 0, interviews: 0, events: 0 };
        }
        if (event.type === 'interview') {
          statsByDay[dateKey].interviews++;
        }
        statsByDay[dateKey].events++;
      }
    });

    // Convert to array and sort
    const sortedDays = Object.keys(statsByDay).sort();
    return sortedDays.map(dateKey => {
      const [year, month, day] = dateKey.split('-').map(Number);
      return {
        dateKey,
        date: new Date(year, month - 1, day),
        ...statsByDay[dateKey],
      };
    });
  }, [start, end, applications, events]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      applications: statsData.reduce((sum, day) => sum + day.applications, 0),
      interviews: statsData.reduce((sum, day) => sum + day.interviews, 0),
      events: statsData.reduce((sum, day) => sum + day.events, 0),
    };
  }, [statsData]);

  // Calculate max value for scaling charts
  const maxValue = useMemo(() => {
    if (statsData.length === 0) return 1;
    return Math.max(
      ...statsData.map(d => Math.max(d.applications, d.interviews, d.events)),
      1
    );
  }, [statsData]);

  const chartHeight = isLandscape ? 300 : 250;
  const chartWidth = windowDimensions.width - 40;

  const renderLineChart = () => {
    if (statsData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={[styles.emptyChartText, { color: colorScheme.colors.textSecondary }]}>
            No data to display
          </Text>
        </View>
      );
    }

    const pointRadius = 4;
    const padding = 40;
    const graphHeight = chartHeight - padding * 2;
    const graphWidth = chartWidth - padding * 2;
    const stepX = statsData.length > 1 ? graphWidth / (statsData.length - 1) : 0;

    // Generate paths for each data series
    const applicationsPath: string[] = [];
    const interviewsPath: string[] = [];
    const eventsPath: string[] = [];

    statsData.forEach((day, index) => {
      const x = padding + (index * stepX);
      const appY = padding + graphHeight - (day.applications / maxValue) * graphHeight;
      const intY = padding + graphHeight - (day.interviews / maxValue) * graphHeight;
      const evtY = padding + graphHeight - (day.events / maxValue) * graphHeight;

      if (index === 0) {
        applicationsPath.push(`M ${x} ${appY}`);
        interviewsPath.push(`M ${x} ${intY}`);
        eventsPath.push(`M ${x} ${evtY}`);
      } else {
        applicationsPath.push(`L ${x} ${appY}`);
        interviewsPath.push(`L ${x} ${intY}`);
        eventsPath.push(`L ${x} ${evtY}`);
      }
    });

    return (
      <View style={[styles.chartContainer, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
        <View style={styles.chartContent}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const value = Math.round(maxValue * ratio);
              const y = padding + graphHeight - (ratio * graphHeight);
              return (
                <View key={i} style={[styles.yAxisLabel, { top: y - 8 }]}>
                  <Text style={[styles.axisText, { color: colorScheme.colors.textSecondary }]}>{value}</Text>
                </View>
              );
            })}
          </View>

          {/* Chart area */}
          <View style={[styles.chartArea, { width: chartWidth, height: chartHeight }]}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding + graphHeight - (ratio * graphHeight);
              return (
                <View
                  key={i}
                  style={[
                    styles.gridLine,
                    {
                      top: y,
                      left: padding,
                      width: graphWidth,
                      backgroundColor: colorScheme.colors.border,
                    },
                  ]}
                />
              );
            })}

            {/* Line paths using View components with proper transforms */}
            <View style={styles.linesContainer}>
              {/* Applications line */}
              {statsData.map((day, index) => {
                if (index === 0) return null;
                const x1 = padding + ((index - 1) * stepX);
                const y1 = padding + graphHeight - (statsData[index - 1].applications / maxValue) * graphHeight;
                const x2 = padding + (index * stepX);
                const y2 = padding + graphHeight - (day.applications / maxValue) * graphHeight;
                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
                return (
                  <View
                    key={`app-line-${index}`}
                    style={[
                      styles.lineSegment,
                      {
                        left: x1,
                        top: y1,
                        width: length,
                        height: 2,
                        backgroundColor: '#4CAF50',
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              })}
              {/* Interviews line */}
              {statsData.map((day, index) => {
                if (index === 0) return null;
                const x1 = padding + ((index - 1) * stepX);
                const y1 = padding + graphHeight - (statsData[index - 1].interviews / maxValue) * graphHeight;
                const x2 = padding + (index * stepX);
                const y2 = padding + graphHeight - (day.interviews / maxValue) * graphHeight;
                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
                return (
                  <View
                    key={`int-line-${index}`}
                    style={[
                      styles.lineSegment,
                      {
                        left: x1,
                        top: y1,
                        width: length,
                        height: 2,
                        backgroundColor: '#2196F3',
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              })}
              {/* Events line */}
              {statsData.map((day, index) => {
                if (index === 0) return null;
                const x1 = padding + ((index - 1) * stepX);
                const y1 = padding + graphHeight - (statsData[index - 1].events / maxValue) * graphHeight;
                const x2 = padding + (index * stepX);
                const y2 = padding + graphHeight - (day.events / maxValue) * graphHeight;
                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
                return (
                  <View
                    key={`evt-line-${index}`}
                    style={[
                      styles.lineSegment,
                      {
                        left: x1,
                        top: y1,
                        width: length,
                        height: 2,
                        backgroundColor: '#FF9800',
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              })}

              {/* Data points */}
              {statsData.map((day, index) => {
                const x = padding + (index * stepX);
                const appY = padding + graphHeight - (day.applications / maxValue) * graphHeight;
                const intY = padding + graphHeight - (day.interviews / maxValue) * graphHeight;
                const evtY = padding + graphHeight - (day.events / maxValue) * graphHeight;
                return (
                  <React.Fragment key={`points-${index}`}>
                    <View style={[styles.dataPoint, { left: x - pointRadius, top: appY - pointRadius, backgroundColor: '#4CAF50' }]} />
                    <View style={[styles.dataPoint, { left: x - pointRadius, top: intY - pointRadius, backgroundColor: '#2196F3' }]} />
                    <View style={[styles.dataPoint, { left: x - pointRadius, top: evtY - pointRadius, backgroundColor: '#FF9800' }]} />
                  </React.Fragment>
                );
              })}
            </View>

            {/* X-axis labels */}
            <View style={styles.xAxis}>
              {statsData.map((day, index) => {
                const x = padding + (index * stepX);
                const dateStr = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <View key={index} style={[styles.xAxisLabel, { left: x - 25 }]}>
                    <Text style={[styles.axisText, { color: colorScheme.colors.textSecondary, fontSize: 10 }]} numberOfLines={1}>
                      {dateStr}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.legendText, { color: colorScheme.colors.text }]}>Applications</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
            <Text style={[styles.legendText, { color: colorScheme.colors.text }]}>Interviews</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
            <Text style={[styles.legendText, { color: colorScheme.colors.text }]}>Events</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBarChart = () => {
    if (statsData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={[styles.emptyChartText, { color: colorScheme.colors.textSecondary }]}>
            No data to display
          </Text>
        </View>
      );
    }

    const padding = 40;
    const graphHeight = chartHeight - padding * 2;
    const graphWidth = chartWidth - padding * 2;
    const barGroupWidth = statsData.length > 0 ? graphWidth / statsData.length : 0;
    const barWidth = barGroupWidth * 0.25; // Each bar takes 25% of group width
    const barSpacing = barGroupWidth * 0.05; // 5% spacing between bars

    return (
      <View style={[styles.chartContainer, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
        <View style={styles.chartContent}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const value = Math.round(maxValue * ratio);
              const y = padding + graphHeight - (ratio * graphHeight);
              return (
                <View key={i} style={[styles.yAxisLabel, { top: y - 8 }]}>
                  <Text style={[styles.axisText, { color: colorScheme.colors.textSecondary }]}>{value}</Text>
                </View>
              );
            })}
          </View>

          {/* Chart area */}
          <View style={[styles.chartArea, { width: chartWidth, height: chartHeight }]}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding + graphHeight - (ratio * graphHeight);
              return (
                <View
                  key={i}
                  style={[
                    styles.gridLine,
                    {
                      top: y,
                      left: padding,
                      width: graphWidth,
                      backgroundColor: colorScheme.colors.border,
                    },
                  ]}
                />
              );
            })}

            {/* Bars */}
            <View style={styles.barsContainer}>
              {statsData.map((day, index) => {
                const groupX = padding + (index * barGroupWidth);
                const baseY = padding + graphHeight;

                const appHeight = (day.applications / maxValue) * graphHeight;
                const intHeight = (day.interviews / maxValue) * graphHeight;
                const evtHeight = (day.events / maxValue) * graphHeight;

                return (
                  <View key={index} style={[styles.barGroup, { left: groupX }]}>
                    {/* Applications bar */}
                    <View
                      style={[
                        styles.bar,
                        {
                          left: barSpacing,
                          bottom: 0,
                          width: barWidth,
                          height: appHeight,
                          backgroundColor: '#4CAF50',
                        },
                      ]}
                    />
                    {/* Interviews bar */}
                    <View
                      style={[
                        styles.bar,
                        {
                          left: barSpacing + barWidth + barSpacing,
                          bottom: 0,
                          width: barWidth,
                          height: intHeight,
                          backgroundColor: '#2196F3',
                        },
                      ]}
                    />
                    {/* Events bar */}
                    <View
                      style={[
                        styles.bar,
                        {
                          left: barSpacing + (barWidth + barSpacing) * 2,
                          bottom: 0,
                          width: barWidth,
                          height: evtHeight,
                          backgroundColor: '#FF9800',
                        },
                      ]}
                    />
                  </View>
                );
              })}
            </View>

            {/* X-axis labels */}
            <View style={styles.xAxis}>
              {statsData.map((day, index) => {
                const x = padding + (index * barGroupWidth) + (barGroupWidth / 2);
                const dateStr = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <View key={index} style={[styles.xAxisLabel, { left: x - 25 }]}>
                    <Text style={[styles.axisText, { color: colorScheme.colors.textSecondary, fontSize: 10 }]} numberOfLines={1}>
                      {dateStr}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.legendText, { color: colorScheme.colors.text }]}>Applications</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
            <Text style={[styles.legendText, { color: colorScheme.colors.text }]}>Interviews</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
            <Text style={[styles.legendText, { color: colorScheme.colors.text }]}>Events</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTableView = () => {
    return (
      <View style={[styles.tableContainer, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
        <View style={[styles.tableHeader, { backgroundColor: colorScheme.colors.secondary }]}>
          <Text style={[styles.tableHeaderText, { color: colorScheme.colors.text }]}>Date</Text>
          <Text style={[styles.tableHeaderText, { color: colorScheme.colors.text }]}>Applications</Text>
          <Text style={[styles.tableHeaderText, { color: colorScheme.colors.text }]}>Interviews</Text>
          <Text style={[styles.tableHeaderText, { color: colorScheme.colors.text }]}>Events</Text>
        </View>
        {statsData.length === 0 ? (
          <View style={styles.emptyTableRow}>
            <Text style={[styles.emptyTableText, { color: colorScheme.colors.textSecondary }]}>
              No activity for this period
            </Text>
          </View>
        ) : (
          statsData.map((day, index) => {
            const dateStr = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return (
              <View
                key={day.dateKey}
                style={[
                  styles.tableRow,
                  {
                    backgroundColor: index % 2 === 0 ? colorScheme.colors.background : colorScheme.colors.surface,
                    borderColor: colorScheme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.tableCell, styles.tableCellDate, { color: colorScheme.colors.text }]}>
                  {dateStr}
                </Text>
                <Text style={[styles.tableCell, { color: colorScheme.colors.text }]}>
                  {day.applications}
                </Text>
                <Text style={[styles.tableCell, { color: colorScheme.colors.text }]}>
                  {day.interviews}
                </Text>
                <Text style={[styles.tableCell, { color: colorScheme.colors.text }]}>
                  {day.events}
                </Text>
              </View>
            );
          })
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colorScheme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colorScheme.colors.text }]}>
          Activity Statistics Report
        </Text>
        <Text style={[styles.subtitle, { color: colorScheme.colors.textSecondary }]}>
          {periodType.charAt(0).toUpperCase() + periodType.slice(1)}: {label}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* View Type Selector */}
        <View style={[styles.viewTypeSelector, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
          <Text style={[styles.viewTypeLabel, { color: colorScheme.colors.text }]}>View Type</Text>
          <View style={styles.viewTypeButtons}>
            <TouchableOpacity
              style={[
                styles.viewTypeButton,
                {
                  backgroundColor: viewType === 'table' ? colorScheme.colors.primary : colorScheme.colors.secondary,
                }
              ]}
              onPress={() => setViewType('table')}
            >
              <Text
                style={[
                  styles.viewTypeButtonText,
                  { color: viewType === 'table' ? '#FFF8E7' : colorScheme.colors.text }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.85}
              >
                Table
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewTypeButton,
                {
                  backgroundColor: viewType === 'line' ? colorScheme.colors.primary : colorScheme.colors.secondary,
                }
              ]}
              onPress={() => setViewType('line')}
            >
              <Text
                style={[
                  styles.viewTypeButtonText,
                  { color: viewType === 'line' ? '#FFF8E7' : colorScheme.colors.text }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.85}
              >
                Line
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewTypeButton,
                {
                  backgroundColor: viewType === 'bar' ? colorScheme.colors.primary : colorScheme.colors.secondary,
                }
              ]}
              onPress={() => setViewType('bar')}
            >
              <Text
                style={[
                  styles.viewTypeButtonText,
                  { color: viewType === 'bar' ? '#FFF8E7' : colorScheme.colors.text }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.85}
              >
                Bar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Visualization */}
        {viewType === 'table' && renderTableView()}
        {viewType === 'line' && renderLineChart()}
        {viewType === 'bar' && renderBarChart()}
      </ScrollView>
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
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  viewTypeSelector: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  viewTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  viewTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  viewTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  chartContent: {
    position: 'relative',
  },
  yAxis: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 35,
  },
  yAxisLabel: {
    position: 'absolute',
    right: 4,
  },
  chartArea: {
    position: 'relative',
    marginLeft: 35,
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    opacity: 0.3,
  },
  linesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lineSegment: {
    position: 'absolute',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFF8E7',
  },
  barsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  barGroup: {
    position: 'absolute',
    bottom: 0,
    height: '100%',
  },
  bar: {
    position: 'absolute',
  },
  xAxis: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 20,
  },
  xAxisLabel: {
    position: 'absolute',
    width: 50,
    alignItems: 'center',
  },
  axisText: {
    fontSize: 11,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
  },
  emptyChart: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 2,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
  },
  tableCellDate: {
    textAlign: 'left',
  },
  emptyTableRow: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

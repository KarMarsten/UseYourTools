import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { UserPreferences } from './preferences';
import { Event } from './events';
import { getAllEvents } from './events';
import { generateTimeBlocks } from './timeBlockGenerator';
import { DAY_THEMES } from './plannerData';
import { getDayThemeForDate } from './plannerData';
import { formatTime12Hour, getDateKey } from './timeFormatter';
import { ColorScheme } from './colorSchemes';
import { JobApplication } from './applications';

/**
 * Generate HTML for weekly schedule PDF
 */
export const generateWeeklyScheduleHTML = (
  weekStart: Date,
  preferences: UserPreferences,
  entries: Record<string, Record<string, string>>,
  events: Event[],
  colorScheme: ColorScheme
): string => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    days.push(date);
  }

  const timeBlocks = generateTimeBlocks(preferences);
  const use12Hour = preferences.use12HourClock;

  const formatTimeDisplay = (time: string): string => {
    if (!time) return '';
    if (use12Hour) {
      return formatTime12Hour(time);
    }
    return time;
  };

  const getDayEvents = (date: Date): Event[] => {
    const dateKey = getDateKey(date);
    return events.filter(e => e.dateKey === dateKey).sort((a, b) => {
      const [aH, aM] = a.startTime.split(':').map(Number);
      const [bH, bM] = b.startTime.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    });
  };

  const getDayEntries = (date: Date): Record<string, string> => {
    const dateKey = getDateKey(date);
    return entries[dateKey] || {};
  };

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: ${colorScheme.colors.background};
          color: ${colorScheme.colors.text};
        }
        .week-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .week-title {
          font-size: 24px;
          font-weight: bold;
          color: ${colorScheme.colors.primary};
          margin-bottom: 10px;
        }
        .week-dates {
          font-size: 14px;
          color: ${colorScheme.colors.textSecondary};
        }
        .day-section {
          page-break-after: always;
          margin-bottom: 30px;
        }
        .day-header {
          background-color: ${colorScheme.colors.surface};
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid ${colorScheme.colors.primary};
        }
        .day-title {
          font-size: 20px;
          font-weight: bold;
          color: ${colorScheme.colors.text};
          margin-bottom: 5px;
        }
        .day-theme {
          font-size: 14px;
          color: ${colorScheme.colors.textSecondary};
          font-style: italic;
        }
        .time-block {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid ${colorScheme.colors.border};
        }
        .time-block-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .time-block-time {
          font-size: 12px;
          color: ${colorScheme.colors.primary};
          font-weight: 600;
        }
        .time-block-title {
          font-size: 16px;
          font-weight: 600;
          color: ${colorScheme.colors.text};
        }
        .time-block-description {
          font-size: 12px;
          color: ${colorScheme.colors.textSecondary};
          margin-top: 4px;
        }
        .entry-lines {
          margin-top: 10px;
          min-height: 40px;
          border-bottom: 1px solid ${colorScheme.colors.border};
          padding-bottom: 5px;
          color: ${colorScheme.colors.text};
          white-space: pre-wrap;
          font-size: 14px;
        }
        .event-block {
          background-color: ${colorScheme.colors.surface};
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          border-left: 3px solid ${colorScheme.colors.accent};
        }
        .event-title {
          font-size: 16px;
          font-weight: 600;
          color: ${colorScheme.colors.text};
          margin-bottom: 6px;
        }
        .event-time {
          font-size: 12px;
          color: ${colorScheme.colors.primary};
          margin-bottom: 4px;
        }
        .event-details {
          font-size: 12px;
          color: ${colorScheme.colors.textSecondary};
          margin-top: 6px;
        }
        .event-detail-row {
          margin-bottom: 3px;
        }
      </style>
    </head>
    <body>
      <div class="week-header">
        <div class="week-title">Weekly Schedule</div>
        <div class="week-dates">${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${days[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
      </div>
  `;

  days.forEach((day, dayIndex) => {
    const dayTheme = getDayThemeForDate(day);
    const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });
    const dayDate = day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const dayEvents = getDayEvents(day);
    const dayEntries = getDayEntries(day);

    html += `
      <div class="day-section">
        <div class="day-header">
          <div class="day-title">${dayName}, ${dayDate}</div>
          <div class="day-theme">${dayTheme.theme}</div>
        </div>
    `;

    // Add events first
    dayEvents.forEach(event => {
      const startTimeStr = formatTimeDisplay(event.startTime);
      const endTimeStr = event.endTime ? formatTimeDisplay(event.endTime) : '';
      const timeStr = endTimeStr ? `${startTimeStr} - ${endTimeStr}` : startTimeStr;

      html += `
        <div class="event-block">
          <div class="event-title">${event.type.charAt(0).toUpperCase() + event.type.slice(1)}: ${event.title}</div>
          <div class="event-time">${timeStr}</div>
      `;

      if (event.company) {
        html += `<div class="event-detail-row"><strong>Company:</strong> ${event.company}</div>`;
      }
      if (event.jobTitle) {
        html += `<div class="event-detail-row"><strong>Job Title:</strong> ${event.jobTitle}</div>`;
      }
      if (event.contactName) {
        html += `<div class="event-detail-row"><strong>Contact:</strong> ${event.contactName}</div>`;
      }
      if (event.address) {
        html += `<div class="event-detail-row"><strong>Address:</strong> ${event.address}</div>`;
      }
      if (event.phone) {
        html += `<div class="event-detail-row"><strong>Phone:</strong> ${event.phone}</div>`;
      }
      if (event.email) {
        html += `<div class="event-detail-row"><strong>Email:</strong> ${event.email}</div>`;
      }
      if (event.notes) {
        html += `<div class="event-detail-row"><strong>Notes:</strong> ${event.notes}</div>`;
      }

      html += `</div>`;
    });

    // Add time blocks with entries
    timeBlocks.forEach(block => {
      const entryKey = block.id;
      const entry = dayEntries[entryKey] || '';

      html += `
        <div class="time-block">
          <div class="time-block-header">
            <div class="time-block-time">${block.time}</div>
            <div class="time-block-title">${block.title}</div>
          </div>
      `;

      if (block.description) {
        html += `<div class="time-block-description">${block.description}</div>`;
      }

      html += `
          <div class="entry-lines">${entry || ''}</div>
        </div>
      `;
    });

    html += `</div>`; // Close day-section
  });

  html += `
      </body>
    </html>
  `;

  return html;
};

/**
 * Generate HTML for unemployment report PDF
 */
export const generateUnemploymentReportHTML = (weekStart: Date, events: Event[], applications: JobApplication[], colorScheme: ColorScheme): string => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    days.push(date);
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  // Filter to only interviews and appointments
  const relevantEvents = events.filter(e => 
    (e.type === 'interview' || e.type === 'appointment') && 
    days.some(d => getDateKey(d) === e.dateKey)
  ).sort((a, b) => {
    const dateCompare = a.dateKey.localeCompare(b.dateKey);
    if (dateCompare !== 0) return dateCompare;
    const [aH, aM] = a.startTime.split(':').map(Number);
    const [bH, bM] = b.startTime.split(':').map(Number);
    return (aH * 60 + aM) - (bH * 60 + bM);
  });

  // Filter to rejected applications within the week (based on application date)
  const rejectedApplications = applications.filter(app => {
    if (app.status !== 'rejected') return false;
    
    // Filter by application date, not effective date, so we show applications in the week they were applied
    const appliedDate = new Date(app.appliedDate);
    appliedDate.setHours(0, 0, 0, 0);
    const weekStartNormalized = new Date(weekStart);
    weekStartNormalized.setHours(0, 0, 0, 0);
    const weekEndNormalized = new Date(weekEnd);
    weekEndNormalized.setHours(0, 0, 0, 0);
    return appliedDate >= weekStartNormalized && appliedDate <= weekEndNormalized;
  }).sort((a, b) => {
    return new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
  });

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: ${colorScheme.colors.background};
          color: ${colorScheme.colors.text};
        }
        .report-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .report-title {
          font-size: 24px;
          font-weight: bold;
          color: ${colorScheme.colors.primary};
          margin-bottom: 10px;
        }
        .report-subtitle {
          font-size: 14px;
          color: ${colorScheme.colors.textSecondary};
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          background-color: ${colorScheme.colors.background};
        }
        th {
          background-color: ${colorScheme.colors.surface};
          padding: 12px;
          text-align: left;
          border: 1px solid ${colorScheme.colors.border};
          font-weight: 600;
          color: ${colorScheme.colors.text};
          font-size: 12px;
        }
        td {
          padding: 10px;
          border: 1px solid ${colorScheme.colors.border};
          font-size: 12px;
          color: ${colorScheme.colors.text};
        }
        tr:nth-child(even) {
          background-color: ${colorScheme.colors.surface};
        }
        .no-events {
          text-align: center;
          padding: 40px;
          color: ${colorScheme.colors.textSecondary};
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-title">Weekly Job Search Activity Report</div>
        <div class="report-subtitle">Week of ${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Type</th>
            <th>Company</th>
            <th>Job Title</th>
            <th>Contact Person</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Rejection Reason</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (relevantEvents.length === 0 && rejectedApplications.length === 0) {
    html += `
      <tr>
        <td colspan="9" class="no-events">No interviews, appointments, or rejected applications for this week</td>
      </tr>
    `;
  } else {
    // Add events first
    relevantEvents.forEach(event => {
      // Parse dateKey as local date components to avoid timezone issues
      // dateKey is in format "YYYY-MM-DD"
      const [year, month, day] = event.dateKey.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const startTimeStr = formatTime12Hour(event.startTime);
      const endTimeStr = event.endTime ? formatTime12Hour(event.endTime) : '';
      const timeStr = endTimeStr ? `${startTimeStr} - ${endTimeStr}` : startTimeStr;

      // Check if this event is linked to a rejected application
      const linkedRejectedApp = event.applicationId 
        ? applications.find(app => app.id === event.applicationId && app.status === 'rejected')
        : null;
      
      // Determine type: "Interview Rejected" if linked to rejected app, otherwise normal type
      let typeDisplay = event.type.charAt(0).toUpperCase() + event.type.slice(1);
      if (event.type === 'interview' && linkedRejectedApp) {
        typeDisplay = 'Interview Rejected';
      }

      html += `
        <tr>
          <td>${dateStr}</td>
          <td>${timeStr}</td>
          <td>${typeDisplay}</td>
          <td>${event.company || '-'}</td>
          <td>${event.jobTitle || '-'}</td>
          <td>${event.contactName || '-'}</td>
          <td>${event.phone || '-'}</td>
          <td>${event.email || '-'}</td>
          <td>${linkedRejectedApp?.rejectedReason || '-'}</td>
        </tr>
      `;
    });

    // Add rejected applications (show application date entry)
    // For rejected applications with interviews, we show both:
    // 1. The interview event (as "Interview Rejected" in events section above)
    // 2. The application date entry (as "Application Rejected" here)
    rejectedApplications.forEach(app => {
      // Always show the application date entry using the applied date
      const appliedDate = new Date(app.appliedDate);
      const dateStr = appliedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = appliedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      // Always show as "Application Rejected" for the application date entry
      // (The interview event is shown separately in the events section above as "Interview Rejected")
      const typeDisplay = 'Application Rejected';

      html += `
        <tr>
          <td>${dateStr}</td>
          <td>${timeStr}</td>
          <td>${typeDisplay}</td>
          <td>${app.company || '-'}</td>
          <td>${app.positionTitle || '-'}</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>${app.rejectedReason || '-'}</td>
        </tr>
      `;
    });
  }

  html += `
        </tbody>
      </table>
      </body>
    </html>
  `;

  return html;
};

/**
 * Export weekly schedule as PDF
 */
export const exportWeeklySchedulePDF = async (
  weekStart: Date,
  preferences: UserPreferences,
  entries: Record<string, Record<string, string>>,
  events: Event[],
  colorScheme: ColorScheme
): Promise<void> => {
  try {
    const html = generateWeeklyScheduleHTML(weekStart, preferences, entries, events, colorScheme);

    // printToFileAsync creates a file in a shareable location, we can use it directly
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Weekly Schedule',
        UTI: 'com.adobe.pdf', // iOS specific: specify PDF UTI
      });
    } else {
      console.log('Sharing not available. File saved at:', uri);
    }
  } catch (error) {
    console.error('Error exporting weekly schedule PDF:', error);
    throw error;
  }
};

/**
 * Export unemployment report as PDF
 */
export const exportUnemploymentReportPDF = async (weekStart: Date, events: Event[], applications: JobApplication[], colorScheme: ColorScheme): Promise<void> => {
  try {
    const html = generateUnemploymentReportHTML(weekStart, events, applications, colorScheme);

    // printToFileAsync creates a file in a shareable location, we can use it directly
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Unemployment Report',
        UTI: 'com.adobe.pdf', // iOS specific: specify PDF UTI
      });
    } else {
      console.log('Sharing not available. File saved at:', uri);
    }
  } catch (error) {
    console.error('Error exporting unemployment report PDF:', error);
    throw error;
  }
};


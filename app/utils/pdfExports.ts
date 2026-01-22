import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { UserPreferences } from './preferences';
import { Event } from './events';
import { generateTimeBlocks } from './timeBlockGenerator';
import { getDayThemeForDate } from './plannerData';
import { formatTime12Hour, getDateKey } from './timeFormatter';
import { ColorScheme, getColorScheme } from './colorSchemes';
import { JobApplication } from './applications';

/**
 * Get light mode color scheme for printing (to save ink)
 * Always returns light mode colors regardless of current theme
 */
const getPrintColorScheme = (colorScheme: ColorScheme): ColorScheme => {
  return getColorScheme(colorScheme.name, false); // Force light mode (false)
};

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
    // Use light mode colors for printing to save ink
    const printColorScheme = getPrintColorScheme(colorScheme);
    const html = generateWeeklyScheduleHTML(weekStart, preferences, entries, events, printColorScheme);

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
    // Use light mode colors for printing to save ink
    const printColorScheme = getPrintColorScheme(colorScheme);
    const html = generateUnemploymentReportHTML(weekStart, events, applications, printColorScheme);

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

/**
 * Generate HTML for job applications report PDF
 */
export const generateJobApplicationsReportHTML = (weekStart: Date, applications: JobApplication[], colorScheme: ColorScheme): string => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  // Filter applications that were applied during this week (based on appliedDate)
  const weekApplications = applications.filter(app => {
    const appliedDate = new Date(app.appliedDate);
    appliedDate.setHours(0, 0, 0, 0);
    const weekStartNormalized = new Date(weekStart);
    weekStartNormalized.setHours(0, 0, 0, 0);
    const weekEndNormalized = new Date(weekEnd);
    weekEndNormalized.setHours(0, 0, 0, 0);
    return appliedDate >= weekStartNormalized && appliedDate <= weekEndNormalized;
  }).sort((a, b) => {
    // Sort by application date and time (earliest first)
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
        .no-applications {
          text-align: center;
          padding: 40px;
          color: ${colorScheme.colors.textSecondary};
          font-style: italic;
        }
        .status-applied {
          color: #1976d2;
          font-weight: 600;
        }
        .status-interview {
          color: #388e3c;
          font-weight: 600;
        }
        .status-rejected {
          color: #d32f2f;
          font-weight: 600;
        }
        .status-no-response {
          color: #f57c00;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-title">Weekly Job Applications Report</div>
        <div class="report-subtitle">Week of ${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Position Title</th>
            <th>Company</th>
            <th>Source</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (weekApplications.length === 0) {
    html += `
      <tr>
        <td colspan="6" class="no-applications">No job applications for this week</td>
      </tr>
    `;
  } else {
    weekApplications.forEach(app => {
      const appliedDate = new Date(app.appliedDate);
      const dateStr = appliedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = appliedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      
      // Format status with appropriate styling class
      let statusDisplay = app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('-', ' ');
      let statusClass = `status-${app.status}`;

      html += `
        <tr>
          <td>${dateStr}</td>
          <td>${timeStr}</td>
          <td>${app.positionTitle || '-'}</td>
          <td>${app.company || '-'}</td>
          <td>${app.source || '-'}</td>
          <td class="${statusClass}">${statusDisplay}</td>
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
 * Export job applications report as PDF
 */
export const exportJobApplicationsReportPDF = async (weekStart: Date, applications: JobApplication[], colorScheme: ColorScheme): Promise<void> => {
  try {
    // Use light mode colors for printing to save ink
    const printColorScheme = getPrintColorScheme(colorScheme);
    const html = generateJobApplicationsReportHTML(weekStart, applications, printColorScheme);

    // printToFileAsync creates a file in a shareable location, we can use it directly
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Job Applications Report',
        UTI: 'com.adobe.pdf', // iOS specific: specify PDF UTI
      });
    } else {
      console.log('Sharing not available. File saved at:', uri);
    }
  } catch (error) {
    console.error('Error exporting job applications report PDF:', error);
    throw error;
  }
};

/**
 * Generate HTML for activity statistics report (daily/weekly/monthly)
 */
export const generateActivityStatsReportHTML = (
  periodType: 'daily' | 'weekly' | 'monthly',
  startDate: Date,
  events: Event[],
  applications: JobApplication[],
  colorScheme: ColorScheme
): string => {
  const getDateRange = () => {
    const endDate = new Date(startDate);
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

  // Calculate statistics
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

  // Process events (interviews and other events)
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

  // Calculate totals
  const totalApplications = Object.values(statsByDay).reduce((sum, day) => sum + day.applications, 0);
  const totalInterviews = Object.values(statsByDay).reduce((sum, day) => sum + day.interviews, 0);
  const totalEvents = Object.values(statsByDay).reduce((sum, day) => sum + day.events, 0);

  // Sort days
  const sortedDays = Object.keys(statsByDay).sort();

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
        .summary-section {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
          flex-wrap: wrap;
        }
        .summary-card {
          background-color: ${colorScheme.colors.surface};
          padding: 20px;
          border-radius: 8px;
          border: 1px solid ${colorScheme.colors.border};
          min-width: 150px;
          text-align: center;
          margin: 10px;
        }
        .summary-label {
          font-size: 14px;
          color: ${colorScheme.colors.textSecondary};
          margin-bottom: 8px;
        }
        .summary-value {
          font-size: 32px;
          font-weight: bold;
          color: ${colorScheme.colors.primary};
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
          text-align: center;
        }
        tr:nth-child(even) {
          background-color: ${colorScheme.colors.surface};
        }
        .date-cell {
          text-align: left;
        }
        .no-data {
          text-align: center;
          padding: 40px;
          color: ${colorScheme.colors.textSecondary};
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-title">Activity Statistics Report</div>
        <div class="report-subtitle">${periodType.charAt(0).toUpperCase() + periodType.slice(1)}: ${label}</div>
      </div>
      <div class="summary-section">
        <div class="summary-card">
          <div class="summary-label">Applications</div>
          <div class="summary-value">${totalApplications}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Interviews</div>
          <div class="summary-value">${totalInterviews}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Events</div>
          <div class="summary-value">${totalEvents}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Applications</th>
            <th>Interviews</th>
            <th>Events</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (sortedDays.length === 0) {
    html += `
      <tr>
        <td colspan="4" class="no-data">No activity for this period</td>
      </tr>
    `;
  } else {
    sortedDays.forEach(dateKey => {
      const [year, month, day] = dateKey.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const dayStats = statsByDay[dateKey];
      html += `
        <tr>
          <td class="date-cell">${dateStr}</td>
          <td>${dayStats.applications}</td>
          <td>${dayStats.interviews}</td>
          <td>${dayStats.events}</td>
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
 * Export activity statistics report as PDF
 */
export const exportActivityStatsReportPDF = async (
  periodType: 'daily' | 'weekly' | 'monthly',
  startDate: Date,
  events: Event[],
  applications: JobApplication[],
  colorScheme: ColorScheme
): Promise<void> => {
  try {
    // Use light mode colors for printing to save ink
    const printColorScheme = getPrintColorScheme(colorScheme);
    const html = generateActivityStatsReportHTML(periodType, startDate, events, applications, printColorScheme);
    const { uri } = await Print.printToFileAsync({ html });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      console.log('Sharing not available. File saved at:', uri);
    }
  } catch (error) {
    console.error('Error exporting activity statistics report PDF:', error);
    throw error;
  }
};

/**
 * Options for daily planner PDF export
 */
export interface DailyPlannerExportOptions {
  includeSchedule: boolean;
  includeApplications: boolean;
  includeEvents: boolean;
}

/**
 * Generate HTML for daily planner PDF
 */
export const generateDailyPlannerHTML = (
  date: Date,
  preferences: UserPreferences,
  entries: Record<string, string>,
  events: Event[],
  applications: JobApplication[],
  options: DailyPlannerExportOptions,
  colorScheme: ColorScheme
): string => {
  const dateKey = getDateKey(date);
  const timeBlocks = generateTimeBlocks(preferences);
  const use12Hour = preferences.use12HourClock;
  const dayTheme = getDayThemeForDate(date);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const formatTimeDisplay = (time: string): string => {
    if (!time) return '';
    if (use12Hour) {
      return formatTime12Hour(time);
    }
    return time;
  };

  const formatTimeRange = (timeRange: string): string => {
    if (!timeRange || timeRange.toLowerCase().includes('evening')) {
      return timeRange;
    }
    const parts = timeRange.split('–');
    if (parts.length !== 2) {
      return timeRange;
    }
    if (use12Hour) {
      return `${formatTime12Hour(parts[0])}–${formatTime12Hour(parts[1])}`;
    }
    return timeRange;
  };

  // Filter events for this date
  const dayEvents = events.filter(e => e.dateKey === dateKey).sort((a, b) => {
    const [aH, aM] = a.startTime.split(':').map(Number);
    const [bH, bM] = b.startTime.split(':').map(Number);
    return (aH * 60 + aM) - (bH * 60 + bM);
  });

  // Filter applications for this date
  const dayApplications = applications.filter(app => {
    const appliedDate = new Date(app.appliedDate);
    appliedDate.setHours(0, 0, 0, 0);
    return getDateKey(appliedDate) === dateKey;
  }).sort((a, b) => {
    return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
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
        .day-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .day-title {
          font-size: 24px;
          font-weight: bold;
          color: ${colorScheme.colors.primary};
          margin-bottom: 10px;
        }
        .day-date {
          font-size: 14px;
          color: ${colorScheme.colors.textSecondary};
          margin-bottom: 10px;
        }
        .day-theme {
          font-size: 14px;
          color: ${colorScheme.colors.textSecondary};
          font-style: italic;
          background-color: ${colorScheme.colors.surface};
          padding: 10px;
          border-radius: 8px;
          margin-top: 10px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: ${colorScheme.colors.text};
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid ${colorScheme.colors.border};
        }
        .time-block {
          background-color: ${colorScheme.colors.surface};
          border: 1px solid ${colorScheme.colors.border};
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }
        .time-block-header {
          display: flex;
          margin-bottom: 10px;
        }
        .time-block-time {
          font-weight: 600;
          color: ${colorScheme.colors.primary};
          width: 100px;
          font-size: 14px;
        }
        .time-block-title {
          font-weight: 600;
          color: ${colorScheme.colors.text};
          flex: 1;
          font-size: 16px;
        }
        .time-block-description {
          font-size: 13px;
          color: ${colorScheme.colors.textSecondary};
          font-style: italic;
          margin-bottom: 10px;
        }
        .entry-content {
          font-size: 14px;
          color: ${colorScheme.colors.text};
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .event-card, .application-card {
          background-color: ${colorScheme.colors.surface};
          border: 1px solid ${colorScheme.colors.border};
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 12px;
        }
        .event-title, .application-title {
          font-size: 16px;
          font-weight: 600;
          color: ${colorScheme.colors.text};
          margin-bottom: 8px;
        }
        .event-time {
          font-size: 14px;
          color: ${colorScheme.colors.primary};
          margin-bottom: 8px;
        }
        .event-type {
          font-size: 12px;
          color: ${colorScheme.colors.textSecondary};
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .event-details, .application-details {
          font-size: 13px;
          color: ${colorScheme.colors.textSecondary};
          margin-top: 8px;
        }
        .event-detail-row, .application-detail-row {
          margin-bottom: 4px;
        }
        .application-status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          margin-left: 8px;
        }
        .status-applied {
          background-color: #4CAF50;
          color: #FFF8E7;
        }
        .status-interview {
          background-color: #2196F3;
          color: #FFF8E7;
        }
        .status-rejected {
          background-color: #F44336;
          color: #FFF8E7;
        }
        .status-no-response {
          background-color: #FF9800;
          color: #FFF8E7;
        }
        .empty-state {
          text-align: center;
          padding: 30px;
          color: ${colorScheme.colors.textSecondary};
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="day-header">
        <div class="day-title">${dayName}</div>
        <div class="day-date">${dateStr}</div>
        <div class="day-theme">🌿 ${dayTheme.theme}</div>
      </div>
  `;

  // Add schedule section
  if (options.includeSchedule) {
    html += `
      <div class="section">
        <div class="section-title">Daily Schedule</div>
    `;

    if (timeBlocks.length === 0) {
      html += `<div class="empty-state">No time blocks configured</div>`;
    } else {
      timeBlocks.forEach(block => {
        const entry = entries[block.id] || '';
        html += `
          <div class="time-block">
            <div class="time-block-header">
              <div class="time-block-time">${formatTimeRange(block.time)}</div>
              <div class="time-block-title">${block.title}</div>
            </div>
        `;
        if (block.description) {
          html += `<div class="time-block-description">${block.description}</div>`;
        }
        html += `
            <div class="entry-content">${entry || '(No entry)'}</div>
          </div>
        `;
      });
    }

    html += `</div>`;
  }

  // Add applications section
  if (options.includeApplications) {
    html += `
      <div class="section">
        <div class="section-title">Job Applications</div>
    `;

    if (dayApplications.length === 0) {
      html += `<div class="empty-state">No applications created on this day</div>`;
    } else {
      dayApplications.forEach(app => {
        const statusClass = `status-${app.status}`;
        html += `
          <div class="application-card">
            <div class="application-title">
              ${app.positionTitle}
              <span class="application-status ${statusClass}">${app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('-', ' ')}</span>
            </div>
            <div class="application-details">
              <div class="application-detail-row"><strong>Company:</strong> ${app.company}</div>
        `;
        if (app.source) {
          html += `<div class="application-detail-row"><strong>Source:</strong> ${app.source}</div>`;
        }
        html += `<div class="application-detail-row"><strong>Applied:</strong> ${new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>`;
        if (app.notes) {
          html += `<div class="application-detail-row"><strong>Notes:</strong> ${app.notes}</div>`;
        }
        html += `
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
  }

  // Add events section
  if (options.includeEvents) {
    html += `
      <div class="section">
        <div class="section-title">Events & Interviews</div>
    `;

    if (dayEvents.length === 0) {
      html += `<div class="empty-state">No events scheduled for this day</div>`;
    } else {
      dayEvents.forEach(event => {
        const eventIcon = event.type === 'interview' ? '💼' : event.type === 'appointment' ? '📅' : '🔔';
        const startTimeStr = formatTimeDisplay(event.startTime);
        const endTimeStr = event.endTime ? formatTimeDisplay(event.endTime) : '';
        const timeStr = endTimeStr ? `${startTimeStr} - ${endTimeStr}` : startTimeStr;

        html += `
          <div class="event-card">
            <div class="event-title">${eventIcon} ${event.title}</div>
            <div class="event-time">${timeStr}</div>
            <div class="event-type">${event.type.charAt(0).toUpperCase() + event.type.slice(1)}</div>
            <div class="event-details">
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
        html += `
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
  }

  html += `
      </body>
    </html>
  `;

  return html;
};

/**
 * Export daily planner as PDF
 */
export const exportDailyPlannerPDF = async (
  date: Date,
  preferences: UserPreferences,
  entries: Record<string, string>,
  events: Event[],
  applications: JobApplication[],
  options: DailyPlannerExportOptions,
  colorScheme: ColorScheme
): Promise<void> => {
  try {
    // Use light mode colors for printing to save ink
    const printColorScheme = getPrintColorScheme(colorScheme);
    const html = generateDailyPlannerHTML(date, preferences, entries, events, applications, options, printColorScheme);
    // printToFileAsync creates a file in a shareable location, we can use it directly
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Daily Planner',
        UTI: 'com.adobe.pdf', // iOS specific: specify PDF UTI
      });
    } else {
      console.log('Sharing not available. File saved at:', uri);
    }
  } catch (error) {
    console.error('Error exporting daily planner PDF:', error);
    throw error;
  }
};

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { UserPreferences } from './preferences';
import { Event } from './events';
import { getAllEvents } from './events';
import { generateTimeBlocks } from './timeBlockGenerator';
import { DAY_THEMES } from './plannerData';
import { getDayThemeForDate } from './plannerData';
import { formatTime12Hour } from './timeFormatter';

/**
 * Generate HTML for weekly schedule PDF
 */
const generateWeeklyScheduleHTML = (
  weekStart: Date,
  preferences: UserPreferences,
  entries: Record<string, Record<string, string>>,
  events: Event[]
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
    const dateKey = date.toISOString().split('T')[0];
    return events.filter(e => e.dateKey === dateKey).sort((a, b) => {
      const [aH, aM] = a.startTime.split(':').map(Number);
      const [bH, bM] = b.startTime.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    });
  };

  const getDayEntries = (date: Date): Record<string, string> => {
    const dateKey = date.toISOString().split('T')[0];
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
          background-color: #FFF8E7;
          color: #4A3A2A;
        }
        .week-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .week-title {
          font-size: 24px;
          font-weight: bold;
          color: #8C6A4A;
          margin-bottom: 10px;
        }
        .week-dates {
          font-size: 14px;
          color: #6b5b4f;
        }
        .day-section {
          page-break-after: always;
          margin-bottom: 30px;
        }
        .day-header {
          background-color: #E7D7C1;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #8C6A4A;
        }
        .day-title {
          font-size: 20px;
          font-weight: bold;
          color: #4A3A2A;
          margin-bottom: 5px;
        }
        .day-theme {
          font-size: 14px;
          color: #6b5b4f;
          font-style: italic;
        }
        .time-block {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #C9A66B;
        }
        .time-block-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .time-block-time {
          font-size: 12px;
          color: #8C6A4A;
          font-weight: 600;
        }
        .time-block-title {
          font-size: 16px;
          font-weight: 600;
          color: #4A3A2A;
        }
        .time-block-description {
          font-size: 12px;
          color: #6b5b4f;
          margin-top: 4px;
        }
        .entry-lines {
          margin-top: 10px;
          min-height: 40px;
          border-bottom: 1px solid #C9A66B;
          padding-bottom: 5px;
          color: #4A3A2A;
          white-space: pre-wrap;
          font-size: 14px;
        }
        .event-block {
          background-color: #E7D7C1;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          border-left: 3px solid #A67C52;
        }
        .event-title {
          font-size: 16px;
          font-weight: 600;
          color: #4A3A2A;
          margin-bottom: 6px;
        }
        .event-time {
          font-size: 12px;
          color: #8C6A4A;
          margin-bottom: 4px;
        }
        .event-details {
          font-size: 12px;
          color: #6b5b4f;
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
const generateUnemploymentReportHTML = (weekStart: Date, events: Event[]): string => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    days.push(date);
  }

  // Filter to only interviews and appointments
  const relevantEvents = events.filter(e => 
    (e.type === 'interview' || e.type === 'appointment') && 
    days.some(d => d.toISOString().split('T')[0] === e.dateKey)
  ).sort((a, b) => {
    const dateCompare = a.dateKey.localeCompare(b.dateKey);
    if (dateCompare !== 0) return dateCompare;
    const [aH, aM] = a.startTime.split(':').map(Number);
    const [bH, bM] = b.startTime.split(':').map(Number);
    return (aH * 60 + aM) - (bH * 60 + bM);
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
          background-color: #FFF8E7;
          color: #4A3A2A;
        }
        .report-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .report-title {
          font-size: 24px;
          font-weight: bold;
          color: #8C6A4A;
          margin-bottom: 10px;
        }
        .report-subtitle {
          font-size: 14px;
          color: #6b5b4f;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          background-color: white;
        }
        th {
          background-color: #E7D7C1;
          padding: 12px;
          text-align: left;
          border: 1px solid #C9A66B;
          font-weight: 600;
          color: #4A3A2A;
          font-size: 12px;
        }
        td {
          padding: 10px;
          border: 1px solid #C9A66B;
          font-size: 12px;
          color: #4A3A2A;
        }
        tr:nth-child(even) {
          background-color: #FFF8E7;
        }
        .no-events {
          text-align: center;
          padding: 40px;
          color: #6b5b4f;
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
          </tr>
        </thead>
        <tbody>
  `;

  if (relevantEvents.length === 0) {
    html += `
      <tr>
        <td colspan="8" class="no-events">No interviews or appointments scheduled for this week</td>
      </tr>
    `;
  } else {
    relevantEvents.forEach(event => {
      const date = new Date(event.dateKey);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const startTimeStr = formatTime12Hour(event.startTime);
      const endTimeStr = event.endTime ? formatTime12Hour(event.endTime) : '';
      const timeStr = endTimeStr ? `${startTimeStr} - ${endTimeStr}` : startTimeStr;

      html += `
        <tr>
          <td>${dateStr}</td>
          <td>${timeStr}</td>
          <td>${event.type.charAt(0).toUpperCase() + event.type.slice(1)}</td>
          <td>${event.company || '-'}</td>
          <td>${event.jobTitle || '-'}</td>
          <td>${event.contactName || '-'}</td>
          <td>${event.phone || '-'}</td>
          <td>${event.email || '-'}</td>
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
  events: Event[]
): Promise<void> => {
  try {
    const html = generateWeeklyScheduleHTML(weekStart, preferences, entries, events);

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
export const exportUnemploymentReportPDF = async (weekStart: Date, events: Event[]): Promise<void> => {
  try {
    const html = generateUnemploymentReportHTML(weekStart, events);

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


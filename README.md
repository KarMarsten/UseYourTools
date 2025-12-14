<p align="center"><img width="400" height="400" alt="UseYourTools App Icon" src="https://github.com/KarMarsten/UseYourTools/blob/main/app/assets/icon.png" /></p>

# UseYourTools - Structured Daily Planner for Job Hunters 📅

A comprehensive daily planning app designed specifically for job seekers, built with React Native and Expo.

---

## ✨ Features

### 📱 Calendar & Planning
- **Interactive Calendar**: Monthly view with visual indicators for days with entries and events
- **Daily Planner**: Customizable time blocks that adapt to your schedule
- **Daily Themes**: Focused planning themes for each day of the week
- **Persistent Storage**: All entries and events are saved locally

### 📅 Event Management

Create and manage events with three types:

- **Interviews**: Full event details with start/end times, company, job title, contact info
- **Appointments**: Similar to interviews, for any scheduled meeting
- **Reminders**: Simple reminders that only require a start time (no end time needed)

**Event Features:**
- **Contact Information**: Store company name, job title, contact name, email, phone, and address
- **Smart Actions**: 
  - 📍 Tap addresses to open in Maps (Apple Maps or Google Maps)
  - 📞 Tap phone numbers to call or text
  - ✉️ Tap email addresses to open your email app
- **Time Management**: 
  - Custom start and end times (end time optional for reminders)
  - Supports both 12-hour and 24-hour time formats
  - Automatic sorting by start time
- **Notifications**: Automatic reminders 10 minutes before event start time
- **View & Edit Modes**: 
  - Tap an event to view details in read-only mode
  - Tap "Edit" button in the upper right to modify
  - Delete events directly from the event list

### ⚙️ Settings & Customization

**Schedule Configuration**
- **Custom Start/End Times**: Set your workday hours (automatically calculates 9-hour blocks)
- **Reorderable Time Blocks**: Drag and drop to arrange your daily routine order
- **Dynamic Time Blocks**: Blocks automatically adjust based on your start/end times

**Visual Customization**
- **4 Color Schemes**: 
  - 🌿 **Earth-Tone** (default): Warm browns, tans, and muted golds
  - 🌊 **Cheerful Nature**: Greens and blues with nature-inspired tones
  - ☀️ **Sunny Sky**: Vibrant oranges and yellows
  - 💜 **Imagination Run Wild**: Purples and pinks with creative flair
- All schemes use a cream background (#FFF8E7) for consistency

**Preferences**
- **Clock Format**: Toggle between 12-hour (AM/PM) and 24-hour (HH:MM) time display
- **Map App Preference**: Choose between Apple Maps and Google Maps for address links

### 📊 Reports

Generate and export professional reports from your planner data:

- **Weekly Schedule Report**
  - View or export your complete weekly schedule as PDF
  - Includes all time blocks, entries, and events for the selected week (Sunday-Saturday)
  - Shows daily themes and formatted time ranges
  - Perfect for reviewing your weekly planning

- **Unemployment Report**
  - Generate formatted reports specifically for unemployment filing
  - Includes company name, contact person, date/time, and job title
  - Only includes interviews and appointments (excludes reminders)
  - Filtered to show only events from the selected week
  - Export as PDF for easy submission

**Report Features:**
- **Week Selector**: Choose any Sunday-Saturday week to generate reports
- **In-App Viewing**: View reports using WebView before exporting
- **PDF Export**: Share or save PDFs with `expo-sharing`
- **Color Preservation**: PDFs respect your selected color scheme
- **All Data Included**: Reports pull from your saved planner entries and events

---

## 🚀 Getting Started

### Quick Start with Expo Go

1. **Clone the repository**
   ```bash
   git clone https://github.com/KarMarsten/UseYourTools.git
   cd UseYourTools/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your device**
   - Install [Expo Go](https://expo.dev/client) on your iOS or Android device
   - Scan the QR code from the terminal or Expo DevTools
   - The app will load on your device

That's it! No need for Xcode, Android Studio, or complex setup.

---

## 📂 Project Structure

```
app/
├── components/          # React components
│   ├── CalendarScreen.tsx
│   ├── DailyPlannerScreen.tsx
│   ├── SetupScreen.tsx
│   ├── ReportsScreen.tsx
│   └── AddEventModal.tsx
├── context/            # React Context providers
├── utils/              # Utility functions (events, PDFs, preferences)
└── assets/             # App icons and images
```

---

## 🛠️ Tech Stack

- **React Native** 0.79.6
- **Expo SDK** 53
- **TypeScript**
- **React Context API** for state management
- **AsyncStorage** for local persistence
- **expo-notifications** for reminders
- **expo-print** for PDF generation

---

## 📱 Usage

1. **First Launch**: Complete the setup wizard to configure your schedule and preferences
2. **Calendar**: Tap any date to view events and open the daily planner
3. **Add Events**: Use the "+ Add Event" button in the daily planner
4. **View Events**: Tap an event to view details in read-only mode
5. **Edit Events**: Tap "Edit" in the event view or edit directly from the list
6. **Reports**: Access reports from the calendar header to view or export PDFs

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

This project is licensed under the **MIT License**.

---

**Happy Planning! 📅✨**

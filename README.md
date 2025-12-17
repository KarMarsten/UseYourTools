<p align="center"><img width="400" height="400" alt="UseYourTools App Icon" src="https://github.com/KarMarsten/UseYourTools/blob/main/app/assets/icon.png" /></p>

# UseYourTools 🎯

**Tools for Job Hunters**

A comprehensive mobile app built specifically for job seekers. Organize your job search activities, track applications, manage resumes, and keep everything in one place.

---

## ✨ Features

### 🏠 Home Screen

The central hub providing quick access to all tools:
- 🔗 **Job Sites** sidebar: Quick links to popular job search platforms (Indeed, LinkedIn, Glassdoor, Monster, ZipRecruiter, Dice)
- 🛠️ **Tools** section: Access to Daily Planner, Calendar, Job Applications, Resumes, and Reports
- 🎨 Clean, modern interface that adapts to your chosen color theme

### 📅 Calendar & Daily Planner

**Calendar View:**
- Monthly calendar showing all events and planned activities
- Visual indicators for days with entries, events, and reminders
- Quick navigation to any date
- Tap any date to open the daily planner

**Daily Planner:**
- Customizable time blocks that adapt to your schedule
- Daily themes for focused planning
- Persistent notes saved automatically for each time block
- Full integration with calendar events

**Event Management:**

Create three types of events:

1. **Interviews** 📞 - Track interview details including:
   - Company name and job title
   - Contact person (name, email, phone)
   - Address (tap to open in Maps)
   - Start and end times (end time defaults to 30 minutes after start)
   - Notes section
   - Can be linked to job applications

2. **Appointments** 📍 - For networking meetings, career fairs, or scheduled activities
   - Same features as interviews
   - Fully customizable end times

3. **Reminders** ⏰ - Simple reminders with title and time
   - Perfect for quick to-dos or deadlines

**Smart Features:**
- ⏱️ Auto-end time: End time automatically sets to 30 minutes after start (fully editable)
- 📍 Tap addresses to open in Apple Maps or Google Maps
- 📞 Tap phone numbers to call or text
- ✉️ Tap email addresses to compose an email
- 🔔 Automatic notifications 10 minutes before each event
- 👁️ View events in read-only mode (tap to view, tap "Edit" to modify)
- 📅 Calendar sync with Apple Calendar or Google Calendar

### 💼 Job Applications

Comprehensive tracking system for all your applications:

**Application Tracking:**
- Position title and company name
- Source (LinkedIn, Indeed, company website, etc.)
- Job posting URL
- Applied date & time (auto-recorded, editable for backfilling)
- Status tracking:
  - Applied (newly submitted)
  - Rejected
  - Interview (application has progressed)
- Notes section

**Smart Features:**
- 🔍 Search: Find applications by company, position, or source
- 📊 Statistics: See application stats at a glance
- ⚠️ Duplicate detection: Warns if you try to apply to the same position twice
- 🔗 Quick links: Tap to open the original job posting
- 🗂️ Filter: View applications by status
- ➕ Create interview events: Easily create interview events from applications
- 📅 Multiple interviews: Link multiple interview events to a single application
- 👀 View interview schedule: See all interview events with date, time, and contact name

### 📄 Resumes

Organize all your resume versions:

**Resume Management:**
- Save multiple resume versions (e.g., "Software Engineer Resume v2")
- Support for PDF, DOC, and DOCX files
- All resumes in one place, sorted by most recent
- Active/Inactive status for better organization

**Actions:**
- 👁️ Preview: View PDF resumes directly in the app
- 📤 Share: Easily share via email, messages, or any app
- 💾 Save: Save resumes to your device
- ✏️ Rename: Give resumes descriptive names
- ✅ Toggle Active/Inactive: Organize your resume collection
- 🗑️ Delete: Remove old versions

### ⚙️ Settings & Customization

**Schedule Setup:**
- Customize workday start time
- Reorder time blocks to match your routine
- Time blocks automatically adjust to your schedule

**Visual Themes:**
Choose from four beautiful color schemes:
- 🌿 Earth-Tone (default): Warm browns and tans
- 🌊 Cheerful Nature: Greens and blues
- ☀️ Sunny Sky: Vibrant oranges and yellows
- 💜 Imagination Run Wild: Purples and pinks

**Preferences:**
- ⏰ 12-hour or 24-hour clock format
- 🗺️ Apple Maps or Google Maps for addresses
- 🌍 Device timezone or custom timezone
- 📅 Calendar sync with Apple Calendar or Google Calendar

### 📊 Reports

Generate professional PDF reports:

**Weekly Schedule Report:**
- Complete view of your week (Sunday through Saturday)
- All time blocks with entries
- All events with full details
- Perfect for weekly reviews

**Unemployment Report:**
- Formatted specifically for unemployment filing
- Includes company, contact person, date, time, and job title
- Only shows interviews and appointments
- Export as PDF for easy submission

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- iOS development: Xcode (for iOS builds)
- Android development: Android Studio (for Android builds)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/KarMarsten/UseYourTools.git
   cd UseYourTools/app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. For iOS, install CocoaPods dependencies:
   ```bash
   cd ios
   pod install
   cd ..
   ```

### Running the App

**Development Build (Recommended for Calendar Sync):**

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

**Development Server:**

```bash
# Start Metro bundler
npm start

# Or with tunnel (for testing on devices outside local network)
npm run start:tunnel
```

**Note:** Calendar sync features require a development build. Expo Go does not support all native features.

### First Time Setup

When you first open the app:
1. Complete the setup wizard to configure your schedule
2. Choose your preferred color scheme
3. Set your time preferences (12/24 hour, timezone)
4. Optionally enable calendar sync
5. Start using your tools!

---

## 📱 How to Use

### Navigating the App

Start at the **Home Screen** - your central hub. From here:
- Use the **Job Sites** sidebar for quick access to job search platforms
- Tap any tool card to access Calendar, Job Applications, Resumes, or Reports

### Creating Events

**From Calendar:**
1. Tap **Calendar** from home
2. Tap any date on the calendar
3. Tap **"+ Add Event"**
4. Choose event type (Interview, Appointment, or Reminder)
5. Fill in details (end time defaults to 30 minutes after start)
6. Tap **"Save"**

**From Job Application:**
1. Tap **Job Applications** from home
2. Find an application with status "Interview"
3. Tap **"+ Add Interview Event"**
4. Event form opens with company and position pre-filled
5. Select interview date, fill in time and contact details
6. Tap **"Save"** - event is automatically linked to the application

### Tracking Job Applications

1. Tap **Job Applications** from home
2. Tap **"+ Add"** to add a new application
3. Fill in position title, company, source, and optional job posting URL
4. Choose application status (Applied, Rejected, or Interview)
5. Add notes if needed
6. Tap **"Save Application"**

Use search to find specific applications or filter by status to see your progress.

### Managing Resumes

1. Tap **Resumes** from home
2. Tap **"+ Add"** to save a resume
3. Select a PDF, DOC, or DOCX file from your device
4. File is saved with its original name (you can rename it later)

To share, save, rename, or delete a resume, use the buttons on each resume card.

### Calendar Sync

To sync events with your device's calendar:

1. Go to **Settings** (gear icon)
2. Under **"Calendar Sync"**, choose **"Apple Calendar"** or **"Google Calendar"**
3. Tap **"Sync All Existing Events to Calendar"** to sync existing events
4. New events will automatically sync going forward

**Note:** The app automatically selects a writable calendar. Read-only calendars (like subscribed calendars) will not be used.

### Generating Reports

1. Tap **Reports** from home
2. Choose report type (Weekly Schedule or Unemployment Report)
3. Select the week you want to report on
4. View the report, then tap **"Export PDF"** to save or share

---

## 🛠️ Technical Details

**Built with:**
- React Native 0.79.6
- Expo SDK 53
- TypeScript
- Local storage with AsyncStorage
- Calendar integration with expo-calendar
- PDF generation with expo-print
- File system with expo-file-system
- Safe area handling with react-native-safe-area-context

**Platform Support:**
- ✅ iOS (requires iOS 15.1+)
- ✅ Android

**Architecture:**
- All data stored locally on device (privacy-first)
- No external servers or cloud storage required
- Calendar sync uses device's native calendar APIs

---

## 💡 Tips & Tricks

- **Home Screen Hub**: Always return to home to access any tool
- **Application Search**: Use search to quickly find if you've already applied somewhere
- **Multiple Interview Events**: Track all rounds of interviews for a single application
- **Quick Status Changes**: Tap the status badge on any application to quickly change status
- **Auto End Time**: End time automatically sets to 30 minutes later - but you can always change it
- **Resume Organization**: Name resumes descriptively and mark active ones for easy identification
- **Smart Notifications**: Get reminders 10 minutes before each event
- **Map Integration**: Tap any address to get directions instantly
- **Privacy First**: All data stays on your device - nothing is sent to servers

---

## 🔧 Troubleshooting

### Development Server Connection

If you're having trouble connecting to the development server:

1. Make sure Metro bundler is running (`npm start`)
2. For iOS: If using tunnel mode, you may need to rebuild the app after Info.plist changes
3. Check that your device and computer are on the same network (for LAN mode)
4. See `app/TROUBLESHOOTING_CONNECTION.md` for more details

### Calendar Sync Issues

- Ensure calendar permissions are granted
- The app automatically selects a writable calendar
- If you have only read-only calendars, the app will create a new writable calendar

---

## 📝 License

This project is licensed under the **MIT License**.

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

---

**Made with ❤️ for job seekers everywhere**

*Happy Job Hunting! 🎯✨*

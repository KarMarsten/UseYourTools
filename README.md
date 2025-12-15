<p align="center"><img width="400" height="400" alt="UseYourTools App Icon" src="https://github.com/KarMarsten/UseYourTools/blob/main/app/assets/icon.png" /></p>

# UseYourTools 🎯

**Tools for Job Hunters**

A beautifully designed mobile app built specifically for job seekers. Organize your job search activities, track applications, manage your resumes, and keep everything in one place.

---

## 🌟 What is UseYourTools?

UseYourTools is a comprehensive toolkit for job seekers that helps you:
- 📅 **Plan your day** with a customizable calendar and daily planner
- 💼 **Track job applications** and search history to avoid duplicates
- 📄 **Manage your resumes** in one convenient location
- 📊 **Generate reports** for unemployment filing or personal tracking
- 🔔 **Never miss an appointment** with automatic reminders
- 🗓️ **Sync with your calendar** to keep everything connected

All your data is stored locally on your device - private, secure, and always accessible.

---

## ✨ Key Features

### 🏠 Home Screen

Start here! The home screen welcomes you and gives you easy access to all your tools:
- **Calendar**: View your schedule and daily planner
- **Job Applications**: Track your job applications and search history
- **Resumes**: Manage your resume files
- **Reports**: View weekly schedules and unemployment reports

### 📅 Calendar

**Calendar View:**
- Monthly calendar showing all your events and planned activities
- Visual indicators for days with entries, events, and reminders
- Quick navigation to any date
- Tap any date to open your daily planner

**Daily Planner:**
- **Customizable Time Blocks**: Arrange your day exactly how you want
- **Flexible Scheduling**: Set your own start and end times (defaults to 9-hour workday)
- **Daily Themes**: Each day of the week has a focused planning theme
- **Persistent Notes**: Write notes for each time block - they're saved automatically

**Event Management:**

Create three types of events:

1. **Interviews** 📞
   - Company name and job title
   - Contact person details (name, email, phone)
   - Address (tap to open in Maps)
   - Start and end times
   - Notes section

2. **Appointments** 📍
   - Same features as interviews
   - Perfect for networking meetings, career fairs, or any scheduled activity

3. **Reminders** ⏰
   - Simple reminders with just a title and time
   - Great for quick to-dos or deadlines

**Smart Actions:**
- 📍 Tap addresses to open in Apple Maps or Google Maps
- 📞 Tap phone numbers to call or send a text
- ✉️ Tap email addresses to compose an email
- 🔔 Get automatic notifications 10 minutes before each event
- 👁️ View events in read-only mode (tap to view, tap "Edit" to modify)

### 💼 Job Applications

Keep track of every job you apply to with a comprehensive tracking system:

**Application Tracking:**
- **Position Title**: Record the exact job title you're applying for
- **Company Name**: Track which companies you've applied to
- **Source**: Note where you found the job (LinkedIn, Indeed, company website, etc.)
- **Job Posting URL**: Save a direct link to the original job posting
- **Applied Date & Time**: Automatically records when you applied (or edit for backfilling)
- **Status**: Track your application status:
  - Applied (newly submitted)
  - Rejected (received a "no thank you")
  - No Response (haven't heard back)
- **Notes**: Add any additional details or follow-up notes

**Smart Features:**
- 🔍 **Search**: Quickly find applications by company, position, or source
- 📊 **Statistics**: See your application stats at a glance (total, applied, rejected, no response)
- ⚠️ **Duplicate Detection**: Warns you if you try to apply to the same position twice
- 🔗 **Quick Links**: Tap to open the original job posting
- 🗂️ **Filter**: View applications by status (all, applied, rejected, no response)

Never lose track of where you've applied, and make sure you don't accidentally apply to the same position twice!

### 📄 Resumes

Keep all your resume versions organized and accessible:

**Resume Management:**
- **Save Multiple Versumes**: Store different versions of your resume (e.g., "Software Engineer Resume v2")
- **File Support**: Works with PDF, DOC, and DOCX files
- **Easy Access**: All your resumes in one place, sorted by most recent
- **File Information**: See file size, type, and when you saved it

**Actions:**
- 📤 **Share**: Easily share your resume via email, messages, or any app
- ✏️ **Rename**: Give your resumes descriptive names for easy identification
- 🗑️ **Delete**: Remove old versions you no longer need

Perfect for managing different resume versions tailored to different job types or industries!

### ⚙️ Settings & Customization

**Schedule Setup:**
- Choose your workday start time (end time automatically set to 9 hours later)
- Reorder time blocks to match your daily routine
- Time blocks automatically adjust to your schedule

**Visual Themes:**
Choose from four beautiful color schemes:
- 🌿 **Earth-Tone** (default): Warm browns and tans
- 🌊 **Cheerful Nature**: Greens and blues
- ☀️ **Sunny Sky**: Vibrant oranges and yellows
- 💜 **Imagination Run Wild**: Purples and pinks

**Preferences:**
- ⏰ 12-hour or 24-hour clock format
- 🗺️ Choose Apple Maps or Google Maps for addresses
- 🌍 Use device timezone or specify a custom timezone
- 📅 Sync events with Apple Calendar or Google Calendar

### 📊 Reports

Generate professional PDF reports from your planning data:

**Weekly Schedule Report:**
- Complete view of your week (Sunday through Saturday)
- All time blocks with entries
- All events with full details
- Perfect for weekly reviews

**Unemployment Report:**
- Formatted specifically for unemployment filing
- Includes company, contact person, date, time, and job title
- Only shows interviews and appointments (excludes reminders)
- Export as PDF for easy submission

---

## 🚀 Getting Started

### For Users

**Option 1: Development Build (Recommended for Calendar Sync)**

If you want calendar sync features, you'll need to build the app yourself:

1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Clone this repository:
   ```bash
   git clone https://github.com/KarMarsten/UseYourTools.git
   cd UseYourTools/app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build and run on iOS:
   ```bash
   npx expo run:ios
   ```
   Or on Android:
   ```bash
   npx expo run:android
   ```

**Option 2: Expo Go (Quick Test)**

For quick testing without calendar sync:

1. Install [Expo Go](https://expo.dev/client) on your phone
2. Clone the repository and install dependencies (steps 1-3 above)
3. Start the development server:
   ```bash
   npm start
   ```
4. Scan the QR code with Expo Go

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

Start at the **Home Screen** - your central hub for all tools. From here, tap any tool card to access:
- 📅 **Calendar** - View your schedule and plan your days
- 💼 **Job Applications** - Track your applications
- 📄 **Resumes** - Manage your resume files
- 📊 **Reports** - Generate reports

### Creating Events

1. From the home screen, tap **Calendar**
2. Tap any date on the calendar
3. Tap **"+ Add Event"** button
4. Choose event type (Interview, Appointment, or Reminder)
5. Fill in the details
6. Tap **"Save"**

### Viewing and Editing Events

- **View**: Tap any event to see details in read-only mode
- **Edit**: Tap the **"Edit"** button in the upper right corner
- **Delete**: Delete from the edit screen

### Tracking Job Applications

1. From the home screen, tap **Job Applications**
2. Tap **"+ Add"** to add a new application
3. Fill in the position title, company, source, and optional job posting URL
4. The applied date/time defaults to now, but you can edit it if you're backfilling
5. Choose the application status
6. Add any notes if needed
7. Tap **"Save Application"**

Use the search bar to find specific applications, or filter by status to see your progress!

### Managing Resumes

1. From the home screen, tap **Resumes**
2. Tap **"+ Add"** to save a resume
3. Select a PDF, DOC, or DOCX file from your device
4. The file is automatically saved with its original name (you can rename it later)

To share, rename, or delete a resume, tap the respective buttons on each resume card.

### Calendar Sync

To sync your events with your device's calendar:

1. Go to **Settings** (gear icon on any screen, or from home screen)
2. Under **"Calendar Sync"**, choose **"Apple Calendar"** or **"Google Calendar"**
3. Tap **"Sync All Existing Events to Calendar"** to sync events you've already created
4. New events will automatically sync going forward

### Generating Reports

1. From the home screen, tap **Reports**
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

**Platform Support:**
- ✅ iOS (requires iOS 15.1+)
- ✅ Android (coming soon)

---

## 💡 Tips & Tricks

- **Home Screen Hub**: Always return to the home screen to access any tool - it's your central command center!
- **Application Search**: Use the search feature in Job Applications to quickly find if you've already applied somewhere
- **Resume Organization**: Name your resumes descriptively (e.g., "Software Engineer - Tech Focus") to easily find the right version
- **Smart Notifications**: You'll get a reminder 10 minutes before each event
- **Map Integration**: Tap any address to get directions instantly
- **Privacy First**: All data stays on your device - nothing is sent to servers

---

## 📝 License

This project is licensed under the **MIT License**.

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

---

**Made with ❤️ for job seekers everywhere**

*Happy Job Hunting! 🎯✨*

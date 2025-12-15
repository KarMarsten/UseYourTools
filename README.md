<p align="center"><img width="400" height="400" alt="UseYourTools App Icon" src="https://github.com/KarMarsten/UseYourTools/blob/main/app/assets/icon.png" /></p>

# UseYourTools 📅

**Your Personal Daily Planner for Job Hunters**

A beautifully designed daily planning app built specifically for job seekers. Organize your job search activities, track interviews and appointments, and keep everything in one place.

---

## 🌟 What is UseYourTools?

UseYourTools is a mobile app that helps job seekers:
- 📅 **Plan your day** with customizable time blocks
- 📋 **Track interviews and appointments** with all the details you need
- 📊 **Generate reports** for unemployment filing or personal tracking
- 🔔 **Never miss an appointment** with automatic reminders
- 🗓️ **Sync with your calendar** to keep everything connected

All your data is stored locally on your device - private, secure, and always accessible.

---

## ✨ Key Features

### 📱 Calendar View
- Monthly calendar showing all your events and planned activities
- Visual indicators for days with entries
- Quick navigation to any date
- Easy access to settings and reports

### 📝 Daily Planner
- **Customizable Time Blocks**: Arrange your day exactly how you want
- **Flexible Scheduling**: Set your own start and end times (defaults to 9-hour workday)
- **Daily Themes**: Each day of the week has a focused planning theme
- **Persistent Notes**: Write notes for each time block - they're saved automatically

### 📅 Event Management

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

### ⚙️ Customization

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
- 📅 Sync events with Apple Calendar or Google Calendar (coming soon)

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
5. Start planning!

---

## 📱 How to Use

### Creating Events

1. Open the calendar and tap any date
2. Tap **"+ Add Event"** button
3. Choose event type (Interview, Appointment, or Reminder)
4. Fill in the details
5. Tap **"Save"**

### Viewing and Editing Events

- **View**: Tap any event to see details in read-only mode
- **Edit**: Tap the **"Edit"** button in the upper right corner
- **Delete**: Swipe left on an event or delete from the edit screen

### Calendar Sync

To sync your events with your device's calendar:

1. Go to **Settings** (gear icon in calendar view)
2. Under **"Calendar Sync"**, choose **"Apple Calendar"**
3. Tap **"Sync All Existing Events to Calendar"** to sync events you've already created
4. New events will automatically sync going forward

### Generating Reports

1. From the calendar view, tap the **"Reports"** button
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

**Platform Support:**
- ✅ iOS (requires iOS 15.1+)
- ✅ Android (coming soon)

---

## 💡 Tips & Tricks

- **Quick Navigation**: Swipe between months in the calendar view
- **Time Block Reordering**: Drag and drop time blocks in Settings to match your routine
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

*Happy Planning! 📅✨*

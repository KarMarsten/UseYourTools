<p align="center"><img width="400" height="400" alt="image" src="https://github.com/KarMarsten/UseYourTools/blob/main/app/assets/icon.png" /></p>

# UseYourTools - Structured Daily Planner for Job Hunters 📅

A comprehensive daily planning app designed specifically for job seekers, built with React Native and Expo.

---

## ✨ App Features

### 📱 iOS Application

**Calendar View**
- Interactive monthly calendar as the landing page
- Visual indicators for days with planner entries (✏️) and events (💬)
- Tap any date to view events and access the daily planner
- Automatic highlighting of today's date

**Daily Planner**
- Customizable time blocks that adapt to your schedule
- Daily themes for focused planning
- Interactive text fields for each time block
- Persistent storage of your entries
- Add events (interviews, appointments, reminders) with:
  - Custom start/end times
  - Contact information (name, email, phone)
  - Address (opens in Maps/Google Maps)
  - Company and job title
  - Notes
  - 10-minute advance notifications

**Settings & Customization**
- **Customizable Schedule**: Set your start and end times (automatically calculates 9-hour workday)
- **Reorderable Time Blocks**: Drag and drop to arrange your daily routine
- **Color Schemes**: Choose from 4 beautiful themes:
  - 🌿 Earth-Tone (default) - Browns and tans
  - 🌊 Cheerful Nature - Greens and blues
  - ☀️ Sunny Sky - Oranges and yellows
  - 💜 Imagination Run Wild - Purples and pinks
  - All backgrounds use a cream color (#FFF8E7)
- **Clock Format**: Toggle between 12-hour and 24-hour time
- **Map App Preference**: Choose between Apple Maps and Google Maps

**Event Management**
- Create events with types: Interview, Appointment, or Reminder
- Reminders don't require an end time
- Clickable contact information:
  - 📍 Address → Opens in Maps
  - 📞 Phone → Call or text option
  - ✉️ Email → Opens default email app
- Automatic notifications 10 minutes before event start time

**Reports**
- **Weekly Schedule**: View or export your complete weekly schedule as PDF
- **Unemployment Report**: Generate a formatted report with company, contact, date/time, and job title for unemployment filing
- Week selector to choose any Sunday-Saturday week
- In-app viewing using WebView
- PDF export with color scheme preservation

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- iOS Simulator (for iOS development) or Android Emulator (for Android)
- Expo CLI (optional, included in dependencies)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/UseYourTools.git
   cd UseYourTools
   ```

2. **Navigate to the app directory**
   ```bash
   cd app
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **For iOS development (macOS required)**
   ```bash
   # Install CocoaPods dependencies
   cd ios
   pod install
   cd ..
   ```

5. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

6. **Run on iOS Simulator**
   ```bash
   npm run ios
   # or
   npx expo run:ios
   ```

7. **Run on Android Emulator**
   ```bash
   npm run android
   # or
   npx expo run:android
   ```

---

## 📂 Repository Structure

```
UseYourTools/
├── app/                          # React Native iOS app
│   ├── components/              # React components
│   │   ├── CalendarScreen.tsx   # Main calendar view
│   │   ├── DailyPlannerScreen.tsx # Daily planning interface
│   │   ├── SetupScreen.tsx      # Settings and preferences
│   │   ├── ReportsScreen.tsx    # Reports and PDF exports
│   │   └── AddEventModal.tsx    # Event creation/editing
│   ├── context/                 # React Context providers
│   │   └── PreferencesContext.tsx # Global preferences state
│   ├── utils/                   # Utility functions
│   │   ├── colorSchemes.ts      # Color scheme definitions
│   │   ├── events.ts            # Event CRUD operations
│   │   ├── pdfExports.ts        # PDF generation
│   │   ├── timeBlockGenerator.ts # Dynamic time block generation
│   │   └── preferences.ts       # User preferences management
│   ├── assets/                  # App icons and images
│   ├── App.tsx                  # Main app component
│   └── package.json             # Dependencies
├── docs/                        # Documentation
│   ├── Overview.md
│   └── Usage.md
└── README.md                    # This file
```

---

## 🎨 Color Schemes

All color schemes use a cream background (#FFF8E7) for consistency and readability:

- **Earth-Tone** (Default): Warm browns (#8C6A4A), tans (#E7D7C1), and muted golds
- **Cheerful Nature**: Greens (#5A8A6A) and blues with nature-inspired tones
- **Sunny Sky**: Vibrant oranges (#D4A574) and yellows (#F5C842)
- **Imagination Run Wild**: Purples (#9B6FA8) and pinks with creative flair

---

## 📱 App Navigation

1. **Calendar Screen** (Landing Page)
   - View monthly calendar
   - See indicators for entries and events
   - Tap date to view events
   - Access Settings (⚙️) and Reports (📊) from header

2. **Daily Planner Screen**
   - View and edit time blocks
   - Add text entries for each block
   - Add events with the "+" button
   - Edit existing events by tapping them

3. **Settings Screen**
   - Configure start/end times
   - Reorder time blocks
   - Select color scheme
   - Toggle clock format
   - Choose map app preference

4. **Reports Screen**
   - Select week (Sunday-Saturday)
   - View or export Weekly Schedule
   - View or export Unemployment Report

---

## 🛠️ Technologies Used

- **React Native** (0.81.5) - Cross-platform mobile framework
- **Expo** (54.0.27) - Development platform
- **TypeScript** - Type safety
- **React Context API** - State management
- **AsyncStorage** - Local data persistence
- **expo-notifications** - Event reminders
- **expo-print** & **expo-sharing** - PDF generation and sharing
- **react-native-webview** - In-app report viewing

---

## 🧩 Customization

### Adding New Time Blocks

Edit `app/utils/plannerData.ts` to modify the default time blocks structure.

### Adding New Color Schemes

Edit `app/utils/colorSchemes.ts` to add new color palette options.

### Modifying Event Types

Update the `Event` interface in `app/utils/events.ts` to add new event types or fields.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

We welcome contributions including:
- Bug fixes
- New features
- UI/UX improvements
- Documentation updates
- New color schemes
- Additional report types

---

## 📝 License

This project is licensed under the **MIT License**.  
See the [`LICENSE`](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- React Native community for excellent documentation and tools
- Inspired by the need for better job search organization and planning

---

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Happy Planning! 📅✨**

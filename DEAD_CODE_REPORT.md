# Dead Code Report

**Last Updated**: December 20, 2025

## Summary

✅ **Dead code cleaned up**: 2 unused component files deleted and 1 unused import removed

## Dead Code Found

### 1. Unused Component Files (DELETED)

#### `app/components/CoverLettersScreen.tsx`
- **Status**: ✅ Deleted
- **Reason**: The cover letters functionality is integrated directly into `ApplicationsScreen.tsx` via tabs
- **Action**: File removed from codebase

#### `app/components/ResumeScreen.tsx`
- **Status**: ✅ Deleted
- **Reason**: The resumes functionality is integrated directly into `ApplicationsScreen.tsx` via tabs
- **Action**: File removed from codebase

### 2. Unused Imports (FIXED)

#### `app/components/ApplicationsScreen.tsx`
- **Import**: `getEventById` from `'../utils/events'`
- **Status**: ✅ Fixed
- **Action**: Removed from imports

## Code Analysis

### Exported Functions Status

All exported functions from utility modules are actively used:

- **timeFormatter.ts**: All exports in use (`formatTime12Hour`, `formatTimeRange`, `getDateKey`)
- **plannerData.ts**: All exports in use (interfaces, constants, helper functions)
- **followUpReminders.ts**: All exports in use
- **preferences.ts**: All exports in use (`savePreferences`, `loadPreferences`, interfaces)
- **applications.ts**: All exports in use
- **offers.ts**: All exports in use (newly added)
- **coverLetters.ts**: All exports in use
- **eventNotifications.ts**: All exports in use
- **calendarSync.ts**: All exports in use
- **resumes.ts**: All exports in use
- **events.ts**: All exports in use (except `getEventById` which is not imported anywhere)
- **pdfExports.ts**: All exports in use
- **entryChecker.ts**: All exports in use
- **eventActions.ts**: All exports in use
- **colorSchemes.ts**: All exports in use
- **timeBlockGenerator.ts**: All exports in use

### Component Status

All active components are referenced and used:
- `HomeScreen` - Main entry point ✅
- `CalendarScreen` - Calendar view ✅
- `DailyPlannerScreen` - Daily planner view ✅
- `SetupScreen` - Initial setup ✅
- `ReportsScreen` - Reports generation ✅
- `ViewReportScreen` - Report viewing ✅
- `ApplicationsScreen` - Job applications management (includes resumes & cover letters tabs) ✅
- `OffersScreen` - Job offers management ✅
- `AboutScreen` - About information ✅
- `AddEventModal` - Event creation/editing ✅

Previously unused components (now deleted):
- `CoverLettersScreen` - ✅ Deleted (functionality in ApplicationsScreen)
- `ResumeScreen` - ✅ Deleted (functionality in ApplicationsScreen)

### Imports Status

- ✅ All imports are used (after removing `getEventById`)
- ✅ No other unused imports detected
- ✅ No unused variables or functions

## Current Codebase Status

- **Total TypeScript/TSX files**: ~27
- **Total lines of code**: ~11,000+
- **All exported functions**: ✅ In use (except `getEventById` which is available but not imported)
- **All active components**: ✅ Referenced and used
- **All utilities**: ✅ Actively used

## Cleanup Actions Taken

✅ **Cleaned up on December 20, 2025**:
- Deleted `app/components/CoverLettersScreen.tsx` (unused component)
- Deleted `app/components/ResumeScreen.tsx` (unused component)
- Removed unused `getEventById` import from `ApplicationsScreen.tsx`

✅ **Cleaned up on January 2025**:
- Removed unused state variables `selectedApplicationForResearch` and `selectedApplicationForFeedback` from `InterviewPrepScreen.tsx`
- Removed unused imports from `InterviewPrepScreen.tsx`: `saveQuestion`, `deleteQuestion`, `getSTARResponseById`, `saveCompanyResearch`, `getCompanyResearchByApplicationId`, `deleteCompanyResearch`, `saveInterviewFeedback`, `getInterviewFeedbackByApplicationId`, `deleteInterviewFeedback`

## Recommendations

1. **Keep codebase clean**: Continue to monitor for unused code during development. The unused import has been removed and unused component files have been deleted.

## Notes

- The `getEventById` function in `events.ts` is still exported and available for use, but it's not currently imported anywhere. This is acceptable as it may be useful for future features.
- The `CoverLettersScreen` and `ResumeScreen` components may have been created during development but were later integrated into `ApplicationsScreen` for a better UX with tabs.

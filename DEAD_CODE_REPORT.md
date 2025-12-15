# Dead Code Report

## Unused Exported Functions

The following functions are exported but never imported or used anywhere in the codebase:

### 1. `resetPreferences` 
- **File**: `app/utils/preferences.ts`
- **Line**: 57
- **Description**: Removes all saved preferences from AsyncStorage
- **Status**: ⚠️ **UNUSED** - Consider removing if not needed for future features

### 2. `cancelAllNotifications`
- **File**: `app/utils/eventNotifications.ts`
- **Line**: 97
- **Description**: Cancels all scheduled notifications
- **Status**: ⚠️ **UNUSED** - Could be useful for cleanup, but currently not called anywhere

### 3. `rescheduleEventNotification`
- **File**: `app/utils/eventNotifications.ts`
- **Line**: 108
- **Description**: Reschedules a notification for an updated event
- **Status**: ⚠️ **UNUSED** - Event updates currently cancel and create new notifications manually

## Recommendation

These functions could be:
1. **Removed** if they're not needed
2. **Kept** if they're planned for future features
3. **Used** if they provide better functionality than current implementation

For `rescheduleEventNotification`, it might be worth using it in the event update flow in `DailyPlannerScreen.tsx` for cleaner code.

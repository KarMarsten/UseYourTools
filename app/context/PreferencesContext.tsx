import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserPreferences, loadPreferences } from '../utils/preferences';
import { getColorScheme, ColorScheme } from '../utils/colorSchemes';

interface PreferencesContextType {
  preferences: UserPreferences | null;
  colorScheme: ColorScheme;
  refreshPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const refreshPreferences = async () => {
    const prefs = await loadPreferences();
    setPreferences(prefs);
  };

  useEffect(() => {
    refreshPreferences();
  }, []);

  const colorScheme = preferences 
    ? getColorScheme(preferences.colorScheme, preferences.darkMode ?? false)
    : getColorScheme('earth-tone', false);

  return (
    <PreferencesContext.Provider value={{ preferences, colorScheme, refreshPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
};


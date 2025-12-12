import { Linking, Alert, Platform } from 'react-native';

export type MapAppPreference = 'apple-maps' | 'google-maps';

/**
 * Opens an address in the preferred map application
 */
export const openAddressInMaps = async (address: string, mapAppPreference: MapAppPreference): Promise<void> => {
  try {
    const encodedAddress = encodeURIComponent(address);
    let url: string;

    if (mapAppPreference === 'google-maps') {
      // Try Google Maps first
      if (Platform.OS === 'ios') {
        url = `comgooglemaps://?q=${encodedAddress}`;
      } else {
        url = `geo:0,0?q=${encodedAddress}`;
      }
      
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        // Fallback to web Google Maps
        url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      }
    } else {
      // Apple Maps
      if (Platform.OS === 'ios') {
        url = `http://maps.apple.com/?q=${encodedAddress}`;
      } else {
        // Android fallback to Google Maps web
        url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      }
    }

    await Linking.openURL(url);
  } catch (error) {
    console.error('Error opening address in maps:', error);
    Alert.alert('Error', 'Could not open maps application');
  }
};

/**
 * Opens phone number with option to call or text
 */
export const openPhoneNumber = (phone: string): void => {
  try {
    if (!phone || phone.trim().length === 0) {
      console.warn('openPhoneNumber called with empty phone number');
      Alert.alert('Error', 'No phone number provided');
      return;
    }

    // Clean phone number (remove non-digit characters except +)
    const cleanedPhone = phone.replace(/[^\d+]/g, '');
    
    console.log('Opening phone number alert for:', phone);
    
    Alert.alert(
      'Phone Number',
      `What would you like to do with ${phone}?`,
      [
        {
          text: 'Call',
          onPress: async () => {
            try {
              console.log('Calling:', cleanedPhone);
              await Linking.openURL(`tel:${cleanedPhone}`);
            } catch (error) {
              console.error('Error opening phone call:', error);
              Alert.alert('Error', 'Could not open phone dialer');
            }
          },
        },
        {
          text: 'Text',
          onPress: async () => {
            try {
              console.log('Texting:', cleanedPhone);
              await Linking.openURL(`sms:${cleanedPhone}`);
            } catch (error) {
              console.error('Error opening text message:', error);
              Alert.alert('Error', 'Could not open text message');
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  } catch (error) {
    console.error('Error with phone number:', error);
    Alert.alert('Error', 'Could not process phone number');
  }
};

/**
 * Opens email address in default email application
 */
export const openEmail = async (email: string): Promise<void> => {
  try {
    await Linking.openURL(`mailto:${email}`);
  } catch (error) {
    console.error('Error opening email:', error);
    Alert.alert('Error', 'Could not open email application');
  }
};


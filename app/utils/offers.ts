import AsyncStorage from '@react-native-async-storage/async-storage';

export interface JobOffer {
  id: string;
  applicationId: string; // Link to the job application
  salaryRange?: string; // e.g., "$80,000 - $100,000"
  benefits?: string; // Benefits description
  workLocation: 'remote' | 'hybrid' | 'onsite'; // Work location type
  notes?: string; // Optional notes about the offer
  createdAt: string; // ISO 8601 date string (YYYY-MM-DDTHH:mm:ss.sssZ)
}

const OFFERS_KEY_PREFIX = 'offer_';
const OFFERS_INDEX_KEY = 'offers_index'; // Stores array of all offer IDs

/**
 * Generate a unique ID for an offer
 */
const generateOfferId = (): string => {
  return `off_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all offer IDs from index
 */
const getOffersIndex = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(OFFERS_INDEX_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error loading offers index:', error);
    return [];
  }
};

/**
 * Save a job offer
 */
export const saveOffer = async (offer: JobOffer): Promise<void> => {
  try {
    // If no ID, generate one
    if (!offer.id) {
      offer.id = generateOfferId();
    }

    // If no createdAt, set it to now
    if (!offer.createdAt) {
      offer.createdAt = new Date().toISOString();
    }

    const key = `${OFFERS_KEY_PREFIX}${offer.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(offer));

    // Update index
    const index = await getOffersIndex();
    if (!index.includes(offer.id)) {
      index.push(offer.id);
      await AsyncStorage.setItem(OFFERS_INDEX_KEY, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Error saving offer:', error);
    throw error;
  }
};

/**
 * Load all job offers
 */
export const getAllOffers = async (): Promise<JobOffer[]> => {
  try {
    const index = await getOffersIndex();
    const offers: JobOffer[] = [];

    for (const id of index) {
      const key = `${OFFERS_KEY_PREFIX}${id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        offers.push(JSON.parse(stored) as JobOffer);
      }
    }

    // Sort by created date (newest first)
    return offers.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error('Error loading offers:', error);
    return [];
  }
};

/**
 * Get an offer by ID
 */
export const getOfferById = async (id: string): Promise<JobOffer | null> => {
  try {
    const key = `${OFFERS_KEY_PREFIX}${id}`;
    const offerData = await AsyncStorage.getItem(key);
    if (offerData) {
      return JSON.parse(offerData) as JobOffer;
    }
    return null;
  } catch (error) {
    console.error('Error getting offer:', error);
    return null;
  }
};

/**
 * Get offers by application ID
 */
export const getOffersByApplicationId = async (applicationId: string): Promise<JobOffer[]> => {
  try {
    const allOffers = await getAllOffers();
    return allOffers.filter(offer => offer.applicationId === applicationId);
  } catch (error) {
    console.error('Error getting offers by application ID:', error);
    return [];
  }
};

/**
 * Delete a job offer
 */
export const deleteOffer = async (offerId: string): Promise<void> => {
  try {
    const key = `${OFFERS_KEY_PREFIX}${offerId}`;
    await AsyncStorage.removeItem(key);

    // Update index
    const index = await getOffersIndex();
    const updatedIndex = index.filter(id => id !== offerId);
    await AsyncStorage.setItem(OFFERS_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Error deleting offer:', error);
    throw error;
  }
};


import { DayTheme, getDayThemeForDate } from './plannerData';

export interface DailyQuote {
  quote: string;
  author?: string;
}

/**
 * Zen quotes organized by day theme
 * Each theme has multiple quotes that rotate based on the date
 */
const QUOTES_BY_THEME: Record<string, DailyQuote[]> = {
  'Momentum & Planning': [
    { quote: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
    { quote: 'A goal without a plan is just a wish.', author: 'Antoine de Saint-Exupéry' },
    { quote: 'Planning is bringing the future into the present so that you can do something about it now.', author: 'Alan Lakein' },
    { quote: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
    { quote: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson' },
    { quote: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
    { quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  ],
  'Deep Focus & Skill Growth': [
    { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { quote: 'Growth begins at the end of your comfort zone.', author: 'Neale Donald Walsch' },
    { quote: 'Practice isn\'t the thing you do once you\'re good. It\'s the thing you do that makes you good.', author: 'Malcolm Gladwell' },
    { quote: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
    { quote: 'Continuous effort—not strength or intelligence—is the key to unlocking our potential.', author: 'Winston Churchill' },
    { quote: 'Invest in yourself. Your career is the engine of your wealth.', author: 'Paul Clitheroe' },
    { quote: 'The only person you are destined to become is the person you decide to be.', author: 'Ralph Waldo Emerson' },
  ],
  'Networking & Connection': [
    { quote: 'Your network is your net worth.', author: 'Porter Gale' },
    { quote: 'The single greatest "people skill" is a highly developed and authentic interest in the other person.', author: 'Bob Burg' },
    { quote: 'Relationships are the currency of the business world.', author: 'Unknown' },
    { quote: 'Alone we can do so little; together we can do so much.', author: 'Helen Keller' },
    { quote: 'The way to develop the best that is in a person is by appreciation and encouragement.', author: 'Charles Schwab' },
    { quote: 'Networking is not about just connecting people. It\'s about connecting people with people, people with ideas, and people with opportunities.', author: 'Michele Jennae' },
    { quote: 'Build relationships before you need them.', author: 'Unknown' },
  ],
  'Projects & Mastery': [
    { quote: 'Excellence is not a skill, it\'s an attitude.', author: 'Ralph Marston' },
    { quote: 'Mastery is not a function of genius or talent. It is a function of time and intense focus applied to a particular field of knowledge.', author: 'Robert Greene' },
    { quote: 'The work you do while you procrastinate is probably the work you should be doing for the rest of your life.', author: 'Jessica Hische' },
    { quote: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
    { quote: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
    { quote: 'Do what you love, and you will never work a day in your life.', author: 'Confucius' },
    { quote: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
  ],
  'Review & Celebration': [
    { quote: 'Celebrate what you\'ve accomplished, but raise the bar a little higher each time you succeed.', author: 'Mia Hamm' },
    { quote: 'Take time to appreciate how far you\'ve come.', author: 'Unknown' },
    { quote: 'Progress, not perfection.', author: 'Unknown' },
    { quote: 'The journey of a thousand miles begins with one step.', author: 'Lao Tzu' },
    { quote: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
    { quote: 'Reflect upon your present blessings, of which every man has plenty; not on your past misfortunes, of which all men have some.', author: 'Charles Dickens' },
    { quote: 'Small steps every day lead to big results.', author: 'Unknown' },
  ],
  'Joy & Life Admin': [
    { quote: 'The purpose of our lives is to be happy.', author: 'Dalai Lama' },
    { quote: 'Life is what happens to you while you\'re busy making other plans.', author: 'John Lennon' },
    { quote: 'Find joy in the ordinary.', author: 'Unknown' },
    { quote: 'The little things? The little moments? They aren\'t little.', author: 'Jon Kabat-Zinn' },
    { quote: 'Life is 10% what happens to you and 90% how you react to it.', author: 'Charles R. Swindoll' },
    { quote: 'Happiness is not something ready made. It comes from your own actions.', author: 'Dalai Lama' },
    { quote: 'Take care of yourself, and everything else will follow.', author: 'Unknown' },
  ],
  'Rest & Renewal': [
    { quote: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott' },
    { quote: 'Rest when you\'re weary. Refresh and renew yourself, your body, your mind, your spirit. Then get back to work.', author: 'Ralph Marston' },
    { quote: 'Take rest; a field that has rested gives a bountiful crop.', author: 'Ovid' },
    { quote: 'In the depth of winter, I finally learned that there was in me an invincible summer.', author: 'Albert Camus' },
    { quote: 'Sometimes the most productive thing you can do is relax.', author: 'Unknown' },
    { quote: 'Your body is your most important tool. Take care of it.', author: 'Unknown' },
    { quote: 'Self-care is not selfish. You cannot serve from an empty vessel.', author: 'Eleanor Brown' },
  ],
};

/**
 * Get a daily quote for a given date
 * The quote rotates based on the day of the year to ensure variety
 */
export const getDailyQuote = (date: Date): DailyQuote => {
  const dayTheme = getDayThemeForDate(date);
  const quotes = QUOTES_BY_THEME[dayTheme.theme] || QUOTES_BY_THEME['Momentum & Planning'];
  
  // Use day of year (1-365/366) to select a quote
  // This ensures the quote stays the same all day but changes daily
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const quoteIndex = dayOfYear % quotes.length;
  
  return quotes[quoteIndex];
};


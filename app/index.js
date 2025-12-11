import { registerRootComponent } from 'expo';
import App from './App';

// #region agent log
console.log('DEBUG_LOG: index.js loaded');
console.log('DEBUG_LOG: Registering root component');
// #endregion

try {
  registerRootComponent(App);
  console.log('DEBUG_LOG: Root component registered successfully');
} catch (error) {
  console.error('DEBUG_LOG: Error registering root component:', error);
  throw error;
}

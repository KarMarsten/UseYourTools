// Disable new architecture at runtime if possible
if (typeof global !== 'undefined') {
  // #region agent log
  console.log('DEBUG_LOG: Disabling new architecture');
  // #endregion
  try {
    // Try to disable bridgeless mode
    if (global.__turboModuleProxy === undefined) {
      global.__turboModuleProxy = null;
    }
  } catch (e) {
    console.log('DEBUG_LOG: Could not modify global turbo module proxy');
  }
}

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

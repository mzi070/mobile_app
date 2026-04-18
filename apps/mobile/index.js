/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Required by @notifee/react-native — must be registered at module level.
// Background notification press events are handled here; navigation happens
// via getInitialNotification() when the app foregrounds.
notifee.onBackgroundEvent(async () => {
  // No-op — navigation is handled in App.tsx via getInitialNotification()
});

AppRegistry.registerComponent(appName, () => App);

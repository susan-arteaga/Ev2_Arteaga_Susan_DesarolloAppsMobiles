import { InjectionToken } from '@angular/core';
import { Preferences, PreferencesPlugin } from '@capacitor/preferences';

// Token del plugin Preferences: permite usar un almacenamiento simulado en las pruebas
export const PREFERENCES_PLUGIN = new InjectionToken<PreferencesPlugin>('PreferencesPlugin', {
  providedIn: 'root',
  factory: () => Preferences,
});

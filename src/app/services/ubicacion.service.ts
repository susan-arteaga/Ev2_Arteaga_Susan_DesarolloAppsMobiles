import { Injectable, InjectionToken, inject } from '@angular/core';
import { Geolocation, GeolocationPlugin } from '@capacitor/geolocation';
import { Ubicacion } from '../models/tarea.model';

// Token que permite reemplazar el plugin real por uno simulado en las pruebas
export const GEOLOCATION_PLUGIN = new InjectionToken<GeolocationPlugin>('GeolocationPlugin', {
  providedIn: 'root',
  factory: () => Geolocation,
});

@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private geolocation = inject(GEOLOCATION_PLUGIN);

  /**
   * Obtiene la ubicación GPS actual del dispositivo.
   * Devuelve null si el usuario niega el permiso o el GPS no está disponible.
   */
  async obtenerUbicacion(): Promise<Ubicacion | null> {
    try {
      const posicion = await this.geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      return {
        latitud: posicion.coords.latitude,
        longitud: posicion.coords.longitude,
      };
    } catch (error) {
      console.warn('No se pudo obtener la ubicación', error);
      return null;
    }
  }

  // Genera un enlace a Google Maps para ver la ubicación
  urlMapa(ubicacion: Ubicacion): string {
    return `https://www.google.com/maps?q=${ubicacion.latitud},${ubicacion.longitud}`;
  }
}

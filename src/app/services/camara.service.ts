import { Injectable, InjectionToken, inject } from '@angular/core';
import { Camera, CameraPlugin, CameraResultType, CameraSource } from '@capacitor/camera';

// Token que permite reemplazar el plugin real por uno simulado en las pruebas
export const CAMERA_PLUGIN = new InjectionToken<CameraPlugin>('CameraPlugin', {
  providedIn: 'root',
  factory: () => Camera,
});

@Injectable({ providedIn: 'root' })
export class CamaraService {
  private camera = inject(CAMERA_PLUGIN);

  /**
   * Abre la cámara (o la galería) y devuelve la imagen como data URL.
   * Devuelve null si el usuario cancela o si ocurre un error.
   */
  async tomarFoto(): Promise<string | null> {
    try {
      const foto = await this.camera.getPhoto({
        quality: 50,                         // Calidad reducida para no llenar el almacenamiento
        width: 600,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,         // Pregunta: Cámara o Galería
      });
      return foto.dataUrl ?? null;
    } catch (error) {
      console.warn('No se pudo capturar la imagen', error);
      return null;
    }
  }
}

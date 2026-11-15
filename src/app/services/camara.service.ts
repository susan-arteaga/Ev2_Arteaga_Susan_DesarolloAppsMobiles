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
      if (!foto.dataUrl) return null;
      return await this.comprimirSiEsGrande(foto.dataUrl);
    } catch (error) {
      console.warn('No se pudo capturar la imagen', error);
      return null;
    }
  }

  /**
   * En el navegador, las imágenes de galería pueden superar los 5 MB de localStorage.
   * Si la imagen es pesada, se redimensiona en un canvas a máx. 400 px (JPEG 60 %).
   */
  private comprimirSiEsGrande(dataUrl: string): Promise<string> {
    if (dataUrl.length < 50_000) return Promise.resolve(dataUrl);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const max = 400;
        const escala = Math.min(1, max / Math.max(img.width || max, img.height || max));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round((img.width || max) * escala);
        canvas.height = Math.round((img.height || max) * escala);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
}

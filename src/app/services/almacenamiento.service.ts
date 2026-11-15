import { Injectable, inject } from '@angular/core';
import { Tarea } from '../models/tarea.model';
import { AuthService } from './auth.service';
import { PREFERENCES_PLUGIN } from './preferences.token';

/**
 * Guarda las tareas en el dispositivo usando Capacitor Preferences.
 * Las tareas se mantienen aunque se cierre la app o no haya internet.
 * Cada usuario tiene su propia lista (clave "tareas_<usuario>").
 */
@Injectable({ providedIn: 'root' })
export class AlmacenamientoService {
  private preferences = inject(PREFERENCES_PLUGIN);
  private auth = inject(AuthService);

  private get clave(): string {
    return `tareas_${this.auth.usuarioActual ?? 'invitado'}`;
  }

  async cargarTareas(): Promise<Tarea[]> {
    const { value } = await this.preferences.get({ key: this.clave });
    return value ? (JSON.parse(value) as Tarea[]) : [];
  }

  async guardarTareas(tareas: Tarea[]): Promise<void> {
    try {
      await this.preferences.set({ key: this.clave, value: JSON.stringify(tareas) });
    } catch {
      // Si alguna foto antigua supera la cuota de 5 MB del navegador, se recorta para no fallar
      const livianas = tareas.map((t) => ({
        ...t,
        foto: t.foto && t.foto.length > 80_000 ? undefined : t.foto,
      }));
      await this.preferences.set({ key: this.clave, value: JSON.stringify(livianas) });
    }
  }
}

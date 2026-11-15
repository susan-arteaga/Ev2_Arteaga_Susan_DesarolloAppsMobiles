import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Tarea } from '../models/tarea.model';

const CLAVE_TAREAS = 'tareas';

/**
 * Guarda las tareas en el dispositivo usando Capacitor Preferences.
 * Las tareas se mantienen aunque se cierre la app o no haya internet.
 */
@Injectable({ providedIn: 'root' })
export class AlmacenamientoService {

  async cargarTareas(): Promise<Tarea[]> {
    const { value } = await Preferences.get({ key: CLAVE_TAREAS });
    return value ? (JSON.parse(value) as Tarea[]) : [];
  }

  async guardarTareas(tareas: Tarea[]): Promise<void> {
    await Preferences.set({ key: CLAVE_TAREAS, value: JSON.stringify(tareas) });
  }
}

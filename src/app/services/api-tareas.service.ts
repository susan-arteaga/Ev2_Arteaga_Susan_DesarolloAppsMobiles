import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { Tarea } from '../models/tarea.model';

// Formato de un "todo" en la API externa (JSONPlaceholder)
interface TodoApi {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiTareasService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Importa tareas desde la API externa y las convierte al formato de la app.
   */
  async importarTareas(cantidad = 5): Promise<Tarea[]> {
    const todos = await firstValueFrom(
      this.http.get<TodoApi[]>(`${this.apiUrl}/todos?_limit=${cantidad}`)
    );
    return todos.map((todo) => ({
      id: Date.now() + todo.id,
      titulo: todo.title,
      descripcion: `Importada desde la API (${todo.completed ? 'completada' : 'pendiente'})`,
      fechaCreacion: new Date().toISOString(),
      sincronizada: true,
      origen: 'api' as const,
    }));
  }

  /**
   * Envía a la API remota las tareas que aún no están sincronizadas.
   * Devuelve la cantidad de tareas enviadas.
   */
  async sincronizarTareas(tareas: Tarea[]): Promise<number> {
    const pendientes = tareas.filter((t) => !t.sincronizada);
    if (pendientes.length === 0) return 0;

    const envios = pendientes.map((tarea) =>
      this.http.post(`${this.apiUrl}/todos`, {
        title: tarea.titulo,
        description: tarea.descripcion,
        latitude: tarea.ubicacion?.latitud ?? null,
        longitude: tarea.ubicacion?.longitud ?? null,
        hasPhoto: !!tarea.foto,           // No se envía la imagen completa (es muy pesada)
        createdAt: tarea.fechaCreacion,
        completed: false,
      })
    );

    await firstValueFrom(forkJoin(envios));
    pendientes.forEach((t) => (t.sincronizada = true));
    return pendientes.length;
  }
}

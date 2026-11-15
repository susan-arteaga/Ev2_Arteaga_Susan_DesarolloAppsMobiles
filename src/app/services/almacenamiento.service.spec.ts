import { TestBed } from '@angular/core/testing';
import { AlmacenamientoService } from './almacenamiento.service';
import { AuthService } from './auth.service';
import { PREFERENCES_PLUGIN } from './preferences.token';
import { Tarea } from '../models/tarea.model';

function crearPreferencesMock() {
  const datos: Record<string, string> = {};
  return {
    datos,
    get: vi.fn(async ({ key }: { key: string }) => ({ value: datos[key] ?? null })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => { datos[key] = value; }),
    remove: vi.fn(async ({ key }: { key: string }) => { delete datos[key]; }),
  };
}

describe('AlmacenamientoService (tareas por usuario)', () => {
  let service: AlmacenamientoService;
  const authMock = { usuarioActual: 'ana' as string | null };

  const tarea = (titulo: string): Tarea => ({
    id: 1, titulo, descripcion: '', fechaCreacion: '', sincronizada: false, origen: 'local',
  });

  beforeEach(() => {
    authMock.usuarioActual = 'ana';
    TestBed.configureTestingModule({
      providers: [
        { provide: PREFERENCES_PLUGIN, useValue: crearPreferencesMock() },
        { provide: AuthService, useValue: authMock },
      ],
    });
    service = TestBed.inject(AlmacenamientoService);
  });

  it('debe guardar y cargar las tareas del usuario', async () => {
    await service.guardarTareas([tarea('Tarea de Ana')]);

    const tareas = await service.cargarTareas();

    expect(tareas.length).toBe(1);
    expect(tareas[0].titulo).toBe('Tarea de Ana');
  });

  it('cada usuario debe ver solo sus propias tareas', async () => {
    await service.guardarTareas([tarea('Tarea de Ana')]);

    authMock.usuarioActual = 'pedro';
    expect(await service.cargarTareas()).toEqual([]);

    await service.guardarTareas([tarea('Tarea de Pedro')]);
    authMock.usuarioActual = 'ana';
    expect((await service.cargarTareas())[0].titulo).toBe('Tarea de Ana');
  });
});

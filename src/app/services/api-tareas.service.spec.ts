import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiTareasService } from './api-tareas.service';
import { Tarea } from '../models/tarea.model';

describe('ApiTareasService (pruebas de la API externa)', () => {
  let service: ApiTareasService;
  let httpMock: HttpTestingController;
  const API = 'https://jsonplaceholder.typicode.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiTareasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe importar tareas y convertirlas al formato de la app', async () => {
    const promesa = service.importarTareas(2);

    const req = httpMock.expectOne(`${API}/todos?_limit=2`);
    expect(req.request.method).toBe('GET');
    req.flush([
      { userId: 1, id: 1, title: 'Tarea API 1', completed: false },
      { userId: 1, id: 2, title: 'Tarea API 2', completed: true },
    ]);

    const tareas = await promesa;
    expect(tareas.length).toBe(2);
    expect(tareas[0].titulo).toBe('Tarea API 1');
    expect(tareas[0].origen).toBe('api');
    expect(tareas[1].descripcion).toContain('completada');
  });

  it('debe enviar solo las tareas no sincronizadas', async () => {
    const tareas: Tarea[] = [
      { id: 1, titulo: 'A', descripcion: '', fechaCreacion: '', sincronizada: false, origen: 'local',
        ubicacion: { latitud: -33.4, longitud: -70.6 } },
      { id: 2, titulo: 'B', descripcion: '', fechaCreacion: '', sincronizada: true, origen: 'local' },
    ];

    const promesa = service.sincronizarTareas(tareas);

    const req = httpMock.expectOne(`${API}/todos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('A');
    expect(req.request.body.latitude).toBe(-33.4);
    req.flush({ id: 201 });

    expect(await promesa).toBe(1);
    expect(tareas[0].sincronizada).toBe(true);
  });

  it('no debe hacer peticiones si todo está sincronizado', async () => {
    const enviadas = await service.sincronizarTareas([]);
    expect(enviadas).toBe(0);
    httpMock.expectNone(`${API}/todos`);
  });
});

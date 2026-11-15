import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NavController } from '@ionic/angular';

import { Tab1Page } from './tab1.page';
import { CamaraService } from '../services/camara.service';
import { UbicacionService } from '../services/ubicacion.service';
import { AlmacenamientoService } from '../services/almacenamiento.service';
import { AuthService } from '../services/auth.service';

describe('Tab1Page (integración cámara + GPS en las tareas)', () => {
  let component: Tab1Page;
  let fixture: ComponentFixture<Tab1Page>;

  // Servicios simulados
  const camaraMock = { tomarFoto: vi.fn() };
  const ubicacionMock = { obtenerUbicacion: vi.fn(), urlMapa: vi.fn().mockReturnValue('#') };
  const almacenamientoMock = {
    cargarTareas: vi.fn().mockResolvedValue([]),
    guardarTareas: vi.fn().mockResolvedValue(undefined),
  };
  const authMock = { usuarioActual: 'ana', cerrarSesion: vi.fn().mockResolvedValue(undefined) };
  const navMock = { navigateRoot: vi.fn().mockResolvedValue(true) };

  beforeEach(async () => {
    vi.clearAllMocks();
    almacenamientoMock.cargarTareas.mockResolvedValue([]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CamaraService, useValue: camaraMock },
        { provide: UbicacionService, useValue: ubicacionMock },
        { provide: AlmacenamientoService, useValue: almacenamientoMock },
        { provide: AuthService, useValue: authMock },
        { provide: NavController, useValue: navMock },
      ],
    });

    fixture = TestBed.createComponent(Tab1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse la página', () => {
    expect(component).toBeTruthy();
  });

  it('debe adjuntar la foto capturada al formulario', async () => {
    camaraMock.tomarFoto.mockResolvedValue('data:image/jpeg;base64,FOTO');

    await component.tomarFoto();

    expect(component.nuevaFoto).toBe('data:image/jpeg;base64,FOTO');
  });

  it('debe guardar la tarea con foto y ubicación GPS', async () => {
    ubicacionMock.obtenerUbicacion.mockResolvedValue({ latitud: -33.45, longitud: -70.66 });
    component.nuevoTitulo = 'Tarea con foto';
    component.nuevaDescripcion = 'Prueba';
    component.nuevaFoto = 'data:image/jpeg;base64,FOTO';

    await component.guardarTarea();

    expect(component.tareas.length).toBe(1);
    expect(component.tareas[0].foto).toBe('data:image/jpeg;base64,FOTO');
    expect(component.tareas[0].ubicacion).toEqual({ latitud: -33.45, longitud: -70.66 });
    expect(almacenamientoMock.guardarTareas).toHaveBeenCalled();
    // El formulario se limpia después de guardar
    expect(component.nuevoTitulo).toBe('');
    expect(component.nuevaFoto).toBeNull();
  });

  it('debe guardar la tarea aunque el GPS no esté disponible', async () => {
    ubicacionMock.obtenerUbicacion.mockResolvedValue(null);
    component.nuevoTitulo = 'Sin GPS';

    await component.guardarTarea();

    expect(component.tareas.length).toBe(1);
    expect(component.tareas[0].ubicacion).toBeUndefined();
  });

  it('debe cerrar sesión y volver al login', async () => {
    await component.cerrarSesion();

    expect(authMock.cerrarSesion).toHaveBeenCalled();
    expect(navMock.navigateRoot).toHaveBeenCalledWith('/login');
    expect(component.tareas).toEqual([]);
  });
});

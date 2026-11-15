import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { PREFERENCES_PLUGIN } from './preferences.token';

/** Crea un almacenamiento simulado en memoria */
export function crearPreferencesMock() {
  const datos: Record<string, string> = {};
  return {
    datos,
    get: vi.fn(async ({ key }: { key: string }) => ({ value: datos[key] ?? null })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => { datos[key] = value; }),
    remove: vi.fn(async ({ key }: { key: string }) => { delete datos[key]; }),
  };
}

describe('AuthService (autenticación de usuarios)', () => {
  let service: AuthService;
  let preferencesMock: ReturnType<typeof crearPreferencesMock>;

  beforeEach(() => {
    preferencesMock = crearPreferencesMock();
    TestBed.configureTestingModule({
      providers: [{ provide: PREFERENCES_PLUGIN, useValue: preferencesMock }],
    });
    service = TestBed.inject(AuthService);
  });

  it('debe registrar un usuario e iniciar sesión automáticamente', async () => {
    await service.registrar('Ana', '1234');

    expect(service.usuarioActual).toBe('ana');
    expect(await service.estaAutenticado()).toBe(true);
  });

  it('no debe guardar la contraseña en texto plano', async () => {
    await service.registrar('ana', 'secreta');

    expect(preferencesMock.datos['usuarios']).not.toContain('secreta');
  });

  it('no debe permitir registrar un usuario repetido', async () => {
    await service.registrar('ana', '1234');

    await expect(service.registrar('ANA', '5678')).rejects.toThrow('ya existe');
  });

  it('debe validar el largo mínimo de usuario y contraseña', async () => {
    await expect(service.registrar('ab', '1234')).rejects.toThrow('usuario');
    await expect(service.registrar('ana', '12')).rejects.toThrow('contraseña');
  });

  it('debe iniciar sesión con las credenciales correctas', async () => {
    await service.registrar('ana', '1234');
    await service.cerrarSesion();

    await service.iniciarSesion('ana', '1234');

    expect(service.usuarioActual).toBe('ana');
  });

  it('debe rechazar una contraseña incorrecta', async () => {
    await service.registrar('ana', '1234');
    await service.cerrarSesion();

    await expect(service.iniciarSesion('ana', 'mala')).rejects.toThrow('incorrectos');
    expect(service.usuarioActual).toBeNull();
  });

  it('debe rechazar un usuario que no existe', async () => {
    await expect(service.iniciarSesion('nadie', '1234')).rejects.toThrow('incorrectos');
  });

  it('debe cerrar la sesión', async () => {
    await service.registrar('ana', '1234');

    await service.cerrarSesion();

    expect(service.usuarioActual).toBeNull();
    expect(preferencesMock.datos['sesion']).toBeUndefined();
  });

  it('debe recuperar la sesión guardada al reabrir la app', async () => {
    preferencesMock.datos['sesion'] = 'ana';

    expect(await service.cargarSesion()).toBe('ana');
    expect(await service.estaAutenticado()).toBe(true);
  });
});

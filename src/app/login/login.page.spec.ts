import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavController } from '@ionic/angular';
import { LoginPage } from './login.page';
import { AuthService } from '../services/auth.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  const authMock = { registrar: vi.fn(), iniciarSesion: vi.fn() };
  const navMock = { navigateRoot: vi.fn().mockResolvedValue(true) };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: NavController, useValue: navMock },
      ],
    });
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse la página', () => {
    expect(component).toBeTruthy();
  });

  it('debe iniciar sesión y redirigir a las tareas', async () => {
    authMock.iniciarSesion.mockResolvedValue(undefined);
    component.usuario = 'ana';
    component.password = '1234';

    await component.enviar();

    expect(authMock.iniciarSesion).toHaveBeenCalledWith('ana', '1234');
    expect(navMock.navigateRoot).toHaveBeenCalledWith('/tabs/tab1');
  });

  it('debe mostrar un error si las credenciales son incorrectas', async () => {
    authMock.iniciarSesion.mockRejectedValue(new Error('Usuario o contraseña incorrectos'));
    component.usuario = 'ana';
    component.password = 'mala';

    await component.enviar();

    expect(component.error).toBe('Usuario o contraseña incorrectos');
    expect(navMock.navigateRoot).not.toHaveBeenCalled();
  });

  it('debe validar que las contraseñas coincidan al registrarse', async () => {
    component.cambiarModo();
    component.usuario = 'ana';
    component.password = '1234';
    component.confirmarPassword = '9999';

    await component.enviar();

    expect(component.error).toBe('Las contraseñas no coinciden');
    expect(authMock.registrar).not.toHaveBeenCalled();
  });
});

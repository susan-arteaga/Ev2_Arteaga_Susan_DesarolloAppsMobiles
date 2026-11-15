import { TestBed } from '@angular/core/testing';
import { UbicacionService, GEOLOCATION_PLUGIN } from './ubicacion.service';

describe('UbicacionService (pruebas del GPS)', () => {
  let service: UbicacionService;
  // Plugin de geolocalización simulado (mock): no usa el GPS real
  const geolocationMock = { getCurrentPosition: vi.fn() };

  beforeEach(() => {
    geolocationMock.getCurrentPosition.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: GEOLOCATION_PLUGIN, useValue: geolocationMock }],
    });
    service = TestBed.inject(UbicacionService);
  });

  it('debe crearse el servicio', () => {
    expect(service).toBeTruthy();
  });

  it('debe devolver la latitud y longitud actuales', async () => {
    // Coordenadas de ejemplo (Santiago de Chile)
    geolocationMock.getCurrentPosition.mockResolvedValue({
      timestamp: Date.now(),
      coords: { latitude: -33.4489, longitude: -70.6693, accuracy: 10 },
    });

    const ubicacion = await service.obtenerUbicacion();

    expect(ubicacion).toEqual({ latitud: -33.4489, longitud: -70.6693 });
  });

  it('debe solicitar la ubicación con alta precisión', async () => {
    geolocationMock.getCurrentPosition.mockResolvedValue({
      timestamp: Date.now(),
      coords: { latitude: 1, longitude: 2, accuracy: 5 },
    });

    await service.obtenerUbicacion();

    expect(geolocationMock.getCurrentPosition).toHaveBeenCalledWith(
      expect.objectContaining({ enableHighAccuracy: true })
    );
  });

  it('debe devolver null si el usuario niega el permiso de ubicación', async () => {
    geolocationMock.getCurrentPosition.mockRejectedValue(new Error('Location permission was denied'));

    const ubicacion = await service.obtenerUbicacion();

    expect(ubicacion).toBeNull();
  });

  it('debe generar un enlace válido a Google Maps', () => {
    const url = service.urlMapa({ latitud: -33.4489, longitud: -70.6693 });

    expect(url).toBe('https://www.google.com/maps?q=-33.4489,-70.6693');
  });
});

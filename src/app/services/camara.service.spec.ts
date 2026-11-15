import { TestBed } from '@angular/core/testing';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import { CamaraService, CAMERA_PLUGIN } from './camara.service';

describe('CamaraService (pruebas de la cámara)', () => {
  let service: CamaraService;
  // Plugin de cámara simulado (mock): no abre la cámara real
  const cameraMock = { getPhoto: vi.fn() };

  beforeEach(() => {
    cameraMock.getPhoto.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: CAMERA_PLUGIN, useValue: cameraMock }],
    });
    service = TestBed.inject(CamaraService);
  });

  it('debe crearse el servicio', () => {
    expect(service).toBeTruthy();
  });

  it('debe devolver la imagen capturada como data URL', async () => {
    const imagenFalsa = 'data:image/jpeg;base64,AAAA';
    cameraMock.getPhoto.mockResolvedValue({ dataUrl: imagenFalsa, format: 'jpeg' });

    const resultado = await service.tomarFoto();

    expect(resultado).toBe(imagenFalsa);
  });

  it('debe llamar a la cámara con las opciones correctas', async () => {
    cameraMock.getPhoto.mockResolvedValue({ dataUrl: 'data:image/jpeg;base64,AAAA' });

    await service.tomarFoto();

    expect(cameraMock.getPhoto).toHaveBeenCalledTimes(1);
    expect(cameraMock.getPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        quality: 50,
      })
    );
  });

  it('debe devolver null si el usuario cancela la captura', async () => {
    cameraMock.getPhoto.mockRejectedValue(new Error('User cancelled photos app'));

    const resultado = await service.tomarFoto();

    expect(resultado).toBeNull();
  });

  it('debe devolver null si la cámara no entrega imagen', async () => {
    cameraMock.getPhoto.mockResolvedValue({ format: 'jpeg' });

    const resultado = await service.tomarFoto();

    expect(resultado).toBeNull();
  });
});

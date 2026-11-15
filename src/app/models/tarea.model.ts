// Coordenadas GPS donde se creó la tarea
export interface Ubicacion {
  latitud: number;
  longitud: number;
}

// Modelo de una tarea (ampliado en la Parte 2)
export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  foto?: string;            // Imagen capturada con la cámara (data URL base64)
  ubicacion?: Ubicacion;    // Ubicación GPS al momento de crear la tarea
  fechaCreacion: string;    // Fecha en formato ISO
  sincronizada: boolean;    // true si ya se envió a la API remota
  origen: 'local' | 'api';  // 'api' si fue importada desde la API externa
}

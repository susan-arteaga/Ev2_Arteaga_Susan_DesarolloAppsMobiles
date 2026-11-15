import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton, IonIcon,
  IonList, IonBadge, IonSpinner, ToastController, NavController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addCircleOutline, saveOutline, closeOutline, pencilOutline, trashOutline,
  cameraOutline, locationOutline, cloudUploadOutline, cloudDownloadOutline,
  checkmarkCircle, timeOutline, logOutOutline, personCircleOutline
} from 'ionicons/icons';

import { Tarea, Ubicacion } from '../models/tarea.model';
import { CamaraService } from '../services/camara.service';
import { UbicacionService } from '../services/ubicacion.service';
import { AlmacenamientoService } from '../services/almacenamiento.service';
import { ApiTareasService } from '../services/api-tareas.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    FormsModule,
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonButton, IonIcon,
    IonList, IonBadge, IonSpinner
  ],
})
export class Tab1Page {
  // Servicios
  private camaraService = inject(CamaraService);
  ubicacionService = inject(UbicacionService);
  private almacenamiento = inject(AlmacenamientoService);
  private api = inject(ApiTareasService);
  private toastCtrl = inject(ToastController);
  auth = inject(AuthService);
  private navCtrl = inject(NavController);

  // Estado de la página
  tareas: Tarea[] = [];
  nuevoTitulo: string = '';
  nuevaDescripcion: string = '';
  nuevaFoto: string | null = null;  // Foto capturada en el formulario
  editandoId: number | null = null; // null = modo agregar, número = modo editar
  cargando: boolean = false;        // Muestra un spinner mientras se trabaja

  constructor() {

    addIcons({
      addCircleOutline, saveOutline, closeOutline, pencilOutline, trashOutline,
      cameraOutline, locationOutline, cloudUploadOutline, cloudDownloadOutline,
      checkmarkCircle, timeOutline, logOutOutline, personCircleOutline
    });
  }


  async ionViewWillEnter() {
    this.tareas = await this.almacenamiento.cargarTareas();
  }

  // ===== AUTENTICACIÓN =====
  async cerrarSesion() {
    await this.auth.cerrarSesion();
    this.tareas = [];
    this.limpiarFormulario();
    // navigateRoot limpia el historial: no se puede volver a las tareas con "atrás"
    await this.navCtrl.navigateRoot('/login');
  }

  get pendientesDeSincronizar(): number {
    return this.tareas.filter(t => !t.sincronizada).length;
  }

  // ===== CÁMARA =====
  async tomarFoto() {
    const foto = await this.camaraService.tomarFoto();
    if (foto) {
      this.nuevaFoto = foto;
    }
  }

  quitarFoto() {
    this.nuevaFoto = null;
  }

  // ===== AGREGAR / EDITAR =====
  async guardarTarea() {
    if (this.nuevoTitulo.trim() === '') return;

    if (this.editandoId !== null) {
      // Modo editar: actualizar la tarea existente
      const tarea = this.tareas.find(t => t.id === this.editandoId);
      if (tarea) {
        tarea.titulo = this.nuevoTitulo.trim();
        tarea.descripcion = this.nuevaDescripcion.trim();
        tarea.foto = this.nuevaFoto ?? undefined;
        tarea.sincronizada = false; // Cambió, hay que volver a sincronizar
      }
      this.editandoId = null;
    } else {
      // Modo agregar: se obtiene la ubicación GPS al crear la tarea
      this.cargando = true;
      const ubicacion: Ubicacion | null = await this.ubicacionService.obtenerUbicacion();
      this.cargando = false;

      if (!ubicacion) {
        this.mostrarMensaje('No se pudo obtener la ubicación. La tarea se guardó sin GPS.', 'warning');
      }

      this.tareas.push({
        id: Date.now(),
        titulo: this.nuevoTitulo.trim(),
        descripcion: this.nuevaDescripcion.trim(),
        foto: this.nuevaFoto ?? undefined,
        ubicacion: ubicacion ?? undefined,
        fechaCreacion: new Date().toISOString(),
        sincronizada: false,
        origen: 'local',
      });
    }

    await this.almacenamiento.guardarTareas(this.tareas);
    this.limpiarFormulario();
  }


  editarTarea(tarea: Tarea) {
    this.editandoId = tarea.id;
    this.nuevoTitulo = tarea.titulo;
    this.nuevaDescripcion = tarea.descripcion;
    this.nuevaFoto = tarea.foto ?? null;
  }


  cancelarEdicion() {
    this.limpiarFormulario();
  }


  async eliminarTarea(id: number) {
    this.tareas = this.tareas.filter(t => t.id !== id);
    if (this.editandoId === id) {
      this.limpiarFormulario();
    }
    await this.almacenamiento.guardarTareas(this.tareas);
  }

  // ===== API EXTERNA =====
  async importarTareas() {
    this.cargando = true;
    try {
      const importadas = await this.api.importarTareas(5);
      this.tareas = [...this.tareas, ...importadas];
      await this.almacenamiento.guardarTareas(this.tareas);
      this.mostrarMensaje(`Se importaron ${importadas.length} tareas desde la API`, 'success');
    } catch {
      this.mostrarMensaje('Error al importar tareas. Revisa tu conexión a internet.', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  async sincronizarTareas() {
    this.cargando = true;
    try {
      const enviadas = await this.api.sincronizarTareas(this.tareas);
      await this.almacenamiento.guardarTareas(this.tareas);
      const mensaje = enviadas > 0
        ? `Se sincronizaron ${enviadas} tareas con el servidor`
        : 'Todas las tareas ya estaban sincronizadas';
      this.mostrarMensaje(mensaje, 'success');
    } catch {
      this.mostrarMensaje('Error al sincronizar. Las tareas siguen guardadas en el dispositivo.', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  // ===== UTILIDADES =====
  private limpiarFormulario() {
    this.editandoId = null;
    this.nuevoTitulo = '';
    this.nuevaDescripcion = '';
    this.nuevaFoto = null;
  }

  private async mostrarMensaje(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}

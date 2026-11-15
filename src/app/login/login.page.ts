import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonItem, IonInput, IonButton, IonIcon, IonText, NavController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logInOutline, personAddOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [
    FormsModule, CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonItem, IonInput, IonButton, IonIcon, IonText
  ],
})
export class LoginPage {
  private auth = inject(AuthService);
  private navCtrl = inject(NavController);

  modoRegistro = false;  // false = iniciar sesión, true = crear cuenta
  usuario = '';
  password = '';
  confirmarPassword = '';
  error = '';
  cargando = false;

  constructor() {
    addIcons({ logInOutline, personAddOutline });
  }

  cambiarModo() {
    this.modoRegistro = !this.modoRegistro;
    this.error = '';
    this.password = '';
    this.confirmarPassword = '';
  }

  async enviar() {
    this.error = '';

    if (this.modoRegistro && this.password !== this.confirmarPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.cargando = true;
    try {
      if (this.modoRegistro) {
        await this.auth.registrar(this.usuario, this.password);
      } else {
        await this.auth.iniciarSesion(this.usuario, this.password);
      }
      this.usuario = '';
      this.password = '';
      this.confirmarPassword = '';
      // navigateRoot limpia el historial: no se puede volver al login con "atrás"
      await this.navCtrl.navigateRoot('/tabs/tab1');
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Ocurrió un error';
    } finally {
      this.cargando = false;
    }
  }
}

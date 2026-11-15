import { Injectable, inject } from '@angular/core';
import { PREFERENCES_PLUGIN } from './preferences.token';

// Usuario registrado (la contraseña nunca se guarda en texto plano)
interface Usuario {
  nombre: string;
  passwordHash: string;
}

const CLAVE_USUARIOS = 'usuarios';
const CLAVE_SESION = 'sesion';

/**
 * Autenticación básica local: registro, inicio y cierre de sesión.
 * Los usuarios y la sesión se guardan en el dispositivo con Capacitor Preferences.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private preferences = inject(PREFERENCES_PLUGIN);

  usuarioActual: string | null = null;
  private sesionCargada = false;

  /** Recupera la sesión guardada (si el usuario ya había iniciado sesión antes). */
  async cargarSesion(): Promise<string | null> {
    if (!this.sesionCargada) {
      const { value } = await this.preferences.get({ key: CLAVE_SESION });
      this.usuarioActual = value;
      this.sesionCargada = true;
    }
    return this.usuarioActual;
  }

  async estaAutenticado(): Promise<boolean> {
    return (await this.cargarSesion()) !== null;
  }

  /** Crea una cuenta nueva e inicia sesión con ella. */
  async registrar(nombre: string, password: string): Promise<void> {
    const usuario = this.normalizar(nombre);
    if (usuario.length < 3) throw new Error('El usuario debe tener al menos 3 caracteres');
    if (password.length < 4) throw new Error('La contraseña debe tener al menos 4 caracteres');

    const usuarios = await this.obtenerUsuarios();
    if (usuarios.some(u => u.nombre === usuario)) {
      throw new Error('Ese nombre de usuario ya existe');
    }

    usuarios.push({ nombre: usuario, passwordHash: await this.hashPassword(usuario, password) });
    await this.preferences.set({ key: CLAVE_USUARIOS, value: JSON.stringify(usuarios) });
    await this.guardarSesion(usuario);
  }

  /** Verifica usuario y contraseña, y guarda la sesión. */
  async iniciarSesion(nombre: string, password: string): Promise<void> {
    const usuario = this.normalizar(nombre);
    const usuarios = await this.obtenerUsuarios();
    const encontrado = usuarios.find(u => u.nombre === usuario);
    const hash = await this.hashPassword(usuario, password);

    if (!encontrado || encontrado.passwordHash !== hash) {
      throw new Error('Usuario o contraseña incorrectos');
    }
    await this.guardarSesion(usuario);
  }

  async cerrarSesion(): Promise<void> {
    await this.preferences.remove({ key: CLAVE_SESION });
    this.usuarioActual = null;
  }

  // ===== Métodos privados =====

  private async obtenerUsuarios(): Promise<Usuario[]> {
    const { value } = await this.preferences.get({ key: CLAVE_USUARIOS });
    return value ? (JSON.parse(value) as Usuario[]) : [];
  }

  private async guardarSesion(usuario: string): Promise<void> {
    await this.preferences.set({ key: CLAVE_SESION, value: usuario });
    this.usuarioActual = usuario;
    this.sesionCargada = true;
  }

  private normalizar(nombre: string): string {
    return nombre.trim().toLowerCase();
  }

  /** Convierte la contraseña en un hash SHA-256 (se usa el usuario como "sal"). */
  private async hashPassword(usuario: string, password: string): Promise<string> {
    const datos = new TextEncoder().encode(`${usuario}:${password}`);
    const hash = await crypto.subtle.digest('SHA-256', datos);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

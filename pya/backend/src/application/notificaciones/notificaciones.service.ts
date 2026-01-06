// Servicio de Notificaciones
import { NotificacionesRepository } from '../../infrastructure/repositories/notificaciones.repo';
import { Notificacion, TipoNotificacion } from '../../domain/notificacion';

export class NotificacionesService {
  private repo = new NotificacionesRepository();

  async crear(notificacion: Omit<Notificacion, 'idNotificacion' | 'fechaEnvio'>): Promise<string> {
    const id = await this.repo.crear(notificacion);
    
    // Aquí iría la lógica de envío real (email, SMS, FCM)
    await this.enviar(notificacion);
    
    return id;
  }

  private async enviar(notificacion: Omit<Notificacion, 'idNotificacion' | 'fechaEnvio'>): Promise<void> {
    // Stub para envío de notificaciones
    console.log(`[NOTIFICACION] Tipo: ${notificacion.tipo}, Destinatario: ${notificacion.destinatario}`);
    console.log(`[NOTIFICACION] Mensaje: ${notificacion.mensaje}`);
    
    // TODO: Implementar integración real con:
    // - Nodemailer para email
    // - Twilio para SMS
    // - Firebase Cloud Messaging para push
  }

  async notificarCambioEstadoTramite(
    tramiteId: string,
    codigoUnico: string,
    nuevoEstado: string,
    destinatario: string,
    tipo: TipoNotificacion = TipoNotificacion.EMAIL
  ): Promise<string> {
    const mensaje = `Su trámite ${codigoUnico} ha cambiado de estado a: ${nuevoEstado}`;
    
    return await this.crear({
      tipo,
      destinatario,
      mensaje,
      tramiteId,
      leida: false
    });
  }

  async notificarInicio(
    tramiteId: string,
    codigoUnico: string,
    destinatario: string,
    tipo: TipoNotificacion = TipoNotificacion.EMAIL
  ): Promise<string> {
    const mensaje = `Su trámite ${codigoUnico} ha sido registrado exitosamente. Será procesado pronto.`;
    
    return await this.crear({
      tipo,
      destinatario,
      mensaje,
      tramiteId,
      leida: false
    });
  }

  async obtenerPorTramite(tramiteId: string): Promise<Notificacion[]> {
    return await this.repo.obtenerPorTramite(tramiteId);
  }

  async obtenerPorDestinatario(destinatario: string, limite?: number): Promise<Notificacion[]> {
    return await this.repo.obtenerPorDestinatario(destinatario, limite);
  }

  async obtenerNoLeidas(destinatario: string): Promise<Notificacion[]> {
    return await this.repo.obtenerNoLeidas(destinatario);
  }

  async marcarComoLeida(idNotificacion: string): Promise<void> {
    await this.repo.marcarComoLeida(idNotificacion);
  }
}

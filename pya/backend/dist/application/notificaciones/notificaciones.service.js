"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificacionesService = void 0;
// Servicio de Notificaciones
const notificaciones_repo_1 = require("../../infrastructure/repositories/notificaciones.repo");
const notificacion_1 = require("../../domain/notificacion");
class NotificacionesService {
    constructor() {
        this.repo = new notificaciones_repo_1.NotificacionesRepository();
    }
    async crear(notificacion) {
        const id = await this.repo.crear(notificacion);
        // Aquí iría la lógica de envío real (email, SMS, FCM)
        await this.enviar(notificacion);
        return id;
    }
    async enviar(notificacion) {
        // Stub para envío de notificaciones
        console.log(`[NOTIFICACION] Tipo: ${notificacion.tipo}, Destinatario: ${notificacion.destinatario}`);
        console.log(`[NOTIFICACION] Mensaje: ${notificacion.mensaje}`);
        // TODO: Implementar integración real con:
        // - Nodemailer para email
        // - Twilio para SMS
        // - Firebase Cloud Messaging para push
    }
    async notificarCambioEstadoTramite(tramiteId, codigoUnico, nuevoEstado, destinatario, tipo = notificacion_1.TipoNotificacion.EMAIL) {
        const mensaje = `Su trámite ${codigoUnico} ha cambiado de estado a: ${nuevoEstado}`;
        return await this.crear({
            tipo,
            destinatario,
            mensaje,
            tramiteId,
            leida: false
        });
    }
    async notificarInicio(tramiteId, codigoUnico, destinatario, tipo = notificacion_1.TipoNotificacion.EMAIL) {
        const mensaje = `Su trámite ${codigoUnico} ha sido registrado exitosamente. Será procesado pronto.`;
        return await this.crear({
            tipo,
            destinatario,
            mensaje,
            tramiteId,
            leida: false
        });
    }
    async obtenerPorTramite(tramiteId) {
        return await this.repo.obtenerPorTramite(tramiteId);
    }
    async obtenerPorDestinatario(destinatario, limite) {
        return await this.repo.obtenerPorDestinatario(destinatario, limite);
    }
    async obtenerNoLeidas(destinatario) {
        return await this.repo.obtenerNoLeidas(destinatario);
    }
    async marcarComoLeida(idNotificacion) {
        await this.repo.marcarComoLeida(idNotificacion);
    }
}
exports.NotificacionesService = NotificacionesService;

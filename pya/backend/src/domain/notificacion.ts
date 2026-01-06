// Entidad Notificación según diagrama de clases
export enum TipoNotificacion {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  SISTEMA = 'sistema'
}

export interface Notificacion {
  fechaEnvio: Date;
  idNotificacion: string;
  mensaje: string;
  tipo: TipoNotificacion;
  destinatario?: string; // email, teléfono o userId
  tramiteId?: string;
  leida?: boolean;
}

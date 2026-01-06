// Entidad AuditoriaSistema según diagrama de clases
export interface AuditoriaSistema {
  accion: string;
  fechaHora: Date;
  idAuditoria: string;
  usuario: string; // uid del usuario
  // Campos adicionales para contexto
  rol?: string;
  tramiteId?: string;
  entidad?: string;
  estadoAnterior?: any;
  estadoNuevo?: any;
  detalles?: string;
}

// Entidad Documento según diagrama de clases
export enum TipoDocumento {
  CEDULA = 'cedula',
  CERTIFICADO_DEFUNCION = 'certificado_defuncion',
  INFORME_MEDICO = 'informe_medico',
  CERTIFICADO_MATRICULA = 'certificado_matricula',
  ACTA_ACCIDENTE = 'acta_accidente',
  OTRO = 'otro'
}

export interface Documento {
  idDocumento: string;
  tramiteId: string;
  tipo: TipoDocumento;
  nombreArchivo: string;
  urlArchivo: string; // URL de Firebase Storage (antes 'ruta')
  descripcion: string;
  fechaSubida: Date; // Antes 'fechaCarga'
  validado: boolean;
}

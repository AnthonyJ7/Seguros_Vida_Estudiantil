// Entidad Beneficiario según diagrama de clases
export interface Beneficiario {
  cuentaBancaria: string;
  idBeneficiario: string;
  nombreCompleto: string;
  parentesco: string;
  // Método de negocio
  recibirNotificacion?: () => void;
}

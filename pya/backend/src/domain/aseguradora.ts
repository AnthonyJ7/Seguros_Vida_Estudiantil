// Entidad Aseguradora según diagrama de clases
export interface Aseguradora {
  idAseguradora: string; // String para compatibilidad con Firestore
  nombre: string;
  correoContacto: string;
}

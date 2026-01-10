import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'firebaseDate',
  standalone: true
})
export class FirebaseDatePipe implements PipeTransform {
  transform(value: any, format: string = 'short'): string {
    if (!value) return '';

    let date: Date;

    // Si es un objeto Firestore Timestamp con toDate()
    if (value && typeof value.toDate === 'function') {
      date = value.toDate();
    }
    // Si es un objeto con seconds (Firestore Timestamp plain)
    else if (value && typeof value === 'object' && value.seconds) {
      date = new Date(value.seconds * 1000);
    }
    // Si ya es un Date
    else if (value instanceof Date) {
      date = value;
    }
    // Si es un string o número
    else {
      date = new Date(value);
    }

    // Si la fecha es inválida
    if (isNaN(date.getTime())) {
      return '';
    }

    // Formatos
    if (format === 'short') {
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
    if (format === 'full') {
      return date.toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    if (format === 'time') {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    if (format === 'datetime') {
      return date.toLocaleString('es-ES');
    }

    return date.toLocaleDateString('es-ES');
  }
}

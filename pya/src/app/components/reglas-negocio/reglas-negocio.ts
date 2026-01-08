import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReglasHttpService, ReglaDto } from '../../services/reglas-http.service';

@Component({
  selector: 'app-reglas-negocio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reglas-negocio.html',
  styleUrl: './reglas-negocio.css',
})
export class ReglasNegocio implements OnInit {
  reglas: ReglaDto[] = [];
  newRegla: ReglaDto = { nombre: '', descripcion: '', valor: 0, estado: true };
  cargando = false;
  enviando = false;
  successMsg = '';
  errorMsg = '';

  constructor(private reglasHttp: ReglasHttpService) {}

  ngOnInit() {
    this.loadReglas();
  }

  async loadReglas() {
    this.cargando = true;
    this.successMsg = '';
    this.errorMsg = '';
    this.reglasHttp.listar().subscribe({
      next: (data) => (this.reglas = data || []),
      error: (err) => (this.errorMsg = 'No se pudieron cargar las reglas'),
      complete: () => (this.cargando = false)
    });
  }

  async addRegla() {
    if (!this.isNewReglaValid()) return;
    this.enviando = true;
    this.successMsg = '';
    this.errorMsg = '';
    const payload: ReglaDto = {
      nombre: (this.newRegla.nombre || '').toUpperCase(),
      descripcion: this.newRegla.descripcion || '',
      valor: Number(this.newRegla.valor) || 0,
      estado: Boolean(this.newRegla.estado)
    };
    this.reglasHttp.crear(payload).subscribe({
      next: () => {
        this.newRegla = { nombre: '', descripcion: '', valor: 0, estado: true };
        this.successMsg = 'Regla creada correctamente';
        this.loadReglas();
      },
      error: () => (this.errorMsg = 'No se pudo crear la regla'),
      complete: () => (this.enviando = false)
    });
  }

  async updateRegla(id: string, regla: ReglaDto) {
    if (!id) return;
    this.enviando = true;
    this.successMsg = '';
    this.errorMsg = '';
    const payload: Partial<ReglaDto> = {
      nombre: (regla.nombre || '').toUpperCase(),
      descripcion: regla.descripcion,
      valor: Number(regla.valor),
      estado: Boolean(regla.estado)
    };
    this.reglasHttp.actualizar(id, payload).subscribe({
      next: () => {
        this.successMsg = 'Regla actualizada';
        this.loadReglas();
      },
      error: () => (this.errorMsg = 'No se pudo actualizar la regla'),
      complete: () => (this.enviando = false)
    });
  }

  async deleteRegla(id: string) {
    if (!id) return;
    if (!confirm('¿Eliminar esta regla?')) return;
    this.enviando = true;
    this.successMsg = '';
    this.errorMsg = '';
    this.reglasHttp.eliminar(id).subscribe({
      next: () => {
        this.successMsg = 'Regla eliminada';
        this.loadReglas();
      },
      error: () => (this.errorMsg = 'No se pudo eliminar la regla'),
      complete: () => (this.enviando = false)
    });
  }

  toggleEstado(r: ReglaDto) {
    if (!r?.idRegla) return;
    this.enviando = true;
    this.successMsg = '';
    this.errorMsg = '';
    const obs = r.estado
      ? this.reglasHttp.desactivar(r.idRegla)
      : this.reglasHttp.activar(r.idRegla);
    obs.subscribe({
      next: () => {
        this.successMsg = r.estado ? 'Regla desactivada' : 'Regla activada';
        this.loadReglas();
      },
      error: () => (this.errorMsg = 'No se pudo cambiar el estado'),
      complete: () => (this.enviando = false)
    });
  }

  isNewReglaValid(): boolean {
    const nombre = (this.newRegla.nombre || '').trim();
    const valor = Number(this.newRegla.valor);
    const desc = (this.newRegla.descripcion || '').trim();
    if (!nombre || !/^[A-Z0-9_]+$/.test(nombre.toUpperCase())) {
      this.errorMsg = 'Nombre inválido (usa MAYUSCULAS y _ ).';
      return false;
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      this.errorMsg = 'El valor debe ser un número positivo.';
      return false;
    }
    if (!desc) {
      this.errorMsg = 'La descripción es obligatoria.';
      return false;
    }
    return true;
  }
}

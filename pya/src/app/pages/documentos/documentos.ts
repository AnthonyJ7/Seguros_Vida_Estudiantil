import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { DocumentosHttpService } from '../../services/documentos-http.service';

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documentos.html',
  styleUrl: './documentos.css',
})
export class DocumentosComponent implements OnInit {
  documentos: any[] = [];
  loading = true;
  error = '';

  constructor(private documentosHttp: DocumentosHttpService) {}

  async ngOnInit() {
    try {
      this.documentos = await firstValueFrom(this.documentosHttp.listar());
    } catch (e: any) {
      this.error = 'Backend no disponible o error al cargar documentos';
    }
    this.loading = false;
  }
}

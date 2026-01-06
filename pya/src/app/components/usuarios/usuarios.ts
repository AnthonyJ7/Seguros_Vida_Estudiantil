import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  usuarios: any[] = [];
  newUsuario: any = {};
  roles = ['CLIENTE', 'GESTOR', 'ADMIN'];

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadUsuarios();
  }

  async loadUsuarios() {
    try {
      this.usuarios = await this.firestoreService.getDocuments('usuarios');
    } catch (error) {
      console.error('Error loading usuarios:', error);
    }
  }

  async addUsuario() {
    try {
      await this.firestoreService.addDocument('usuarios', this.newUsuario);
      this.newUsuario = {};
      this.loadUsuarios();
    } catch (error) {
      console.error('Error adding usuario:', error);
    }
  }

  async updateUsuario(id: string, usuario: any) {
    try {
      await this.firestoreService.updateDocument('usuarios', id, usuario);
      this.loadUsuarios();
    } catch (error) {
      console.error('Error updating usuario:', error);
    }
  }

  async deleteUsuario(id: string) {
    try {
      await this.firestoreService.deleteDocument('usuarios', id);
      this.loadUsuarios();
    } catch (error) {
      console.error('Error deleting usuario:', error);
    }
  }
}

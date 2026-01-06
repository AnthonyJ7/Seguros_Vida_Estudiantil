import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-beneficiarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './beneficiarios.html',
  styleUrl: './beneficiarios.css',
})
export class Beneficiarios implements OnInit {
  beneficiarios: any[] = [];
  newBeneficiario: any = {};

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadBeneficiarios();
  }

  async loadBeneficiarios() {
    try {
      this.beneficiarios = await this.firestoreService.getDocuments('beneficiarios');
    } catch (error) {
      console.error('Error loading beneficiarios:', error);
    }
  }

  async addBeneficiario() {
    try {
      await this.firestoreService.addDocument('beneficiarios', this.newBeneficiario);
      this.newBeneficiario = {};
      this.loadBeneficiarios();
    } catch (error) {
      console.error('Error adding beneficiario:', error);
    }
  }

  async deleteBeneficiario(id: string) {
    try {
      await this.firestoreService.deleteDocument('beneficiarios', id);
      this.loadBeneficiarios();
    } catch (error) {
      console.error('Error deleting beneficiario:', error);
    }
  }
}

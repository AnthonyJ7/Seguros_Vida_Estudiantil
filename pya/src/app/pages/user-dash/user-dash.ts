import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-dash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dash.html'
})
export class UserDashComponent { // <--- Cambiado a UserDashComponent
  seguroActivo: boolean = true;
  fechaVencimiento: string = '12/12/2026';
}
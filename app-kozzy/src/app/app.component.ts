import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// 1. IMPORTE O COMPONENTE DE LOADING
import { LoadingComponent } from './loading/loading.component'; 

@Component({
  selector: 'app-root',
  standalone: true,
  // 2. ADICIONE ELE NA LISTA DE IMPORTS
  imports: [
    RouterOutlet, 
    LoadingComponent 
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css' // ou .scss se estiver usando
})
export class AppComponent {
  title = 'kozzy-distribuidora';
}
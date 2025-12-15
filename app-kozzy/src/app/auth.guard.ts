import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service'; // Ajuste o caminho conforme necessário

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Verificar se o usuário está logado
    if (!this.authService.isLogado()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar permissões específicas baseadas na rota
    const requiredRole = route.data['role'];
    
    if (requiredRole) {
      switch (requiredRole) {
        case 'supervisor':
          if (!this.authService.isSupervisor()) {
            // Se não é supervisor, redireciona para a tela de atendente
            this.router.navigate(['/central']);
            return false;
          }
          break;
        
        case 'atendente':
          if (!this.authService.isAtendente() && !this.authService.isSupervisor()) {
            // Se não é atendente nem supervisor, redireciona para login
            this.router.navigate(['/login']);
            return false;
          }
          break;
        
        default:
          // Papel não reconhecido
          this.router.navigate(['/login']);
          return false;
      }
    }

    return true;
  }
}

// Guard específico para supervisores
@Injectable({
  providedIn: 'root'
})
export class SupervisorGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.authService.isLogado()) {
      this.router.navigate(['/login']);
      return false;
    }

    if (!this.authService.isSupervisor()) {
      // Se não é supervisor, redireciona para a central de atendimento
      this.router.navigate(['/central']);
      return false;
    }

    return true;
  }
}

// Guard específico para atendentes (permite supervisor também)
@Injectable({
  providedIn: 'root'
})
export class AtendenteGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.authService.isLogado()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Permite acesso se for atendente ou supervisor
    if (!this.authService.isAtendente() && !this.authService.isSupervisor()) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}


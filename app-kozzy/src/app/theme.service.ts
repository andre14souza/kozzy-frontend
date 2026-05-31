import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkThemeKey = 'kozzy-dark-theme';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initTheme();
  }

  initTheme(): void {
    if (!this.isBrowser) return;
    
    const isDark = localStorage.getItem(this.darkThemeKey) === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleTheme(): void {
    if (!this.isBrowser) return;
    
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(this.darkThemeKey, 'false');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem(this.darkThemeKey, 'true');
    }
  }

  isDarkTheme(): boolean {
    if (!this.isBrowser) return false;
    return document.documentElement.classList.contains('dark');
  }
}

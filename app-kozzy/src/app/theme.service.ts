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
    this.loadTheme();
  }

  toggleTheme(): void {
    if (!this.isBrowser) return;
    
    const isDark = document.body.classList.contains('dark-theme');
    if (isDark) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      localStorage.setItem(this.darkThemeKey, 'false');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      localStorage.setItem(this.darkThemeKey, 'true');
    }
  }

  isDarkTheme(): boolean {
    if (!this.isBrowser) return false;
    return document.body.classList.contains('dark-theme');
  }

  private loadTheme(): void {
    if (!this.isBrowser) return;
    
    const isDark = localStorage.getItem(this.darkThemeKey) === 'true';
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }
}

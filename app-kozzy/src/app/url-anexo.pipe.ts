import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../environments/environment';

@Pipe({
  name: 'urlAnexo',
  standalone: true
})
export class UrlAnexoPipe implements PipeTransform {
  // SVG fallbacks representados em Data URI para carregamento imediato
  private readonly defaultAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ef4444"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
  private readonly defaultAttachment = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-3.31 2.69-6 6-6s6 2.69 6 6v10c0 4.42-3.58 8-8 8s-8-3.58-8-8V4h2v11c0 3.31 2.69 6 6 6s6-2.69 6-6V5c0-2.21-1.79-4-4-4s-4 1.79-4 4v12.5c0 1.1.9 2 2 2s2-.9 2-2V6h2z"/></svg>';

  transform(path: string | undefined | null, type: 'avatar' | 'anexo' = 'anexo'): string {
    const fallback = type === 'avatar' ? this.defaultAvatar : this.defaultAttachment;

    if (!path || path === '#' || path.trim() === '') {
      return fallback;
    }

    // Se já for uma URL absoluta (começando com http ou blob), retorna ela diretamente
    if (path.startsWith('http') || path.startsWith('blob:')) {
      return path;
    }

    // Se começar com caracteres de caminho local (como C:\... ou barras locais) rejeitamos e limpamos
    const normalizedPath = path.replace(/\\/g, '/');
    if (/^[a-zA-Z]:\//.test(normalizedPath) || normalizedPath.startsWith('//')) {
      return fallback;
    }

    // Obtém a URL base limpando o sufixo '/api' de environment.apiUrl se necessário
    const baseUrl = environment.apiUrl.replace(/\/api$/, '');
    const prefix = normalizedPath.startsWith('/') ? '' : '/';

    return `${baseUrl}${prefix}${normalizedPath}`;
  }
}

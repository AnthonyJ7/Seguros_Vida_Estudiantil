import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiBaseUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, any>) {
    const url = this.url(path);
    const httpParams = this.toParams(params);
    return this.http.get<T>(url, { params: httpParams });
  }

  post<T>(path: string, body?: any, params?: Record<string, any>) {
    const url = this.url(path);
    const httpParams = this.toParams(params);
    return this.http.post<T>(url, body, { params: httpParams });
  }

  put<T>(path: string, body?: any) {
    const url = this.url(path);
    return this.http.put<T>(url, body);
  }

  patch<T>(path: string, body?: any) {
    const url = this.url(path);
    return this.http.patch<T>(url, body);
  }

  delete<T>(path: string) {
    const url = this.url(path);
    return this.http.delete<T>(url);
  }

  private url(path: string) {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${this.base}${p}`;
  }

  private toParams(params?: Record<string, any>) {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        httpParams = httpParams.set(k, String(v));
      }
    });
    return httpParams;
  }
}

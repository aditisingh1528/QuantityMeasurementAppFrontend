import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${API_BASE}/auth/login`, { username, password });
  }

  register(username: string, password: string): Observable<any> {
    return this.http.post(`${API_BASE}/auth/register`, { username, password });
  }

  googleLogin(idToken: string): Observable<{ token: string; username?: string; email?: string }> {
    return this.http.post<any>(`${API_BASE}/auth/google`, { idToken });
  }

  saveToken(token: string, username: string) {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('username', username);
  }

  logout() {
    sessionStorage.clear();
    localStorage.removeItem('app_activeType');
    localStorage.removeItem('app_activeAction');
    localStorage.removeItem('app_activeSubOp');
    localStorage.removeItem('app_lastResult');
    localStorage.removeItem('app_val1');
    localStorage.removeItem('app_val2');
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getUsername(): string | null {
    return sessionStorage.getItem('username');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

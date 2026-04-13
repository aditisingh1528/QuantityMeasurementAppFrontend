import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse, CompareRequest, ConvertRequest, ArithmeticRequest } from '../models/quantity.model';

const API_BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class QuantityService {

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  compare(body: CompareRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${API_BASE}/quantities/compare`, body, {
      headers: this.getHeaders()
    });
  }

  convert(body: ConvertRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${API_BASE}/quantities/convert`, body, {
      headers: this.getHeaders()
    });
  }

  add(body: ArithmeticRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${API_BASE}/quantities/add`, body, {
      headers: this.getHeaders()
    });
  }

  subtract(body: ArithmeticRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${API_BASE}/quantities/subtract`, body, {
      headers: this.getHeaders()
    });
  }

  divide(body: ArithmeticRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${API_BASE}/quantities/divide`, body, {
      headers: this.getHeaders()
    });
  }
}

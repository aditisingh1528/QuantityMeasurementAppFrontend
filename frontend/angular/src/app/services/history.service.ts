import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HistoryRecord } from '../models/quantity.model';
import { AuthService } from './auth.service';

const JSON_BASE = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class HistoryService {

  fullHistoryCleared = false;

  constructor(private http: HttpClient, private authService: AuthService) {}

  saveToSession(record: HistoryRecord) {
    const existing = this.getSessionHistory();
    existing.push(record);
    sessionStorage.setItem('sessionHistory', JSON.stringify(existing));
  }

  getSessionHistory(): HistoryRecord[] {
    const raw = sessionStorage.getItem('sessionHistory') ?? '[]';
    return JSON.parse(raw);
  }

  clearSessionHistory() {
    sessionStorage.removeItem('sessionHistory');
  }

  saveToServer(record: HistoryRecord): void {
    const username = this.authService.getUsername();
    this.http.post(`${JSON_BASE}/history`, { ...record, user: username }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  loadFromServer(): Observable<HistoryRecord[]> {
    const username = this.authService.getUsername();
    return this.http.get<HistoryRecord[]>(`${JSON_BASE}/history`).pipe(
      map(all => all.filter(h => h.user === username)),
      catchError(() => of([]))
    );
  }

  clearFromServer(): Observable<void> {
    const username = this.authService.getUsername();
    return this.http.get<HistoryRecord[]>(`${JSON_BASE}/history`).pipe(
      map(all => {
        const mine = all.filter(r => r.user === username);
        mine.forEach(r => {
          this.http.delete(`${JSON_BASE}/history/${r.id}`).subscribe();
        });
      }),
      catchError(() => of(undefined))
    );
  }
}

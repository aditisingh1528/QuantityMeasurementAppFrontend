import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { HistoryService } from '../../services/history.service';
import { HistoryRecord } from '../../models/quantity.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './history.component.html'
})
export class HistoryComponent implements OnInit {

  historyItems: HistoryRecord[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private historyService: HistoryService, private router: Router) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading = true;
    this.errorMessage = '';

    this.historyService.loadFromServer().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.historyItems = data.slice().reverse();
        if (data.length === 0) {
          this.errorMessage = 'No saved history found.';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Could not load history. Make sure JSON Server is running on port 3000.';
      }
    });
  }

  clearAll() {
    this.historyService.clearFromServer().subscribe({
      next: () => {
        this.historyItems = [];
        this.errorMessage = 'History cleared.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}

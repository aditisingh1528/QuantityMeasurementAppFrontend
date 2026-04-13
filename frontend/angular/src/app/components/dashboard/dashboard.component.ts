import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { HeaderComponent } from '../header/header.component';
import { QuantityService } from '../../services/quantity.service';
import { HistoryService } from '../../services/history.service';
import { AuthService } from '../../services/auth.service';
import {
  MeasurementType, ActionType, SubOpType,
  UNITS, UNIT_LABELS, TYPE_ICONS,
  HistoryRecord, ApiResponse
} from '../../models/quantity.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  // expose to template
  UNIT_LABELS = UNIT_LABELS;
  TYPE_ICONS = TYPE_ICONS;

  measurementTypes: MeasurementType[] = ['Length', 'Weight', 'Temperature', 'Volume'];
  actionTypes: ActionType[] = ['comparison', 'conversion', 'arithmetic'];
  subOps: SubOpType[] = ['ADD', 'SUBTRACT', 'DIVIDE'];

  activeType: MeasurementType = 'Length';
  activeAction: ActionType = 'comparison';
  activeSubOp: SubOpType = 'ADD';

  units: string[] = [];
  unit1 = '';
  unit2 = '';
  val1 = 1;
  val2 = 1;

  resultPreview = '—';
  compareResult = '—';
  compareEqual = false;
  arithResultValue = '—';
  arithResultUnit = '';

  apiError = '';
  isLoading = false;

  historyItems: HistoryRecord[] = [];
  isLoggedIn = false;
  historyLoading = false;

  toastMessage = '';
  showToast = false;

  constructor(
    private quantityService: QuantityService,
    private historyService: HistoryService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();

    // restore persisted state
    this.activeType = (localStorage.getItem('app_activeType') as MeasurementType) ?? 'Length';
    this.activeAction = (localStorage.getItem('app_activeAction') as ActionType) ?? 'comparison';
    this.activeSubOp = (localStorage.getItem('app_activeSubOp') as SubOpType) ?? 'ADD';

    const savedVal1 = localStorage.getItem('app_val1');
    const savedVal2 = localStorage.getItem('app_val2');
    if (savedVal1) this.val1 = parseFloat(savedVal1);
    if (savedVal2) this.val2 = parseFloat(savedVal2);

    this.populateUnits();
    this.restoreLastResult();

    this.historyItems = this.historyService.getSessionHistory();
  }

  populateUnits() {
    this.units = UNITS[this.activeType] ?? [];

    const savedU1 = localStorage.getItem(`app_unit1_${this.activeType}`);
    const savedU2 = localStorage.getItem(`app_unit2_${this.activeType}`);

    this.unit1 = (savedU1 && this.units.includes(savedU1)) ? savedU1 : this.units[0];
    this.unit2 = (savedU2 && this.units.includes(savedU2)) ? savedU2 : (this.units[1] ?? this.units[0]);
  }

  selectType(type: MeasurementType) {
    this.activeType = type;
    localStorage.setItem('app_activeType', type);

    if (type === 'Temperature' && this.activeAction === 'arithmetic') {
      this.activeAction = 'comparison';
      localStorage.setItem('app_activeAction', 'comparison');
    }

    this.populateUnits();
    this.clearResult();
  }

  selectAction(action: ActionType) {
    if (action === 'arithmetic' && this.activeType === 'Temperature') return;
    this.activeAction = action;
    localStorage.setItem('app_activeAction', action);
    this.clearResult();
  }

  selectSubOp(op: SubOpType) {
    this.activeSubOp = op;
    localStorage.setItem('app_activeSubOp', op);
    this.clearResult();
  }

  isArithDisabled(): boolean {
    return this.activeType === 'Temperature';
  }

  getConnectorSymbol(): string {
    if (this.activeAction === 'conversion') return '→';
    if (this.activeAction === 'comparison') return '=';
    const symbols: Record<SubOpType, string> = { ADD: '+', SUBTRACT: '−', DIVIDE: '÷' };
    return symbols[this.activeSubOp];
  }

  getExecuteLabel(): string {
    if (this.activeAction === 'conversion') return 'Convert';
    if (this.activeAction === 'comparison') return 'Compare';
    return 'Calculate';
  }

  clearResult() {
    this.resultPreview = '—';
    this.compareResult = '—';
    this.compareEqual = false;
    this.arithResultValue = '—';
    this.arithResultUnit = '';
    this.apiError = '';
    localStorage.removeItem('app_lastResult');
  }

  persistInputs() {
    localStorage.setItem('app_val1', String(this.val1));
    localStorage.setItem('app_val2', String(this.val2));
    localStorage.setItem(`app_unit1_${this.activeType}`, this.unit1);
    localStorage.setItem(`app_unit2_${this.activeType}`, this.unit2);
  }

  restoreLastResult() {
    const raw = localStorage.getItem('app_lastResult');
    if (!raw) return;
    try {
      const r = JSON.parse(raw);
      if (r.type !== this.activeType || r.action !== this.activeAction) return;

      if (r.action === 'comparison') {
        this.compareResult = r.display;
        this.compareEqual = r.equal;
      } else if (r.action === 'conversion') {
        this.resultPreview = r.display;
      } else {
        this.arithResultValue = r.display;
        this.arithResultUnit = r.unit ?? '';
      }
    } catch (_) {}
  }

  execute() {
    if (isNaN(this.val1)) {
      this.apiError = 'Please enter a valid value.';
      return;
    }

    this.apiError = '';
    this.isLoading = true;
    this.persistInputs();

    const mType = this.activeType + 'Unit';

    if (this.activeAction === 'comparison') {
      this.quantityService.compare({
        this: { value: this.val1, unit: this.unit1, measurementType: mType },
        that: { value: this.val2, unit: this.unit2, measurementType: mType }
      }).subscribe({
        next: (data) => this.handleCompareResult(data),
        error: (err) => this.handleError(err)
      });

    } else if (this.activeAction === 'conversion') {
      this.quantityService.convert({
        from: { value: this.val1, unit: this.unit1, measurementType: mType },
        toUnit: this.unit2
      }).subscribe({
        next: (data) => this.handleConvertResult(data),
        error: (err) => this.handleError(err)
      });

    } else {
      if (isNaN(this.val2)) {
        this.apiError = 'Please enter a valid second value.';
        this.isLoading = false;
        return;
      }
      const body = {
        this: { value: this.val1, unit: this.unit1, measurementType: mType },
        that: { value: this.val2, unit: this.unit2, measurementType: mType }
      };
      const call =
        this.activeSubOp === 'ADD'      ? this.quantityService.add(body) :
        this.activeSubOp === 'SUBTRACT' ? this.quantityService.subtract(body) :
                                          this.quantityService.divide(body);

      call.subscribe({
        next: (data) => this.handleArithResult(data),
        error: (err) => this.handleError(err)
      });
    }
  }

  handleCompareResult(data: ApiResponse) {
    const equal = data.resultString === 'true' || data.resultValue === 1 || data.result === true;
    const display = equal ? '✔ Equal' : '✘ Not Equal';

    this.compareResult = display;
    this.compareEqual = equal;
    this.isLoading = false;

    const record = this.buildRecord('COMPARE',
      `${this.val1} ${UNIT_LABELS[this.unit1]} vs ${this.val2} ${UNIT_LABELS[this.unit2]}`,
      display
    );
    localStorage.setItem('app_lastResult', JSON.stringify({
      type: this.activeType, action: 'comparison', display, equal
    }));
    this.saveHistory(record);
  }

  handleConvertResult(data: ApiResponse) {
    const val = this.formatNumber(data.resultValue);
    const unitLabel = UNIT_LABELS[data.resultUnit ?? this.unit2] ?? this.unit2;

    this.resultPreview = val;
    this.isLoading = false;

    const record = this.buildRecord('CONVERT',
      `${this.val1} ${UNIT_LABELS[this.unit1]} → ${UNIT_LABELS[this.unit2]}`,
      `${val} ${unitLabel}`
    );
    localStorage.setItem('app_lastResult', JSON.stringify({
      type: this.activeType, action: 'conversion', display: val
    }));
    this.saveHistory(record);
  }

  handleArithResult(data: ApiResponse) {
    const val = this.formatNumber(data.resultValue);
    const unitLabel = UNIT_LABELS[data.resultUnit ?? this.unit1] ?? this.unit1;

    this.arithResultValue = val;
    this.arithResultUnit = unitLabel;
    this.isLoading = false;

    const opSymbols: Record<SubOpType, string> = { ADD: '+', SUBTRACT: '−', DIVIDE: '÷' };
    const record = this.buildRecord(this.activeSubOp,
      `${this.val1} ${UNIT_LABELS[this.unit1]} ${opSymbols[this.activeSubOp]} ${this.val2} ${UNIT_LABELS[this.unit2]}`,
      `${val} ${unitLabel}`
    );
    localStorage.setItem('app_lastResult', JSON.stringify({
      type: this.activeType, action: 'arithmetic', display: val, unit: unitLabel
    }));
    this.saveHistory(record);
  }

  handleError(err: any) {
    this.apiError = err.error?.message ?? err.message ?? 'Something went wrong.';
    this.isLoading = false;
  }

  buildRecord(operation: string, details: string, outcome: string): HistoryRecord {
    return {
      id: Date.now().toString(),
      type: this.activeType,
      operation,
      details,
      outcome,
      time: new Date().toLocaleTimeString()
    };
  }

  saveHistory(record: HistoryRecord) {
    this.historyService.saveToSession(record);
    if (this.isLoggedIn) {
      this.historyService.saveToServer(record);
    }
    this.historyItems = this.historyService.getSessionHistory().slice().reverse();
  }

  clearHistory() {
    this.historyService.clearSessionHistory();
    if (this.isLoggedIn) {
      this.historyService.clearFromServer().subscribe();
    }
    this.historyItems = [];
  }

  loadFullHistory() {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.historyLoading = true;
    this.historyService.loadFromServer().subscribe({
      next: (data) => {
        this.historyLoading = false;
        this.historyItems = data.slice().reverse();
      },
      error: () => {
        this.historyLoading = false;
        this.displayToast('Could not load history. Is JSON Server running?');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  formatNumber(n: number | undefined | null): string {
    if (n === undefined || n === null) return '—';
    const num = parseFloat(String(n));
    if (isNaN(num)) return '—';
    return parseFloat(num.toPrecision(8)).toString();
  }

  displayToast(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  getHistoryReversed(): HistoryRecord[] {
    return this.historyService.getSessionHistory().slice().reverse();
  }
}

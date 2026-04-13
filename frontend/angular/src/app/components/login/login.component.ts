import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {

  activeTab: 'login' | 'signup' = 'login';

  loginForm: FormGroup;
  signupForm: FormGroup;

  loginError = '';
  signupError = '';
  loginLoading = false;
  signupLoading = false;

  showLoginPw = false;
  showSignupPw = false;

  toastMessage = '';
  showToast = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.signupForm = this.fb.group({
      name: [''],
      username: ['', Validators.required],
      password: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$/)
      ]],
      mobile: ['']
    });
  }

  switchTab(tab: 'login' | 'signup') {
    this.activeTab = tab;
    this.loginError = '';
    this.signupError = '';
  }

  toggleLoginPw() {
    this.showLoginPw = !this.showLoginPw;
  }

  toggleSignupPw() {
    this.showSignupPw = !this.showSignupPw;
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginError = 'Please enter username and password.';
      return;
    }

    const { username, password } = this.loginForm.value;
    this.loginLoading = true;
    this.loginError = 'Authenticating…';

    this.authService.login(username, password).subscribe({
      next: (data) => {
        this.authService.saveToken(data.token, username);
        this.loginLoading = false;
        this.loginError = '';
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loginLoading = false;
        this.loginError = 'Login failed: ' + (err.error?.message ?? err.message ?? 'Server error');
      }
    });
  }

  onSignup() {
    if (this.signupForm.get('username')?.invalid || this.signupForm.get('password')?.invalid) {
      this.signupError = 'Username and password are required.';
      return;
    }

    if (this.signupForm.get('password')?.errors?.['pattern'] || this.signupForm.get('password')?.errors?.['minlength']) {
      this.signupError = 'Password must be 3+ chars with an uppercase letter and a special character.';
      return;
    }

    const { username, password } = this.signupForm.value;
    this.signupLoading = true;
    this.signupError = 'Creating account…';

    this.authService.register(username, password).subscribe({
      next: () => {
        this.signupLoading = false;
        this.signupError = '';
        this.signupForm.reset();
        this.switchTab('login');
        this.loginForm.patchValue({ username });
        this.displayToast('Account created! Please log in.');
      },
      error: (err) => {
        this.signupLoading = false;
        this.signupError = 'Registration failed: ' + (err.error?.message ?? err.message ?? 'Server error');
      }
    });
  }

  displayToast(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }
}

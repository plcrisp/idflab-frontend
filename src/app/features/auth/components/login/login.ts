import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); // show errors if there is one not filled field
      return;
    }

    const { email, password } = this.loginForm.value;

    this.errorMessage = '';

    this.auth.login(email, password).subscribe({
      next: (response) => {
        console.log('Login realizado com sucesso!', response);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Erro ao fazer login';
        this.cdr.detectChanges();
        console.error('Erro no login:', error);
      },
    });
  }
}

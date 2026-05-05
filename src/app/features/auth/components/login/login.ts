import { Component, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { GoogleAuthService } from '../../services/google-auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';

  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private googleAuth: GoogleAuthService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.googleAuth.initializeGoogleAuth();
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); // show errors if there is one not filled field
      return;
    }

    this.isLoading = true;

    const { email, password } = this.loginForm.value;

    this.errorMessage = '';

    this.auth.login(email, password).subscribe({
      next: (response) => {
        console.log('Login realizado com sucesso!', response);
        this.isLoading = false;
      },
      error: (error) => {
        const message =
          error?.error?.detail?.message || error?.error?.message || 'Erro ao fazer login';

        this.errorMessage = message;

        if (message === 'E-mail não verificado. Verifique sua caixa de entrada.') {
          if (email) {
            this.auth.resendEmailVerification(email).subscribe({
              next: () => {
                console.log('E-mail de verificação reenviado.');
                this.isLoading = false;
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error('Erro ao reenviar e-mail:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
              },
            });

            return;
          }
        }

        this.isLoading = false;
        this.cdr.detectChanges();

        console.error('Erro no login:', error);
      },
    });
  }

  loginWithGoogle(): void {
    this.googleAuth.openPopup();
  }
}

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TimerService } from '../../../../core/services/timer.service';
import { TokenService } from '../../../../core/services/token.service';

export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirm_password')?.value;

  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
};

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.scss',
  providers: [TimerService],
})
export class Register implements OnInit {
  registerForm: FormGroup;
  errorMessage: string = '';

  isGoogleAuth: boolean = false;

  isLoading: boolean = false;
  isRegistered: boolean = false;
  isResending: boolean = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private tokenService: TokenService,
    private cdr: ChangeDetectorRef,
    public timerService: TimerService,
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', Validators.required],
        user_type: ['STUDENT', Validators.required],
        auth_provider: ['LOCAL', Validators.required],
      },
      {
        validators: passwordMatchValidator,
      },
    );
  }

  ngOnInit() {
    const state = history.state;

    if (state && state.isGoogleAuth) {
      this.isGoogleAuth = true;

      this.registerForm.patchValue({
        name: state.name,
        email: state.email,
        auth_provider: 'GOOGLE',
      });

      this.registerForm.get('email')?.disable();

      this.registerForm.get('password')?.clearValidators();
      this.registerForm.get('confirm_password')?.clearValidators();

      this.registerForm.get('password')?.updateValueAndValidity();
      this.registerForm.get('confirm_password')?.updateValueAndValidity();

      this.cdr.detectChanges();
    }
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched(); // show errors if there is one not filled field
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isGoogleAuth) {
      const payloadGoogle = {
        name: this.registerForm.value.name,
        email: history.state.email,
        user_type: this.registerForm.value.user_type,
      };

      this.auth.registerWithGoogle(payloadGoogle).subscribe({
        next: (response) => {
          this.tokenService.saveTokens(response.access_token, response.refresh_token);
          console.log('Criação de conta realizada com sucesso!');
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Erro ao criar conta';
        },
      });
    } else {
      this.auth.register(this.registerForm.value).subscribe({
        next: (response) => {
          console.log('Conta criada com sucesso!', response);
          this.isLoading = false;
          this.isRegistered = true;
          this.timerService.startResendTimer(30, () => this.cdr.detectChanges());
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error?.error?.message || 'Erro ao criar conta';
          this.cdr.detectChanges();
        },
      });
    }
  }

  onResendEmail() {
    if (!this.timerService.canResend || this.isResending) return;

    this.isResending = true;
    const email: string = this.registerForm.get('email')?.value;

    this.auth.resendEmailVerification(email).subscribe({
      next: () => {
        this.isResending = false;
        this.timerService.startResendTimer(30, () => this.cdr.detectChanges());

        this.cdr.detectChanges();
      },
      error: () => {
        this.isResending = false;
        this.timerService.startResendTimer(30, () => this.cdr.detectChanges());
        this.cdr.detectChanges();
      },
    });
  }
}

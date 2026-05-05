import { ChangeDetectorRef, Component } from '@angular/core';
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
export class Register {
  registerForm: FormGroup;
  errorMessage: string = '';

  isLoading: boolean = false;
  isRegistered: boolean = false;
  isResending: boolean = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
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
      },
      {
        validators: passwordMatchValidator,
      },
    );
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched(); // show errors if there is one not filled field
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

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

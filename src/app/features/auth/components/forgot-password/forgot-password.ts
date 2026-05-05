import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TimerService } from '../../../../core/services/timer.service';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
  providers: [TimerService],
})
export class ForgotPassword {
  forgotForm: FormGroup;
  errorMessage: string = '';

  isLoading: boolean = false;
  wasSent: boolean = false;
  isResending: boolean = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    public timerService: TimerService,
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const { email } = this.forgotForm.value;

    this.errorMessage = '';

    this.auth.sendPasswordReset(email).subscribe({
      next: (response) => {
        console.log('E-mail de recuperação enviado com sucesso!', response);
        this.isLoading = false;
        this.wasSent = true;
        this.timerService.startResendTimer(30, () => this.cdr.detectChanges());
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Erro ao enviar e-email de recuperação';
        this.cdr.detectChanges();
      },
    });
  }

  onResendEmail() {
    if (!this.timerService.canResend || this.isResending) return;

    this.isResending = true;
    const email: string = this.forgotForm.get('email')?.value;

    this.auth.sendPasswordReset(email).subscribe({
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

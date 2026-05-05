import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TimerService } from '../../../../core/services/timer.service';

@Component({
  selector: 'app-verify-email',
  standalone: false,
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
  providers: [TimerService],
})
export class VerifyEmail {
  status: 'loading' | 'success' | 'error' | 'resent' = 'loading';
  errorMessage: string = '';
  resendForm: FormGroup;

  isLoading: boolean = false;
  isResending: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    public timerService: TimerService,
  ) {
    this.resendForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status = 'error';
      this.errorMessage = 'Link de verificação inválido ou ausente.';
      return;
    }

    this.verifyUserToken(token);
  }

  onSubmit() {
    if (this.resendForm.invalid) {
      this.resendForm.markAllAsTouched();
      return;
    }

    const { email } = this.resendForm.value;

    this.errorMessage = '';

    this.auth.resendEmailVerification(email).subscribe({
      next: (response) => {
        console.log('E-mail de verificação enviado com sucesso!', response);
        this.isLoading = false;
        this.status = 'resent';
        this.timerService.startResendTimer(30, () => this.cdr.detectChanges());
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Erro ao enviar e-email de verificação';
        this.cdr.detectChanges();
      },
    });
  }

  onResendEmail() {
    if (!this.timerService.canResend || this.isResending) return;

    this.isResending = true;
    const email: string = this.resendForm.get('email')?.value;

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

  private verifyUserToken(token: string) {
    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.status = 'success';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.status = 'error';
        this.errorMessage =
          error?.error?.message || 'Este link de verificação expirou ou já foi utilizado.';
        this.cdr.detectChanges();
      },
    });
  }
}

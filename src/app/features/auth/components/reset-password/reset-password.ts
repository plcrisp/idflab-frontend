import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { passwordMatchValidator } from '../register/register';
import { ResetPasswordPayload } from '../../models/user.model';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  resetForm: FormGroup;
  errorMessage: string = '';

  isLoading: boolean = false;
  success: boolean = false;
  isResending: boolean = false;
  token: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {
    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', Validators.required],
      },
      {
        validators: passwordMatchValidator,
      },
    );
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      return;
    }
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const resetPassword: ResetPasswordPayload = {
      token: this.token!,
      new_password: this.resetForm.value.password,
    };

    this.errorMessage = '';

    this.auth.resetPassword(resetPassword).subscribe({
      next: (response) => {
        console.log('Senha alterada com sucesso!', response);
        this.isLoading = false;
        this.success = true;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Erro ao alterar senha';
        this.cdr.detectChanges();
      },
    });
  }
}

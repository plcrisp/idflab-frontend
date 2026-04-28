import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: false,
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail {
  status: 'loading' | 'success' | 'error' = 'loading';
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status = 'error';
      this.errorMessage = 'Link de verificação inválido ou ausente.';
      return;
    }

    this.verifyUserToken(token);
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

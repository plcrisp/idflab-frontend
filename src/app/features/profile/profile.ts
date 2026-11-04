import { ChangeDetectorRef, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { toast } from '@spartan-ng/brain/sonner';
import { MainLayoutService } from '../../core/services/state/main-layout.service';
import { TimerService } from '../../core/services/utils/timer.service';
import { AuthService } from '../auth/services/auth.service';
import {
  AUTH_PROVIDER_LABELS,
  USER_TYPE_LABELS,
  USER_TYPE_OPTIONS,
} from '../auth/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  providers: [TimerService],
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private mainLayoutService = inject(MainLayoutService);
  private cdr = inject(ChangeDetectorRef);
  readonly timerService = inject(TimerService);

  readonly user = this.auth.user;
  readonly userInitials = this.auth.userInitials;
  readonly isSaving = signal<boolean>(false);
  readonly isSendingReset = signal<boolean>(false);

  readonly userTypeOptions = USER_TYPE_OPTIONS;

  readonly userTypeLabel = computed(() => {
    const type = this.user()?.user_type;
    return type ? USER_TYPE_LABELS[type] : '';
  });

  readonly authProviderLabel = computed(() => {
    const provider = this.user()?.auth_provider;
    return provider ? AUTH_PROVIDER_LABELS[provider] : 'E-mail e senha';
  });

  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    institution: [''],
    user_type: ['STUDENT', [Validators.required]],
  });

  constructor() {
    this.timerService.canResend = true;

    effect(() => {
      const currentUser = this.user();
      if (currentUser && !this.profileForm.dirty) {
        this.syncFormWithUser(currentUser);
      }
    });
  }

  ngOnInit(): void {
    this.mainLayoutService.setBreadcrumbs([
      { label: 'Perfil', url: '/app/profile', active: true },
    ]);
  }

  private syncFormWithUser(u = this.user()): void {
    if (!u) return;
    this.profileForm.reset({
      name: u.name,
      institution: u.institution ?? '',
      user_type: u.user_type,
    });
  }

  hasChanges(): boolean {
    const u = this.user();
    if (!u) return false;

    const raw = this.profileForm.getRawValue();
    const currentName = (raw.name ?? '').trim();
    const currentInst = (raw.institution ?? '').trim();
    const savedInst = (u.institution ?? '').trim();

    return (
      currentName !== u.name ||
      currentInst !== savedInst ||
      raw.user_type !== u.user_type
    );
  }

  onReset(): void {
    this.syncFormWithUser();
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const raw = this.profileForm.getRawValue();
    const trimmedName = (raw.name ?? '').trim();

    if (!trimmedName) {
      this.profileForm.get('name')?.setErrors({ required: true });
      this.profileForm.get('name')?.markAsTouched();
      return;
    }

    if (!this.hasChanges()) {
      return;
    }

    this.isSaving.set(true);

    const trimmedInstitution = (raw.institution ?? '').trim();

    this.auth
      .updateProfile({
        name: trimmedName,
        institution: trimmedInstitution || null,
        user_type: raw.user_type,
      })
      .subscribe({
        next: (updatedUser) => {
          this.isSaving.set(false);
          this.syncFormWithUser(updatedUser);
          toast.success('Perfil atualizado com sucesso!', { position: 'bottom-center' });
        },
        error: (err) => {
          this.isSaving.set(false);
          const detail = err?.error?.detail || 'Não foi possível atualizar o perfil.';
          toast.error(detail, { position: 'bottom-center' });
        },
      });
  }

  onSendPasswordReset(): void {
    const email = this.user()?.email;
    if (!email || !this.timerService.canResend || this.isSendingReset()) return;

    this.isSendingReset.set(true);

    this.auth.sendPasswordReset(email).subscribe({
      next: () => {
        this.isSendingReset.set(false);
        this.timerService.startResendTimer(30, () => this.cdr.detectChanges());
        toast.success(`Link de redefinição enviado para ${email}.`, {
          position: 'bottom-center',
        });
      },
      error: () => {
        this.isSendingReset.set(false);
        toast.error('Não foi possível enviar o e-mail de redefinição.', {
          position: 'bottom-center',
        });
      },
    });
  }
}

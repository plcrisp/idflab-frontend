import {
  Component,
  effect,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import { Project } from '../../../../core/models/api/project.model';

@Component({
  selector: 'app-project-rename-modal',
  standalone: false,
  templateUrl: './project-rename-modal.html',
  styleUrl: './project-rename-modal.scss',
})
export class ProjectRenameModal {
  isOpen = input<boolean>(false);
  project = input<Project | null>(null);
  isSaving = input<boolean>(false);

  confirm = output<string>();
  cancel = output<void>();

  inputValue = signal<string>('');
  errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const p = this.project();
      const open = this.isOpen();
      if (open && p) {
        this.inputValue.set(p.name);
        this.errorMessage.set(null);
      }
    });
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isOpen() && !this.isSaving()) {
      this.onCancel();
    }
  }

  onSave(): void {
    const val = this.inputValue().trim();
    if (!val) {
      this.errorMessage.set('O nome do projeto não pode ser vazio.');
      return;
    }
    this.errorMessage.set(null);
    this.confirm.emit(val);
  }

  onCancel(): void {
    if (this.isSaving()) return;
    this.errorMessage.set(null);
    this.cancel.emit();
  }
}

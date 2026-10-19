import { Component, HostListener, input, output } from '@angular/core';
import { Project } from '../../../../core/models/api/project.model';

@Component({
  selector: 'app-project-delete-modal',
  standalone: false,
  templateUrl: './project-delete-modal.html',
  styleUrl: './project-delete-modal.scss',
})
export class ProjectDeleteModal {
  isOpen = input<boolean>(false);
  project = input<Project | null>(null);
  isDeleting = input<boolean>(false);

  confirm = output<Project>();
  cancel = output<void>();

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isOpen() && !this.isDeleting()) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    const p = this.project();
    if (p) {
      this.confirm.emit(p);
    }
  }

  onCancel(): void {
    if (this.isDeleting()) return;
    this.cancel.emit();
  }
}

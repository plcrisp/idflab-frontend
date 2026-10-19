import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmSidebarService } from '@spartan-ng/helm/sidebar';
import { MainLayoutService } from '../../core/services/state/main-layout.service';
import { ProjectsService } from '../../core/services/api/projects.service';
import { NotificationsService } from '../../core/services/api/notifications.service';
import { Project } from '../../core/models/api/project.model';
import {
  ProjectStatsData,
  StatusFilterType,
} from './components/projects-toolbar/projects-toolbar';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private mainLayoutService = inject(MainLayoutService);
  private sidebarService = inject(HlmSidebarService);
  private projectsService = inject(ProjectsService);
  private notificationsService = inject(NotificationsService);

  readonly loading = signal<boolean>(true);
  readonly projects = signal<Project[]>([]);
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<StatusFilterType>('ALL');

  // Paginação (3 cards = 1 fileira de 3)
  readonly pageSize = 3;
  readonly currentPage = signal<number>(1);

  // Modais
  readonly renameModalOpen = signal<boolean>(false);
  readonly projectToRename = signal<Project | null>(null);
  readonly isRenaming = signal<boolean>(false);

  readonly deleteModalOpen = signal<boolean>(false);
  readonly projectToDelete = signal<Project | null>(null);
  readonly isDeleting = signal<boolean>(false);

  readonly metrics = computed<ProjectStatsData>(() => {
    const list = this.projects();
    const total = list.length;
    const completed = list.filter((p) => this.isCompleted(p)).length;
    const inProgress = total - completed;
    return { total, inProgress, completed };
  });

  readonly filteredProjects = computed<Project[]>(() => {
    const list = this.projects();
    const filter = this.statusFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return list.filter((p) => {
      // Filtro de status
      if (filter === 'IN_PROGRESS' && this.isCompleted(p)) return false;
      if (filter === 'COMPLETED' && !this.isCompleted(p)) return false;

      // Filtro de busca textual
      if (!query) return true;

      const pName = (p.name || '').toLowerCase();
      const sName = (p.station?.name || '').toLowerCase();
      const sCode = (p.station?.code || '').toLowerCase();
      const sCity = (p.station?.city || '').toLowerCase();
      const sState = (p.station?.state || '').toLowerCase();
      const sCombined = `${sCity} ${sState}`.toLowerCase();

      return (
        pName.includes(query) ||
        sName.includes(query) ||
        sCode.includes(query) ||
        sCity.includes(query) ||
        sState.includes(query) ||
        sCombined.includes(query)
      );
    });
  });

  readonly totalFiltered = computed<number>(() => this.filteredProjects().length);

  readonly totalPages = computed<number>(() =>
    Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize)),
  );

  readonly paginatedProjects = computed<Project[]>(() => {
    const list = this.filteredProjects();
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  readonly paginationText = computed<string>(() => {
    const total = this.totalFiltered();
    if (total === 0) return '';
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize + 1;
    const end = Math.min(page * this.pageSize, total);
    return `${start}-${end} de ${total}`;
  });

  ngOnInit(): void {
    this.mainLayoutService.setBreadcrumbs([
      { label: 'Central de projetos', url: '/app/projects', active: true },
    ]);
    this.sidebarService.setOpen(true);

    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projectsService.getProjects().subscribe({
      next: (data) => {
        this.projects.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar lista de projetos:', err);
        this.projects.set([]);
        this.loading.set(false);
        toast.error('Não foi possível carregar os projetos.', { position: 'bottom-center' });
      },
    });
  }

  isCompleted(project: Project): boolean {
    return project.furthest_step === 'FUTURE_SCENARIOS' || project.furthest_step === 'RESULTS';
  }

  isProjectProcessing(projectId: string): boolean {
    const panel = this.notificationsService.panel();
    if (!panel || !panel.active_jobs) return false;
    return panel.active_jobs.some((job) => job.project_id === projectId);
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  onStatusFilterChange(filter: StatusFilterType): void {
    this.statusFilter.set(filter);
    this.currentPage.set(1);
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('ALL');
    this.currentPage.set(1);
  }

  // --- Modal Renomear ---

  openRenameModal(project: Project): void {
    this.projectToRename.set(project);
    this.isRenaming.set(false);
    this.renameModalOpen.set(true);
  }

  closeRenameModal(): void {
    if (this.isRenaming()) return;
    this.renameModalOpen.set(false);
    this.projectToRename.set(null);
  }

  confirmRename(newName: string): void {
    const project = this.projectToRename();
    if (!project) return;

    if (newName === project.name) {
      this.closeRenameModal();
      return;
    }

    this.isRenaming.set(true);

    this.projectsService.updateProjectName(project.id, newName).subscribe({
      next: (updated) => {
        this.projects.update((list) =>
          list.map((p) =>
            p.id === project.id
              ? { ...p, name: updated.name, updated_at: updated.updated_at }
              : p,
          ),
        );
        this.isRenaming.set(false);
        this.closeRenameModal();
        toast.success('Projeto renomeado com sucesso!', { position: 'bottom-center' });
      },
      error: (err) => {
        console.error('Erro ao renomear projeto:', err);
        toast.error('Falha ao renomear o projeto. Tente novamente.', {
          position: 'bottom-center',
        });
        this.isRenaming.set(false);
      },
    });
  }

  // --- Modal Excluir ---

  openDeleteModal(project: Project): void {
    this.projectToDelete.set(project);
    this.isDeleting.set(false);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) return;
    this.deleteModalOpen.set(false);
    this.projectToDelete.set(null);
  }

  confirmDelete(): void {
    const project = this.projectToDelete();
    if (!project) return;

    this.isDeleting.set(true);

    this.projectsService.deleteProject(project.id).subscribe({
      next: () => {
        this.projects.update((list) => list.filter((p) => p.id !== project.id));
        this.isDeleting.set(false);
        this.closeDeleteModal();
        toast.success('Projeto excluído com sucesso!', { position: 'bottom-center' });
      },
      error: (err) => {
        console.error('Erro ao excluir projeto:', err);
        toast.error('Falha ao excluir o projeto. Tente novamente.', {
          position: 'bottom-center',
        });
        this.isDeleting.set(false);
      },
    });
  }
}

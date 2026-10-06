import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, signal } from '@angular/core';
import { FillStatus, FilterStatus, PathOption, PathSelector } from './path-selector';

@Component({
  standalone: true,
  imports: [PathSelector],
  template: `
    <app-path-selector
      [(selected)]="selected"
      [fillStatus]="fillStatus()"
      [filterStatus]="filterStatus()"
      [filterThreshold]="filterThreshold()"
      [disabled]="disabled()"
    />
  `,
})
class TestHostComponent {
  selected = signal<PathOption>('fill');
  fillStatus = signal<FillStatus>('idle');
  filterStatus = signal<FilterStatus>('default');
  filterThreshold = signal<number>(90);
  disabled = signal<boolean>(false);
}

describe('PathSelector', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, PathSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render radiogroup and two radio cards without eyebrows, with "fill" selected by default', () => {
    const radiogroup = fixture.debugElement.query(By.css('[role="radiogroup"]'));
    expect(radiogroup).toBeTruthy();
    expect(radiogroup.nativeElement.getAttribute('aria-label')).toBe('Modo de tratamento de falhas');

    const cards = fixture.debugElement.queryAll(By.css('[role="radio"]'));
    expect(cards.length).toBe(2);

    const fillCard = cards[0];
    const filterCard = cards[1];

    expect(fillCard.nativeElement.getAttribute('aria-checked')).toBe('true');
    expect(fillCard.nativeElement.getAttribute('tabindex')).toBe('0');
    expect(fillCard.nativeElement.textContent).toContain('Preencher falhas');
    expect(fillCard.nativeElement.textContent).toContain('Recomendado');
    expect(fillCard.nativeElement.textContent).not.toContain('ESTIMAR');

    expect(filterCard.nativeElement.getAttribute('aria-checked')).toBe('false');
    expect(filterCard.nativeElement.getAttribute('tabindex')).toBe('-1');
    expect(filterCard.nativeElement.textContent).toContain('Desconsiderar anos incompletos');
    expect(filterCard.nativeElement.textContent).not.toContain('FILTRAR');
  });

  it('should render circular check ONLY on the selected card and NO empty circle on unselected card', () => {
    const cards = fixture.debugElement.queryAll(By.css('[role="radio"]'));
    const fillCard = cards[0];
    const filterCard = cards[1];

    // Card 1 is selected: has check indicator in corner
    const fillCheck = fillCard.query(By.css('.bg-primary.rounded-full'));
    expect(fillCheck).toBeTruthy();

    // Card 2 is unselected: should NOT have any corner circle
    const filterCheck = filterCard.query(By.css('.rounded-full'));
    expect(filterCheck).toBeNull();

    // Switch selection to filterCard
    filterCard.nativeElement.click();
    fixture.detectChanges();

    // Now Card 2 is selected and has check, Card 1 has none
    expect(cards[1].query(By.css('.bg-primary.rounded-full'))).toBeTruthy();
    expect(cards[0].query(By.css('.rounded-full'))).toBeNull();
  });

  it('should switch selected option when clicking on the second card without changing card background class', () => {
    const cards = fixture.debugElement.queryAll(By.css('[role="radio"]'));
    const filterCard = cards[1];

    filterCard.nativeElement.click();
    fixture.detectChanges();

    expect(host.selected()).toBe('filter');
    expect(cards[0].nativeElement.getAttribute('aria-checked')).toBe('false');
    expect(cards[1].nativeElement.getAttribute('aria-checked')).toBe('true');

    // Both cards maintain the standard .path-card class
    expect(cards[0].nativeElement.classList.contains('path-card')).toBe(true);
    expect(cards[1].nativeElement.classList.contains('path-card')).toBe(true);
    expect(cards[1].nativeElement.classList.contains('path-card--selected')).toBe(true);
    expect(cards[0].nativeElement.classList.contains('path-card--unselected')).toBe(true);
  });

  it('should navigate and switch selection using arrow keys', () => {
    const cards = fixture.debugElement.queryAll(By.css('[role="radio"]'));
    const fillCard = cards[0];

    // ArrowRight moves to filter
    fillCard.triggerEventHandler('keydown', {
      key: 'ArrowRight',
      preventDefault: () => {},
    });
    fixture.detectChanges();

    expect(host.selected()).toBe('filter');

    // ArrowLeft moves back to fill
    const filterCard = cards[1];
    filterCard.triggerEventHandler('keydown', {
      key: 'ArrowLeft',
      preventDefault: () => {},
    });
    fixture.detectChanges();

    expect(host.selected()).toBe('fill');
  });

  it('should select card when pressing Enter or Space', () => {
    const cards = fixture.debugElement.queryAll(By.css('[role="radio"]'));
    const filterCard = cards[1];

    filterCard.triggerEventHandler('keydown', {
      key: 'Enter',
      preventDefault: () => {},
    });
    fixture.detectChanges();

    expect(host.selected()).toBe('filter');
  });

  it('should not allow selection change when disabled is true', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('[role="radio"]'));
    const fillCard = cards[0];
    const filterCard = cards[1];

    expect(fillCard.nativeElement.getAttribute('aria-disabled')).toBe('true');
    expect(filterCard.nativeElement.getAttribute('aria-disabled')).toBe('true');
    expect(fillCard.nativeElement.getAttribute('tabindex')).toBe('-1');

    filterCard.nativeElement.click();
    fixture.detectChanges();

    expect(host.selected()).toBe('fill');

    fillCard.triggerEventHandler('keydown', {
      key: 'ArrowRight',
      preventDefault: () => {},
    });
    fixture.detectChanges();

    expect(host.selected()).toBe('fill');
  });

  it('should display correct status badges for fillStatus', () => {
    const getFillCardText = () =>
      fixture.debugElement.queryAll(By.css('[role="radio"]'))[0].nativeElement.textContent;

    // idle
    expect(getFillCardText()).toContain('Não executado');

    // running
    host.fillStatus.set('running');
    fixture.detectChanges();
    expect(getFillCardText()).toContain('Executando…');

    // done
    host.fillStatus.set('done');
    fixture.detectChanges();
    expect(getFillCardText()).toContain('Executado');

    // error
    host.fillStatus.set('error');
    fixture.detectChanges();
    expect(getFillCardText()).toContain('Falhou');
  });

  it('should NOT render any badge on filter card when filterStatus is default, and render "Configurado · N%" when configured', () => {
    const getFilterCard = () => fixture.debugElement.queryAll(By.css('[role="radio"]'))[1];

    // default: NO badge rendered, no "Padrão", no "≥"
    expect(getFilterCard().nativeElement.textContent).not.toContain('Padrão');
    expect(getFilterCard().nativeElement.textContent).not.toContain('≥');
    expect(getFilterCard().query(By.css('[hlmBadge]'))).toBeNull();

    // configured: renders "Configurado · 90%"
    host.filterStatus.set('configured');
    fixture.detectChanges();
    expect(getFilterCard().nativeElement.textContent).toContain('Configurado · 90%');
    expect(getFilterCard().query(By.css('[hlmBadge]'))).toBeTruthy();

    // configured with custom threshold 85%
    host.filterThreshold.set(85);
    fixture.detectChanges();
    expect(getFilterCard().nativeElement.textContent).toContain('Configurado · 85%');
  });
});

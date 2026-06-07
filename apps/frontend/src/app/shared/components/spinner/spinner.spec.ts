import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpinnerComponent } from './spinner';

describe('SpinnerComponent', () => {
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SpinnerComponent] });
    fixture = TestBed.createComponent(SpinnerComponent);
  });

  function svg(): SVGElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('svg');
  }

  it('renders a spinning icon sized via the size input', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    const el = svg();
    expect(el?.classList).toContain('animate-spin');
    expect(el?.classList).toContain('h-10');
  });

  it('is decorative by default', () => {
    fixture.detectChanges();
    const el = svg();
    expect(el?.getAttribute('aria-hidden')).toBe('true');
    expect(el?.getAttribute('role')).toBeNull();
  });

  it('exposes a live status when a label is provided', () => {
    fixture.componentRef.setInput('label', 'Rezerwuję');
    fixture.detectChanges();

    const el = svg();
    expect(el?.getAttribute('role')).toBe('status');
    expect(el?.getAttribute('aria-label')).toBe('Rezerwuję');
    expect(el?.getAttribute('aria-hidden')).toBeNull();
  });
});

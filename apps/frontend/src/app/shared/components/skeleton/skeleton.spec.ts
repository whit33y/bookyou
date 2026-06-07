import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton';

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SkeletonComponent] });
    fixture = TestBed.createComponent(SkeletonComponent);
  });

  function block(): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('div');
  }

  it('renders a pulsing, decorative placeholder', () => {
    fixture.detectChanges();
    const el = block();
    expect(el?.classList).toContain('animate-pulse');
    expect(el?.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies the provided dimensions and rounding', () => {
    fixture.componentRef.setInput('width', '50%');
    fixture.componentRef.setInput('height', '2rem');
    fixture.componentRef.setInput('rounded', 'rounded-full');
    fixture.detectChanges();

    const el = block();
    expect(el?.style.width).toBe('50%');
    expect(el?.style.height).toBe('2rem');
    expect(el?.classList).toContain('rounded-full');
  });
});

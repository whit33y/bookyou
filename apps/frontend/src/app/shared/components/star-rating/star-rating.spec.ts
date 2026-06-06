import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating';

describe('StarRatingComponent', () => {
  let fixture: ComponentFixture<StarRatingComponent>;
  let component: StarRatingComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StarRatingComponent],
    });
    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  describe('readonly mode', () => {
    it('renders an accessible average label and clips the overlay to the rating', () => {
      fixture.componentRef.setInput('rating', 3.5);
      fixture.detectChanges();

      const img = element().querySelector('[role="img"]');
      expect(img?.getAttribute('aria-label')).toBe('Średnia ocena: 3.5 na 5');

      const overlay = element().querySelector<HTMLElement>('.text-amber-400');
      expect(overlay?.style.width).toBe('70%');
    });

    it('does not render interactive controls', () => {
      fixture.componentRef.setInput('rating', 4);
      fixture.detectChanges();

      expect(element().querySelectorAll('[role="radio"]').length).toBe(0);
    });
  });

  describe('interactive mode', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('readonly', false);
      fixture.detectChanges();
    });

    it('renders five radio stars', () => {
      expect(element().querySelectorAll('[role="radio"]').length).toBe(5);
    });

    it('emits the selected rating on click', () => {
      let emitted: number | undefined;
      component.ratingChange.subscribe((value) => (emitted = value));

      const stars = element().querySelectorAll<HTMLButtonElement>('[role="radio"]');
      stars[3].click();

      expect(emitted).toBe(4);
    });

    it('increments the rating with ArrowRight', () => {
      fixture.componentRef.setInput('rating', 2);
      fixture.detectChanges();

      let emitted: number | undefined;
      component.ratingChange.subscribe((value) => (emitted = value));

      const group = element().querySelector<HTMLElement>('[role="radiogroup"]')!;
      group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(emitted).toBe(3);
    });

    it('does not exceed five stars when navigating up', () => {
      fixture.componentRef.setInput('rating', 5);
      fixture.detectChanges();

      let emitted: number | undefined;
      component.ratingChange.subscribe((value) => (emitted = value));

      const group = element().querySelector<HTMLElement>('[role="radiogroup"]')!;
      group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(emitted).toBe(5);
    });

    it('marks the selected star as checked', () => {
      fixture.componentRef.setInput('rating', 3);
      fixture.detectChanges();

      const stars = element().querySelectorAll<HTMLButtonElement>('[role="radio"]');
      expect(stars[2].getAttribute('aria-checked')).toBe('true');
      expect(stars[0].getAttribute('aria-checked')).toBe('false');
    });
  });
});

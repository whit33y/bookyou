import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmptyStateComponent } from './empty-state';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  let component: EmptyStateComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Brak wizyt');
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the title and the decorative icon', () => {
    fixture.detectChanges();
    expect(element().textContent).toContain('Brak wizyt');
    const icon = element().querySelector('svg');
    expect(
      icon?.getAttribute('aria-hidden') ?? icon?.parentElement?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('renders the description only when provided', () => {
    fixture.detectChanges();
    expect(element().querySelectorAll('p').length).toBe(1);

    fixture.componentRef.setInput('description', 'Zarezerwuj swoją pierwszą wizytę.');
    fixture.detectChanges();
    expect(element().textContent).toContain('Zarezerwuj swoją pierwszą wizytę.');
  });

  it('renders no CTA when ctaLabel is empty', () => {
    fixture.detectChanges();
    expect(element().querySelector('a')).toBeNull();
    expect(element().querySelector('button')).toBeNull();
  });

  it('renders the CTA as a router link when ctaLink is set', () => {
    fixture.componentRef.setInput('ctaLabel', 'Zarezerwuj');
    fixture.componentRef.setInput('ctaLink', '/businesses');
    fixture.detectChanges();

    const link = element().querySelector('a');
    expect(link?.textContent?.trim()).toBe('Zarezerwuj');
    expect(link?.getAttribute('href')).toBe('/businesses');
    expect(element().querySelector('button')).toBeNull();
  });

  it('renders the CTA as a button emitting ctaClick when no link is set', () => {
    fixture.componentRef.setInput('ctaLabel', 'Dodaj usługę');
    fixture.detectChanges();

    let clicked = false;
    component.ctaClick.subscribe(() => (clicked = true));

    const button = element().querySelector('button');
    expect(button?.textContent?.trim()).toBe('Dodaj usługę');
    button?.click();
    expect(clicked).toBe(true);
  });
});

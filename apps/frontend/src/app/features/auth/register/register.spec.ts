import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './register';

describe('RegisterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should require email and password', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const form = fixture.componentInstance.form;
    expect(form.valid).toBe(false);

    form.patchValue({ email: 'test@test.com', password: '12345678' });
    expect(form.valid).toBe(true);
  });

  it('should reject password shorter than 8 chars', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const form = fixture.componentInstance.form;
    form.patchValue({ email: 'test@test.com', password: '1234567' });
    expect(form.valid).toBe(false);
  });
});

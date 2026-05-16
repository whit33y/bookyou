import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './register';
import { Role } from '../../../core/models/user.model';

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

  it('should default role to CLIENT', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    expect(fixture.componentInstance.form.controls.role.value).toBe(Role.CLIENT);
  });

  it('should allow selecting PROVIDER role', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const form = fixture.componentInstance.form;
    form.controls.role.setValue(Role.PROVIDER);
    expect(form.controls.role.value).toBe(Role.PROVIDER);
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

  it('should include role in form value', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const form = fixture.componentInstance.form;
    form.patchValue({
      email: 'test@test.com',
      password: '12345678',
      role: Role.PROVIDER,
    });

    const value = form.getRawValue();
    expect(value.role).toBe(Role.PROVIDER);
  });
});

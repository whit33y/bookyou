import { Appointment, AppointmentStatus } from '../models/appointment.model';

export function canCancelAppointment(appointment: Appointment): boolean {
  return (
    appointment.status === AppointmentStatus.PENDING ||
    appointment.status === AppointmentStatus.CONFIRMED
  );
}

# BookYou Roadmap

This document outlines the development phases for BookYou, a platform for beauty, wellness, and health service bookings.

## Phase 1: MVP (Minimum Viable Product)

The goal of the MVP is to provide a functional end-to-end booking experience for both service providers and clients.

### 1. User Management

- **Auth:** Registration and Login (Email/Password).
- **Roles:** Basic separation between `Service Provider` (Business) and `Client` (User).
- **Profiles:** Basic business profile (name, address, description, opening hours) and client profile.

### 2. Service Catalog (Business Side)

- Ability for businesses to define services (name, duration, price).
- List and edit services.

### 3. Search & Discovery (Client Side)

- List all available businesses.
- Basic filtering by town, category or name.
- View business profile and service list.

### 4. Booking Engine

- **Calendar Management:** Business owners can see their schedule.
- **Reservation Flow:** Clients can select a service and an available time slot.
- **Appointment Status:** Basic statuses: `Pending`, `Confirmed`, `Cancelled`.

### 5. Essential UI/UX

- Mobile-first responsive design (Angular + Tailwind).
- Simple dashboard for Business owners.
- List of upcoming appointments for Clients.

---

## Phase 2: Full Version

The Full Version expands the ecosystem with automation, financial tools, and advanced discovery.

### 1. Advanced Booking & Calendar

- **Employee Management:** Support for multiple staff members with individual calendars.
- **Recurrence:** Support for recurring appointments.
- **Buffer Times:** Automatic breaks between services.

### 2. Payments & Monetization

- **Online Payments:** Integration with Stripe or PayU.
- **Deposits:** Option to require a deposit for high-value services.
- **Invoicing:** Automatic generation of receipts/invoices.

### 3. Communication & Marketing

- **Notifications:** SMS and Email reminders/confirmations.
- **Push Notifications:** Real-time updates via mobile app/web push.
- **Reviews & Ratings:** Clients can rate services after completion.
- **Promotions:** Discount codes and "Happy Hours" management.

### 4. Advanced Discovery

- **Map View:** Searching for services using an interactive map (Google Maps/Mapbox).
- **Geolocation:** Automatic finding of nearby salons.
- **Smart Recommendations:** Based on user history.

### 5. Business Analytics (SaaS Dashboard)

- **Revenue Reports:** Visual charts of earnings.
- **Client Retention:** Stats on returning vs. new clients.
- **Popularity:** Which services/staff members are booked most often.

---

---

# BookYou Roadmap (Wersja PL)

Ten dokument przedstawia etapy rozwoju BookYou, platformy do rezerwacji usług beauty, wellness i zdrowotnych.

## Faza 1: MVP (Minimum Viable Product)

Celem MVP jest zapewnienie funkcjonalnego procesu rezerwacji "end-to-end" zarówno dla usługodawców, jak i klientów.

### 1. Zarządzanie Użytkownikami

- **Autentykacja:** Rejestracja i Logowanie (Email/Hasło).
- **Role:** Podstawowy podział na `Usługodawcę` (Biznes) i `Klienta` (Użytkownik).
- **Profile:** Podstawowy profil biznesowy (nazwa, adres, opis, godziny otwarcia) oraz profil klienta.

### 2. Katalog Usług (Strona Biznesowa)

- Możliwość definiowania usług (nazwa, czas trwania, cena).
- Lista i edycja usług.

### 3. Wyszukiwanie i Odkrywanie (Strona Klienta)

- Lista wszystkich dostępnych firm.
- Podstawowe filtrowanie po mieście, kategorii lub nazwie.
- Podgląd profilu firmy i listy usług.

### 4. Silnik Rezerwacji

- **Zarządzanie Kalendarzem:** Właściciele firm widzą swój grafik.
- **Proces Rezerwacji:** Klienci mogą wybrać usługę i dostępny slot czasowy.
- **Status Wizyty:** Podstawowe statusy: `Oczekująca`, `Potwierdzona`, `Anulowana`.

### 5. Podstawowe UI/UX

- Design responsywny mobile-first (Angular + Tailwind).
- Prosty panel (dashboard) dla właścicieli firm.
- Lista nadchodzących wizyt dla klientów.

---

## Faza 2: Pełna Wersja

Pełna wersja rozszerza ekosystem o automatyzację, narzędzia finansowe i zaawansowane funkcje odkrywania.

### 1. Zaawansowane Rezerwacje i Kalendarz

- **Zarządzanie Pracownikami:** Wsparcie dla wielu członków personelu z indywidualnymi kalendarzami.
- **Powtarzalność:** Obsługa wizyt cyklicznych.
- **Przerwy Techniczne:** Automatyczne przerwy (buffery) między usługami.

### 2. Płatności i Monetyzacja

- **Płatności Online:** Integracja ze Stripe lub PayU.
- **Zaliczki:** Opcja wymagania zadatku przy usługach o wysokiej wartości.
- **Fakturowanie:** Automatyczne generowanie potwierdzeń/faktur.

### 3. Komunikacja i Marketing

- **Powiadomienia:** Przypomnienia i potwierdzenia SMS/Email.
- **Push Notifications:** Aktualizacje w czasie rzeczywistym via web/mobile push.
- **Opinie i Oceny:** Klienci mogą oceniać usługi po ich zakończeniu.
- **Promocje:** Zarządzanie kodami rabatowymi i ofertami typu "Happy Hours".

### 4. Zaawansowane Odkrywanie

- **Widok Mapy:** Wyszukiwanie usług na interaktywnej mapie (Google Maps/Mapbox).
- **Geolokalizacja:** Automatyczne znajdowanie salonów w pobliżu.
- **Inteligentne Rekomendacje:** Oparte na historii użytkownika.

### 5. Analityka Biznesowa (Dashboard SaaS)

- **Raporty Przychodów:** Wizualne wykresy zarobków.
- **Retencja Klientów:** Statystyki powracających vs nowych klientów.
- **Popularność:** Które usługi/pracownicy są najczęściej rezerwowani.

---

## Kamienie Milowe (Techniczne)

1. [ ] Konfiguracja schematu Prisma dla MVP (Użytkownicy, Firmy, Usługi, Wizyty).
2. [ ] Implementacja Backend Auth i CRUD dla usług.
3. [ ] Stworzenie Layoutu Frontend i stron logowania.
4. [ ] Budowa logiki rezerwacji (kalendarz).
5. [ ] Integracja z infrastrukturą chmurową do wdrożenia.

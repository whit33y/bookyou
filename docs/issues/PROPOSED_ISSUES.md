# BookYou — Propozycje Issues / Proposed Issues

## Ocena obecnego stanu aplikacji

### Co jest zrobione ✅

- Monorepo (Angular 21 + NestJS) z Prisma + PostgreSQL
- Autentykacja (rejestracja/logowanie, JWT, role CLIENT/PROVIDER)
- CRUD biznesów (tworzenie, edycja, lista, szczegóły)
- CRUD usług (dodawanie/edycja usług do biznesu)
- System rezerwacji (tworzenie, statusy, kalendarz providera)
- Strona główna z rozróżnieniem guest/authenticated
- Podstawowy routing z guardami (auth/guest)
- Shared components (navigation, footer, toast, status-badge, confirm-modal)
- Docker Compose dla PostgreSQL
- Quality tooling (Husky, Commitlint, Prettier, ESLint)

### Czego brakuje / Co jest słabe ❌

- **Brak wyszukiwania/filtrowania** — lista biznesów nie ma filtrów (miasto, kategoria, nazwa)
- **Brak profilu użytkownika** — nie można edytować swoich danych, zmienić hasła
- **Brak kategorii usług** — w bazie nie ma modelu kategorii, kafelki na stronie głównej są statyczne/mockowe
- **Brak zdjęć/avatarów** — biznesy i użytkownicy nie mają zdjęć, co sprawia że UI jest "martwy"
- **Brak powiadomień** — żadnych emaili, SMS-ów ani push notifications
- **Brak opinii/ocen** — klienci nie mogą oceniać usług
- **Brak walidacji dostępności** — booking modal nie sprawdza realnie wolnych slotów z godzin otwarcia
- **UI jest generyczny** — brak animacji, brak skeleton loaderów, brak empty states z ilustracjami
- **Brak dark mode**
- **Brak testów E2E**
- **Brak CI/CD pipeline**

---

## Issue #1: Wyszukiwarka i filtrowanie biznesów

**Description / Opis:** Dodanie funkcjonalności wyszukiwania i filtrowania na stronie `/businesses` — po nazwie, mieście i kategorii usług.

### Scope / Zakres

**Backend:**

- Endpoint `GET /businesses` z query params: `search`, `city`, `category`
- Filtrowanie case-insensitive po nazwie i mieście
- Paginacja wyników (limit/offset)

**Frontend:**

- Pasek wyszukiwania z inputem tekstowym i selectem miasta
- Debounce na wyszukiwaniu (300ms)
- Wyświetlanie liczby wyników
- Empty state gdy brak wyników ("Nie znaleziono biznesów")
- Skeleton loader podczas ładowania

### Goal / Cel

Użytkownik może szybko znaleźć interesujący go biznes bez przeglądania całej listy.

### Acceptance Criteria / Kryteria akceptacji

- Wpisanie tekstu w search filtruje biznesy po nazwie
- Wybranie miasta filtruje po lokalizacji
- Filtry działają łącznie (AND)
- Wyniki ładują się z debounce
- Widoczny jest empty state gdy brak wyników
- Endpoint obsługuje paginację

---

## Issue #2: Profil użytkownika — edycja danych i zmiana hasła

**Description / Opis:** Dodanie strony profilu użytkownika z możliwością edycji danych osobowych i zmiany hasła.

### Scope / Zakres

**Backend:**

- `GET /auth/me` — zwraca pełne dane zalogowanego użytkownika
- `PATCH /auth/me` — aktualizacja name, email
- `PATCH /auth/me/password` — zmiana hasła (wymaga podania starego hasła)

**Frontend:**

- Nowa strona `/profile` (chroniona authGuard)
- Formularz edycji: imię, email
- Osobny formularz zmiany hasła (stare hasło + nowe hasło + potwierdzenie)
- Link do profilu w nawigacji (avatar/ikona użytkownika)
- Toast z potwierdzeniem po zapisie

### Goal / Cel

Użytkownik ma kontrolę nad swoimi danymi i może zarządzać kontem.

### Acceptance Criteria / Kryteria akceptacji

- Użytkownik widzi swoje aktualne dane w formularzu
- Może zmienić imię i email
- Może zmienić hasło (walidacja starego hasła)
- Błędy walidacji wyświetlane inline
- Po zapisie pojawia się toast sukcesu

---

## Issue #3: Model kategorii usług + dynamiczne kafelki na stronie głównej

**Description / Opis:** Wprowadzenie modelu `Category` w bazie danych i powiązanie go z `Service`. Kafelki kategorii na stronie głównej powinny być dynamiczne.

### Scope / Zakres

**Backend:**

- Nowy model `Category` w Prisma (id, name, icon, slug)
- Relacja `Service` → `Category` (many-to-one)
- Migracja bazy danych
- Endpoint `GET /categories` — lista kategorii z liczbą powiązanych usług
- Seed z podstawowymi kategoriami (Fryzjer, Barber, Kosmetyczka, Masaż, Paznokcie, Fizjoterapia)

**Frontend:**

- Sekcja kategorii na stronie głównej pobiera dane z API
- Kliknięcie w kategorię przekierowuje do `/businesses?category=slug`
- Ikony kategorii (można użyć emoji lub SVG)

### Goal / Cel

Kategorie usług są zarządzane w bazie danych, a nie hardcoded w frontendzie. Użytkownik może przeglądać biznesy po kategorii.

### Acceptance Criteria / Kryteria akceptacji

- Model `Category` istnieje w schemacie Prisma
- Endpoint zwraca listę kategorii
- Strona główna wyświetla dynamiczne kafelki
- Kliknięcie w kategorię filtruje biznesy

---

## Issue #4: Upload zdjęć — logo biznesu i avatar użytkownika

**Description / Opis:** Dodanie możliwości uploadu zdjęć dla biznesów (logo/cover) i użytkowników (avatar), aby UI wyglądał bardziej profesjonalnie i "żywo".

### Scope / Zakres

**Backend:**

- Endpoint `POST /upload/image` z multer (już zainstalowany w dependencies)
- Zapis plików lokalnie (lub S3 w przyszłości) — na start folder `uploads/`
- Endpoint `GET /uploads/:filename` do serwowania plików
- Pola `avatarUrl` w modelu `User` i `logoUrl`, `coverUrl` w modelu `Business`
- Migracja bazy danych

**Frontend:**

- Komponent upload z podglądem (drag & drop lub click)
- W ustawieniach biznesu — upload logo
- W profilu użytkownika — upload avatara
- Placeholder/default avatar gdy brak zdjęcia
- Wyświetlanie logo biznesu na liście i w szczegółach

### Goal / Cel

Aplikacja wygląda profesjonalnie i "żywo" dzięki zdjęciom. Biznesy są rozpoznawalne wizualnie.

### Acceptance Criteria / Kryteria akceptacji

- Użytkownik może uploadować avatar w profilu
- Provider może uploadować logo biznesu
- Zdjęcia wyświetlają się na liście biznesów i w szczegółach
- Placeholder gdy brak zdjęcia
- Walidacja rozmiaru pliku (max 5MB) i formatu (jpg, png, webp)

---

## Issue #5: Walidacja dostępności slotów czasowych (Smart Booking)

**Description / Opis:** Booking modal powinien pokazywać tylko realnie dostępne sloty czasowe na podstawie godzin otwarcia biznesu i istniejących rezerwacji.

### Scope / Zakres

**Backend:**

- Endpoint `GET /businesses/:id/available-slots?date=YYYY-MM-DD&serviceId=uuid`
- Logika: generuj sloty na podstawie `openingHours`, odejmij zajęte (istniejące appointments), uwzględnij `duration` usługi
- Zwraca tablicę dostępnych godzin: `["09:00", "09:30", "10:00", ...]`

**Frontend:**

- Booking modal: po wybraniu daty i usługi, pobiera dostępne sloty
- Wyświetla sloty jako klikalne przyciski (grid)
- Disabled/szare sloty gdy brak dostępności
- Loading state podczas pobierania slotów
- Komunikat "Brak wolnych terminów" gdy pusta lista

### Goal / Cel

Użytkownik nie może zarezerwować terminu który jest już zajęty. Proces rezerwacji jest intuicyjny.

### Acceptance Criteria / Kryteria akceptacji

- Sloty generowane na podstawie godzin otwarcia
- Zajęte terminy nie są wyświetlane
- Czas trwania usługi wpływa na dostępne sloty
- Nie można zarezerwować w przeszłości
- Widoczny loading i empty state

---

## Issue #6: System opinii i ocen (Reviews & Ratings)

**Description / Opis:** Klienci mogą wystawiać oceny (1-5 gwiazdek) i opinie tekstowe po zakończonej wizycie.

### Scope / Zakres

**Backend:**

- Nowy model `Review` (id, rating 1-5, comment, clientId, businessId, appointmentId, createdAt)
- Relacje: Review → User, Review → Business, Review → Appointment
- Endpoint `POST /reviews` — tylko dla klienta, tylko po wizycie ze statusem COMPLETED
- Endpoint `GET /businesses/:id/reviews` — lista opinii z paginacją
- Pole `averageRating` i `reviewCount` w response biznesu (computed)

**Frontend:**

- Komponent gwiazdek (rating stars) — reużywalny
- Formularz dodawania opinii (po zakończonej wizycie, w "Moje wizyty")
- Wyświetlanie średniej oceny i liczby opinii na karcie biznesu
- Sekcja opinii na stronie szczegółów biznesu
- Sortowanie opinii (najnowsze / najwyżej oceniane)

### Goal / Cel

Social proof — nowi użytkownicy widzą opinie i mogą podjąć lepszą decyzję. Biznesy są motywowane do dobrej obsługi.

### Acceptance Criteria / Kryteria akceptacji

- Klient może dodać opinię tylko po zakończonej wizycie
- Ocena 1-5 gwiazdek + opcjonalny komentarz
- Średnia ocena widoczna na liście biznesów
- Strona szczegółów pokazuje listę opinii
- Nie można dodać dwóch opinii do tej samej wizyty

---

## Issue #7: Animacje, skeleton loadery i empty states (UI Polish)

**Description / Opis:** Poprawa UX poprzez dodanie animacji przejść, skeleton loaderów podczas ładowania danych i atrakcyjnych empty states.

### Scope / Zakres

**Skeleton Loaders:**

- Lista biznesów — karty-placeholder z pulsującą animacją
- Szczegóły biznesu — skeleton dla nagłówka, usług, opinii
- Dashboard — skeleton dla statystyk i listy wizyt
- Moje wizyty — skeleton dla kart wizyt

**Empty States:**

- "Moje wizyty" gdy brak wizyt — ilustracja + CTA "Zarezerwuj pierwszą wizytę"
- Lista biznesów gdy brak wyników — ilustracja + tekst
- Dashboard providera gdy brak usług — CTA "Dodaj pierwszą usługę"
- Kalendarz gdy brak wizyt w danym dniu

**Animacje:**

- Fade-in przy ładowaniu stron (Angular route animations)
- Subtle hover effects na kartach biznesów
- Animacja toast notifications (slide-in/slide-out)
- Smooth transitions w modalach

### Goal / Cel

Aplikacja czuje się "żywa" i profesjonalna. Użytkownik zawsze wie co się dzieje (loading) i co może zrobić (empty states z CTA).

### Acceptance Criteria / Kryteria akceptacji

- Każda strona z danymi ma skeleton loader
- Każda pusta lista ma dedykowany empty state z CTA
- Modalne okna mają animację wejścia/wyjścia
- Karty biznesów mają hover effect
- Brak "migania" przy ładowaniu (skeleton → content)

---

## Issue #8: Dark Mode

**Description / Opis:** Dodanie obsługi dark mode z automatycznym wykrywaniem preferencji systemowych i możliwością ręcznego przełączania.

### Scope / Zakres

- Toggle dark/light w nawigacji (ikona słońce/księżyc)
- Zapis preferencji w localStorage
- Automatyczne wykrywanie `prefers-color-scheme`
- Dostosowanie palety kolorów Tailwind (dark: variants)
- Wszystkie komponenty wspierają dark mode
- Smooth transition przy przełączaniu

### Goal / Cel

Użytkownicy mogą korzystać z aplikacji w ciemnym motywie, co jest standardem w nowoczesnych aplikacjach.

### Acceptance Criteria / Kryteria akceptacji

- Toggle w nawigacji przełącza motyw
- Preferencja zapisywana w localStorage
- Przy pierwszej wizycie — wykrywanie systemowego motywu
- Wszystkie strony wyglądają poprawnie w dark mode
- Smooth transition (bez flashowania)

---

## Issue #9: CI/CD Pipeline (GitHub Actions)

**Description / Opis:** Konfiguracja GitHub Actions do automatycznego budowania, testowania i lintowania przy każdym pushu/PR.

### Scope / Zakres

- Workflow `ci.yml`:
  - Trigger: push do `main`, PR do `main`
  - Job 1: Lint (ESLint + Prettier check)
  - Job 2: Backend tests (Jest)
  - Job 3: Frontend tests (Vitest)
  - Job 4: Build (frontend + backend)
- Cache `node_modules` dla szybszych buildów
- Status checks wymagane do merge PR
- Badge w README

### Goal / Cel

Każdy PR jest automatycznie walidowany. Nie można zmergować kodu który nie przechodzi testów.

### Acceptance Criteria / Kryteria akceptacji

- Push do main triggeruje pipeline
- PR do main triggeruje pipeline
- Lint, testy i build muszą przejść
- Badge CI w README
- Pipeline trwa < 5 minut

---

## Issue #10: Powiadomienia email (potwierdzenie rezerwacji + przypomnienie)

**Description / Opis:** Wysyłanie emaili przy tworzeniu rezerwacji (potwierdzenie) i 24h przed wizytą (przypomnienie).

### Scope / Zakres

**Backend:**

- Integracja z serwisem email (Resend, Nodemailer + SMTP, lub SendGrid)
- Template HTML dla: potwierdzenia rezerwacji, przypomnienia 24h
- Wysyłka emaila przy `POST /appointments` (do klienta i providera)
- Cron job / scheduled task: sprawdzanie wizyt w ciągu 24h i wysyłka przypomnień
- Konfiguracja przez zmienne środowiskowe

**Frontend:**

- Brak zmian (email wysyłany z backendu)

### Goal / Cel

Użytkownicy nie zapominają o wizytach. Potwierdzenie emailem buduje zaufanie do platformy.

### Acceptance Criteria / Kryteria akceptacji

- Po utworzeniu rezerwacji klient i provider dostają email
- 24h przed wizytą klient dostaje przypomnienie
- Emaile mają czytelny HTML template
- Konfiguracja SMTP przez env vars
- Graceful handling gdy email się nie wyśle (log, nie crash)

---

## Priorytetyzacja (sugerowana kolejność)

| #   | Issue                                         | Impact    | Effort    |
| --- | --------------------------------------------- | --------- | --------- |
| 1   | Wyszukiwarka i filtrowanie                    | 🔥 Wysoki | 🟡 Średni |
| 5   | Smart Booking (walidacja slotów)              | 🔥 Wysoki | 🟡 Średni |
| 7   | UI Polish (skeletony, empty states, animacje) | 🔥 Wysoki | 🟡 Średni |
| 3   | Kategorie usług                               | 🟠 Średni | 🟢 Niski  |
| 2   | Profil użytkownika                            | 🟠 Średni | 🟢 Niski  |
| 4   | Upload zdjęć                                  | 🟠 Średni | 🟡 Średni |
| 6   | Opinie i oceny                                | 🟠 Średni | 🟡 Średni |
| 8   | Dark Mode                                     | 🟡 Niski  | 🟢 Niski  |
| 9   | CI/CD Pipeline                                | 🟠 Średni | 🟢 Niski  |
| 10  | Powiadomienia email                           | 🟡 Niski  | 🔴 Wysoki |

---

_Wygenerowano: 2026-05-24_

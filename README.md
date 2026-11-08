# Unify Learn · phone screens (React + TypeScript)

Every phone screen from the Figma file **Unify MoodBoard**, built in the same stack as `DIBBLS/unify` → `apps/web`
(React 18, React Router 6, lucide-react, Vite 5, TypeScript strict).

**128 screens:** student S01–S76 (S57 removed), class list & claiming AT01–AT19, contributor C01–C06, lecturer L00–L20 (with intro L01a–L01c), and the Unify admin panel AD01–AD04 (desktop).
**Not included:** student desktop, dark mode, Dean/HOD, Face-off (game).

The *why* behind each screen is in a separate doc: **Unify Learn · Why Each Screen Works This Way** (shared alongside this zip).

---

## Update · 5 Nov

**Naming.** The role is called **HOC** everywhere (no more "class rep" or "Head of Class").

**Lecturer onboarding (L00, L01a–L01c, L01).** A black "Unify Learn · FOR LECTURERS" splash, then three intro screens:
"Every course you teach. Under one roof." · "400 students? Attendance in minutes." · "See beyond your lecture hall."
(type only, no fake stats). The welcome screen now says "A new way to manage your teaching." with Box Boy reading papers.
Keep the "minutes" claim honest: test the scan with a real class before launch.

**Claiming your name for attendance (AT01–AT19, `screens/student/ClassList.tsx`).** Replaces S57, where students typed their own name.
- The HOC **must** upload the class list first: a document (Excel/CSV, Word, PDF), a pasted list, or our template (AT01, AT01a, AT01b, AT02). No photos.
  For documents, Unify guesses which column is surname / first / middle name / matric from the headings and the HOC can correct it.
- A class can have more than one HOC (up to 3 for big classes). Any of them can upload or edit; they share one list.
  Rows = surname, first name, middle name, matric. Unify flags duplicates, short matric numbers and missing names (AT03).
- Students sign up and log in with their **normal Gmail**. The first time they open their pass they sign in **once** with their
  LASU student email (`firstname.lastnameMATRIC@st.lasu.edu.ng`). The matric in the address is matched to the list and the
  name + matric are locked to the account (AT07–AT09).
- Problems: list not uploaded (AT10), not on the list (AT11), matric already claimed → message box to the HOC (AT12),
  no access to student email → HOC checks the ID card in person (AT13, AT17).
- Priority (carryover) courses: the student is matched once against their **own** class list. For a course at another level,
  they ask that level's HOC to add them to the course register (AT14), and the HOC approves it in the inbox (AT15).
  The scanner must accept approved priority students.
- The HOC inbox (AT15) holds clashes, not-on-list requests, ID checks and priority requests. Clashes are settled on AT16.
- Several HOCs can share a class: any of them can edit; every change is logged with who made it (AT06).
- New session: the class is promoted (e.g. 300L → 400L) and the list carries over; HOC marks who isn't moving up and adds
  direct-entry students; last session's attendance stays on the old records (AT18).
- The class list is visible only to that class's HOCs and its lecturers. Unify admin sees counts only.
- Later: fill the list straight from the school's systems when that's possible, so keep the list as a data source, not a form.

**Note review marker.** No "Pending review" text. Icon only: yellow clock until the lecturer checks the note, green check after
(`ReviewMark` in Learning.tsx). Notes stay live while the clock shows.

**Legal and accounts.** Sign-up (S06) shows "By creating an account you agree to our Terms of Use and Privacy Policy" (links need
real pages). Settings (S48) and lecturer Me (L17) have **Delete my account**. App stores require in-app deletion.
Dev note: allow at most **2 accounts per phone**.

**Unify admin (AD01–AD04, desktop).** Overview, HOC requests (approve/decline with checks), class lists per class (uploaded /
claimed / clashes) and note reports.

**Still open:** HOC vs WhatsApp (waiting on the HOC interviews; keep Class feed and Post to class on hold) · Dean/HOD panels ·
Nigeria Data Protection Act check of what we store and the privacy notice.

## Run it

```bash
npm install
npm run dev        # http://localhost:3001
npm run build      # type-check + production build
```

- `/` opens a gallery of every screen, grouped like the Figma sections.
- `/screens/S19` opens one screen at phone width. A small bar (top right) steps through screens; arrow keys work too, `h` hides it. Add `?clean` to hide it for screenshots.
- Buttons inside screens move between screens the way the real app will.

## Structure

```
src/
  styles/tokens.css        colours, fonts, radii, sizes (single source of truth)
  styles/ui.css            utility + component classes (.screen, .card, .btn, .chip, .pill …)
  components/
    ui.tsx                 Display, Label, Button, Card, ListCard, ListRow, Chip, Pill, Toggle,
                           Segmented, Checkbox, Field, ProgressBar, StepBars, Banner …
    chrome.tsx             Screen, TopBar, TabBar (student / lecturer / contributor), BottomActions, Sheet, GreenBand
    brand.tsx              Box Boy poses, FadedBoxBoy, PERSONAS, Avatar, Wordmark, SemesterWeek,
                           CountdownRing, StreakPill
    nav.ts                 useGo('S02') / useBack()  ← prototype-only navigation
  data/sample.ts           ALL sample data. Swap for API calls here.
  screens/
    student/Onboarding.tsx S01–S13   (incl. S11 Box Boy carousel)
    student/Home.tsx       S14–S22   (hero + semester week strip, CGPA plan)
    student/Learning.tsx   S23–S36   (course page, note blocks, quiz, keypads, results, streak, revision)
    student/Campus.tsx     S37–S53   (timetable, class feed, guide, Me, settings, offline, lecturer profile)
    student/ClassRep.tsx   S54–S56
    student/Attendance.tsx S57–S70   (attendance pass + scanner, online class)
    student/States.tsx     S71–S76
    contributor/Contributor.tsx  C01–C06
    lecturer/Lecturer.tsx        L01–L20
    registry.ts            id → component list used by the gallery and routes
  App.tsx, main.tsx
public/boxboy/             Box Boy illustrations + persona avatars
```

## What changed from the earlier designs (all in code)

- **Semester week strip** (`SemesterWeek` in brand.tsx) sits in the Home hero, under the department pill.
  Weeks 1–7 calm (green), 8–10 amber "exams in N weeks", 11–12 red ("exams next week" at 12). No "first class" time.
- **CGPA plan (S15–S18):** the student enters their CGPA once. Compulsory courses are pre-ticked. Each course is only
  marked **Done / Priority / Not yet** (Priority = carryover). No per-course grades. Maths is in `neededGpa()` and
  `bestFinish()` in Home.tsx.
- **Box Boy picker (S11):** circular carousel: selected avatar in the middle, neighbours left/right fading out; swipe
  or tap to move; persona title and traits underneath ("The 5.0 Scholar").
- **Timetable colours:** one neutral style for every class. Colour only means status (red cancelled, amber dashed not
  confirmed, black moved).

## Porting into `apps/web`

1. Copy `styles/`, `components/`, `public/boxboy/` across. Import both CSS files once in the app entry.
2. Move screens over one flow at a time. Each screen is a plain component with no props; lift data into props or hooks.
3. Replace `useGo('S..')` with real routes (map below). `nav.ts` is the only place that knows about Figma ids.
4. Replace `data/sample.ts` with API calls. Every screen reads from it or from local constants marked as sample.
5. The current repo tabs are Dashboard/Learn/Explore/Profile (students) and Dashboard/Studio/Profile (authors).
   The designs use **Home / Timetable / Class / Me** for students and lecturers and **Home / Studio / Me** for
   contributors. `TabBar` in chrome.tsx has all three.

### Suggested route map

| Route | Screens |
|---|---|
| `/welcome`, `/signup/*` | S01–S13 |
| `/home` | S14, S19, S20, S58 |
| `/plan`, `/plan/courses`, `/plan/target`, `/plan/result` | S15–S18 |
| `/notifications` | S21 |
| `/course/:code` (`?tab=weeks\|outline\|practice`) | S23–S25, S60 |
| `/course/:code/week/:n/class/:c` | S26, S27 (report sheet) |
| `/course/:code/week/:n/quiz` (`/q/:i`, `/results`) | S28–S32 |
| `/course/:code/week/:n/done`, `/streak` | S33, S34 |
| `/revision`, `/revision/done` | S35, S36 |
| `/timetable` (`?view=week\|day`) | S37–S40 |
| `/class/:slotId` | S41, S64–S70 (online) |
| `/class` (feed) | S42, S43 |
| `/guides/:slug` | S44 |
| `/me`, `/me/edit`, `/me/settings`, `/me/settings/notifications` | S45–S49 |
| `/me/class-rep/request` | S50, S51 |
| `/rep/post`, `/rep/timetable`, `/rep/contributors` | S54–S56 |
| `/attendance/setup`, `/attendance/pass`, `/attendance/scan`, `/attendance` | S57, S59, S61, S63 |
| `/rep/confirm-lecturer/:id` | S62 |
| `/lecturer/profile/:id` | S53 |
| `/studio` (`/compose`, `/manual`, `/quiz`, `/review`, `/live`) | C01–C06 |
| `/l/onboarding/*` | L01–L06 |
| `/l/home`, `/l/timetable`, `/l/me` | L07–L09, L17 |
| `/l/course/:code` (`?tab=weeks\|report\|attendance`) | L10–L12 |
| `/l/review/:weekId`, `/l/send`, `/l/post` | L13–L15 |
| `/l/attendance/:sessionId` | L16 |
| `/l/online/:slotId` (`/live`, `/register`) | L18–L20 |

S52 (offline), S71–S76 (states) are states of other routes, not routes of their own.

## Behaviour notes for the build

- **Quiz (S29–S31):** copy and long-press are blocked while a quiz is open (`QuizShell`). One timer for the whole quiz;
  submits at zero. If the connection drops, answers save on the phone and submit later (S75).
- **Maths keypad (S31):** answers are checked as expressions, so `(8/27)ρV³` and `0.296ρV³` both count.
- **Attendance pass (S59):** placeholder pattern. Real pass = signed QR that rotates every 30 s and works offline for
  the day (S74 when it needs a refresh). Several Heads of Class can scan one class; offline scans queue (S61).
- **Online class (S64–S70, L18–L20):** big classes split into rooms of 100 (by surname, matric or evenly). Students
  always join through Unify so their room is assigned and check-in 1 is recorded. Present = 2 of 3 check-ins.
- **Notifications:** at most 3 a day; class changes always come through (S49).
- **Lecturer report (L11):** counts only. Names show only on attendance lists.

## Open item (don't build yet)

**Verified class list / claiming a matric number.** S57 collects full name + matric once, and the Head of Class sees
them on scan. How a student proves that name and matric are theirs (school email sign-in, the HOC's uploaded list,
forgotten passwords, linking a school email later) is still being decided. See the reasoning doc, section
"Attendance: open discussion".

## Assets

- Box Boy PNGs in `public/boxboy/` are 1× exports from Figma. Replace with the original high-res files before launch.
- Fonts load from Google Fonts (Bowlby One SC, Inter, Playfair Display, STIX Two Text). Self-host for offline use.
- Everything in `data/sample.ts` and the screen-level constants is sample content.

# Gala Pass

# ROSCOMMON HOUSE MET GALA 2026

## Digital Ticketing, QR Verification & Bus Attendance System

I want you to build a polished, production-ready web application for the **Roscommon House Met Gala: Burgundy and Black**, taking strong visual inspiration from the attached reference images.

The application is primarily a **digital ticketing and QR-based attendance/check-in system**.

The system must allow us to:

1. Import/read registered attendees from a Google Sheet connected to our Google Form.
2. Give every attendee a unique ticket.
3. Generate a completely unique QR code for every attendee.
4. Associate each QR code with exactly one attendee.
5. Generate a beautiful digital ticket matching the attached Met Gala visual theme.
6. Email the generated ticket to the attendee.
7. Allow event/bus staff to scan the QR code using a phone camera.
8. Immediately display the attendee's name, surname, SMID/student number and relevant information.
9. Allow staff to confirm that the attendee has boarded the bus with one tap.
10. Record the boarding time.
11. Later use the same QR ticket to record that the attendee has returned.
12. Provide a live dashboard showing who has boarded, who has returned and who is still outstanding.

---

# 1. VISUAL DESIGN DIRECTION

Use the attached images as the primary visual inspiration.

The visual identity should feel like:

* Luxury gala
* Met Gala
* Formal dinner
* Elegant invitation
* Burgundy and black
* Premium editorial fashion
* Sophisticated, cinematic and dramatic
* High-end event management

### Primary colour palette

Use approximately:

* Deep Burgundy: #5A0F18
* Dark Burgundy: #3B080F
* Near Black: #0B0A0A
* Ivory/Cream: #F4EFE5
* Warm Gold: #B89B5E
* Soft Champagne: #D8C9A8
* White: #FFFFFF

Do NOT make the interface look like a generic SaaS dashboard.

Avoid:

* Bright blue
* Neon colours
* Generic purple gradients
* Overly rounded cards
* Childish UI
* Generic Bootstrap styling
* Excessive glassmorphism

The interface should feel like a **luxury event platform**.

Use generous whitespace, elegant borders, subtle shadows and refined typography.

---

# 2. TYPOGRAPHY

Use an elegant combination of:

### Display font

Something similar to:

* Playfair Display
* Cormorant Garamond
* Cinzel

### UI/body font

Use something clean such as:

* Inter
* Manrope
* Montserrat

The event title should feel editorial and premium.

For example:

MET GALA

BURGUNDY AND BLACK

THE ROSCOMMON FORMAL

Use uppercase typography selectively.

---

# 3. APPLICATION NAME

Use:

**ROS COMMON HOUSE**

or preferably:

**ROSCOMMON HOUSE**

Main event:

**MET GALA: BURGUNDY AND BLACK**

Subtitle:

**THE ROSCOMMON FORMAL**

The application should consistently use this branding.

---

# 4. MAIN APPLICATION STRUCTURE

Create the following main sections:

### Admin Dashboard

### Attendees

### Tickets

### QR Scanner

### Bus Boarding

### Return Check-in

### Event Settings

### Email/Ticket Management

Use a left navigation sidebar on desktop and a mobile bottom/navigation approach where appropriate.

On mobile, the QR scanner should be extremely easy to access.

---

# 5. DASHBOARD

Create a premium dashboard showing the current event.

Header:

**MET GALA: BURGUNDY AND BLACK**

Subheading:

**The Roscommon Formal | 16 October 2026**

Show large statistics:

### Registered

30

### Tickets Issued

30

### Boarded

0

### Returned

0

### Still Out

30

These numbers must update dynamically.

Example:

Registered: 30

Boarded: 24

Returned: 21

Still Out: 3

The dashboard should immediately communicate the current attendance situation.

---

# 6. ATTENDEE DATABASE

Create an Attendees page.

Each attendee should have:

* First name
* Surname
* Full name
* Student number / SMID
* Email
* Dietary requirement
* Ticket ID
* QR token
* Ticket status
* Boarding status
* Boarding time
* Return status
* Return time

Example:

Samson Okuthe

SMID:

OKTSAM001

Email:

[OKTSAM001@myuct.ac.za](mailto:OKTSAM001@myuct.ac.za)

Ticket:

RCF-0001

Status:

BOARDING PENDING

---

# 7. GOOGLE SHEET DATA

The current source of attendee information is a Google Form.

The Google Form responses appear in a Google Sheet.

Assume every submitted form represents a person who has already paid and is therefore eligible for a ticket.

DO NOT build a payment verification workflow.

The Google Sheet contains information such as:

* Name
* Surname
* Student Number / SMID
* Dietary Requirement
* Proof of Payment
* Google account information

The application should eventually be able to synchronise with the Google Sheet.

For the first MVP, also provide a way to import/seed the first 30 attendees manually via CSV or spreadsheet import.

The system must prevent duplicate attendees based primarily on Student Number/SMID.

---

# 8. STUDENT EMAIL GENERATION

The student's email is derived from their student number.

For example:

Student Number:

OKTSAM001

Generated email:

[OKTSAM001@myuct.ac.za](mailto:OKTSAM001@myuct.ac.za)

Therefore, do not require the attendee to manually provide an email address if the Student Number is available.

Create this automatically:

student_number + "@myuct.ac.za"

Make the email domain configurable in Event Settings.

Default:

@myuct.ac.za

---

# 9. TICKET GENERATION

Every attendee must receive ONE unique ticket.

Example:

Samson Okuthe

Student Number:

OKTSAM001

Ticket ID:

RCF-0001

John Smith:

RCF-0002

Sarah Adams:

RCF-0003

Ticket IDs must be unique.

Never reuse ticket IDs.

---

# 10. QR CODE SYSTEM

This is one of the most important parts of the application.

Every attendee must receive a completely different QR code.

DO NOT encode only the person's name.

DO NOT encode only the student number.

Instead generate a secure, unique random QR token.

Example:

RCF-a7f92b81d4e31c8...

The database should associate this token with exactly one attendee.

Conceptually:

QR TOKEN

↓

TICKET

↓

ATTENDEE

↓

NAME + SURNAME + SMID + OTHER DETAILS

Example:

QR token:

RCF-a7f92b81d4e31c8

maps to:

Ticket: RCF-0001

Name: Samson

Surname: Okuthe

SMID: OKTSAM001

Email: [OKTSAM001@myuct.ac.za](mailto:OKTSAM001@myuct.ac.za)

The QR itself does NOT need to expose the attendee's private information.

When the scanner reads the token, the app queries the database and retrieves the corresponding attendee.

---

# 11. DIGITAL TICKET DESIGN

Create a beautiful digital ticket based heavily on the attached ticket reference.

The attached reference has:

* Burgundy left section
* Cream/ivory ticket section
* Elegant typography
* Formal Dinner branding
* Met Gala branding
* Ticket number
* Event information
* Dramatic luxury aesthetic
* Perforated-ticket visual treatment
* Barcode/QR area

Recreate this overall design language for the generated digital ticket.

Do not make it look like a generic QR code slapped onto a white PDF.

The ticket should look like an actual luxury event invitation.

Include:

ROSCOMMON HOUSE

MET GALA

BURGUNDY AND BLACK

THE ROSCOMMON FORMAL

ATTENDEE NAME

STUDENT NUMBER / SMID

DATE

VENUE

TICKET NUMBER

QR CODE

DIETARY REQUIREMENT where appropriate

The QR code should have sufficient white/quiet space around it so phone cameras can reliably scan it.

---

# 12. TICKET EXAMPLE

For:

Samson Okuthe

SMID:

OKTSAM001

Ticket:

RCF-0001

Generate a ticket visually similar to the attached reference.

The QR code must be the QR associated with Samson's database record.

If John Smith has ticket RCF-0002, his ticket must contain a completely different QR code.

---

# 13. EMAIL TICKETS

After generating the ticket, prepare it to be sent to:

[OKTSAM001@myuct.ac.za](mailto:OKTSAM001@myuct.ac.za)

for Samson.

The sender should be configurable.

For the initial prototype, create an email configuration/settings section rather than hardcoding credentials.

The email should contain:

Subject:

Your Roscommon House Met Gala Ticket 🎟️

Body:

Welcome to the Roscommon House Met Gala: Burgundy and Black.

Your ticket is attached.

Please keep this ticket available on your phone and present the QR code when boarding the bus.

The generated ticket should be attached as a PDF.

Also provide a "View Ticket" option if tickets are stored online.

IMPORTANT:

Do not expose email/API credentials in frontend code.

Use secure backend/server-side functions or environment variables.

---

# 14. QR SCANNER

Create a dedicated mobile-first QR scanner.

This is one of the most important screens.

It should use the phone camera to scan QR codes.

The experience should be:

SCAN

↓

QR FOUND

↓

LOOK UP TOKEN

↓

DISPLAY ATTENDEE

Example result:

---

✓ VALID TICKET

SAMSON OKUTHE

SMID001

Ticket RCF-0001

Dietary:
Halaal

Status:

NOT BOARDED

[ BOARD BUS ]

---

The attendee's name and surname should be extremely prominent.

SMID/student number should appear underneath in smaller text.

---

# 15. INVALID QR

If a QR code does not exist in the database:

Display:

INVALID TICKET

This QR code is not recognised.

Do not allow boarding.

---

# 16. DUPLICATE SCAN

If the attendee has already boarded:

Display:

ALREADY BOARDED

SAMSON OKUTHE

SMID001

Boarded:

18:43:21

This ticket has already been used for boarding.

Do not create a duplicate boarding record.

---

# 17. BOARD BUS FUNCTION

After scanning a valid ticket, show:

[ BOARD BUS ]

When staff presses the button:

Update:

boarded = true

boarding_time = current timestamp

Optionally record:

boarding_staff

device

bus number

Then show a success state:

✓ BOARDING CONFIRMED

SAMSON OKUTHE

SMID001

Boarded at:

18:43

Then automatically return to scanner mode after a short delay.

The workflow must be fast because staff may need to scan dozens or hundreds of people.

---

# 18. RETURN CHECK-IN

The same QR ticket must work for the return journey.

Create a scanner mode:

**RETURN CHECK-IN**

Staff scans the same QR.

The app retrieves the person.

Display:

SAMSON OKUTHE

SMID001

Boarded earlier:

18:43

Current status:

NOT RETURNED

[ CONFIRM RETURN ]

After tapping:

✓ RETURN CONFIRMED

Return time:

01:17

This allows us to determine exactly who has returned.

---

# 19. LIVE RETURN DASHBOARD

Create a dashboard:

## BUS RETURN STATUS

Registered:

30

Boarded:

30

Returned:

27

Still Out:

3

Then display:

### STILL OUT

John Smith
SMID002

Sarah Adams
SMID003

Michael Jones
SMID017

This should update in real time.

---

# 20. ATTENDANCE STATES

Use clear states:

REGISTERED

TICKET ISSUED

NOT BOARDED

BOARDED

RETURNED

Potential additional states:

CANCELLED

REVOKED

INVALID

The system should never allow an invalid ticket to be checked in.

---

# 21. DATABASE

Use Supabase/PostgreSQL for the backend database.

Suggested tables:

### events

id

name

subtitle

date

venue

ticket_price

theme

created_at

### attendees

id

first_name

surname

student_number

email

dietary_requirement

form_submission_id

created_at

### tickets

id

attendee_id

event_id

ticket_number

qr_token

status

ticket_url

issued_at

### attendance

id

ticket_id

boarded

boarding_time

boarding_staff

returned

return_time

return_staff

updated_at

This structure should support multiple events in the future.

---

# 22. SECURITY

Never trust information contained directly in the QR.

The QR should contain only a secure unique token.

The backend should verify the token.

The frontend should never be able to arbitrarily mark an unknown person as boarded.

Use authenticated staff accounts.

Create at least two roles:

ADMIN

STAFF

ADMIN can:

* Manage attendees
* Generate tickets
* Resend tickets
* View all records
* Edit event settings
* Manage staff
* View attendance

STAFF can:

* Scan tickets
* Board attendees
* Confirm returns
* View basic attendee information

---

# 23. ADMIN DASHBOARD STYLE

The admin interface should still follow the Met Gala theme.

However, usability comes first.

Use:

Cream backgrounds

Burgundy primary actions

Black text

Gold accents

Elegant borders

Subtle animations

Cards with restrained corner radius

Use the dramatic photography from the attached references selectively.

Do not overwhelm the dashboard with images.

---

# 24. MOBILE-FIRST DESIGN

The scanner is primarily going to be used on mobile phones.

Therefore:

* Large scan button
* Large camera area
* Large attendee name
* Large confirmation buttons
* High contrast
* Fast transitions
* Minimal typing
* Easy one-handed operation

The scanner screen should feel almost like a dedicated professional event-check-in device.

---

# 25. HOME/DASHBOARD HERO

Create a visually impressive event header using the attached Met Gala imagery.

Display:

ROSCOMMON HOUSE

MET GALA

BURGUNDY AND BLACK

THE ROSCOMMON FORMAL

16 OCTOBER 2026

SUIKERBOSSIE

Use a large editorial hero image with a dark/burgundy overlay if necessary.

The visual treatment should feel cinematic and premium.

---

# 26. TICKET PREVIEW

The admin should be able to click an attendee and see:

[ VIEW TICKET ]

The application should render their exact personalised ticket.

Example:

SAMSON OKUTHE

SMID001

RCF-0001

[ UNIQUE QR CODE ]

The QR shown must correspond to the database record.

---

# 27. TEST DATA

Create a seed/test mode with at least 5 sample attendees.

For example:

Samson Okuthe
OKTSAM001

John Smith
SMID002

Sarah Adams
SMID003

Michael Jones
SMID004

Jessica Brown
SMID005

Generate a unique ticket and unique QR code for each.

I want to be able to test:

1. Scan Samson's QR.
2. Samson appears.
3. Press BOARD BUS.
4. Scan Samson again.
5. It says ALREADY BOARDED.
6. Scan John's QR.
7. John appears instead.
8. Confirm John boarded.
9. Switch to RETURN CHECK-IN.
10. Scan Samson.
11. Confirm Samson returned.
12. Dashboard updates.

---

# 28. IMPORTANT DATA RELATIONSHIP

The fundamental relationship must be:

ATTENDEE

↓

TICKET

↓

UNIQUE QR TOKEN

↓

SCAN

↓

DATABASE LOOKUP

↓

ATTENDEE DETAILS

↓

BOARD / RETURN ACTION

Do not build the QR system as a static image generator disconnected from the database.

Every QR must be tied to an actual database record.

---

# 29. GOOGLE SHEETS INTEGRATION

Design the application so that the first 30 attendees can be imported from the current Google Sheet.

Then build the architecture for automatic synchronisation.

When a new row appears in the Google Sheet:

1. Detect new attendee.
2. Validate Student Number.
3. Prevent duplicate Student Number.
4. Generate @myuct.ac.za email.
5. Create attendee database record.
6. Generate unique ticket number.
7. Generate secure QR token.
8. Generate personalised ticket.
9. Store ticket.
10. Send ticket email.
11. Mark ticket as issued.

Do not require manual QR generation.

---

# 30. IMPORTANT MVP PRIORITY

Build this in stages.

### PHASE 1

Build the UI and database.

### PHASE 2

Create 5 test attendees.

### PHASE 3

Generate unique QR codes.

### PHASE 4

Build the scanner.

### PHASE 5

Implement boarding.

### PHASE 6

Implement return check-in.

### PHASE 7

Implement the dashboard.

### PHASE 8

Implement Google Sheet integration.

### PHASE 9

Implement automated ticket email delivery.

Do not fake backend functionality with static frontend data.

Where an external integration requires credentials, create the correct environment-variable/configuration structure and clearly identify what needs to be connected.

---

# 31. FINAL UX GOAL

The entire system should feel like:

**A luxury Met Gala ticketing platform on the surface, with a highly practical event attendance system underneath.**

The attendee experience:

Google Form

↓

Automatic ticket

↓

Beautiful Met Gala ticket in email

↓

QR code

↓

Arrive at bus

↓

Scan

↓

Name appears

↓

Tap BOARD BUS

↓

Enjoy event

↓

Scan again when returning

↓

Tap RETURNED

↓

Organisers know exactly who is on the bus and who has returned.

Make the application visually impressive, but prioritise reliability, speed and clarity during scanning.

Use the attached images as the visual design reference throughout the application.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e7af9db7-848c-40f3-9bbc-5bcd10e9ac01).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

# GXKTM Production Readiness Report

**Date:** 2026-03-02
**Status:** NOT PRODUCTION READY - Critical issues must be resolved first

---

## Executive Summary

A 4-agent audit team reviewed the entire GXKTM codebase across backend, frontend, security/infrastructure, and feature completeness. The application has a solid foundation but has **critical security vulnerabilities** and **bugs** that must be fixed before production deployment.

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Backend Bugs & Security | 5 | 5 | 5 | 4 | 19 |
| Frontend Bugs & UX | 4 | 5 | 6 | 5 | 20 |
| Security & Infrastructure | 6 | 6 | 8 | 3 | 23 |
| Missing Features | 8 critical-for-launch | 9 high-priority | 10 nice-to-have | - | 27 |

---

## PHASE 1: FIX IMMEDIATELY (Security Critical)

These issues expose real user data or credentials right now.

### 1. Database credentials & Supabase keys committed to git
- **File:** `.env` (committed to repo)
- **Impact:** Full database access and user impersonation possible
- **Action:** Rotate ALL Supabase credentials immediately. Remove `.env` from git history. Add to `.gitignore`.

### 2. Service role key exposed to browser
- **File:** `backend/config.py:12`
- **Impact:** `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is sent to every client browser — full DB access
- **Action:** Remove `NEXT_PUBLIC_` prefix. Service role key must ONLY exist on backend.

### 3. Database password printed to logs
- **File:** `backend/database.py:12-20`
- **Impact:** Credentials visible in container logs
- **Action:** Delete the entire debug print block.

### 4. SQLAlchemy echo=True in production
- **File:** `backend/database.py:31`
- **Impact:** All SQL queries (including sensitive data) printed to stdout
- **Action:** Set `echo=False` or make conditional on DEBUG env var.

### 5. Unprofessional error message in API
- **File:** `backend/routers/admin_users.py:63`
- **Impact:** Response contains `"ERROR HERE IDIOT"` — visible to users
- **Action:** Remove the unprofessional text.

---

## PHASE 2: FIX BEFORE DEPLOY (Security & Bugs)

### Backend Security
| # | Issue | File | Impact |
|---|-------|------|--------|
| 6 | SQL injection via dynamic sort_by parameter | `families.py:70`, `payments.py:80`, `admin_enrollments.py:56` | Whitelist allowed sort columns |
| 7 | Missing auth on GET /api/families/all | `families.py:109` | Exposes all family data without auth |
| 8 | Missing auth on CSV export endpoints | `classes.py:297`, `payments.py:513` | Student/payment data downloadable by anyone |
| 9 | Mass assignment vulnerability (setattr loop) | `families.py:360`, `payments.py:408` | Clients can modify system fields |
| 10 | CORS wide open (allow_methods/headers = *) | `main.py:24-33` | Lock down to specific methods/headers/origins |
| 11 | No rate limiting on any endpoints | `main.py` | Auth brute-force and DoS possible |
| 12 | Verbose error messages leak internals | `auth.py:121`, `enrollment_portal.py:693` | Use generic messages, log details server-side |

### Frontend Bugs
| # | Issue | File | Impact |
|---|-------|------|--------|
| 13 | Typo: `gioaLy` instead of `giaoLy` | `ReviewStep.tsx:90` | Returns undefined values in enrollment review |
| 14 | Hardcoded placeholder contact info | `ConfirmationStep.tsx:114-129` | Users see fake email/phone for support |
| 15 | Memory leak — state updates on unmounted components | `PaymentList.tsx:86` | Add cleanup/AbortController |
| 16 | No loading indicators during FamilyDetailModal operations | `FamilyDetailModal.tsx:150+` | Users can trigger duplicate requests |
| 17 | Backdrop dismiss while request in-flight causes inconsistent state | Multiple modals | Disable close during operations |

### Infrastructure
| # | Issue | File | Impact |
|---|-------|------|--------|
| 18 | No HTTPS configuration | `docker-compose.yml` | All data in plaintext |
| 19 | No security headers (CSP, HSTS, X-Frame-Options) | `next.config.ts` | Vulnerable to XSS, clickjacking |
| 20 | Docker containers run as root | Both Dockerfiles | Container escape risk |
| 21 | `--reload` flag in production Dockerfile | `backend/Dockerfile` | Performance/security issue |
| 22 | No health checks in Docker Compose | `docker-compose.yml` | No auto-restart on failure |
| 23 | No resource limits in Docker Compose | `docker-compose.yml` | One container can consume all host resources |
| 24 | Database connection lacks SSL mode | `database.py` | DB traffic may be unencrypted |

---

## PHASE 3: FIX BEFORE RELEASE (Quality & UX)

### Backend Data Integrity
| # | Issue | File |
|---|-------|------|
| 25 | Missing unique constraint on (family_id, school_year) for payments | `models.py` |
| 26 | N+1 query in class enrollment counts | `classes.py:50-70` |
| 27 | Race condition in school year transition | `school_years.py:303-312` |
| 28 | Guardian email unique constraint too strict (cross-family) | `models.py:65` |
| 29 | Cascade delete on Family removes all related data without soft-delete | `models.py:54-57` |
| 30 | Missing date validation (future DOB accepted) | `enrollment_portal.py:521` |

### Frontend UX
| # | Issue | File |
|---|-------|------|
| 31 | Missing empty states (blank screen when no data) | FamilyList, PaymentList, ClassList |
| 32 | Error states not rendered to UI | ClassList, PaymentList, FamilyList |
| 33 | Missing keyboard navigation / focus trapping in modals | All modals |
| 34 | Missing aria-required and aria-invalid on auth forms | Login/Signup pages |
| 35 | Inconsistent pagination across components | FamilyList vs PaymentList |
| 36 | No loading spinner during ClassSelectionStep init | ClassSelectionStep.tsx |
| 37 | Race conditions with rapid wizard navigation | EnrollmentContext.tsx |
| 38 | Type mismatches between frontend types and backend responses | `types/family.ts` |

---

## PHASE 4: MISSING FEATURES

### Critical for Launch
| Feature | Why It Matters |
|---------|---------------|
| **Attendance tracking** | Core school function — needed for daily operations and reporting |
| **Class capacity limits** | Prevents overbooking; essential for classroom management |
| **Email notifications** | Enrollment confirmations, payment reminders, announcements |
| **Audit logging** | Track who changed what — compliance and accountability |
| **Student medical/allergy info** | Legal and safety requirement for any school |
| **Bulk import for student data** | Essential for initial setup and migration |
| **Admin approval workflow for enrollments** | Review before finalizing, especially with capacity constraints |
| **Payment processor integration** | Stripe/PayPal for online tuition collection |

### High Priority (Soon After Launch)
| Feature | Why It Matters |
|---------|---------------|
| Financial reports & analytics | Revenue summaries, delinquency tracking |
| Class scheduling (days/times/locations) | Currently just roster, no schedule info |
| Sibling discounts / family pricing | Common need for multi-child families |
| Document management | Upload forms, waivers, permission slips |
| Enrollment history & re-enrollment | Track retention across years |
| Granular role permissions | Teacher, registrar, treasurer roles beyond admin/user |
| Dashboard analytics & KPIs | Enrollment rates, payment rates, trends |
| Grade progression reporting | Verify students advancing correctly |
| Email notification templates | Branded, customizable communications |

### Nice to Have (Post-Launch)
| Feature | Why It Matters |
|---------|---------------|
| Parent portal | Self-service view of students, balance, attendance |
| Teacher/instructor interface | Manage roster, attendance, feedback |
| Multi-language support (Vietnamese UI) | Matches the school's community |
| Mobile app | Native iOS/Android for parents and admins |
| SMS notifications | Text reminders in addition to email |
| Payment plans/installments | Flexible payment options |
| Advanced reporting & custom exports | Data analysis beyond basic CSV |
| Calendar integration | Google Calendar sync for class schedules |
| LMS features | Assignments, grades if teaching online |

---

## Current Strengths

The application has a solid foundation worth building on:
- Clean auth model (Supabase JWT with admin/user roles)
- Well-structured data model (families, students, guardians, classes, enrollments, payments)
- Working enrollment wizard with grade progression logic
- Multi-school-year support with transition workflows
- Admin dashboard with family/class/payment management
- Vietnamese text utilities for search matching

---

## Recommended Priority Order

1. **Rotate credentials** and remove `.env` from git (today)
2. **Fix critical security** — auth on endpoints, remove debug logging, lock CORS (this week)
3. **Fix frontend bugs** — typo in ReviewStep, loading states, error displays (this week)
4. **Harden infrastructure** — HTTPS, Docker security, rate limiting (before deploy)
5. **Add capacity limits and attendance** (before launch)
6. **Add email notifications** (before launch)
7. **Polish UX** — empty states, accessibility, responsive design (before launch)
8. **Build out remaining features** per roadmap (ongoing)

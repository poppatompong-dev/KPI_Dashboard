# 📖 System Documentation: Smart City KPI Platform v3.2

> **Smart City Municipal Performance Management System (AI-Driven)**
> พัฒนาโดย: นักวิชาการคอมพิวเตอร์ เทศบาลนคร
> VERSION: 3.2 (Performance Optimized)
> UPDATED: 11/03/2026 20:00

---

## 1. 🏗️ System Architecture

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+)
- **Backend/API**: Google Apps Script (Web App URL)
- **Database**: Google Sheets (Cloud Storage)
- **AI Engine**: Client-side JavaScript (Statistical Logic & NLP)
- **Testing**: Vitest — 15/15 Unit Tests Passing
- **Hosting**: Vercel (Static Site) — `vercel.json` configured

### Data Flow
```mermaid
graph TD
    User((User)) -->|Browser| UI[Landing Page + Dashboards]
    UI -->|API Call| GAS[Google Apps Script]
    GAS -->|CRUD| GS[(Google Sheets)]
    UI -->|Local| AI[ai-engine.js / scoring.js]
    AI -->|Insights| UI
```

---

## 2. 🖥️ Interface & Features

### 🏠 Landing Page — v3.2 (Lighthouse Optimized)
**Dark Glassmorphism UI** รองรับทุกหน้าจอ (400px–1920px+)
- Non-blocking Google Fonts (FCP optimization)
- GPU-composited background blobs (`will-change: transform`)
- Semantic landmarks: `<main>`, `<nav>`, `<header>`, `<footer>`
- Heading hierarchy: `h1` → `h2` (ไม่ข้ามระดับ)
- Skip link สำหรับ keyboard / screen-reader users
- Focus-visible styles ครบทุก interactive element
- `aria-hidden` บน decorative SVGs
- `prefers-reduced-motion` animation support
- Open Graph + Twitter Card meta
- JSON-LD Structured Data (WebApplication schema)

### 📊 Executive Dashboard
แสดงภาพรวมความสำเร็จของเมืองรายยุทธศาสตร์ พร้อม AI Performance Insights ภาษาไทย

### 🧠 Intelligent Reports (AI-Driven)
ระบบรายงานตรวจจับ KPI วิกฤต ด้วย Linear Regression และ Z-Score Analysis

### 📘 User Manual
คู่มือการใช้งาน Built-in รองรับทุกบทบาท

### 🔐 Admin Back-Office
RBAC, Audit Logs, User Management

---

## 3. 🧠 Smart Capabilities

| Feature | Implementation | Goal |
|---|---|---|
| **Trend Forecast** | Linear Regression (OLS) | พยากรณ์ผลงาน 3 เดือน |
| **Risk Detection** | Z-Score & Target Gap | ตรวจ KPI วิกฤต |
| **NLP Insights** | Thai Text Generation | สรุปผลภาษาไทย |
| **Scoring Engine** | Weighted Average | คะแนนรวมถ่วงน้ำหนัก |

---

## 4. 🧪 Testing

| Tool | Command | Status |
|---|---|---|
| **Vitest** | `npm test` | ✅ 15/15 Pass |

---

## 5. 🚀 Deployment

### Local
```bash
npm run dev   # Vite dev server → http://localhost:5173
npm test      # Unit tests
```

### Vercel
1. Push → `https://github.com/poppatompong-dev/KPI_Dashboard`
2. Import repo ใน Vercel Dashboard → Auto Deploy

**Security Headers** (ผ่าน `vercel.json`):
- `Strict-Transport-Security` (HSTS)
- `X-Frame-Options: SAMEORIGIN`
- `Cross-Origin-Opener-Policy: same-origin`
- `X-Content-Type-Options: nosniff`
- Cache-Control: CSS/JS immutable, HTML must-revalidate

### SEO Files
- `/robots.txt` — Allow all crawlers
- `/sitemap.xml` — All major pages indexed

---

## 6. ⚡ Lighthouse Optimization Summary

| Dimension | Key Fixes Applied |
|---|---|
| **Performance** | Non-blocking fonts, GPU blobs, CSS preload, reduced-motion |
| **Accessibility** | Skip link, landmarks, heading order, focus-visible, aria-hidden, contrast |
| **Best Practices** | HSTS, X-Frame-Options, COOP, Cache-Control headers |
| **SEO** | canonical, robots.txt, sitemap.xml, JSON-LD, OG tags |

---

## 7. 🛠️ Maintenance

1. **Google Sheet**: อย่าเปลี่ยน Header แถว 1
2. **GAS**: ทุกครั้งที่แก้ไข `Deploy.gs` → "New Deployment"
3. **Landing CSS**: แก้ใน `<style>` ใน `index.html`
4. **Links**: ห้ามเปลี่ยนชื่อไฟล์ `.html` ในโฟลเดอร์ราก

---

## 🎖️ Developer Credits
**นักวิชาการคอมพิวเตอร์** — กองยุทธศาสตร์และงบประมาณ เทศบาลนคร
*"Transforming Municipal Data into Intelligent Decisions"*

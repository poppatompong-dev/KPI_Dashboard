# 📢 Release Notes: Smart City KPI Platform v3.1

**Status**: PRODUCTION READY 🚀
**Release Date**: 11 มีนาคม 2026
**Release Time**: 19:45 น.
**Version**: 3.1 (Patch Update)
**Lead Developer**: นักวิชาการคอมพิวเตอร์ (Computer Technical Officer)

---

## 🛠️ Change Log (สรุปการแก้ไขโดยละเอียด)

### 🆕 v3.1 — Landing Page Redesign & DevOps (11/03/2026 19:45)
- **Dark Glassmorphism Landing Page**: ออกแบบหน้าแรกใหม่ทั้งหมด — Dark theme `#0a0c14`, Glass cards พร้อม hover glow effects และ micro-animations
- **Full Responsive**: รองรับทุกขนาดหน้าจอ (400px, 640px, 768px, 1024px, 1280px+) ด้วย 4 breakpoints
- **Unit Testing Infrastructure**: ติดตั้ง Vitest พร้อมเขียน 15 Unit Tests ครอบคลุม `ScoringEngine` และ `AIEngine` — ผ่านทั้งหมด
- **Vercel Deployment Ready**: เพิ่มไฟล์ `vercel.json` สำหรับ Static Site hosting พร้อม Clean URL routing
- **Vite Dev Server**: เพิ่ม `npm run dev` สำหรับ Local development ด้วย Vite

### v3.0 — Major Release (11/03/2026 15:00)
- **Responsive Navigation & UI**: รวมระบบเมนู Sidebar เป็นมาตรฐานเดียวกันทุกหน้า, Mobile Bottom Nav
- **Intelligent Reporting System**: สร้างหน้า `reports.html` + AI Engine (5 Report Types, Risk Analysis, NLP)
- **Help & Documentation**: เพิ่มหน้า `manual.html`, built-in PDF Export
- **Professional Branding**: Footer Credits, Version Tracking

---

## 📦 Version History Log

| Version | Date | Time | Key Changes | Developer |
|:---|:---|:---|:---|:---|
| **v3.1** | 11/03/2026 | 19:45 | Landing Page Redesign, Unit Tests, Vercel Deploy | นักวิชาการคอมพิวเตอร์ |
| **v3.0** | 11/03/2026 | 15:00 | Major Release: Responsive, AI Reports, Manual, Credits | นักวิชาการคอมพิวเตอร์ |
| **v2.5** | 10/03/2026 | 14:20 | Admin Back-Office & User Management | นักวิชาการคอมพิวเตอร์ |
| **v2.0** | 08/03/2026 | 10:00 | Executive & Director Dashboards | นักวิชาการคอมพิวเตอร์ |
| **v1.0** | 05/03/2026 | 09:30 | Initial System Setup & Google Sheets Integration | นักวิชาการคอมพิวเตอร์ |

---

## ⚡ Deployment Instructions (สำหรับ Google Apps Script)
1. คัดลอกโค้ดจากไฟล์ `d:\Web Application\KPI_Dashboard\apps-script\Deploy.gs` ทั้งหมด
2. นำไปวางใน Google Apps Script Editor ของชีตฐานข้อมูล
3. คลิกปุ่ม **Deploy** > **New Deployment**
4. เลือกประเภทเป็น **Web App**
5. ตั้งค่า **Who has access** เป็น **"Anyone"**
6. คลิก **Deploy** และนำ URL ที่ได้มาอัปเดตใน `js/api.js`

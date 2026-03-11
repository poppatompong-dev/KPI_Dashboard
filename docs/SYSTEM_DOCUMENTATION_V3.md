# 📖 System Documentation: Smart City KPI Platform v3.0

> **Smart City Municipal Performance Management System (AI-Driven)**
> พัฒนาโดย: นักวิชาการคอมพิวเตอร์ เทศบาลนคร
> VERSION: 3.0 (Release Candidate)
> UPDATED: 11/03/2026 14:55

---

## 1. 🏗️ System Architecture

ระบบถูกออกแบบให้เป็น **Serverless Web Application** โดยใช้โครงสร้างพื้นฐานของ Google Workspace:

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+)
- **Backend/API**: Google Apps Script (Deployment via Web App URL)
- **Database**: Google Sheets (Cloud Storage)
- **AI Engine**: Client-side JavaScript Processing (Statistical Logic & NLP)

### Data Flow Diagram
```mermaid
graph TD
    User((User)) -->|Browser| UI[Frontend: Dashboards/Reports]
    UI -->|API Call| GAS[Google Apps Script]
    GAS -->|CRUD| GS[(Google Sheets)]
    UI -->|Local Process| AI[AI Engine: analysis.js/scoring.js]
    AI -->|Insights| UI
```

---

## 2. 🖥️ Interface & Key Features

### 🏠 Landing Page (Home)
จุดเริ่มต้นสำหรับการเลือกบทบาทผู้ใช้งาน ออกแบบให้เรียบง่ายและรองรับ Mobile Responsive 100%
![Landing Page — 5-Role Selection](C:\Users\Patompong\.gemini\antigravity\brain\3d77d48c-fc2b-4110-936e-ad801d1d09a0\landing_page_footer_1773214879911.png)

### 📊 Executive Dashboard
แสดงภาพรวมความสำเร็จของเมืองรายยุทธศาสตร์ พร้อม AI Performance Insights สรุปผลงานเป็นข้อความภาษาไทย
![Executive Dashboard — Performance Insights](C:\Users\Patompong\.gemini\antigravity\brain\3d77d48c-fc2b-4110-936e-ad801d1d09a0\executive_dashboard_sidebar_1773214911095.png)

### 🧠 Intelligent Reports (AI-Driven)
ระบบรายงานที่คำนวณความเสี่ยงล่วงหน้า โดยใช้หลักการทางสถิติเพื่อตรวจจับตัวชี้วัดที่วิกฤต
![Intelligent Reports — Risk Heatmap](C:\Users\Patompong\.gemini\antigravity\brain\3d77d48c-fc2b-4110-936e-ad801d1d09a0\intelligent_reports_risk_1773214944441.png)

### 📘 User Manual
คู่มือการใช้งานแบบ Built-in ช่วยให้ผู้ใช้งานใหม่เริ่มต้นได้รวดเร็ว แบ่งตามบทบาทงาน
![User Manual — Step-by-Step Guide](C:\Users\Patompong\.gemini\antigravity\brain\3d77d48c-fc2b-4110-936e-ad801d1d09a0\user_manual_guide_1773214963056.png)

### 🔐 Admin Back-Office
ส่วนจัดการความปลอดภัยและการตั้งค่าระบบ (RBAC, Audit Logs, User Management)
![Admin Login Screen](C:\Users\Patompong\.gemini\antigravity\brain\3d77d48c-fc2b-4110-936e-ad801d1d09a0\admin_login_screen_1773214996420.png)

---

## 3. 🧠 Smart Capabilities (AI & Logic)

| Feature | Technical Implementation | Goal |
|---------|-------------------------|------|
| **Trend Forecast** | Linear Regression (Ordinary Least Squares) | พยากรณ์ผลงานในอีก 3 เดือนข้างหน้า |
| **Risk Detection** | Z-Score & Target Gap Analysis | ตรวจพบ KPI ที่มีโอกาสไม่บรรลุเป้าหมาย |
| **NLP Insights** | Context-aware Thai Text Generation | แปลงตัวเลขให้เป็นข้อสรุปที่ผู้บริหารอ่านเข้าใจง่าย |
| **Scoring Engine** | Weighted Average & Status Mapping | คำนวณคะแนนรวมเมืองโดยถ่วงน้ำหนักตามความสำคัญ |

---

## 4. 🛠️ Future Development Guide

### การดูแลรักษาระบบ (Maintenance)
1.  **Google Sheet**: อย่าเปลี่ยนชื่อหัวตาราง (Header) ในแถวที่ 1 ของแต่ละ Sheet
2.  **GAS Deployment**: ทุกครั้งที่มีการแก้ไข `Deploy.gs` ให้เลือก "New Deployment" เพื่อรับ URL ใหม่ (ถ้าต้องการเปลี่ยน Version)
3.  **Styles**: แก้ไข `css/styles.css` เพื่อเปลี่ยนโทนสี (ใช้ CSS Variables ใน `:root`)

### สิ่งที่สามารถต่อยอดได้
- เชื่อมต่อ Line Notify สำหรับส่งรายงานความเสี่ยงรายวัน
- เพิ่มระบบ OCR สำหรับอ่านค่าจากเอกสารรูปภาพเข้าสู่ระบบโดยอัตโนมัติ
- เชื่อมต่อกับ Chat API เพื่อทำ Dynamic Q&A เกี่ยวกับข้อมูล KPI

---

## 🎖️ Developer Credits
**นักวิชาการคอมพิวเตอร์**
*กองยุทธศาสตร์และงบประมาณ เทศบาลนคร*
*"Transforming Municipal Data into Intelligent Decisions"*

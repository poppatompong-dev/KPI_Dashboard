/* ============================================================
   GAS Configuration — LOCAL DEVELOPMENT ONLY
   ============================================================
   ⚠️  ไฟล์นี้ถูก .gitignore แล้ว — ห้าม commit ขึ้น repository
   สำหรับ Production: ตั้งค่าใน Vercel Environment Variables
   ============================================================
   
   SETUP:
   1. คัดลอกไฟล์นี้: cp config.example.js config.js
   2. แก้ไข config.js ใส่ค่าจริง (GAS_URL และ API_SECRET)
   3. เพิ่ม <script src="config.js"></script> ใน HTML ที่ต้องใช้ API
      ก่อน <script src="js/api.js"></script>
   ============================================================ */

window.GAS_URL    = 'YOUR_GAS_WEB_APP_URL_HERE';
// ตัวอย่าง: 'https://script.google.com/macros/s/AKfy.../exec'

window.API_SECRET = 'YOUR_API_SECRET_HERE';
// ต้องตรงกับค่า API_SECRET ที่ตั้งใน GAS Script Properties
// สร้าง random secret ด้วย: crypto.randomUUID() หรือ uuidgen

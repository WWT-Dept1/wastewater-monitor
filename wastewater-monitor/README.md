# Wastewater Flow Monitoring – Presentation Prototype

Dashboard ใหม่ตามแบบ INLET FLOW พร้อม:
- Live inlet flow / capacity / Today / Average / Peak
- ตรวจความผิดปกติ: ข้อมูลหยุดส่ง >3 นาที, Flow ต่ำ/สูง, Flow เปลี่ยนฉับพลัน
- สรุป Flow รายชั่วโมงอัตโนมัติจากข้อมูลที่ ESP32 ส่ง
- Export CSV
- Workflow: พนักงานทวนสอบ → ผู้ช่วยตรวจสอบ → หัวหน้าแผนกอนุมัติ

## ติดตั้ง
1. Supabase SQL Editor: รัน `database/add_review_workflow.sql`
2. GitHub: แทนที่ไฟล์ `web/index.html`, `web/app.js`, `web/config.js`
3. Vercel จะ redeploy อัตโนมัติ

## หมายเหตุ
นี่เป็น Prototype. สิทธิ์ insert ของ anon เปิดไว้เพื่อทดสอบหน้าเว็บได้ง่าย ก่อนใช้งานจริงควรเพิ่ม Login และ Role-based access.

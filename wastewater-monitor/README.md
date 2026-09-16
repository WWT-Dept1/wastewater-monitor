# Wastewater Monitor — Prototype

ต้นแบบสำหรับ ISOMAG MS1000 + MV110 → ESP32 → Wi‑Fi/4G Router → Supabase → Web Dashboard

## ก่อนต่อสาย
**ห้ามต่อสัญญาณ 4–20 mA จาก MV110 เข้าขา ESP32 โดยตรง**
ต้องใช้โมดูลรับ 4–20 mA ที่ให้เอาต์พุตไม่เกินช่วง ADC ของ ESP32 (0–3.3 V) และควรใช้แบบ isolated เมื่อต่อกับเครื่องจริง

ค่าขั้ว Output ของ MV110 และการตั้ง 0–72 m³/h ต้องตรวจจากเครื่อง/คู่มือของเครื่องจริงก่อนต่อ Prototype

## ของที่ต้องมี
- ESP32 DevKit
- โมดูล 4–20 mA → 0–3.3 V ที่เหมาะกับ ESP32
- Power supply / USB 5 V
- Terminal, สาย และกล่อง
- Router Wi‑Fi ใส่ SIM (มีอยู่แล้ว)

## 1. Database
1. สมัคร/สร้าง Supabase project
2. เปิด SQL Editor
3. รัน `database/setup.sql`
4. เก็บ Project URL และ anon/publishable key

## 2. ESP32
เปิด `esp32/wastewater_flow.ino` ด้วย Arduino IDE
แก้:
- `WIFI_SSID`
- `WIFI_PASSWORD`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

ติดตั้ง ESP32 board package แล้ว Upload

### ADC
ตัวอย่างใช้ GPIO34 และสมมติ receiver module ให้:
- 4 mA = 0.66 V
- 20 mA = 3.30 V

นี่เป็นค่าเริ่มต้นเท่านั้น ต้องวัดและ calibration กับโมดูลที่ซื้อจริง

## 3. Web Dashboard
แก้ `web/config.js` ให้เป็น Supabase URL/key เดียวกัน

ทดสอบ local ด้วย web server เช่น VS Code Live Server หรือ:
`python -m http.server 8080 -d web`

## 4. GitHub + Vercel
สร้าง GitHub repository แล้วอัปโหลดโฟลเดอร์นี้
จากนั้น Import repository ใน Vercel และตั้ง Root Directory เป็น `web`

> GitHub = เก็บ source code
> Vercel = host หน้า Web
> Supabase = database/API

## Prototype scope
เวอร์ชันนี้เน้น “อ่าน/บันทึก/แสดงผล” เท่านั้น ไม่สั่ง Pump/VFD/Valve

## ขั้นต่อไป
1. ตรวจ nameplate/terminal diagram ของ MV110 ตัวจริง
2. เลือก receiver 4–20 mA ที่แน่นอน
3. ทำ wiring diagram ตามโมดูลจริง
4. Calibration เทียบค่าหน้าจอ MV110 กับ Dashboard
5. หลัง Prototype ผ่าน ค่อยเพิ่ม login, alarm, hourly report และ RS485/Modbus

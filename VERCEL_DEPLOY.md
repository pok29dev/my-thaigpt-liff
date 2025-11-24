# คู่มือการ Deploy บน Vercel

## ขั้นตอนการ Deploy

### 1. เตรียม Environment Variables

ก่อน deploy ต้องเตรียม Environment Variables ต่อไปนี้:

| Variable Name       | Description                      | ใช้ที่           |
| ------------------- | -------------------------------- | ---------------- |
| `VITE_API_BASE_URL` | URL ของ ThaiGPT API              | Client-side      |
| `VITE_API_NODE_ID`  | Node ID สำหรับ API               | Client-side      |
| `VITE_LIFF_ID`      | LIFF ID จาก LINE Developers      | Client-side      |
| `THAIGPT_API_TOKEN` | Bearer Token สำหรับ API (สำคัญ!) | Server-side only |

### 2. Deploy ผ่าน Vercel Dashboard

1. **Push code ไปยัง Git Repository**

   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Import Project ใน Vercel**

   - ไปที่ [vercel.com](https://vercel.com)
   - คลิก "Add New" > "Project"
   - เลือก Git repository ของคุณ
   - Vercel จะ detect โปรเจกต์อัตโนมัติ

3. **ตั้งค่า Environment Variables**

   - ในหน้า Project Settings
   - ไปที่ "Environment Variables"
   - เพิ่มตัวแปรทั้งหมด 4 ตัว (ดูจากตารางด้านบน)
   - **สำคัญ**: เลือก Environment ทั้งหมด (Production, Preview, Development)

4. **Deploy**
   - คลิก "Deploy"
   - รอให้ build เสร็จ
   - จะได้ URL สำหรับ Production

### 3. Deploy ผ่าน Vercel CLI

```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (ครั้งแรกจะถามคำถาม)
vercel

# ตั้งค่า Environment Variables
vercel env add VITE_API_BASE_URL
vercel env add VITE_API_NODE_ID
vercel env add VITE_LIFF_ID
vercel env add THAIGPT_API_TOKEN

# Deploy ไปยัง Production
vercel --prod
```

## ตรวจสอบการ Deploy

หลังจาก deploy เสร็จ:

1. **ตรวจสอบ API Endpoints**

   - ไปที่ `https://your-domain.vercel.app/api/get-history`
   - ควรได้ response 405 (Method Not Allowed) ถ้าเรียกด้วย GET
   - ถ้าได้ 500 อาจเป็นเพราะ Environment Variables ยังไม่ได้ตั้งค่า

2. **ตรวจสอบ Frontend**

   - ไปที่ `https://your-domain.vercel.app`
   - ควรเห็น Chat Interface
   - ตรวจสอบ Console ใน Browser DevTools ว่ามี error หรือไม่

3. **ตรวจสอบ Logs**
   - ไปที่ Vercel Dashboard > Project > Functions
   - ดู Logs ของ API functions

## Troubleshooting

### ปัญหา: API กลับมาเป็น 500 Error

**สาเหตุ**: Environment Variables ยังไม่ได้ตั้งค่า

**แก้ไข**:

1. ไปที่ Vercel Dashboard > Project Settings > Environment Variables
2. ตรวจสอบว่ามี `THAIGPT_API_TOKEN` ตั้งค่าไว้หรือไม่
3. Redeploy project

### ปัญหา: Frontend ไม่สามารถเรียก API ได้

**สาเหตุ**: CORS หรือ API endpoint ไม่ถูกต้อง

**แก้ไข**:

1. ตรวจสอบว่าเรียก API ด้วย path `/api/get-history` และ `/api/send-prompt`
2. ตรวจสอบ Console ใน Browser DevTools
3. ตรวจสอบ Network tab ว่า request ถูกส่งไปหรือไม่

### ปัญหา: Streaming ไม่ทำงาน

**สาเหตุ**: Vercel Functions อาจมีปัญหาในการ forward stream

**แก้ไข**:

1. ตรวจสอบ Logs ใน Vercel Dashboard
2. ตรวจสอบว่า `stream: 1` ถูกส่งไปใน request body
3. ลองใช้ non-streaming mode ก่อน (`stream: 0`)

## Production Checklist

- [ ] Environment Variables ทั้งหมดถูกตั้งค่าใน Vercel
- [ ] API endpoints ทำงานถูกต้อง
- [ ] Frontend สามารถเรียก API ได้
- [ ] Streaming responses ทำงาน
- [ ] LIFF integration ทำงาน
- [ ] Error handling ทำงานถูกต้อง
- [ ] Custom domain ถูกตั้งค่า (ถ้ามี)

## หมายเหตุ

- **THAIGPT_API_TOKEN**: ต้องเก็บเป็นความลับ อย่า commit ลง Git
- **VITE\_ prefix**: Environment variables ที่มี prefix `VITE_` จะถูก expose ไปยัง client-side
- **Serverless Functions**: Functions ในโฟลเดอร์ `api/` จะทำงานอัตโนมัติเมื่อ deploy

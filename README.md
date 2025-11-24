# ThaiGPT LIFF App

แอปพลิเคชัน Chat Bot สำหรับ LINE LIFF ที่ใช้ ThaiGPT API

## คุณสมบัติ

- 💬 Chat Interface ที่สวยงามและใช้งานง่าย
- 🔐 API Token ถูกปกป้องด้วย Server-side Functions
- 📱 รองรับ LINE LIFF
- ⚡ Streaming Responses สำหรับการตอบกลับแบบ Real-time
- 💾 เก็บประวัติการสนทนาใน LocalStorage

## โครงสร้างโปรเจกต์

```
my-thaigpt-liff/
├── api/                    # Vercel Serverless Functions
│   ├── get-history.js      # API endpoint สำหรับดึงประวัติการสนทนา
│   └── send-prompt.js      # API endpoint สำหรับส่ง prompt และรับ streaming response
├── src/
│   ├── App.jsx            # หน้าหลักของแอป
│   └── ...
├── .env                   # Environment variables (ไม่ commit)
├── .env.example           # ตัวอย่าง Environment variables
└── vercel.json            # Vercel configuration
```

## การติดตั้ง

1. Clone repository

```bash
git clone <repository-url>
cd my-thaigpt-liff
```

2. ติดตั้ง dependencies

```bash
npm install
```

3. สร้างไฟล์ `.env` จาก `.env.example`

```bash
cp .env.example .env
```

4. แก้ไขค่าใน `.env`:

```env
VITE_API_BASE_URL=https://cnx.thaigpt.com
VITE_API_NODE_ID=your_node_id_here
VITE_LIFF_ID=your_liff_id_here
THAIGPT_API_TOKEN=your_bearer_token_here
```

## การรัน Development Server

```bash
npm run dev
```

## การ Build

```bash
npm run build
```

## การ Deploy บน Vercel

### วิธีที่ 1: ใช้ Vercel CLI

1. ติดตั้ง Vercel CLI

```bash
npm i -g vercel
```

2. Login และ Deploy

```bash
vercel login
vercel
```

3. ตั้งค่า Environment Variables ใน Vercel Dashboard:
   - ไปที่ Project Settings > Environment Variables
   - เพิ่มตัวแปรต่อไปนี้:
     - `VITE_API_BASE_URL`
     - `VITE_API_NODE_ID`
     - `VITE_LIFF_ID`
     - `THAIGPT_API_TOKEN` (สำคัญ: ใช้ใน server-side เท่านั้น)

### วิธีที่ 2: ใช้ Vercel Dashboard

1. Push code ไปยัง GitHub/GitLab/Bitbucket
2. ไปที่ [Vercel Dashboard](https://vercel.com)
3. Import Project จาก Git repository
4. ตั้งค่า Environment Variables:
   - `VITE_API_BASE_URL`
   - `VITE_API_NODE_ID`
   - `VITE_LIFF_ID`
   - `THAIGPT_API_TOKEN`
5. Deploy

### สิ่งสำคัญสำหรับ Vercel

- **Environment Variables**: ต้องตั้งค่าทั้งหมดใน Vercel Dashboard
- **Serverless Functions**: API routes อยู่ในโฟลเดอร์ `api/` และจะทำงานอัตโนมัติ
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## API Endpoints

### `/api/get-history`

ดึงประวัติการสนทนา

**Request:**

```json
{
  "user_id": "string",
  "node_id": "string",
  "run_id": "string"
}
```

**Response:**

```json
{
  "status": "success",
  "memory": [{ "input": "string", "output": "string" }]
}
```

### `/api/send-prompt`

ส่ง prompt และรับ streaming response

**Request:**

```json
{
  "prompt": "string",
  "user_id": "string",
  "node_id": "string",
  "run_id": "string",
  "stream": 1
}
```

**Response:**
Streaming response จาก ThaiGPT API

## Security

- ✅ API Token ถูกเก็บไว้ใน Server-side (Vercel Functions)
- ✅ Client-side ไม่สามารถเข้าถึง `THAIGPT_API_TOKEN` ได้
- ✅ Environment variables ถูก exclude จาก Git

## License

MIT

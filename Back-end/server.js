// Back-end/server.js (Phiên bản đã sửa lỗi và có Fallback)

const express = require("express");
const cors = require("cors");
const path = require("path");
// ĐẢM BẢO IMPORT ĐÚNG CÚ PHÁP
const { enrichContent } = require("./aiService"); 
const generateSchedule = require("./scheduler");

const app = express();
app.use(cors());
app.use(express.json());

// Phục vụ file tĩnh và route trang chủ
app.use(express.static(path.join(__dirname, '../Front-end'))); 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Front-end/index.html'));
});

app.post("/generate-schedule", async (req, res) => {
    const userData = req.body;
    // Lấy lịch thô
    const rawPlan = generateSchedule(userData);

    try {
        // KÍCH HOẠT LẠI AI VÀ LÀM GIÀU NỘI DUNG
        const finalSchedule = await enrichContent(rawPlan); 
        
        res.json(finalSchedule);
    } catch (error) {
        // 🚨 FALLBACK: Nếu AI lỗi (TypeError, API Key, Mạng), trả về lịch thô
        console.warn(`CẢNH BÁO: Lỗi AI (${error.message.split('\n')[0]}). Trả về lịch học thô.`);
        
        // Sử dụng lịch thô đã tính toán
        res.status(200).json(rawPlan); 
    }
});

app.listen(3000, () => {
  console.log("Server chạy tại http://localhost:3000");
});
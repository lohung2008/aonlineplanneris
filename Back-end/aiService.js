// Back-end/aiService.js (Phiên bản đã sửa lỗi biến và Prompt)

const { GoogleGenAI } = require("@google/genai");

// 🚨 ĐẢM BẢO KHÓA API CỦA BẠN ĐƯỢC ĐẶT TRONG DẤU NGOẶC KÉP ("...")
// THAY 'YOUR_VALID_GEMINI_API_KEY_HERE' BẰNG KHÓA CỦA BẠN.
const GEMINI_API_KEY = "AIzaSyBfrTul5PJD6Gpo1ynHmWk0ti4b7d6i13c"; 
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Hàm làm giàu nội dung (enrichContent)
// 🚨 Đảm bảo tham số ĐƯỢC ĐẶT TÊN là 'rawSchedule' để khớp với prompt bên trong
async function enrichContent(rawSchedule) {
    if (!rawSchedule || !rawSchedule.schedule) {
        // Lỗi này giúp xác định nếu dữ liệu đầu vào không hợp lệ
        throw new Error("Dữ liệu lịch học thô từ scheduler không hợp lệ.");
    }
    
    // Sử dụng biến rawSchedule trong Prompt
    const prompt = `
    Vai trò: Bạn là chuyên gia lập kế hoạch học tập cá nhân hóa.

Nhiệm vụ: Lấy dữ liệu lịch học thô (rawSchedule) và làm giàu (enrich) nội dung cho trường details của mỗi session bằng cách tạo một kế hoạch học tập chi tiết, áp dụng kết hợp các phương pháp học tập tiên tiến.

Yêu cầu chi tiết cho mỗi buổi học (session.details):

Chủ đề/Mục tiêu chính (Chủ động): Xác định rõ mục tiêu cần đạt được trong 1 giờ học này, tập trung vào việc khắc phục điểm yếu (weakPoints).

Khởi động (5-10 phút): Áp dụng Active Recall hoặc Spaced Repetition (ôn tập nhanh kiến thức cũ từ 1-2 ngày trước).

Học tập sâu (40-45 phút): Tập trung vào việc giải quyết các bài tập khó hoặc nội dung quan trọng. Áp dụng Kỹ thuật Feynman (tóm tắt/giải thích cho người khác) hoặc Luyện tập xen kẽ (Interleaving) nếu môn học cho phép.

Kết thúc & Đánh giá (5-10 phút): Tự đánh giá, ghi lại các điểm chưa hiểu rõ (Confusion Points) và lập Quick Plan cho buổi học tiếp theo.

Cấu trúc Thời gian: Dùng kỹ thuật Pomodoro (ví dụ: 25 phút học, 5 phút nghỉ) trong khoảng thời gian 1.0 giờ này.

Định dạng đầu ra: Phải là JSON hợp lệ, giữ nguyên cấu trúc của rawSchedule và chỉ cập nhật trường details cho mỗi session.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        // Cần đảm bảo output là JSON hợp lệ
        const jsonText = response.text.trim().replace(/^```json|```$/g, '');
        return JSON.parse(jsonText);

    } catch (error) {
        // Đặt tên lỗi rõ ràng hơn để dễ debug
        error.message = `Lỗi gọi API Gemini (Khóa API hoặc Parsing): ${error.message}`;
        throw error;
    }
}

module.exports = { enrichContent };
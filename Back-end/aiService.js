// Back-end/aiService.js (Phiên bản ĐÃ THÊM XỬ LÝ LỖI JSON)

const { GoogleGenAI } = require("@google/genai"); 
// 🚨 Đảm bảo bạn đã cài đặt thư viện @google/genai 
// và khai báo biến môi trường cho GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 

// Prompt cho AI để làm giàu nội dung
const getSystemPrompt = (rawPlan) => {
    return `
Bạn là Trợ lý Lập kế hoạch học tập AI. Dưới đây là dữ liệu thô về lịch học:

    Dữ liệu thô: ${JSON.stringify(rawPlan)}

    Mục tiêu của bạn là biến 'rawPlan' thành 'finalSchedule' bằng cách làm giàu nội dung chi tiết cho từng buổi học (session).

    **QUY TẮC BẮT BUỘC:**
    1.  **Luân phiên & Lồng ghép môn học (Micro-sessions):** KHÔNG được để một môn học xuất hiện QUÁ 2 LẦN LIÊN TIẾP trong các buổi học (sessions) của cùng một ngày. Nếu có thể, hãy lồng ghép các hoạt động nhẹ (như Đọc tin tức, Luyện viết đoạn văn, 20 phút Tiếng Anh, thiền) vào giữa các buổi học chính (1.5 giờ) để tối ưu hóa sự tập trung.
    2.  **Phương pháp học tập hiệu quả (Phải được nêu rõ trong details):** Áp dụng các phương pháp học tập như: Active Recall, Spaced Repetition (từ Ngày 2), và Feynman Technique một cách hiệu quả, tránh lặp lại.
ĐẦU RA BẮT BUỘC phải là MỘT CHUỖI JSON DUY NHẤT có cấu trúc sau:
{
  "schedule": [
    {
      "day": "Ngày 1",
      "sessions": [
        {
          "subject": "Toán",
          "duration": 1.0,
          "details": "Học Toán (1.0 giờ)",
          "topics": ["Ôn tập hàm số bậc nhất (nếu điểm yếu là Hàm số)"], // 🚨 Thêm mảng topics
        },
        // ... các buổi học khác ...
      ]
    },
    // ... các ngày khác ...
  ],
  "summary": "Mục tiêu: [Mục tiêu cũ]. Điểm yếu: [Điểm yếu cũ]...", // Giữ nguyên summary cũ
  "goal": "[Mục tiêu cũ]",
  "weakPoints": "[Điểm yếu cũ]",
  "aiSummary": "[Tóm tắt AI mới dựa trên mục tiêu/điểm yếu]", // 🚨 Tóm tắt mới (3-5 câu)
}

Lịch học thô là: ${JSON.stringify(rawPlan, null, 2)}
`;
};


async function enrichContent(rawPlan) {
    const prompt = getSystemPrompt(rawPlan);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const rawJsonText = response.text.trim();
        
        // 🚨 XỬ LÝ LỖI JSON PARSING TẠI ĐÂY
        try {
            // Thử phân tích cú pháp JSON
            const finalSchedule = JSON.parse(rawJsonText);
            
            // Nếu JSON hợp lệ, trả về
            return finalSchedule; 

        } catch (jsonError) {
            // Bắt lỗi "Unterminated string" hoặc lỗi parsing khác
            console.error("LỖI JSON PARSING: Dữ liệu từ AI không phải JSON hợp lệ hoặc bị cắt ngắn.");
            // Ném một lỗi mới để khối try...catch trong server.js bắt và trả về lịch thô
            throw new Error(`Lỗi Parsing JSON từ AI: ${jsonError.message}. Dữ liệu AI trả về: ${rawJsonText.substring(0, 200)}...`);
        }

    } catch (apiError) {
        // Bắt lỗi gọi API (ví dụ: Khóa API sai, lỗi kết nối)
        console.error("LỖI GỌI API GEMINI:", apiError.message);
        throw new Error(`Lỗi gọi API Gemini (Khóa API hoặc Parsing): ${apiError.message.split('\n')[0]}`);
    }
}

module.exports = { enrichContent };

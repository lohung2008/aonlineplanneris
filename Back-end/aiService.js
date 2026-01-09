// Back-end/aiService.js (Phiên bản ĐÃ FIX LỖI JSON PARSING TRIỆT ĐỂ)

const { GoogleGenAI } = require("@google/genai"); 
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 

// 🚨 HÀM MỚI: DỌN DẸP CHUỖI JSON THÔ TỪ AI
function cleanJsonString(rawText) {
    if (!rawText) return '';
    
    let cleaned = rawText.trim();
    
    // 1. Loại bỏ các ký hiệu markdown JSON (```json...```)
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7).trim();
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3).trim();
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3).trim();
    }
    
    // 2. TÌM VÀ CÔ LẬP ĐỐI TƯỢNG JSON HỢP LỆ (TỪ DẤU { ĐẦU TIÊN ĐẾN DẤU } CUỐI CÙNG)
    // Đây là bước quan trọng để loại bỏ các thông báo, lời giải thích xung quanh JSON
    const startIndex = cleaned.indexOf('{');
    const endIndex = cleaned.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleaned = cleaned.substring(startIndex, endIndex + 1);
    } else {
        // Nếu không tìm thấy cấu trúc JSON, trả về chuỗi đã dọn dẹp markdown
        return cleaned; 
    }
    
    // 3. Loại bỏ dấu phẩy thừa trước dấu đóng ngoặc (lỗi thường gặp trong JSON sinh ra từ AI)
    // Ví dụ: {"a": 1, "b": 2,} => {"a": 1, "b": 2}
    cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1'); 
    
    return cleaned;
}

const getSystemPrompt = (rawPlan) => {
    return `
Bạn là Trợ lý Lập kế hoạch học tập AI. Dưới đây là dữ liệu thô về lịch học:

Dữ liệu thô: ${JSON.stringify(rawPlan)}

Mục tiêu của bạn là biến 'rawPlan' thành 'finalSchedule' bằng cách làm giàu nội dung chi tiết cho từng buổi học (session).

**QUY TẮC NỘI DUNG (Để đảm bảo AI tạo ra giá trị):**
1.  **Phân tích:** Dựa trên Mục tiêu và Điểm yếu (có trong dữ liệu thô), đề xuất các nội dung học (topics) cụ thể cho từng môn học.
2.  **Phương pháp học tập:** Luôn lồng ghép các phương pháp học tập hiệu quả như Active Recall, Spaced Repetition (từ Ngày 2), và Phương pháp Feynman vào phần 'details' của từng buổi học.
3.  **Luân phiên:** Trong cùng một ngày, tránh để một môn học xuất hiện quá 2 lần liên tiếp.

**ĐẦU RA BẮT BUỘC:**
Phản hồi của bạn PHẢI là MỘT CHUỖI JSON DUY NHẤT, không có bất kỳ văn bản, lời giải thích hay ký tự Markdown nào bên ngoài cấu trúc này.

{
  "schedule": [
    {
      "day": "Ngày 1",
      "sessions": [
        {
          "subject": "Toán",
          "duration": 1.0,
          "details": "Bắt đầu với Active Recall 15 phút ôn tập hàm số bậc nhất. Sau đó, áp dụng phương pháp Feynman để tìm hiểu chương mới (1.0 giờ).", 
          "topics": ["Ôn tập Hàm số Bậc nhất", "Giới thiệu Phương trình Bậc 2"], 
        },
        // ... các buổi học khác ...
      ]
    },
    // ... các ngày khác ...
  ],
  "summary": "${rawPlan.summary}", // Giữ nguyên summary thô
  "goal": "${rawPlan.goal}",
  "weakPoints": "${rawPlan.weakPoints}",
  "aiSummary": "[Tóm tắt AI mới, chỉ 3-4 câu, tập trung vào chiến lược]", // Tóm tắt ngắn gọn
}
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
        
        const rawJsonText = response.text;
        // DỌN DẸP CHUỖI TRƯỚC KHI PARSE
        const cleanText = cleanJsonString(rawJsonText);
        
        try {
            // Thử phân tích cú pháp JSON trên chuỗi đã dọn dẹp
            const finalSchedule = JSON.parse(cleanText);
            
            return finalSchedule; 

        } catch (jsonError) {
            console.error("LỖI JSON PARSING: Dữ liệu từ AI không phải JSON hợp lệ hoặc bị cắt ngắn.");
            throw new Error(`Lỗi Parsing JSON từ AI: ${jsonError.message}. Dữ liệu AI trả về: ${cleanText.substring(0, 200)}...`);
        }

    } catch (apiError) {
        console.error("LỖI GỌI API GEMINI:", apiError.message);
        throw new Error(`Lỗi gọi API Gemini (Khóa API hoặc Parsing): ${apiError.message.split('\n')[0]}`);
    }
}

module.exports = { enrichContent };


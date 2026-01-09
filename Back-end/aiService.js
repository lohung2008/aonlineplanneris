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
    // Chỉ lấy 7 ngày đầu tiên (hoặc tất cả nếu lịch < 7 ngày)
    const shortSchedule = {
        ...rawPlan,
        schedule: rawPlan.schedule.slice(0, 7)
    };
    
    // Tổng số ngày trong lịch gốc
    const totalDays = rawPlan.schedule.length;

    return `
Bạn là Trợ lý Lập kế hoạch học tập AI. Dưới đây là dữ liệu thô về lịch học:

Dữ liệu thô (Chỉ 7 ngày đầu tiên): ${JSON.stringify(shortSchedule)}

Mục tiêu của bạn là TẠO LỊCH HỌC CHI TIẾT cho CHỈ 7 NGÀY ĐẦU TIÊN (Ngày 1 đến Ngày 7).
Với các ngày còn lại (từ Ngày 8 đến Ngày ${totalDays}), hãy giữ nguyên các buổi học (sessions) theo dữ liệu thô đã cung cấp.

**QUY TẮC NỘI DUNG:**
1.  **Phân tích & Topics:** Dựa trên Mục tiêu và Điểm yếu, đề xuất các nội dung học (topics) cụ thể cho 7 ngày đầu.
2.  **Phương pháp học tập:** Luôn lồng ghép các phương pháp học tập như Active Recall, Spaced Repetition (từ Ngày 2), và Phương pháp Feynman vào phần 'details' của từng buổi học trong 7 ngày đầu.
3.  **Luân phiên:** Trong 7 ngày đầu, tránh để một môn học xuất hiện quá 2 lần liên tiếp trong cùng một ngày.

**ĐẦU RA BẮT BUỘC:**
Phản hồi của bạn PHẢI là MỘT CHUỖI JSON DUY NHẤT, chứa TOÀN BỘ lịch học (từ Ngày 1 đến Ngày ${totalDays}).

{
  "schedule": [
    // ... Ngày 1 đến Ngày 7 (Chi tiết), Ngày 8 đến Ngày ${totalDays} (Thô)
  ],
  "summary": "${rawPlan.summary}", 
  "goal": "${rawPlan.goal}",
  "weakPoints": "${rawPlan.weakPoints}",
  "aiSummary": "[Tóm tắt AI mới, chỉ 3-4 câu, tập trung vào chiến lược]", 
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



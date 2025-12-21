// Back-end/scheduler.js (Phiên bản: Nhiều ca học, Tối đa 2 môn/ngày)

function generateSchedule(data) {
    const { subjects, levels, freeTime, days, weakPoints, goal } = data;

    // 1. KIỂM TRA PHÒNG VỆ
    if (!Array.isArray(subjects) || subjects.length === 0) {
        return { schedule: [], message: "Vui lòng chọn ít nhất một môn học." };
    }

    const dailyFreeTime = parseFloat(freeTime) || 3; 
    
    // ĐỊNH NGHĨA THỜI LƯỢNG CA HỌC MỚI
    const SESSION_DURATION = 1.0; // 1.0 giờ (60 phút)
    const BREAK_DURATION = 0.25; // 0.25 giờ (15 phút)
    const TOTAL_SLOT_TIME = SESSION_DURATION + BREAK_DURATION; // 1.25 giờ cho mỗi khối học

    // Sắp xếp môn học theo mức độ yếu
    const sortedSubjects = subjects.sort(
        (a, b) => levels[a] - levels[b]
    );

    // Tính toán phân bổ thời gian theo trọng số
    const totalTimeAvailable = dailyFreeTime * days; 
    const totalSubjects = sortedSubjects.length;
    const baseTimePerSubject = totalTimeAvailable / totalSubjects; 
    const subjectTimes = {};
    let totalAdjustedTime = 0;

    sortedSubjects.forEach(subject => {
        const weight = 11 - levels[subject]; 
        subjectTimes[subject] = baseTimePerSubject * (weight / 5.5); 
        totalAdjustedTime += subjectTimes[subject];
    });

    sortedSubjects.forEach(subject => {
        subjectTimes[subject] *= (totalTimeAvailable / totalAdjustedTime);
    });

    // --- 2. TẠO DANH SÁCH BUỔI HỌC VÀ LUÂN PHIÊN (FLAT SCHEDULE) ---
    const flatSchedule = [];
    
    sortedSubjects.forEach(subject => {
        const totalHours = subjectTimes[subject];
        // Chia thành các buổi 1.0 giờ (SESSION_DURATION)
        const sessions = Math.round(totalHours / SESSION_DURATION); 

        for (let i = 0; i < sessions; i++) {
            flatSchedule.push(subject);
        }
    });

    flatSchedule.sort(() => Math.random() - 0.5); 
    
    // --- 3. PHÂN BỔ CÁC BUỔI HỌC VÀO TỪNG NGÀY (CÓ GIỚI HẠN) ---
    const schedule = [];
    const daysArray = Array.from({ length: days }, (_, i) => `Ngày ${i + 1}`);
    let sessionIndex = 0;
    
    // Tạo bản sao của flatSchedule để dễ dàng lấy và loại bỏ phần tử
    let remainingFlatSchedule = [...flatSchedule];
    
    for (let i = 0; i < days; i++) {
        const currentDay = daysArray[i];
        const dailySessions = [];
        
        // Số lượng buổi học tối đa mỗi ngày
        const maxDailySessions = Math.floor(dailyFreeTime / TOTAL_SLOT_TIME) || 2; 
        
        // --- LOGIC GIỚI HẠN MÔN HỌC ---
        const subjectsForDay = [];
        // Lấy tối đa 2 môn học từ danh sách các môn chưa được học
        for (let k = 0; k < remainingFlatSchedule.length && subjectsForDay.length < 2; k++) {
            const subject = remainingFlatSchedule[k];
            if (!subjectsForDay.includes(subject)) {
                subjectsForDay.push(subject);
            }
        }
        
        // --- LẤY CÁC CA HỌC CHO NGÀY ĐÓ ---
        for (let j = 0; j < maxDailySessions; j++) {
            if (remainingFlatSchedule.length === 0) break; // Hết sessions

            // Lựa chọn môn học dựa trên subjectsForDay, ưu tiên môn yếu hơn (subjectForDay[0])
            let subjectToPick;
            if (subjectsForDay.length === 1) {
                subjectToPick = subjectsForDay[0];
            } else if (subjectsForDay.length === 2) {
                // Luân phiên giữa 2 môn (môn yếu hơn (0) được ưu tiên hơn)
                subjectToPick = (j % 3 === 0 || j % 3 === 1) ? subjectsForDay[0] : subjectsForDay[1]; 
            } else {
                // Nếu không có môn nào được chọn (trường hợp hiếm)
                subjectToPick = remainingFlatSchedule[0];
            }
            
            // Tìm và loại bỏ môn học đó khỏi danh sách còn lại
            const index = remainingFlatSchedule.indexOf(subjectToPick);
            if (index !== -1) {
                const subject = remainingFlatSchedule.splice(index, 1)[0]; 
                
                dailySessions.push({ 
                    subject, 
                    duration: SESSION_DURATION, 
                    details: `Học ${subject} (${SESSION_DURATION} giờ)` 
                });
            } else if (remainingFlatSchedule.length > 0) {
                 // Nếu môn được chọn hết rồi, lấy môn tiếp theo trong remainingFlatSchedule
                const nextSubject = remainingFlatSchedule.splice(0, 1)[0];
                 if (!subjectsForDay.includes(nextSubject)) {
                    subjectsForDay.push(nextSubject);
                 }
                dailySessions.push({ 
                    subject: nextSubject, 
                    duration: SESSION_DURATION, 
                    details: `Học ${nextSubject} (${SESSION_DURATION} giờ)` 
                });
            } else {
                 break;
            }
        }
        
        schedule.push({ day: currentDay, sessions: dailySessions });
    }
    
    // --- 4. CHUẨN BỊ NỘI DUNG VÀ TRẢ VỀ ---
    const rawSchedule = { 
        schedule: schedule,
        summary: `Mục tiêu: ${goal}. Điểm yếu: ${weakPoints}. Lịch học thô cho ${days} ngày với ${dailyFreeTime} giờ rảnh mỗi ngày. Mỗi ca học 1.0 giờ, nghỉ 15 phút. Ưu tiên học các môn yếu hơn: ${sortedSubjects.join(', ')}.`,
        goal: goal, 
        weakPoints: weakPoints,
    };

    return rawSchedule;
}

module.exports = generateSchedule;
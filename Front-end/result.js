// Front-end/result.js (Phiên bản LỊCH HỌC CHUYÊN NGHIỆP)

document.addEventListener('DOMContentLoaded', () => {
    // Lấy dữ liệu lịch học đã lưu từ index.html
    const scheduleData = JSON.parse(localStorage.getItem('studySchedule'));
    const displayContainer = document.getElementById('schedule-calendar');
    const summaryContainer = document.getElementById('summary-display');

    if (!scheduleData || !scheduleData.schedule) {
        summaryContainer.innerHTML = '<p>⚠️ Dữ liệu lịch học không hợp lệ. Vui lòng quay lại trang chủ để tạo lại lịch.</p>';
        return;
    }
   // 1. Render Summary (Chỉ hiển thị chuỗi summary có sẵn để tránh lặp)
    // Chuỗi summary đã được tạo trong scheduler.js: "Mục tiêu: [goal]. Điểm yếu: [weakPoints]. Lịch học thô..."
    let summaryHTML = `<p>${scheduleData.summary || 'Lịch học chi tiết:'}</p>`;
    
    // Nếu có thêm nội dung làm giàu từ AI (enrichment), hãy hiển thị thêm (Ví dụ: AI Summary)
    if (scheduleData.aiSummary && scheduleData.aiSummary !== scheduleData.summary) {
        summaryHTML = `
            <p><strong>Tóm tắt AI:</strong> ${scheduleData.aiSummary}</p>
            <hr style="border-top: 1px dashed var(--border); margin: 10px 0;">
            ${summaryHTML}
        `;
    }

    summaryContainer.innerHTML = summaryHTML;
    // 2. Render Schedule Calendar
    let calendarHTML = '';

    const START_TIME = 8; // Bắt đầu buổi học đầu tiên lúc 8:00 sáng
    const DURATION = 1.5; // Mỗi buổi học 1.5 giờ

    scheduleData.schedule.forEach((dayEntry) => {
        let sessionsHTML = '';
        let currentTime = START_TIME;

        if (dayEntry.sessions.length > 0) {
            
            dayEntry.sessions.forEach(session => {
                const startHour = Math.floor(currentTime);
                const startMinute = (currentTime % 1) * 60;
                
                const endTime = currentTime + session.duration;
                const endHour = Math.floor(endTime);
                const endMinute = (endTime % 1) * 60;

                const timeStartStr = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
                const timeEndStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
                
                sessionsHTML += `
                    <div class="session-block">
                        <div class="session-time">${timeStartStr} - ${timeEndStr}</div>
                        <div class="session-content">
                            <span class="subject-name">${session.subject} (${session.duration} giờ)</span>
                            <div class="subject-details">${session.details}</div>
                        </div>
                    </div>
                `;
                
                // Giả định có khoảng nghỉ 0.5 giờ (30 phút) giữa các buổi học
                currentTime = endTime + 0.5; 
            });
            
        } else {
            // Trường hợp ngày đó không có buổi học nào
            sessionsHTML = `
                <div class="session-block-container">
                    <div class="session-block">
                        <div class="session-content">
                            <span class="subject-name">Nghỉ ngơi/Tự do</span>
                            <div class="subject-details">Không có lịch học cố định. Bạn có thể xem lại bài cũ hoặc thư giãn.</div>
                        </div>
                    </div>
                </div>
            `;
        }

        calendarHTML += `
            <div class="day-schedule-entry">
                <div class="day-header">
                    <h3>${dayEntry.day}</h3>
                </div>
                <div class="session-block-container">
                    ${sessionsHTML}
                </div>
            </div>
        `;
    });

    displayContainer.innerHTML = calendarHTML;
});
// Front-end/script.js (Phiên bản ĐÃ THÊM LOGIC LOADING ỔN ĐỊNH)

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('study-form');
    const subjectCheckboxes = document.querySelectorAll('.subject-grid input[type="checkbox"]'); 
    const levelInputsContainer = document.getElementById('levelInputs');
    const themeButton = document.getElementById('theme-toggle'); 

    let currentSubjects = [];

    // --- LOGIC DARK MODE ---
    function saveThemeState() {
        const isDarkMode = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
    function toggleDarkMode() {
        document.body.classList.toggle('dark'); 
        saveThemeState();
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    }
    if (themeButton) {
        themeButton.addEventListener('click', toggleDarkMode);
    }
    
    // --- Hàm render các ô input học lực ---
    function renderLevelInputs() {
        // ... (Logic render giữ nguyên)
        const newSubjects = [];
        subjectCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                newSubjects.push(checkbox.value);
            }
        });

        currentSubjects.forEach(subject => {
            if (!newSubjects.includes(subject)) {
                const wrapper = document.querySelector(`.level-input-wrapper[data-subject="${subject}"]`);
                if (wrapper) {
                    wrapper.classList.remove('visible');
                    wrapper.classList.add('hidden');
                    setTimeout(() => {
                        if (wrapper.parentNode) {
                            wrapper.parentNode.removeChild(wrapper);
                        }
                    }, 400); 
                }
            }
        });

        newSubjects.forEach(subject => {
            if (!currentSubjects.includes(subject)) {
                if (document.querySelector(`.level-input-wrapper[data-subject="${subject}"]`)) return;

                const subjectLabel = document.createElement('label');
                subjectLabel.className = 'level-label';
                subjectLabel.textContent = `${subject} (1–10):`;
                
                const subjectInput = document.createElement('input');
                subjectInput.type = 'number';
                subjectInput.name = `level_${subject}`;
                subjectInput.required = true;
                subjectInput.min = '1';
                subjectInput.max = '10';
                subjectInput.step = '0.01';
                subjectInput.placeholder = 'VD: 8.5';
                const inputWrapper = document.createElement('div');
                inputWrapper.className = 'level-input-wrapper hidden'; 
                inputWrapper.setAttribute('data-subject', subject); 
                
                inputWrapper.appendChild(subjectLabel);
                inputWrapper.appendChild(subjectInput);
                
                levelInputsContainer.appendChild(inputWrapper);
                
                setTimeout(() => {
                    inputWrapper.classList.remove('hidden');
                    inputWrapper.classList.add('visible');
                }, 10); 
            }
        });
        
        currentSubjects = newSubjects;
    }

    subjectCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', renderLevelInputs);
        checkbox.classList.add('subject-checkbox'); 
    });
    
    renderLevelInputs();


    // --- Logic Gửi Form (Kèm Loading) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formElement = document.getElementById('study-form');
        const submitButton = formElement.querySelector('.submit-btn');
        const loadingSpinner = document.getElementById('loading-spinner'); 
        
        // 1. Thu thập và kiểm tra dữ liệu
        // ... (Logic thu thập và kiểm tra dữ liệu, giữ nguyên)
        const data = {};
        data.goal = document.getElementById('goal').value;
        data.freeTime = document.getElementById('freeTime').value;
        data.weakPoints = document.getElementById('weakPoints').value;
        data.days = parseInt(document.getElementById('days').value);
        
        data.subjects = [];
        subjectCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                data.subjects.push(checkbox.value);
            }
        });
        if (data.subjects.length === 0) {
            alert('Vui lòng chọn ít nhất một môn học.');
            return;
        }
        if (!data.freeTime || isNaN(parseFloat(data.freeTime)) || parseFloat(data.freeTime) <= 0) {
            alert('Vui lòng nhập Thời gian rảnh hợp lệ.');
            return;
        }

        data.levels = {};
        const levelInputs = levelInputsContainer.querySelectorAll('input[type="number"]');
        let isValidLevels = true;
        levelInputs.forEach(input => {
            const subjectName = input.name.split('_')[1]; 
            const levelValue = parseFloat(input.value);
            if (isNaN(levelValue) || levelValue < 1 || levelValue > 10) {
                alert(`Vui lòng nhập học lực hợp lệ (1-10) cho môn ${subjectName}.`);
                input.focus();
                isValidLevels = false;
            }
            data.levels[subjectName] = levelValue;
        });

        if (!isValidLevels) {
            return; 
        }

        console.log("Dữ liệu gửi đi:", data); 

        // 2. 🚨 HIỂN THỊ LOADING
        submitButton.disabled = true; 
        formElement.style.opacity = '0.5'; 
        loadingSpinner.style.display = 'block'; 

        // 3. Gửi dữ liệu đến backend
        try {
            console.log("Bắt đầu gọi API: /generate-schedule");
            const response = await fetch('/generate-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            
            // 4. 🚨 ẨN LOADING KHI CÓ PHẢN HỒI (Trong try block)
            submitButton.disabled = false;
            formElement.style.opacity = '1';
            loadingSpinner.style.display = 'none';

            if (!response.ok) {
                // ... (Logic xử lý lỗi)
                const errorResult = await response.json().catch(() => ({ message: 'Phản hồi không phải JSON.' }));
                console.error('Lỗi từ Backend:', errorResult);
                alert(`Lỗi ${response.status}: ${errorResult.message || 'Lỗi không xác định từ máy chủ.'}`);
                return;
            }
            
            const result = await response.json();
            localStorage.setItem('studySchedule', JSON.stringify(result));
            window.location.href = 'result.html';
           
        } catch (error) {
            console.error('Lỗi mạng hoặc server:', error);
            alert('Không thể kết nối đến máy chủ backend (http://localhost:3000). Vui lòng kiểm tra server đã chạy chưa.');
            
            // 5. 🚨 ẨN LOADING VÀ KÍCH HOẠT LẠI FORM KHI CÓ LỖI MẠNG (Trong catch block)
            submitButton.disabled = false;
            formElement.style.opacity = '1';
            loadingSpinner.style.display = 'none';
        }
    });

});

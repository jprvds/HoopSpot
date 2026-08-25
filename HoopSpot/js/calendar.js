// ============================================
// CourtHub - Calendar JavaScript
// Functional calendar with real-time availability
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDate = null;
    let monthlyData = {};

    const calendarDates = document.getElementById('calendarDates');
    const calendarMonthYear = document.getElementById('calendarMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const dayDetailPanel = document.getElementById('dayDetailPanel');
    const selectedDateTitle = document.getElementById('selectedDateTitle');
    const dayDetailContent = document.getElementById('dayDetailContent');

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Initialize
    renderCalendar();
    loadCourts();

    // Event Listeners
    prevMonthBtn.addEventListener('click', function () {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', function () {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    // Render Calendar
    function renderCalendar() {
        calendarMonthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        calendarDates.innerHTML = '';

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const today = new Date();

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-date', 'empty');
            calendarDates.appendChild(emptyCell);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            dateCell.classList.add('calendar-date');
            dateCell.textContent = day;

            const cellDate = new Date(currentYear, currentMonth, day);
            const dateStr = formatDate(currentYear, currentMonth + 1, day);

            // Check if past
            if (cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                dateCell.classList.add('past');
            } else {
                dateCell.addEventListener('click', function () {
                    // Remove previous selection
                    document.querySelectorAll('.calendar-date.selected').forEach(el => {
                        el.classList.remove('selected');
                    });
                    dateCell.classList.add('selected');
                    selectedDate = dateStr;
                    loadDayDetails(dateStr, day);
                });
            }

            // Check if today
            if (
                cellDate.getDate() === today.getDate() &&
                cellDate.getMonth() === today.getMonth() &&
                cellDate.getFullYear() === today.getFullYear()
            ) {
                dateCell.classList.add('today');
            }

            calendarDates.appendChild(dateCell);
        }

        // Load monthly booking data
        loadMonthlyData();
    }

    // Load monthly availability data
    function loadMonthlyData() {
        fetch(`api_monthly_bookings.php?month=${currentMonth + 1}&year=${currentYear}`)
            .then(response => response.json())
            .then(data => {
                monthlyData = data.availability || {};
                updateCalendarDots();
            })
            .catch(error => {
                console.error('Error loading monthly data:', error);
            });
    }

    // Update availability dots on calendar
    function updateCalendarDots() {
        const dateCells = calendarDates.querySelectorAll('.calendar-date:not(.empty):not(.past)');
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();

        dateCells.forEach(cell => {
            const day = parseInt(cell.textContent);
            const dateStr = formatDate(currentYear, currentMonth + 1, day);

            // Remove existing dots
            const existingDot = cell.querySelector('.availability-dot');
            if (existingDot) existingDot.remove();

            const dot = document.createElement('span');
            dot.classList.add('availability-dot');

            if (monthlyData[dateStr]) {
                const info = monthlyData[dateStr];
                const percentage = info.booked_slots / info.total_slots;

                if (percentage >= 0.8) {
                    dot.classList.add('full');
                } else if (percentage > 0) {
                    dot.classList.add('partial');
                } else {
                    dot.classList.add('available');
                }
            } else {
                dot.classList.add('available');
            }

            cell.appendChild(dot);
        });
    }

    // Load day details
    function loadDayDetails(dateStr, day) {
        selectedDateTitle.textContent = `${monthNames[currentMonth]} ${day}, ${currentYear}`;
        dayDetailContent.innerHTML = '<div class="loading-spinner small"><i class="fas fa-basketball-ball fa-spin"></i></div>';

        fetch(`api_bookings.php?date=${dateStr}`)
            .then(response => response.json())
            .then(bookings => {
                displayDayDetails(bookings, dateStr);
            })
            .catch(error => {
                dayDetailContent.innerHTML = '<p class="empty-state">Error loading booking data. Please try again.</p>';
                console.error('Error:', error);
            });
    }

    // Display day details with court-wise breakdown
    function displayDayDetails(bookings, dateStr) {
        // Get courts data
        fetch('api_courts.php')
            .then(response => response.json())
            .then(courts => {
                let html = '';

                courts.forEach(court => {
                    const courtBookings = bookings.filter(b => b.court_id == court.id);

                    html += `<div class="court-availability">`;
                    html += `<h4><i class="fas fa-basketball-ball"></i> ${court.name}</h4>`;

                    if (courtBookings.length > 0) {
                        courtBookings.forEach(booking => {
                            const startFormatted = formatTime(booking.start_time);
                            const endFormatted = formatTime(booking.end_time);
                            html += `<div class="time-slot booked">
                                <i class="fas fa-lock"></i>
                                <span>${startFormatted} - ${endFormatted}</span>
                                <span style="margin-left:auto; opacity:0.7; font-size:0.75rem;">Booked by ${booking.booker_name}</span>
                            </div>`;
                        });
                    } else {
                        html += `<div class="time-slot available-slot">
                            <i class="fas fa-check-circle"></i>
                            <span>All time slots available (6:00 AM - 8:00 PM)</span>
                        </div>`;
                    }

                    html += `</div>`;
                });

                // Add book button
                html += `<a href="booking.html?date=${dateStr}" class="btn btn-primary btn-block" style="margin-top:15px;">
                    <i class="fas fa-calendar-plus"></i> Book This Date
                </a>`;

                dayDetailContent.innerHTML = html;
            })
            .catch(error => {
                dayDetailContent.innerHTML = '<p class="empty-state">Error loading court data.</p>';
            });
    }

    // Load courts for the courts grid
    function loadCourts() {
        const courtsGrid = document.getElementById('courtsGrid');
        if (!courtsGrid) return;

        fetch('api_courts.php')
            .then(response => response.json())
            .then(courts => {
                let html = '';
                const icons = ['fas fa-trophy', 'fas fa-sun', 'fas fa-dumbbell'];

                courts.forEach((court, index) => {
                    html += `
                        <div class="court-card">
                            <div class="court-card-image">
                                <i class="${icons[index] || 'fas fa-basketball-ball'}"></i>
                            </div>
                            <div class="court-card-body">
                                <h3>${court.name}</h3>
                                <p class="court-location">
                                    <i class="fas fa-map-marker-alt"></i> ${court.location}
                                </p>
                                <p class="court-description">${court.description}</p>
                                <div class="court-card-footer">
                                    <div class="court-price">
                                        ₱${parseFloat(court.price_per_hour).toFixed(0)} <span>/hour</span>
                                    </div>
                                    <a href="booking.html?court=${court.id}" class="btn btn-primary btn-sm">
                                        <i class="fas fa-calendar-check"></i> Book
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                });

                courtsGrid.innerHTML = html;
            })
            .catch(error => {
                courtsGrid.innerHTML = '<p class="empty-state">Unable to load courts. Please refresh the page.</p>';
                console.error('Error loading courts:', error);
            });
    }

    // Utility: Format date as YYYY-MM-DD
    function formatDate(year, month, day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Utility: Format time for display
    function formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return `${displayHour}:${minutes} ${ampm}`;
    }
});

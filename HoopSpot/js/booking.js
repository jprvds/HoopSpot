document.addEventListener("DOMContentLoaded", function () {
    let courtsData = [];
    let selectedCourtName = "";
 
    const form = document.getElementById("bookingForm");
    const selectedCourtInput = document.getElementById("selectedCourt");
    const courtError = document.getElementById("courtError");
 
    const bookingDate = document.getElementById("bookingDate");
    const dateError = document.getElementById("dateError");
    const startTime = document.getElementById("startTime");
    const startTimeError = document.getElementById("startTimeError");
    const endTime = document.getElementById("endTime");
    const endTimeError = document.getElementById("endTimeError");
 
    const bookerName = document.getElementById("bookerName");
    const nameError = document.getElementById("nameError");
    const bookerEmail = document.getElementById("bookerEmail");
    const emailError = document.getElementById("emailError");
    const bookerPhone = document.getElementById("bookerPhone");
    const phoneError = document.getElementById("phoneError");
 
    const submitBtn = document.getElementById("submitBtn");
    const summaryContent = document.getElementById("summaryContent");
 
    const timeSlotsDisplay = document.getElementById("timeSlotsDisplay");
    const bookedSlotsList = document.getElementById("bookedSlotsList");
 
    const successModal = document.getElementById("successModal");
    const modalMessage = document.getElementById("modalMessage");
    const modalBookingId = document.getElementById("modalBookingId");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
 
    const cancelBookingId = document.getElementById("cancelBookingId");
    const cancelEmail = document.getElementById("cancelEmail");
    const cancelBtn = document.getElementById("cancelBtn");
    const cancelResult = document.getElementById("cancelResult");
 
    // Prevent picking a past date
    const today = new Date().toISOString().split("T")[0];
    if (bookingDate) bookingDate.min = today;
 
    init();
 
    function init() {
        loadCourts();
 
        if (bookingDate) bookingDate.addEventListener("change", onDateOrCourtChange);
        if (startTime) startTime.addEventListener("change", updateSummary);
        if (endTime) endTime.addEventListener("change", updateSummary);
        [bookerName, bookerEmail, bookerPhone].forEach(el => {
            if (el) el.addEventListener("input", updateSummary);
        });
 
        if (form) form.addEventListener("submit", handleSubmit);
        if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
        if (cancelBtn) cancelBtn.addEventListener("click", handleCancelBooking);
 
        // Pre-fill date from ?date= URL param, if present
        const params = new URLSearchParams(window.location.search);
        const dateParam = params.get("date");
        if (dateParam && bookingDate) {
            bookingDate.value = dateParam;
            onDateOrCourtChange();
        }
    }
 
    // ---------- Load courts ----------
    function loadCourts() {
        const courtSelection = document.getElementById("courtSelection");
 
        fetch("api_courts.php")
            .then(response => {
                if (!response.ok) throw new Error("Failed to connect to API");
                return response.json();
            })
            .then(courts => {
                courtsData = courts;
                courtSelection.innerHTML = "";
 
                if (courts.length === 0) {
                    courtSelection.innerHTML = `<p>No courts found in the database.</p>`;
                    return;
                }
 
                courts.forEach(court => {
                    const courtOption = document.createElement("div");
                    courtOption.className = "court-option";
                    courtOption.innerHTML = `
                        <div class="court-icon">
                            <i class="fas fa-basketball-ball"></i>
                        </div>
                        <div class="court-info">
                            <h4>${court.name}</h4>
                            <p>${court.description || "Basketball Court"}</p>
                        </div>
                    `;
 
                    courtOption.addEventListener("click", function () {
                        document.querySelectorAll(".court-option").forEach(option => {
                            option.classList.remove("selected");
                        });
                        courtOption.classList.add("selected");
                        selectedCourtInput.value = court.id;
                        selectedCourtName = court.name;
                        clearError(selectedCourtInput, courtError);
                        onDateOrCourtChange();
                        updateSummary();
                    });
 
                    courtSelection.appendChild(courtOption);
                });
 
                // Pre-select court from ?court= URL param, if present
                const params = new URLSearchParams(window.location.search);
                const courtParam = params.get("court");
                if (courtParam) {
                    const match = courts.find(c => String(c.id) === String(courtParam));
                    if (match) {
                        const options = courtSelection.querySelectorAll(".court-option");
                        const idx = courts.indexOf(match);
                        if (options[idx]) options[idx].click();
                    }
                }
            })
            .catch(error => {
                console.error("Error loading courts:", error);
                courtSelection.innerHTML = `<p style="color: red;">Unable to load courts.</p>`;
            });
    }
 
    // ---------- Show booked slots for the chosen court/date ----------
    function onDateOrCourtChange() {
        const courtId = selectedCourtInput.value;
        const date = bookingDate.value;
 
        if (!courtId || !date) {
            if (timeSlotsDisplay) timeSlotsDisplay.style.display = "none";
            return;
        }
 
        fetch(`api_bookings.php?date=${encodeURIComponent(date)}&court_id=${encodeURIComponent(courtId)}`)
            .then(response => response.json())
            .then(bookings => {
                if (!timeSlotsDisplay || !bookedSlotsList) return;
 
                if (!Array.isArray(bookings) || bookings.length === 0) {
                    bookedSlotsList.innerHTML = `<p>No bookings yet for this date — all slots open.</p>`;
                } else {
                    bookedSlotsList.innerHTML = bookings.map(b =>
                        `<div class="time-slot booked">
                            <i class="fas fa-lock"></i>
                            <span>${formatTime(b.start_time)} - ${formatTime(b.end_time)}</span>
                        </div>`
                    ).join("");
                }
                timeSlotsDisplay.style.display = "block";
            })
            .catch(error => {
                console.error("Error loading bookings for date:", error);
            });
 
        updateSummary();
    }
 
    // ---------- Live summary card ----------
    function updateSummary() {
        const hasCourt = !!selectedCourtInput.value;
        const date = bookingDate.value;
        const start = startTime.value;
        const end = endTime.value;
        const name = bookerName.value.trim();
 
        if (!hasCourt && !date && !start && !end && !name) {
            summaryContent.innerHTML = `
                <div class="summary-empty">
                    <i class="fas fa-basketball-ball"></i>
                    <p>Fill in the form to see your booking summary here</p>
                </div>`;
            return;
        }
 
        summaryContent.innerHTML = `
            <div class="summary-row"><strong>Court:</strong> ${selectedCourtName || "—"}</div>
            <div class="summary-row"><strong>Date:</strong> ${date || "—"}</div>
            <div class="summary-row"><strong>Time:</strong> ${start ? formatTime(start) : "—"} to ${end ? formatTime(end) : "—"}</div>
            <div class="summary-row"><strong>Name:</strong> ${name || "—"}</div>
        `;
    }
 
    // ---------- Validation ----------
    function showError(input, errorEl, message) {
        if (errorEl) errorEl.textContent = message;
        if (input) input.classList.add("invalid");
    }
 
    function clearError(input, errorEl) {
        if (errorEl) errorEl.textContent = "";
        if (input) input.classList.remove("invalid");
    }
 
    function validateForm() {
        let valid = true;
 
        clearError(selectedCourtInput, courtError);
        clearError(bookingDate, dateError);
        clearError(startTime, startTimeError);
        clearError(endTime, endTimeError);
        clearError(bookerName, nameError);
        clearError(bookerEmail, emailError);
        clearError(bookerPhone, phoneError);
 
        if (!selectedCourtInput.value) {
            showError(selectedCourtInput, courtError, "Please select a court.");
            valid = false;
        }
        if (!bookingDate.value) {
            showError(bookingDate, dateError, "Please choose a date.");
            valid = false;
        } else if (bookingDate.value < today) {
            showError(bookingDate, dateError, "Date cannot be in the past.");
            valid = false;
        }
        if (!startTime.value) {
            showError(startTime, startTimeError, "Please choose a start time.");
            valid = false;
        }
        if (!endTime.value) {
            showError(endTime, endTimeError, "Please choose an end time.");
            valid = false;
        } else if (startTime.value && endTime.value <= startTime.value) {
            showError(endTime, endTimeError, "End time must be after start time.");
            valid = false;
        }
        if (!bookerName.value.trim()) {
            showError(bookerName, nameError, "Please enter your name.");
            valid = false;
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!bookerEmail.value.trim() || !emailPattern.test(bookerEmail.value.trim())) {
            showError(bookerEmail, emailError, "Please enter a valid email address.");
            valid = false;
        }
        if (!bookerPhone.value.trim()) {
            showError(bookerPhone, phoneError, "Please enter your phone number.");
            valid = false;
        }
 
        return valid;
    }
 
    // ---------- Submit booking ----------
    function handleSubmit(e) {
        e.preventDefault();
 
        if (!validateForm()) return;
 
        const payload = {
            court_id: selectedCourtInput.value,
            booker_name: bookerName.value.trim(),
            booker_email: bookerEmail.value.trim(),
            booker_phone: bookerPhone.value.trim(),
            booking_date: bookingDate.value,
            start_time: startTime.value,
            end_time: endTime.value
        };
 
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Booking...`;
 
        fetch("api_submit_booking.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    modalMessage.textContent = result.message || "Your court has been reserved successfully.";
                    modalBookingId.textContent = result.booking_id;
                    successModal.classList.add("active");
                    form.reset();
                    selectedCourtInput.value = "";
                    selectedCourtName = "";
                    document.querySelectorAll(".court-option").forEach(o => o.classList.remove("selected"));
                    if (timeSlotsDisplay) timeSlotsDisplay.style.display = "none";
                    updateSummary();
                } else {
                    // Server-side conflict or validation error
                    showError(null, dateError, result.error || "Unable to complete booking.");
                    alert(result.error || "Unable to complete booking.");
                }
            })
            .catch(error => {
                console.error("Error submitting booking:", error);
                alert("Something went wrong submitting your booking. Please try again.");
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="fas fa-check-circle"></i> Confirm Booking`;
            });
    }
 
    function closeModal() {
        successModal.classList.remove("active");
    }
 
    // ---------- Cancel booking ----------
    function handleCancelBooking() {
        const id = cancelBookingId.value.trim();
        const email = cancelEmail.value.trim();
 
        cancelResult.textContent = "";
        cancelResult.className = "cancel-result";
 
        if (!id || !email) {
            cancelResult.textContent = "Please enter both booking ID and email.";
            cancelResult.classList.add("error");
            return;
        }
 
        cancelBtn.disabled = true;
 
        fetch("api_cancel_booking.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking_id: id, booker_email: email })
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    cancelResult.textContent = result.message || "Booking cancelled successfully.";
                    cancelResult.classList.add("success");
                    cancelBookingId.value = "";
                    cancelEmail.value = "";
                } else {
                    cancelResult.textContent = result.error || "Unable to cancel booking.";
                    cancelResult.classList.add("error");
                }
            })
            .catch(error => {
                console.error("Error cancelling booking:", error);
                cancelResult.textContent = "Something went wrong. Please try again.";
                cancelResult.classList.add("error");
            })
            .finally(() => {
                cancelBtn.disabled = false;
            });
    }
 
    // ---------- Utility ----------
    function formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(":");
        const h = parseInt(hours);
        const ampm = h >= 12 ? "PM" : "AM";
        const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return `${displayHour}:${minutes} ${ampm}`;
    }
});
<?php
// API endpoint to get booking counts for an entire month (for calendar view)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

$month = isset($_GET['month']) ? intval($_GET['month']) : intval(date('m'));
$year = isset($_GET['year']) ? intval($_GET['year']) : intval(date('Y'));

// Get the first and last day of the month
$first_day = sprintf('%04d-%02d-01', $year, $month);
$last_day = date('Y-m-t', strtotime($first_day));

$stmt = $conn->prepare("SELECT booking_date, court_id, start_time, end_time FROM bookings WHERE booking_date BETWEEN ? AND ? AND status = 'confirmed' ORDER BY booking_date, start_time");
$stmt->bind_param("ss", $first_day, $last_day);
$stmt->execute();
$result = $stmt->get_result();

$bookings_by_date = [];
while ($row = $result->fetch_assoc()) {
    $date = $row['booking_date'];
    if (!isset($bookings_by_date[$date])) {
        $bookings_by_date[$date] = [];
    }
    $bookings_by_date[$date][] = $row;
}

// Calculate availability for each date
// Total possible slots: 3 courts × 14 hours (6AM-8PM) = 42 slots per day
$total_slots_per_day = 42;
$availability = [];

foreach ($bookings_by_date as $date => $bookings) {
    $booked_hours = 0;
    foreach ($bookings as $booking) {
        $start = intval(substr($booking['start_time'], 0, 2));
        $end = intval(substr($booking['end_time'], 0, 2));
        $booked_hours += ($end - $start);
    }
    $availability[$date] = [
        'booked_slots' => $booked_hours,
        'total_slots' => $total_slots_per_day,
        'booking_count' => count($bookings)
    ];
}

echo json_encode([
    'month' => $month,
    'year' => $year,
    'availability' => $availability
]);

$stmt->close();
$conn->close();
?>

<?php
// API endpoint to get bookings for a specific date and court
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
$court_id = isset($_GET['court_id']) ? intval($_GET['court_id']) : 0;

// Validate date format
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    echo json_encode(['error' => 'Invalid date format']);
    exit;
}

if ($court_id > 0) {
    // Get bookings for specific court and date
    $stmt = $conn->prepare("SELECT * FROM bookings WHERE court_id = ? AND booking_date = ? AND status = 'confirmed' ORDER BY start_time ASC");
    $stmt->bind_param("is", $court_id, $date);
} else {
    // Get all bookings for a date
    $stmt = $conn->prepare("SELECT b.*, c.name as court_name FROM bookings b JOIN courts c ON b.court_id = c.id WHERE b.booking_date = ? AND b.status = 'confirmed' ORDER BY b.start_time ASC");
    $stmt->bind_param("s", $date);
}

$stmt->execute();
$result = $stmt->get_result();

$bookings = [];
while ($row = $result->fetch_assoc()) {
    $bookings[] = $row;
}

echo json_encode($bookings);

$stmt->close();
$conn->close();
?>

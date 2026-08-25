<?php

header('Content-Type: application/json');

require_once 'config.php';

// Get the data from JavaScript
$data = json_decode(file_get_contents('php://input'), true);

// Check if data was received
if (!$data) {
    echo json_encode([
        'success' => false,
        'error' => 'No booking data received.'
    ]);
    exit;
}

// Get the values
$court_id = $data['court_id'] ?? '';
$booker_name = $data['booker_name'] ?? '';
$booker_email = $data['booker_email'] ?? '';
$booker_phone = $data['booker_phone'] ?? '';
$booking_date = $data['booking_date'] ?? '';
$start_time = $data['start_time'] ?? '';
$end_time = $data['end_time'] ?? '';

// Check required fields
if (
    empty($court_id) ||
    empty($booker_name) ||
    empty($booker_email) ||
    empty($booker_phone) ||
    empty($booking_date) ||
    empty($start_time) ||
    empty($end_time)
) {
    echo json_encode([
        'success' => false,
        'error' => 'Please complete all required fields.'
    ]);
    exit;
}

// Check if the time is already booked
$check_sql = "
    SELECT id 
    FROM bookings
    WHERE court_id = ?
    AND booking_date = ?
    AND status != 'cancelled'
    AND start_time < ?
    AND end_time > ?
";

$check_stmt = $conn->prepare($check_sql);

if (!$check_stmt) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $conn->error
    ]);
    exit;
}

$check_stmt->bind_param(
    "isss",
    $court_id,
    $booking_date,
    $end_time,
    $start_time
);

$check_stmt->execute();

$check_result = $check_stmt->get_result();

if ($check_result->num_rows > 0) {
    echo json_encode([
        'success' => false,
        'error' => 'This court is already booked for the selected time.'
    ]);
    $check_stmt->close();
    $conn->close();
    exit;
}

$check_stmt->close();

// Insert the booking
$sql = "
    INSERT INTO bookings
    (
        court_id,
        booker_name,
        booker_email,
        booker_phone,
        booking_date,
        start_time,
        end_time,
        status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $conn->error
    ]);
    exit;
}

$stmt->bind_param(
    "issssss",
    $court_id,
    $booker_name,
    $booker_email,
    $booker_phone,
    $booking_date,
    $start_time,
    $end_time
);

// Save the booking
if ($stmt->execute()) {

    $booking_id = $stmt->insert_id;

    echo json_encode([
        'success' => true,
        'message' => 'Booking saved successfully!',
        'booking_id' => $booking_id
    ]);

} else {

    echo json_encode([
        'success' => false,
        'error' => 'MySQL Error: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();

?>
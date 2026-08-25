<?php
// API endpoint to cancel a booking
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['booking_id']) || empty($data['booker_email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Booking ID and email are required']);
    exit;
}

$booking_id = intval($data['booking_id']);
$booker_email = trim($data['booker_email']);

// Verify ownership and cancel
$stmt = $conn->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ? AND booker_email = ? AND status = 'confirmed'");
$stmt->bind_param("is", $booking_id, $booker_email);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(['success' => true, 'message' => 'Booking cancelled successfully']);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Booking not found or already cancelled. Please check your booking ID and email.']);
}

$stmt->close();
$conn->close();
?>

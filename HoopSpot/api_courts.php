<?php
// API endpoint to get all courts
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

$sql = "SELECT * FROM courts ORDER BY id ASC";
$result = $conn->query($sql);

$courts = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $courts[] = $row;
    }
}

echo json_encode($courts);

$conn->close();
?>

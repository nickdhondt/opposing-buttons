<?php

date_default_timezone_set("America/New_York");

$timestamp = $_GET["lasttime"];

$conn = new mysqli("localhost", "root", "", "dd_test", 3306);

if($conn->connect_error) {
    die("Fout: " . $conn->connect_errno . $conn->connect_error);
}

function get_game_data($timestamp) {
    global $conn;
    $rows = array();

    $result = $conn->query("SELECT id, type, value, timestamp FROM test WHERE timestamp > '$timestamp'");

    while ($record = $result->fetch_assoc()) {
        $rows[] = $record;
    }

    return $rows;
}

    $records = get_game_data($timestamp);

    if (!empty($records)) {
        echo json_encode($records);

        $timestamp = microtime(true);

        flush();
    }

$conn->close();
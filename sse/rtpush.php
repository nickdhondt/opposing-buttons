<?php

date_default_timezone_set("America/New_York");
header("Content-Type: text/event-stream\n\n");
header("Cache-Control: no-cache");

$timestamp = 0;

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


ob_implicit_flush(true);
ob_end_flush();

$first_loop = true;

$loops = 0;

while ($loops < 100) {

    $records = get_game_data($timestamp);

    if (!empty($records)) {
        $dd_game_data = json_encode($records);

        echo "event: ddGameData\n\n";
        echo "retry: 3000\n";
        echo "data: " . $dd_game_data . "\n\n";

        $timestamp = microtime(true);

        flush();
    }

    $loops++;

    if ($first_loop === true) {
        $first_loop = false;
    } else {
        usleep(250000);
    }
}

//$conn->close();
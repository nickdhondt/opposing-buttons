<?php

if (isset($_POST["type"])) {
    $type = $_POST["type"];
    $types = array(0, 1);

    $conn = new mysqli("localhost", "root", "", "dd_test", 3306);

    if($conn->connect_error) {
        die("Fout: " . $conn->connect_errno . $conn->connect_error);
    }

    if (in_array($type, $types)) {
        $prev = 0;
        $sql_prev_value = $conn->query("SELECT value FROM test WHERE type='$type'");

        while($prev_values = $sql_prev_value->fetch_assoc()) $prev = $prev_values["value"];
        $next = $prev + 1;
        $timestamp = microtime(true);

        $sql = $conn->query("UPDATE test SET value='$next', timestamp='$timestamp' WHERE type=$type");

        echo $conn->affected_rows;
    }
} else {
    echo "no data received";
}
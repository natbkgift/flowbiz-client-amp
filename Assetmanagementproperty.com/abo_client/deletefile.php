<?php
 include_once("config.php"); $conn = null; if (!tryConnect()) { die(); } $table = @mysqli_real_escape_string($conn, $_GET["table"]); $primary = @mysqli_real_escape_string($conn, $_GET["primary"]); $primaryValue = @mysqli_real_escape_string($conn, $_GET["primaryValue"]); $colname = @mysqli_real_escape_string($conn, $_GET["colname"]); loadConfig(); loadAllCfg(); if (@$cfgDefault["chkDeleteForReal"]) { $sql = "SELECT $colname FROM $table WHERE $primary='$primaryValue'"; $file = $db[$table][$colname]["Upload_Dir"].'/'.zbSQL($sql); if (file_exists($file)) { unlink($file); } else { ?><script> $.notify("File does not exist!", "error"); </script><?php
 } } $sql = "UPDATE $table SET $colname='' WHERE $primary='$primaryValue'"; @zbSQL($sql); ?><script>
$.notify("Picture removed!", "success"); 
document.getElementById('img_<?=$colname?>').src = '<?=EMPTY_PNG?>';
</script>

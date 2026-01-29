<?php  include_once("config.php"); $localhost = $_GET["localhost"]; $username = $_GET["username"]; $password = $_GET["password"]; $database = $_GET["database"]; $save = $_GET["save"]; $load = $_GET["load"]; loadCfgConnection(); if ($load == 'true') { file_get_contents('../client/conf.connection.json', $json); $cfg = json_decode($json); echo "todo - print the loading state, with values from the cfg if available"; ?><script>
    document.getElementById('localhost').value = cfgConnection["localhost"];
    document.getElementById('password').value = cfgConnection["password"];
  </script><?php
 exit; } if ($save=='true') { $cfg["localhost"] = $localhost; $cfg["username"] = $username; $cfg["password"] = $password; $cfg["database"] = $database; $json = json_encode($cfg); file_put_contents('../client/conf.connection.json', $json); ?><div class="alert alert-success alert-dismissible"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button><h5><i class="icon fas fa-check"></i> DB Configuration Saved!</h5>
    You can configure the next step now
  </div><?php
 exit; } $conn = @new mysqli($localhost, $username, $password, $database); if ($conn->connect_errno) { ?><div class="alert alert-danger alert-dismissible"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button><h5><i class="icon fas fa-check"></i> DB connection error</h5>
  Error response: <?php echo $conn->connect_error?></div><?php
 exit(); } ?><div class="alert alert-success alert-dismissible"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button><h5><i class="icon fas fa-check"></i> DB connected succesfully!</h5>
  You can save your configuration now!
</div>

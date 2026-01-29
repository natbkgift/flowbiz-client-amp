<?php
 session_start(); include_once("config.php"); $conn = null; if (!tryConnect()) { die(); } $name = @mysqli_real_escape_string($conn, $_GET["name"]); $primary = @mysqli_real_escape_string($conn, $_GET["primary"]); $primaryValue = @mysqli_real_escape_string($conn, $_GET["primaryValue"]); $page = @mysqli_real_escape_string($conn, $_GET["page"]); loadConfig(); loadAllCfg(); if (isset($_SESSION['user'])) { } else { if ($cfgCustom["loginType"] != "No Password" && $cfgCustom["loginType"] != "") { header("Location: login.php"); die(); } } if (@$cfgTables["adminlevel_$name"] > 0) { $t = explode('/', $cfgCustom["tableLoginPwd"]); if (isset($t[3])) { $level = 0 + zbSQL("SELECT `{$t[3]}` FROM {$t[0]} WHERE {$t[1]}='{$_SESSION['user']}'"); if ($cfgTables["adminlevel_$name"] > $level) exit; } } ?><br><style>
  .hoverPointer:hover {
    cursor:pointer;
  }
</style><div class="container-fluid"><div id='errorReturn'></div><div class="row"><div class="col-md-12"><div class="card"><div class="card-header"><h3 class="card-title"><i class="nav-icon <?php echo $cfgTables["icon$name"]?>"></i>&nbsp;&nbsp;<a onclick="loadTable('<?php echo $name?>')" href='#'><?php echo $cfgTables["description-$name"]?></a></h3></div><div class="card-body"><?php
 $names = []; $types = []; $k = array_keys($db["$name"]); for($i=0; $i<count($db["$name"]); $i++) { $names[$i] = $k[$i]; $types[$i] = $db["$name"][$k[$i]]["MySQL_Type"]; } $l = count($names); for($i=0; $i<$l-1; ++$i) { for($j=$i+1; $j < $l; ++$j) { if (intval($db[$name][$names[$i]]["Sort_Order"]) > intval($db[$name][$names[$j]]["Sort_Order"])) { $aux = $names[$i]; $names[$i] = $names[$j]; $names[$j] = $aux; $aux = $types[$i]; $types[$i] = $types[$j]; $types[$j] = $aux; } } } ?><table class='table table-sm'><thead><th>Field</th><th>Value</th><th></th></thead><?php
$sql = "SELECT * FROM $name WHERE $primary = '$primaryValue'"; $result = $conn->query($sql); $row = mysqli_fetch_array($result); $saveAll = ""; for($i=0; $i<count($names);++$i) { $status = $db[$name][$names[$i]]["Status"]; if ($status == "Hidden") { continue; } if ($names[$i] == @$cfgTables["sortField_$name"]) { continue; } if (@$cfgTables["multiuser_$name"] == $names[$i]) { continue; } $prettyName = $db[$name][$names[$i]]["Description"]; $help = $db[$name][$names[$i]]["Help"]; if (!$prettyName) $prettyName = $names[$i]; if ($help) $prettyName .= "<br><small style='color:#00c000'>$help</small>"; ?><tr><td class="align-middle"><?php echo $prettyName?></td><td class="align-middle"><?php
 if ($status == "Read Only") { echo phpDbWiz_getView($name, $names[$i], $row[$names[$i]]); } else { $saveButton = editSingleField($name, $names[$i], $types[$i], $primary, $primaryValue, $row[$names[$i]]); } ?></td><td width=5% class="align-middle"><?php  if ( ($db[$name][$names[$i]]["Edit_Mode"] != 'upload') && ($db[$name][$names[$i]]["Edit_Mode"] != 'file') && ($db[$name][$names[$i]]["Status"] != 'Read Only') ) { ?><?php
 $saveAll .= "var val=$saveButton; updateField(encodeURI('".urlencode($name)."'), encodeURI('".urlencode($primary)."'), encodeURI('".urlencode($primaryValue)."'), encodeURI('".urlencode($names[$i])."'), val, -1);"; ?><button onclick="var val=<?php echo $saveButton?>; updateField(encodeURI('<?php echo urlencode($name)?>'), encodeURI('<?php echo urlencode($primary)?>'), encodeURI('<?php echo urlencode($primaryValue)?>'), encodeURI('<?php echo urlencode($names[$i])?>'), val, -1);" alt="Save" title="Save" class="btn btn-primary"><i class="fas fa-save"></i></button><?php  } ?></td></tr><?php
} ?></table></div><button onclick="<?php echo $saveAll; if ($page != -1) echo "loadTable('$name', $page)"?>" alt="Save All" title="Save All" class="btn btn-primary"><i class="fas fa-save"></i>&nbsp;&nbsp;&nbsp;Save All
        </button></div></div></div></div><script>

var GL_colname, GL_dir;

function uploadFile(colname, dir) {
  GL_colname  = colname;
  GL_dir      = dir;
  var file = _("file"+colname).files[0];
  // alert(file.name+" | "+file.size+" | "+file.type);
  var formdata = new FormData();
  formdata.append("file"+colname, file);
  formdata.append("table", encodeURI('<?php echo urlencode($name)?>'));
  formdata.append("colname", encodeURI(colname));
  formdata.append("primary", encodeURI('<?php echo urlencode($primary)?>'));
  formdata.append("primaryValue", encodeURI('<?php echo urlencode($primaryValue)?>'));
  var ajax = new XMLHttpRequest();
  ajax.upload.addEventListener("progress", progressHandler, false);
  ajax.addEventListener("load", completeHandler, false);
  ajax.addEventListener("error", errorHandler, false);
  ajax.addEventListener("abort", abortHandler, false);
  ajax.open("POST", "upload.php?q="+Math.random());
  ajax.send(formdata);
  }

  function progressHandler(event) {
    _(GL_colname+"_loaded_n_total").innerHTML = "Uploaded " + event.loaded + " bytes of " + event.total;
    var percent = (event.loaded / event.total) * 100;
    _(GL_colname+"_progressBar").value = Math.round(percent);
    _(GL_colname+"_status").innerHTML = Math.round(percent) + "% uploaded... Please wait";
  }

  function completeHandler(event) {
    _(GL_colname+"_status").innerHTML           = event.target.responseText;
    _(GL_colname+"_progressBar").value          = 0; 
    _(GL_colname+"_loaded_n_total").innerHTML   = "";
    _(GL_colname+"_progressBar").style.display  = 'none';
    // CANNOT DO IT HERE! Don't know when upload.php has finished moving it
    document.getElementById('img_'+GL_colname).src = GL_dir + '/' + decodeURIComponent(_("file"+GL_colname).files[0]["name"]);
  }

  function errorHandler(event) {
    _(GL_colname+"_status").innerHTML = "Upload Failed";
  }

  function abortHandler(event) {
    _(GL_colname+"_status").innerHTML = "Upload Aborted";
  }

</script>
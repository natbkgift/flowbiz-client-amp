<?php
 include_once("config.php"); $conn = null; if (!tryConnect()) { die(); } $name = @mysqli_real_escape_string($conn, $_GET["table"]); $primary = @mysqli_real_escape_string($conn, $_GET["primary"]); $primaryValue = @mysqli_real_escape_string($conn, $_GET["primaryValue"]); loadConfig(); loadAllCfg(); $hasDetails = hasDetails($name); ?><br><style>

  .hoverPointer:hover {

    cursor:pointer;

  }

</style><div class="container-fluid"><div id='errorReturn'></div><div class="row"><div class="col-md-12"><div class="card"><div class="card-header"><h3 class="card-title"><i class="nav-icon <?php echo $cfgTables["icon$name"]?>"></i>&nbsp;&nbsp;<a onclick="loadTable('<?php echo $name?>')" href='#'><?php echo $cfgTables["description-$name"]?></a></h3></div><div class="card-body"><?php
 $names = []; $types = []; $sql = "SHOW COLUMNS FROM $name"; $result = $conn->query($sql); $n = 0; while($row = mysqli_fetch_array($result)){ $col = $row['Field']; $names[$n] = $col; $types[$n] = zbSQL("SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_NAME = '$name' AND COLUMN_NAME = '$col'"); $n++; } $keys = array_keys($db[$name]); ?><table class='table table-sm'><thead><th>Field</th><th>Value</th><th></th></thead><?php
 $sql = "SELECT * FROM $name WHERE $primary = '$primaryValue'"; $result = $conn->query($sql); $row = mysqli_fetch_array($result); for($i=0; $i<count($names);++$i) { $status = $db[$name][$names[$i]]["Status"]; if ($status == "Hidden") { continue; } $prettyName = $db[$name][$names[$i]]["Description"]; $help = $db[$name][$names[$i]]["Help"]; if (!$prettyName) $prettyName = $names[$i]; if ($help) $prettyName .= "<br><small style='color:#00c000'>$help</small>"; ?><tr><td class="align-middle"><?php echo $prettyName?></td><td class="align-middle"><?php
 if (($status == "Read Only") || (!$cfgTables["chkedit_".$name])) { echo phpDbWiz_getView($name, $names[$i], $row[$i]); } else { $saveButton = editSingleField($name, $names[$i], $types[$i], $primary, $primaryValue, $row[$i]); } ?></td><td width=5% class="align-middle"><?php  if ( ($db[$name][$names[$i]]["Edit_Mode"] != 'upload') && ($db[$name][$names[$i]]["Edit_Mode"] != 'file') && ($db[$name][$names[$i]]["Status"] != 'Read Only') && ($cfgTables["chkedit_".$name]) ) { ?><button onclick="var val=<?php echo $saveButton?>; updateField(encodeURI('<?php echo urlencode($name)?>'), encodeURI('<?php echo urlencode($primary)?>'), encodeURI('<?php echo urlencode($primaryValue)?>'), encodeURI('<?php echo urlencode($names[$i])?>'), val);" alt="Save" title="Save" class="btn btn-primary"><i class="fas fa-save"></i></button><?php  } ?></td></tr><?php
 } ?></table></div></div></div></div></div><style>

  .fa.disabled,

  .fa[disabled],

  .disabled > .fa,

  [disabled] > .fa {

    opacity: 0.5;

    cursor: not-allowed;

    pointer-events: none;

  }

  </style><div class="card"><div class="card-body p-0"><div class="row"><div class='col-md-12' id='errorReturn'></div></div><table class="table table-striped table-sm"><thead><tr><?php
 $oldName = $name; $name = $hasDetails; $primary = zbSQL("SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = '$name' AND CONSTRAINT_NAME = 'PRIMARY'"); echo "<th>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Actions&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th>"; $keys = array_keys($db[$name]); for ($i=0; $i < $n; $i++) { $col = $keys[$i]; $status = $db[$name][$col]["Status"]; if ($status == "Hidden") continue; $prettyName = $col; if ($db[$name][$col]["Description"]) $prettyName = $db[$name][$col]["Description"]; echo "<th>$prettyName</th>"; } ?></tr></thead><tbody><?php
 $linkToMaster = $cfgTables["selectfieldmaster_$hasDetails"]; $sql = "SELECT $hasDetails.* FROM $hasDetails,$oldName WHERE $oldName.`$linkToMaster`=$hasDetails.`".$cfgTables["selectlinktomasterdmaster_$hasDetails"]."` AND $hasDetails.`".$cfgTables["selectlinktomasterdmaster_$hasDetails"]."`='$primaryValue'"; $result = $conn->query($sql); while($row = mysqli_fetch_array($result)){ ?><style>

      .hoverPointer:hover {

        cursor:pointer;

      }

      .fas.disabled,

      .fas[disabled],

      .disabled > .fas,

      [disabled] > .fas {

        opacity: 0.5;

        cursor: not-allowed;

        pointer-events: none;

      }  

    </style><tr><td class='hoverPointer align-middle'><?php
 $clickView = "viewRow('$name', '".urlencode($primary)."','".urlencode($row[$primary])."')"; $clickEdit = "editRow('$name', '".urlencode($primary)."','".urlencode($row[$primary])."')"; $clickDelete = "deleteRow('$name', '".urlencode($primary)."','".urlencode($row[$primary])."', 0)"; $clickViewDisabled = $clickEditDisabled = $clickDeleteDisabled = ""; if (!@$cfgTables["chkview_".$name]) $clickViewDisabled = "disabled"; if (!@$cfgTables["chkedit_".$name]) $clickEditDisabled = "disabled"; if (!@$cfgTables["chkdelete_".$name]) $clickDeleteDisabled = "disabled"; ?><i title="View Row" onclick="<?php echo $clickView?>" class='fas fa-eye <?php echo $clickViewDisabled?>'></i>&nbsp;

        <i title="Edit Row" onclick="<?php echo $clickEdit?>" class='fas fa-edit <?php echo $clickEditDisabled?>'></i>&nbsp;

<?php
 if (0) { ?><i title="Clone Row" onclick="cloneRow('<?php echo $name?>', '<?php echo urlencode($primary)?>','<?php echo urlencode($row[$primary])?>')" class='fas fa-clone'></i>&nbsp;

<?php
 } if (!$clickDeleteDisabled) { ?><i title="Delete Row" onclick="<?php echo $clickDelete?>" class='fas fa-trash <?php echo $clickDeleteDisabled?>' style='color:red'></i><?php
 } ?></td><?php
 $printed = 0; for($i=0; $i<count($keys);++$i) { $status = $db[$name][$keys[$i]]["Status"]; if ($status == "Hidden") { continue; } if (($status == "Read Only") || ($clickEditDisabled == "disabled")) { echo "<td class='align-middle'>".phpDbWiz_getView($name, $keys[$i], $row[$i])."</td>"; } else { echo "<td class='align-middle'><a href='#' onclick=\"editField('$name', '".urlencode($primary)."','".urlencode($row[$primary])."', '{$keys[$i]}', '".urlencode($db[$name][$keys[$i]]["MySQL_Type"])."')\">".urldecode(phpDbWiz_getView($name, $keys[$i], $row[$keys[$i]]))."</a></td>"; } } $printed++; echo "</tr>"; } if (!@$printed) echo "<td>No data to show</td>"; ?></tbody></table></div></div></table><script>



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

  ajax.open("POST", "upload.php");

  ajax.send(formdata);

  }



  function progressHandler(event) {

    _(GL_colname+"_loaded_n_total").innerHTML = "Uploaded " + trunc(event.loaded/1024) + " kB /" + trunc(event.total/1024) + "kB";

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

    //console.log('COMPLETED1 img_'+GL_colname);

    //console.log('COMPLETED2 '+GL_dir+'/'+decodeURIComponent(_("file"+GL_colname).files[0]["name"]));

    //document.getElementById('img_'+'<?php echo $colname?>').src = '<?php echo $db[$table][$colname]["Upload_Dir"]?>/'+decodeURIComponent(_("file"+'<?php echo $colname?>').files[0]["name"]);

    document.getElementById('img_'+GL_colname).src = GL_dir + '/' + decodeURIComponent(_("file"+GL_colname).files[0]["name"]);

  }



  function errorHandler(event) {

    _("status").innerHTML = "Upload Failed";

  }



  function abortHandler(event) {

    _("status").innerHTML = "Upload Aborted";

  }



</script><?php
 function hasDetails($table) { global $db, $cfgTables; $k = array_keys($db); for($i=0; $i<count($k); ++$i) if (@$cfgTables["selectMaster_chkdet_".$k[$i]] == $table) return $k[$i]; return false; } ?>
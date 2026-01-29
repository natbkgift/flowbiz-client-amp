<?php
 session_start(); include_once("config.php"); $conn = null; if (!tryConnect()) { die(); } $table = @mysqli_real_escape_string($conn, $_GET["table"]); $primary = @mysqli_real_escape_string($conn, $_GET["primary"]); $primaryValue = @mysqli_real_escape_string($conn, $_GET["primaryValue"]); $colname = @mysqli_real_escape_string($conn, $_GET["colname"]); $coltype = stripslashes(@mysqli_real_escape_string($conn, $_GET["coltype"])); $page = @mysqli_real_escape_string($conn, $_GET["page"]); if (!$page) $page = 0; loadConfig(); loadAllCfg(); if (@$cfgTables["editlevel_$table"] > 0) { $t = explode('/', $cfgCustom["tableLoginPwd"]); if (isset($t[3])) { $s = "SELECT `{$t[3]}` FROM {$t[0]} WHERE {$t[1]}='{$_SESSION['user']}'"; $level = 0 + zbSQL($s); if ($cfgTables["editlevel_$table"] > $level) { appendLog('?', $table, 'Attempted edit but level not enough'); exit; } } } $sql = "SELECT * FROM $table WHERE $primary='$primaryValue' LIMIT 1"; $result = $conn->query($sql); $r = $result->fetch_array(MYSQLI_ASSOC); ?><section class="content-header"><div class="container-fluid"><div class="row"><div id='errorReturn'></div></div><div class="card card-primary"><div class="card-header"><h3 class="card-title"><ol class="breadcrumb float-sm-left"><li class="breadcrumb-item"><a href="index.php?<?php echo uniqid()?>">Home</a></li><li class="breadcrumb-item"><a onclick="loadTable('<?php echo $table?>')" href="#"><?php echo $cfgTables["description-$table"]?></a></li><?php
 if (!$db[$table][$colname]["Description"]) $db[$table][$colname]["Description"] = $colname; ?><li class="breadcrumb-item"><a href="#"><?=$db[$table][$colname]["Description"]?></a></li></ol></h3><div class="card-tools"><button type="button" class="btn btn-tool" data-card-widget="collapse"><i class="fas fa-minus"></i></button></div></div><div class="card-body"><?php  $help = $db[$table][$colname]["Help"]; echo "<h3>{$db[$table][$colname]["Description"]}</h3>"; if ($help) echo "<p>$help</p>"; $saveButton = editSingleField($table, $colname, $coltype, $primary, $primaryValue, $r[$colname]); ?><br>
<?php
 if ( ($db[$table][$colname]["Edit_Mode"] != 'upload') && ($db[$table][$colname]["Edit_Mode"] != 'file') && ($db[$table][$colname]["Status"] != 'Read Only') ) { ?>
          <button onclick="var val=<?=$saveButton?>; updateField(encodeURI('<?=urlencode($table)?>'), encodeURI('<?php echo urlencode($primary)?>'), encodeURI('<?php echo urlencode($primaryValue)?>'), encodeURI('<?php echo urlencode($colname)?>'), val, <?php echo $page?>);" alt="Save" title="Save" class="btn btn-primary"><i class="fas fa-save"></i>&nbsp;&nbsp;Save
          </button>
<br>
<br>
<?php
$names = []; $types = []; $keys = array_keys($db[$table]); $k = 0; for($i=0; $i<count($keys); $i++) { if ($db[$table][$keys[$i]]["Status"] == 'Hidden') continue; if ($keys[$i] == @$cfgTables["sortField_$name"]) { continue; } $names[$k] = $keys[$i]; $types[$k] = $db[$table][$keys[$i]]["MySQL_Type"]; $k++; } $l = count($names); for($i=0; $i<$l-1; ++$i) { for($j=$i+1; $j < $l; ++$j) { if (intval($db[$table][$names[$i]]["Sort_Order"]) > intval($db[$table][$names[$j]]["Sort_Order"])) { $aux = $names[$i]; $names[$i] = $names[$j]; $names[$j] = $aux; $aux = $types[$i]; $types[$i] = $types[$j]; $types[$j] = $aux; } } } ?><table class='table table-sm'><thead><th>Field</th><th>Value</th></thead><?php
$sql = "SELECT * FROM $table WHERE $primary = '$primaryValue'"; $result = $conn->query($sql); $row = mysqli_fetch_array($result); for($i=0; $i<count($names);++$i) { if (@$cfgTables["multiuser_$table"] == $names[$i]) { continue; } $prettyName = $db[$table][$names[$i]]["Description"]; $help = $db[$table][$names[$i]]["Help"]; if (!$prettyName) $prettyName = $names[$i]; if ($help) $prettyName .= "<br><small style='color:#00c000'>$help</small>"; echo "<tr><td>$prettyName</td><td>"; $ret = phpDbWiz_getView($table, $names[$i], $row[$names[$i]]); if ($ret != EMPTY_VIEW) echo $ret; echo "</td></tr>"; } echo "</table>"; } ?></div></div></div>

<button onclick="<?="editRow('$table', '".urlencode($primary)."','".urlencode($primaryValue)."', $page)"?>" class='btn btn-primary btn-block'>Edit All Fields</button>

  </section>
  <br>


<script>
  function _(el) {
    return document.getElementById(el);
  }

  function uploadFile() {
    var file = _("file"+'<?=$colname?>').files[0];
<?php
 if ($db[$table][$colname]["Edit_Mode"] == 'file') { if ($db[$table][$colname]["Width"] > 0) { ?>
      if(file.size > <?=$db[$table][$colname]["Width"]?>){
        alert("File is too big. Maximum size is <?=$db[$table][$colname]["Width"]?> bytes, while your file is "+file.size+" bytes");
        return;
      };
<?php
 } } ?>  
    // alert(file.name+" | "+file.size+" | "+file.type);
    _("<?=$colname?>_progressBar").style.display = 'block';
    var formdata = new FormData();
    formdata.append("file"+'<?php echo $colname?>', file);
    formdata.append("table", encodeURI('<?php echo urlencode($table)?>'));
    formdata.append("colname", encodeURI('<?php echo urlencode($colname)?>'));
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
    //console.log('loaded colname='+'<?php echo $colname?>');
    _('<?php echo $colname?>'+"_loaded_n_total").innerHTML = "Uploaded " + event.loaded + " / " + event.total;
    var percent = (event.loaded / event.total) * 100;
    _('<?php echo $colname?>'+"_progressBar").value = Math.round(percent);
    _('<?php echo $colname?>'+"_status").innerHTML = Math.round(percent) + "% uploaded... Please wait";
  }

  function completeHandler(event) {
    //console.log('ch '+'<?php echo $colname?>');
    _('<?php echo $colname?>'+"_status").innerHTML           = event.target.responseText;
    _('<?php echo $colname?>'+"_progressBar").value          = 0; 
    _('<?php echo $colname?>'+"_loaded_n_total").innerHTML   = "";
    _('<?php echo $colname?>'+"_progressBar").style.display  = 'none';
    //console.log('COMPLETED1 img_'+'<?php echo $colname?>');
    //console.log('COMPLETED2 '+'<?php echo $db[$table][$colname]["Upload_Dir"]?>/'+decodeURIComponent(_("file"+'<?php echo $colname?>').files[0]["name"]));
    var uploadedFile = decodeURIComponent(_("file"+'<?php echo $colname?>').files[0]["name"]);
<?php
 if ($db[$table][$colname]["Edit_Mode"]=='file') { if (@$db[$table][$colname]["Edit_Aux1"]) { ?>        
        uploadedFile = '<?=$db[$table][$colname]["Edit_Aux1"]?>';
<?php
 } ?>      
      document.getElementById('serverimg_<?=$table?>_<?=$colname?>').innerHTML = '<b>'+uploadedFile+'</b> correctly uploaded';
<?php
 } if ($db[$table][$colname]["Edit_Mode"]=='upload') { if (@$db[$table][$colname]["Edit_Aux1"]) { ?>        
        uploadedFile = '<?=$db[$table][$colname]["Edit_Aux1"]?>';
<?php
 } } if ($db[$table][$colname]["Edit_Mode"]=='upload') { if (@$cfgCustom["chk_allowPdf2jpg"]=='on') { ?>        
        if (uploadedFile.slice(-3).toUpperCase()=='PDF') {
          uploadedFile = uploadedFile.substr(0, uploadedFile.lastIndexOf(".")) + ".jpg";
        }
<?php
 } ?>
      document.getElementById('img_'+'<?=$colname?>').src = '<?=$db[$table][$colname]["Upload_Dir"]?>/'+uploadedFile;
      // to force a refresh
      document.getElementById('img_'+'<?=$colname?>').src = document.getElementById('img_'+'<?=$colname?>').src; 
  <?php
 } ?>    
  }

  function errorHandler(event) {
    _('<?php echo $colname?>'+"_status").innerHTML = "Upload Failed";
  }

  function abortHandler(event) {
    _('<?php echo $colname?>'+"_status").innerHTML = "Upload Aborted";
  }

  function grabUrl() {
    var url = window.prompt('Enter the full url (e.g. https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png)','');
    if (!url)
      return;
    var formdata = new FormData();
    formdata.append("url", encodeURI(url));
    formdata.append("table", encodeURI('<?php echo urlencode($table)?>'));
    formdata.append("colname", encodeURI('<?php echo urlencode($colname)?>'));
    formdata.append("primary", encodeURI('<?php echo urlencode($primary)?>'));
    formdata.append("primaryValue", encodeURI('<?php echo urlencode($primaryValue)?>'));
    var ajax = new XMLHttpRequest();
    ajax.open("POST", "upload.php?q="+Math.random());
    ajax.send(formdata);
    alert('DONE - Refresh still not implemented! Refreshs manually to check the pic!')
  }
</script>
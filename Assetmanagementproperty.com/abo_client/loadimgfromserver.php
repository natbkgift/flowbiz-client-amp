<?php
 include_once("config.php"); $conn = null; if (!tryConnect()) { die(); } loadConfig(); loadAllCfg(); $table = mysqli_real_escape_string($conn, $_GET["table"]); $column = mysqli_real_escape_string($conn, $_GET["column"]); $primary = mysqli_real_escape_string($conn, $_GET["primary"]); $primaryValue = mysqli_real_escape_string($conn, $_GET["primaryValue"]); $dir = $db[$table][$column]["Upload_Dir"]; if (!$dir) $dir = '.'; $f = @scandir($dir); if ($f === false) { ?>
  <div class="alert alert-danger alert-dismissible">
    <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
    <h5><i class="icon fas fa-check"></i> ABO Server has been configured incorrectly</h5>
    The folder <b><?=$dir?></b> does not exist!
  </div>
  <?php
 exit; } echo "<br><div class='row'>"; for($i=0; $i<count($f); ++$i) { if ($f[$i] == '.') continue; if ($f[$i] == '..') continue; if(is_dir($dir.$f[$i])) continue; list($currentWidth, $currentHeight, $currentType, $currentAttr) = getimagesize($db[$table][$column]["Upload_Dir"]."/".$f[$i]); if (!$currentWidth && !@$cfgDefault["chkshowUnknownFiles"]) continue; ?><div class="col-md-3"><div class="card card-widget"><div class="card-header"><div class="user-block"><a href="#" onclick="setPicture('<?=$table?>','<?=$column?>', '<?=$primary?>', '<?=$primaryValue?>', '<?=$f[$i]?>')"><?=$f[$i]?></a><br><small>
<?php
 echo date("F j, Y, g:i a", filemtime("{$db[$table][$column]["Upload_Dir"]}/{$f[$i]}"))."<br>"; if ((($db[$table][$column]["Width"] || $db[$table][$column]["Height"])) && @$currentWidth) { ?>
    Forced <b>Width</b>: <?=$db[$table][$column]["Width"]?> / <b>Height</b>: <?=$db[$table][$column]["Height"]?>
<?php
 } else { if (!@$currentWidth) { echo "Unrecognized image"; } else { ?><b>Width</b>: <?=$currentWidth?> / <b>Height</b>: <?=$currentHeight?><?php
 } } ?></small></div></div>
<?php
 if (@$currentWidth) { ?>      
<div class="card-body">
  <a href="#" onclick="setPicture('<?=$table?>','<?=$column?>', '<?=$primary?>', '<?=$primaryValue?>', '<?=$f[$i]?>')">
    <img class="img-fluid pad" src="<?=$db[$table][$column]["Upload_Dir"]?>/<?=$f[$i]?>" alt="Photo">
  </a>
</div>
<?php
 } ?>      
<?php
 if (@$cfgDefault["chkletDownloadImage"]) { ?>
<div class="card-footer text-center">
  <a class='btn btn-primary' target='_blank' href='<?=$db[$table][$column]["Upload_Dir"]?>/<?=$f[$i]?>' download><i class='fa fa-download'></i> Download</a>
</div>
<?php
 } ?>    
</div>
</div>
<?php
} ?>
</div>

<hr>






<script>
  document.getElementById('serverimg_<?=$table?>_<?=$column?>').style.display = 'block';
</script>
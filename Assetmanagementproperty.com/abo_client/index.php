<?php  $sid = @$_GET["sid"]; if ($sid) session_id($sid); session_start(); $time_start = microtime(true); include_once("config.php"); $conn = null; if (!tryConnect()) { echo "Cannot connect to DB: configuration file missing and/or with wrong configuration"; die(); } $cfgView = $cfgPages = $cfgDb = $cfgDefault = $cfgCustom = $cfgTables = null; $error = loadAllCfg(); $db = ""; loadConfig(); if (isset($_SESSION['user'])) { } else { if ($cfgCustom["loginType"] != "No Password" && $cfgCustom["loginType"] != "") { header("Location: login.php"); die(); } } if ($error) { } $pageid = @mysqli_real_escape_string($conn, $_GET["pageid"]); if ($pageid=='logout') { session_destroy(); header("Location: login.php"); die(); } $level = PHP_INT_MAX; $t = explode('/', $cfgCustom["tableLoginPwd"]); if (isset($t[3])) { $level = 0 + @zbSQL("SELECT `{$t[3]}` FROM {$t[0]} WHERE {$t[1]}='{$_SESSION['user']}'"); } $loginImg = ""; if (isset($t[4])) { $loginImg = @zbSQL("SELECT `{$t[4]}` FROM {$t[0]} WHERE {$t[1]}='{$_SESSION['user']}'"); } ?>

<!DOCTYPE html>
  <html lang="en-US">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link rel="icon" href="<?=$cfgCustom["favico"]?>" type="image/png" sizes="128x128">
    <title><?php echo $cfgCustom["websiteTitle"]?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="quill.snow.css">
    <link rel="stylesheet" href="plugins/fontawesome-free/css/all.min.css">
    <link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css">
    <link rel="stylesheet" href="plugins/tempusdominus-bootstrap-4/css/tempusdominus-bootstrap-4.min.css">
    <link rel="stylesheet" href="plugins/icheck-bootstrap/icheck-bootstrap.min.css">
    <link rel="stylesheet" href="dist/css/adminlte.min.css">
    <link rel="stylesheet" href="plugins/overlayScrollbars/css/OverlayScrollbars.min.css">
    <link rel="stylesheet" href="plugins/daterangepicker/daterangepicker.css">
    <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@9"></script>
  </head>

  <body class="hold-transition sidebar-mini layout-fixed">
  <div class="wrapper">
    <div id="voidDiv" class=""></div>
<?php
 if (substr($pageid,0,9)!='userpages') $displaySearchBar = "visibility:visible"; else $displaySearchBar = "visibility:hidden"; ?>
    <nav id='navSearchBar' style='<?=$displaySearchBar?>' class="main-header navbar navbar-expand navbar-white navbar-light">
      <ul class="navbar-nav">
        <li class="nav-item">
          <a class="nav-link" data-widget="pushmenu" href="#" role="button"><i class="fas fa-bars"></i></a>
        </li>
        <div class="form-inline ml-3">
            <input type=hidden id='typeOfTable' name='typeOfTable' value='<?=@$type?>'>
          <div class="input-group input-group-xs">
            <input id='searchInWhatPage' type=hidden name=searchInWhatPage><input type=hidden name=pageid value=search><input class="form-control form-control-navbar" id=search name=search type="text" placeholder="Search" aria-label="Search" onkeypress="return searchFormOnSubmit(event)">
          </div>
          &nbsp;
          <div class="input-group input-group-xs">
            <select id=typeOfSearch name=type class="form-control form-control-navbar"><option value=2>Containing...</option><option value=1>Exact</option><option value=3>Starting with...</option><option value=4>Using RegExp</option></select>
          </div>
        </div>
      </ul>      
    </nav>

    <aside class="main-sidebar sidebar-dark-primary elevation-4">
    <!-- <aside class="main-sidebar sidebar-dark-primary elevation-4" style='overflow-y:scroll'> -->

    <a href="index.php?q=<?=uniqid()?>" class="brand-link">
      <center>
        <img height=32px src="<?=$cfgCustom["logoBackoffice"]?>" alt="AutoBackOffice Logo">
      </center>  
    </a>
    <div class="sidebar">
    <nav class="mt-2">
      <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
              
<?php
 $o = ""; if ($nPages = @count($cfgPages)) { $first = false; for($i=0; $i<=9; ++$i) { if (! ((@$cfgPages["adminlevel-$i"] == 0) || ($cfgPages["adminlevel-$i"] <= $level))) continue; if (@$cfgPages["name-$i"]) { if (!$first) { $first = true; } if (@$cfgPages["open_$i"]) { $target = "_blank"; $click = @mysqli_real_escape_string($conn, @$cfgPages["file-$i"]); } else { $target = ""; $click = "?pageid=userpages_".@mysqli_real_escape_string($conn, @$cfgPages["name-$i"])."&".uniqid(); } $o .= "<li class='nav-item'>"; $o .= "  <a class='nav-link' "; $o .= "     href='$click' target='$target'>"; $o .= "     <i class='nav-icon {$cfgPages["icon$i"]}'></i>&nbsp;"; $o .= "<p>{$cfgPages["description-$i"]}</p>"; $o .= "  </a>"; $o .= "</li>"; } } } if (@$_SESSION["user"]) { ?>
  <li class="nav-item">
    <a href="#" class="nav-link">
      <i class="nav-icon fa fa-user"></i>
      <p style='color:#00dd00'>
        <?=$_SESSION["user"]?>
      </p>
    </a>
  </li>
<?php
 } if ($nPages && @$cfgDefault["chkUserPagesAtTheBeginning"]) { echo $o; } if (!$db) { $db = []; $db["empty"] = " "; } $names = array(); $kCols = array_keys($db); $l = count($db); for($i=0; $i<$l; ++$i) { if (!@$cfgTables["chkview_".$kCols[$i]]) continue; $names[] = $kCols[$i]; } $l = count($names); for($i=0; $i<$l-1; ++$i) { for($j=$i+1; $j < $l; ++$j) { if (intval(@$cfgTables["sortorder-{$names[$i]}"]) > intval(@$cfgTables["sortorder-{$names[$j]}"])) { $aux = $names[$i]; $names[$i] = $names[$j]; $names[$j] = $aux; } } } for($i=0; $i<$l; ++$i) { $table = $names[$i]; if ((@$cfgTables["chkdet_$table"]) && @$cfgDefault["hideDetails"]) continue; $isPrimary = zbSQL("SHOW INDEX FROM $table WHERE Key_name = 'PRIMARY'"); $click = "return false;"; $info = ""; if ($isPrimary) { $click = "loadTable('$table',0)"; } else { $info = "<span style='color:white'>&nbsp;<i onclick=\" Swal.fire({ title: 'WARNING', text: 'This table cannot be edited', icon: 'warning', confirmButtonColor: '#3085d6', cancelButtonColor: '#d33', confirmButtonText: 'Ok'})\" alt='Missing Primary Key' class='fa fa-info-circle'></i>&nbsp;</span>"; } if ( (@$cfgTables["adminlevel_$table"] == 0) || ($cfgTables["adminlevel_$table"] <= $level)) { ?>
  <li class="nav-item">
    <a href="#" onclick="<?php echo $click?>" class="nav-link">
      <i class="nav-icon <?php echo $cfgTables["icon$table"]?>"></i>
      <p id="menuTable_<?php echo $table?>">
      <?=$cfgTables["description-$table"]?>
<?php  if (!(@$cfgCustom["chk_recordcount"]=='on')) { echo "<span id=\"table_$table\" class=\"right badge badge-primary\">"; echo zbSQL("SELECT COUNT(*) FROM $table"); echo "</span>"; } echo $info ?>
      </p>
    </a>
  </li>
<?php
 } else { } } if (!$dbview) { $dbview = []; $dbview["empty"] = " "; } $names = array(); $kCols = array_keys($dbview); $l = count($dbview); for($i=0; $i<$l; ++$i) { if (!@$cfgView["chkview_".$kCols[$i]]) continue; $names[] = $kCols[$i]; } $l = count($names); for($i=0; $i<$l-1; ++$i) { for($j=$i+1; $j < $l; ++$j) { if (intval(@$cfgView["sortorder-{$names[$i]}"]) > intval(@$cfgView["sortorder-{$names[$j]}"])) { $aux = $names[$i]; $names[$i] = $names[$j]; $names[$j] = $aux; } } } for($i=0; $i<$l; ++$i) { $table = $names[$i]; if ((@$cfgView["chkdet_$table"]) && @$cfgView["hideDetails"]) continue; if ( (@$cfgView["adminlevel_$table"] == 0) || ($cfgView["adminlevel_$table"] <= $level)) { $click = "loadTable('$table',0, '', '', '', '', 'view')"; ?>
  <li class="nav-item">
    <a href="#" onclick="<?php echo $click?>" class="nav-link">
      <i class="nav-icon <?php echo $cfgView["icon$table"]?>"></i>
      <p id="menuTable_<?php echo $table?>">
      <?=$cfgView["description-$table"]?>
<?php  if (!(@$cfgCustom["chk_recordcount"]=='on')) { echo "<span id=\"table_$table\" class=\"right badge badge-primary\">"; echo zbSQL("SELECT COUNT(*) FROM $table"); echo "</span>"; } echo $info ?>
      </p>
    </a>
  </li>
<?php
 } else { } } if ($nPages && !@$cfgDefault["chkUserPagesAtTheBeginning"]) { echo $o; } ?>
  <li class="nav-item">
    <a href="?pageid=logout" class="nav-link">
      <i class="nav-icon fas fa-sign-out-alt"></i>
      <!-- <p>Logout <span style='color:#00dd00'><?=@$_SESSION['user']?></span></p> -->
      <p>Logout</p>
    </a>
  </li>
  </ul>
  </nav>
  </div>
  </aside>
  
  <div class="content-wrapper" id="main-right-window">
    <div class="content-header">
      <div class="container-fluid">
        <div class="row mb-2">
          <div class="col-sm-6">
<?php
 if (substr($pageid, 0, 10)=='userpages_') { $title = "Please wait..."; } else { $title = "PageID not handled ($pageid)"; } if ($pageid == '') $title = @$cfgCustom["backofficename"]; ?><h1 class="m-0 text-dark"><?php echo $title?></h1></div></div></div></div><section class="content"><div class="container-fluid"><?php echo $cfgCustom["frontPage"]?></div></section></div><footer class="main-footer"><?php echo $cfgCustom["footer"]?><div class="float-right d-none d-sm-inline-block"><b>ABO</b> Version 4.0.0
    </div></footer><aside class="control-sidebar control-sidebar-dark"></aside></div>
    <script src="plugins/jquery/jquery.min.js"></script>
    <script src="plugins/jquery-ui/jquery-ui.min.js"></script>
    <script>
  // https://notifyjs.jpillora.com/
  (function(e){typeof define=="function"&&define.amd?define(["jquery"],e):typeof module=="object"&&module.exports?module.exports=function(t,n){return n===undefined&&(typeof window!="undefined"?n=require("jquery"):n=require("jquery")(t)),e(n),n}:e(jQuery)})(function(e){function A(t,n,i){typeof i=="string"&&(i={className:i}),this.options=E(w,e.isPlainObject(i)?i:{}),this.loadHTML(),this.wrapper=e(h.html),this.options.clickToHide&&this.wrapper.addClass(r+"-hidable"),this.wrapper.data(r,this),this.arrow=this.wrapper.find("."+r+"-arrow"),this.container=this.wrapper.find("."+r+"-container"),this.container.append(this.userContainer),t&&t.length&&(this.elementType=t.attr("type"),this.originalElement=t,this.elem=N(t),this.elem.data(r,this),this.elem.before(this.wrapper)),this.container.hide(),this.run(n)}var t=[].indexOf||function(e){for(var t=0,n=this.length;t<n;t++)if(t in this&&this[t]===e)return t;return-1},n="notify",r=n+"js",i=n+"!blank",s={t:"top",m:"middle",b:"bottom",l:"left",c:"center",r:"right"},o=["l","c","r"],u=["t","m","b"],a=["t","b","l","r"],f={t:"b",m:null,b:"t",l:"r",c:null,r:"l"},l=function(t){var n;return n=[],e.each(t.split(/\W+/),function(e,t){var r;r=t.toLowerCase().charAt(0);if(s[r])return n.push(r)}),n},c={},h={name:"core",html:'<div class="'+r+'-wrapper">\n	<div class="'+r+'-arrow"></div>\n	<div class="'+r+'-container"></div>\n</div>',css:"."+r+"-corner {\n	position: fixed;\n	margin: 5px;\n	z-index: 1050;\n}\n\n."+r+"-corner ."+r+"-wrapper,\n."+r+"-corner ."+r+"-container {\n	position: relative;\n	display: block;\n	height: inherit;\n	width: inherit;\n	margin: 3px;\n}\n\n."+r+"-wrapper {\n	z-index: 1;\n	position: absolute;\n	display: inline-block;\n	height: 0;\n	width: 0;\n}\n\n."+r+"-container {\n	display: none;\n	z-index: 1;\n	position: absolute;\n}\n\n."+r+"-hidable {\n	cursor: pointer;\n}\n\n[data-notify-text],[data-notify-html] {\n	position: relative;\n}\n\n."+r+"-arrow {\n	position: absolute;\n	z-index: 2;\n	width: 0;\n	height: 0;\n}"},p={"border-radius":["-webkit-","-moz-"]},d=function(e){return c[e]},v=function(e){if(!e)throw"Missing Style name";c[e]&&delete c[e]},m=function(t,i){if(!t)throw"Missing Style name";if(!i)throw"Missing Style definition";if(!i.html)throw"Missing Style HTML";var s=c[t];s&&s.cssElem&&(window.console&&console.warn(n+": overwriting style '"+t+"'"),c[t].cssElem.remove()),i.name=t,c[t]=i;var o="";i.classes&&e.each(i.classes,function(t,n){return o+="."+r+"-"+i.name+"-"+t+" {\n",e.each(n,function(t,n){return p[t]&&e.each(p[t],function(e,r){return o+="	"+r+t+": "+n+";\n"}),o+="	"+t+": "+n+";\n"}),o+="}\n"}),i.css&&(o+="/* styles for "+i.name+" */\n"+i.css),o&&(i.cssElem=g(o),i.cssElem.attr("id","notify-"+i.name));var u={},a=e(i.html);y("html",a,u),y("text",a,u),i.fields=u},g=function(t){var n,r,i;r=x("style"),r.attr("type","text/css"),e("head").append(r);try{r.html(t)}catch(s){r[0].styleSheet.cssText=t}return r},y=function(t,n,r){var s;return t!=="html"&&(t="text"),s="data-notify-"+t,b(n,"["+s+"]").each(function(){var n;n=e(this).attr(s),n||(n=i),r[n]=t})},b=function(e,t){return e.is(t)?e:e.find(t)},w={clickToHide:!0,autoHide:!0,autoHideDelay:5e3,arrowShow:!0,arrowSize:5,breakNewLines:!0,elementPosition:"bottom",globalPosition:"top right",style:"bootstrap",className:"error",showAnimation:"slideDown",showDuration:400,hideAnimation:"slideUp",hideDuration:200,gap:5},E=function(t,n){var r;return r=function(){},r.prototype=t,e.extend(!0,new r,n)},S=function(t){return e.extend(w,t)},x=function(t){return e("<"+t+"></"+t+">")},T={},N=function(t){var n;return t.is("[type=radio]")&&(n=t.parents("form:first").find("[type=radio]").filter(function(n,r){return e(r).attr("name")===t.attr("name")}),t=n.first()),t},C=function(e,t,n){var r,i;if(typeof n=="string")n=parseInt(n,10);else if(typeof n!="number")return;if(isNaN(n))return;return r=s[f[t.charAt(0)]],i=t,e[r]!==undefined&&(t=s[r.charAt(0)],n=-n),e[t]===undefined?e[t]=n:e[t]+=n,null},k=function(e,t,n){if(e==="l"||e==="t")return 0;if(e==="c"||e==="m")return n/2-t/2;if(e==="r"||e==="b")return n-t;throw"Invalid alignment"},L=function(e){return L.e=L.e||x("div"),L.e.text(e).html()};A.prototype.loadHTML=function(){var t;t=this.getStyle(),this.userContainer=e(t.html),this.userFields=t.fields},A.prototype.show=function(e,t){var n,r,i,s,o;r=function(n){return function(){!e&&!n.elem&&n.destroy();if(t)return t()}}(this),o=this.container.parent().parents(":hidden").length>0,i=this.container.add(this.arrow),n=[];if(o&&e)s="show";else if(o&&!e)s="hide";else if(!o&&e)s=this.options.showAnimation,n.push(this.options.showDuration);else{if(!!o||!!e)return r();s=this.options.hideAnimation,n.push(this.options.hideDuration)}return n.push(r),i[s].apply(i,n)},A.prototype.setGlobalPosition=function(){var t=this.getPosition(),n=t[0],i=t[1],o=s[n],u=s[i],a=n+"|"+i,f=T[a];if(!f||!document.body.contains(f[0])){f=T[a]=x("div");var l={};l[o]=0,u==="middle"?l.top="45%":u==="center"?l.left="45%":l[u]=0,f.css(l).addClass(r+"-corner"),e("body").append(f)}return f.prepend(this.wrapper)},A.prototype.setElementPosition=function(){var n,r,i,l,c,h,p,d,v,m,g,y,b,w,E,S,x,T,N,L,A,O,M,_,D,P,H,B,j;H=this.getPosition(),_=H[0],O=H[1],M=H[2],g=this.elem.position(),d=this.elem.outerHeight(),y=this.elem.outerWidth(),v=this.elem.innerHeight(),m=this.elem.innerWidth(),j=this.wrapper.position(),c=this.container.height(),h=this.container.width(),T=s[_],L=f[_],A=s[L],p={},p[A]=_==="b"?d:_==="r"?y:0,C(p,"top",g.top-j.top),C(p,"left",g.left-j.left),B=["top","left"];for(w=0,S=B.length;w<S;w++)D=B[w],N=parseInt(this.elem.css("margin-"+D),10),N&&C(p,D,N);b=Math.max(0,this.options.gap-(this.options.arrowShow?i:0)),C(p,A,b);if(!this.options.arrowShow)this.arrow.hide();else{i=this.options.arrowSize,r=e.extend({},p),n=this.userContainer.css("border-color")||this.userContainer.css("border-top-color")||this.userContainer.css("background-color")||"white";for(E=0,x=a.length;E<x;E++){D=a[E],P=s[D];if(D===L)continue;l=P===T?n:"transparent",r["border-"+P]=i+"px solid "+l}C(p,s[L],i),t.call(a,O)>=0&&C(r,s[O],i*2)}t.call(u,_)>=0?(C(p,"left",k(O,h,y)),r&&C(r,"left",k(O,i,m))):t.call(o,_)>=0&&(C(p,"top",k(O,c,d)),r&&C(r,"top",k(O,i,v))),this.container.is(":visible")&&(p.display="block"),this.container.removeAttr("style").css(p);if(r)return this.arrow.removeAttr("style").css(r)},A.prototype.getPosition=function(){var e,n,r,i,s,f,c,h;h=this.options.position||(this.elem?this.options.elementPosition:this.options.globalPosition),e=l(h),e.length===0&&(e[0]="b");if(n=e[0],t.call(a,n)<0)throw"Must be one of ["+a+"]";if(e.length===1||(r=e[0],t.call(u,r)>=0)&&(i=e[1],t.call(o,i)<0)||(s=e[0],t.call(o,s)>=0)&&(f=e[1],t.call(u,f)<0))e[1]=(c=e[0],t.call(o,c)>=0)?"m":"l";return e.length===2&&(e[2]=e[1]),e},A.prototype.getStyle=function(e){var t;e||(e=this.options.style),e||(e="default"),t=c[e];if(!t)throw"Missing style: "+e;return t},A.prototype.updateClasses=function(){var t,n;return t=["base"],e.isArray(this.options.className)?t=t.concat(this.options.className):this.options.className&&t.push(this.options.className),n=this.getStyle(),t=e.map(t,function(e){return r+"-"+n.name+"-"+e}).join(" "),this.userContainer.attr("class",t)},A.prototype.run=function(t,n){var r,s,o,u,a;e.isPlainObject(n)?e.extend(this.options,n):e.type(n)==="string"&&(this.options.className=n);if(this.container&&!t){this.show(!1);return}if(!this.container&&!t)return;s={},e.isPlainObject(t)?s=t:s[i]=t;for(o in s){r=s[o],u=this.userFields[o];if(!u)continue;u==="text"&&(r=L(r),this.options.breakNewLines&&(r=r.replace(/\n/g,"<br/>"))),a=o===i?"":"="+o,b(this.userContainer,"[data-notify-"+u+a+"]").html(r)}this.updateClasses(),this.elem?this.setElementPosition():this.setGlobalPosition(),this.show(!0),this.options.autoHide&&(clearTimeout(this.autohideTimer),this.autohideTimer=setTimeout(this.show.bind(this,!1),this.options.autoHideDelay))},A.prototype.destroy=function(){this.wrapper.data(r,null),this.wrapper.remove()},e[n]=function(t,r,i){return t&&t.nodeName||t.jquery?e(t)[n](r,i):(i=r,r=t,new A(null,r,i)),t},e.fn[n]=function(t,n){return e(this).each(function(){var i=N(e(this)).data(r);i&&i.destroy();var s=new A(e(this),t,n)}),this},e.extend(e[n],{defaults:S,addStyle:m,removeStyle:v,pluginOptions:w,getStyle:d,insertCSS:g}),m("bootstrap",{html:"<div>\n<span data-notify-text></span>\n</div>",classes:{base:{"font-weight":"bold",padding:"8px 15px 8px 14px","text-shadow":"0 1px 0 rgba(255, 255, 255, 0.5)","background-color":"#fcf8e3",border:"1px solid #fbeed5","border-radius":"4px","white-space":"nowrap","padding-left":"25px","background-repeat":"no-repeat","background-position":"3px 7px"},error:{color:"#B94A48","background-color":"#F2DEDE","border-color":"#EED3D7","background-image":"url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAtRJREFUeNqkVc1u00AQHq+dOD+0poIQfkIjalW0SEGqRMuRnHos3DjwAH0ArlyQeANOOSMeAA5VjyBxKBQhgSpVUKKQNGloFdw4cWw2jtfMOna6JOUArDTazXi/b3dm55socPqQhFka++aHBsI8GsopRJERNFlY88FCEk9Yiwf8RhgRyaHFQpPHCDmZG5oX2ui2yilkcTT1AcDsbYC1NMAyOi7zTX2Agx7A9luAl88BauiiQ/cJaZQfIpAlngDcvZZMrl8vFPK5+XktrWlx3/ehZ5r9+t6e+WVnp1pxnNIjgBe4/6dAysQc8dsmHwPcW9C0h3fW1hans1ltwJhy0GxK7XZbUlMp5Ww2eyan6+ft/f2FAqXGK4CvQk5HueFz7D6GOZtIrK+srupdx1GRBBqNBtzc2AiMr7nPplRdKhb1q6q6zjFhrklEFOUutoQ50xcX86ZlqaZpQrfbBdu2R6/G19zX6XSgh6RX5ubyHCM8nqSID6ICrGiZjGYYxojEsiw4PDwMSL5VKsC8Yf4VRYFzMzMaxwjlJSlCyAQ9l0CW44PBADzXhe7xMdi9HtTrdYjFYkDQL0cn4Xdq2/EAE+InCnvADTf2eah4Sx9vExQjkqXT6aAERICMewd/UAp/IeYANM2joxt+q5VI+ieq2i0Wg3l6DNzHwTERPgo1ko7XBXj3vdlsT2F+UuhIhYkp7u7CarkcrFOCtR3H5JiwbAIeImjT/YQKKBtGjRFCU5IUgFRe7fF4cCNVIPMYo3VKqxwjyNAXNepuopyqnld602qVsfRpEkkz+GFL1wPj6ySXBpJtWVa5xlhpcyhBNwpZHmtX8AGgfIExo0ZpzkWVTBGiXCSEaHh62/PoR0p/vHaczxXGnj4bSo+G78lELU80h1uogBwWLf5YlsPmgDEd4M236xjm+8nm4IuE/9u+/PH2JXZfbwz4zw1WbO+SQPpXfwG/BBgAhCNZiSb/pOQAAAAASUVORK5CYII=)"},success:{color:"#468847","background-color":"#DFF0D8","border-color":"#D6E9C6","background-image":"url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAutJREFUeNq0lctPE0Ecx38zu/RFS1EryqtgJFA08YCiMZIAQQ4eRG8eDGdPJiYeTIwHTfwPiAcvXIwXLwoXPaDxkWgQ6islKlJLSQWLUraPLTv7Gme32zoF9KSTfLO7v53vZ3d/M7/fIth+IO6INt2jjoA7bjHCJoAlzCRw59YwHYjBnfMPqAKWQYKjGkfCJqAF0xwZjipQtA3MxeSG87VhOOYegVrUCy7UZM9S6TLIdAamySTclZdYhFhRHloGYg7mgZv1Zzztvgud7V1tbQ2twYA34LJmF4p5dXF1KTufnE+SxeJtuCZNsLDCQU0+RyKTF27Unw101l8e6hns3u0PBalORVVVkcaEKBJDgV3+cGM4tKKmI+ohlIGnygKX00rSBfszz/n2uXv81wd6+rt1orsZCHRdr1Imk2F2Kob3hutSxW8thsd8AXNaln9D7CTfA6O+0UgkMuwVvEFFUbbAcrkcTA8+AtOk8E6KiQiDmMFSDqZItAzEVQviRkdDdaFgPp8HSZKAEAL5Qh7Sq2lIJBJwv2scUqkUnKoZgNhcDKhKg5aH+1IkcouCAdFGAQsuWZYhOjwFHQ96oagWgRoUov1T9kRBEODAwxM2QtEUl+Wp+Ln9VRo6BcMw4ErHRYjH4/B26AlQoQQTRdHWwcd9AH57+UAXddvDD37DmrBBV34WfqiXPl61g+vr6xA9zsGeM9gOdsNXkgpEtTwVvwOklXLKm6+/p5ezwk4B+j6droBs2CsGa/gNs6RIxazl4Tc25mpTgw/apPR1LYlNRFAzgsOxkyXYLIM1V8NMwyAkJSctD1eGVKiq5wWjSPdjmeTkiKvVW4f2YPHWl3GAVq6ymcyCTgovM3FzyRiDe2TaKcEKsLpJvNHjZgPNqEtyi6mZIm4SRFyLMUsONSSdkPeFtY1n0mczoY3BHTLhwPRy9/lzcziCw9ACI+yql0VLzcGAZbYSM5CCSZg1/9oc/nn7+i8N9p/8An4JMADxhH+xHfuiKwAAAABJRU5ErkJggg==)"},info:{color:"#3A87AD","background-color":"#D9EDF7","border-color":"#BCE8F1","background-image":"url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QYFAhkSsdes/QAAA8dJREFUOMvVlGtMW2UYx//POaWHXg6lLaW0ypAtw1UCgbniNOLcVOLmAjHZolOYlxmTGXVZdAnRfXQm+7SoU4mXaOaiZsEpC9FkiQs6Z6bdCnNYruM6KNBw6YWewzl9z+sHImEWv+vz7XmT95f/+3/+7wP814v+efDOV3/SoX3lHAA+6ODeUFfMfjOWMADgdk+eEKz0pF7aQdMAcOKLLjrcVMVX3xdWN29/GhYP7SvnP0cWfS8caSkfHZsPE9Fgnt02JNutQ0QYHB2dDz9/pKX8QjjuO9xUxd/66HdxTeCHZ3rojQObGQBcuNjfplkD3b19Y/6MrimSaKgSMmpGU5WevmE/swa6Oy73tQHA0Rdr2Mmv/6A1n9w9suQ7097Z9lM4FlTgTDrzZTu4StXVfpiI48rVcUDM5cmEksrFnHxfpTtU/3BFQzCQF/2bYVoNbH7zmItbSoMj40JSzmMyX5qDvriA7QdrIIpA+3cdsMpu0nXI8cV0MtKXCPZev+gCEM1S2NHPvWfP/hL+7FSr3+0p5RBEyhEN5JCKYr8XnASMT0xBNyzQGQeI8fjsGD39RMPk7se2bd5ZtTyoFYXftF6y37gx7NeUtJJOTFlAHDZLDuILU3j3+H5oOrD3yWbIztugaAzgnBKJuBLpGfQrS8wO4FZgV+c1IxaLgWVU0tMLEETCos4xMzEIv9cJXQcyagIwigDGwJgOAtHAwAhisQUjy0ORGERiELgG4iakkzo4MYAxcM5hAMi1WWG1yYCJIcMUaBkVRLdGeSU2995TLWzcUAzONJ7J6FBVBYIggMzmFbvdBV44Corg8vjhzC+EJEl8U1kJtgYrhCzgc/vvTwXKSib1paRFVRVORDAJAsw5FuTaJEhWM2SHB3mOAlhkNxwuLzeJsGwqWzf5TFNdKgtY5qHp6ZFf67Y/sAVadCaVY5YACDDb3Oi4NIjLnWMw2QthCBIsVhsUTU9tvXsjeq9+X1d75/KEs4LNOfcdf/+HthMnvwxOD0wmHaXr7ZItn2wuH2SnBzbZAbPJwpPx+VQuzcm7dgRCB57a1uBzUDRL4bfnI0RE0eaXd9W89mpjqHZnUI5Hh2l2dkZZUhOqpi2qSmpOmZ64Tuu9qlz/SEXo6MEHa3wOip46F1n7633eekV8ds8Wxjn37Wl63VVa+ej5oeEZ/82ZBETJjpJ1Rbij2D3Z/1trXUvLsblCK0XfOx0SX2kMsn9dX+d+7Kf6h8o4AIykuffjT8L20LU+w4AZd5VvEPY+XpWqLV327HR7DzXuDnD8r+ovkBehJ8i+y8YAAAAASUVORK5CYII=)"},warn:{color:"#C09853","background-color":"#FCF8E3","border-color":"#FBEED5","background-image":"url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAABJlBMVEXr6eb/2oD/wi7/xjr/0mP/ykf/tQD/vBj/3o7/uQ//vyL/twebhgD/4pzX1K3z8e349vK6tHCilCWbiQymn0jGworr6dXQza3HxcKkn1vWvV/5uRfk4dXZ1bD18+/52YebiAmyr5S9mhCzrWq5t6ufjRH54aLs0oS+qD751XqPhAybhwXsujG3sm+Zk0PTwG6Shg+PhhObhwOPgQL4zV2nlyrf27uLfgCPhRHu7OmLgAafkyiWkD3l49ibiAfTs0C+lgCniwD4sgDJxqOilzDWowWFfAH08uebig6qpFHBvH/aw26FfQTQzsvy8OyEfz20r3jAvaKbhgG9q0nc2LbZxXanoUu/u5WSggCtp1anpJKdmFz/zlX/1nGJiYmuq5Dx7+sAAADoPUZSAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfdBgUBGhh4aah5AAAAlklEQVQY02NgoBIIE8EUcwn1FkIXM1Tj5dDUQhPU502Mi7XXQxGz5uVIjGOJUUUW81HnYEyMi2HVcUOICQZzMMYmxrEyMylJwgUt5BljWRLjmJm4pI1hYp5SQLGYxDgmLnZOVxuooClIDKgXKMbN5ggV1ACLJcaBxNgcoiGCBiZwdWxOETBDrTyEFey0jYJ4eHjMGWgEAIpRFRCUt08qAAAAAElFTkSuQmCC)"}}}),e(function(){g(h.css).attr("id","core-notify"),e(document).on("click","."+r+"-hidable",function(t){e(this).trigger("notify-hide")}),e(document).on("notify-hide","."+r+"-wrapper",function(t){var n=e(this).data(r);n&&n.show(!1)})})})

  function _(el) {
    return document.getElementById(el);
  }

  function serialize(form){if(!form||form.nodeName!=="FORM"){return }var i,j,q=[];for(i=form.elements.length-1;i>=0;i=i-1){if(form.elements[i].name===""){continue}switch(form.elements[i].nodeName){case"INPUT":switch(form.elements[i].type){case"text":case"hidden":case"password":case"button":case"reset":case"submit":q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value));break;case"checkbox":case"radio":if(form.elements[i].checked){q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value))}break;case"file":break}break;case"TEXTAREA":q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value));break;case"SELECT":switch(form.elements[i].type){case"select-one":q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value));break;case"select-multiple":for(j=form.elements[i].options.length-1;j>=0;j=j-1){if(form.elements[i].options[j].selected){q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].options[j].value))}}break}break;case"BUTTON":switch(form.elements[i].type){case"reset":case"submit":case"button":q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value));break}break}}return q.join("&")};

  function _v(id) {
    id = document.getElementById(id);
    if (id)
      return id.value;
    else
      return null;
  }

  function _e(id, v) {
    id = document.getElementById(id);
    if (id)
      id.value = v;
    else
      return null;
  }
 
  var lastSelected = '';

  function loading(div) {
    document.getElementById(div).innerHTML = '<div class="overlay-wrapper"><div class="overlay"><i class="fas fa-3x fa-sync-alt fa-spin"></i>&nbsp;&nbsp;&nbsp;<div class="text-bold pt-2">Loading...</div></div></div>';
  }

  function saveCustomization(page) {
    var elements = serialize(document.forms[1]); 
    loading('resultCustomization');
    var url = 'savecustomform.php?variableName='+page+'&'+elements+'&q='+Math.random();
    $('#resultCustomization').load(url);
  }

  function checkConnection(save) {
    var username  = _v('username');
    var password  = _v('password');
    var localhost = _v('localhost');
    var database  = _v('database');
    var url = 'checkconnection.php?username='+encodeURI(username)+'&password='+encodeURI(password)+'&database='+encodeURI(database)+'&localhost='+encodeURI(localhost)+'&save='+save+'&q='+Math.random();
    loading('resultCustomization');
    $('#resultCustomization').load(url);
  }

  function editParam(table, column) {
    if (lastSelected)
      $('#'+lastSelected).removeClass("table-active");
    lastSelected = table+'_'+column;
    $('#'+lastSelected).addClass("table-active");
    loading('edit'+table);
    var url = 'editparam.php?table='+encodeURI(table)+'&column='+encodeURI(column)+'&q='+Math.random();
    $('#edit'+table).load(url);
  }

  function viewParam(table, column) {
    if (lastSelected)
      $('#'+lastSelected).removeClass("table-active");
    lastSelected = table+'_'+column;
    $('#'+lastSelected).addClass("table-active");
    loading('edit'+table);
    var url = 'viewparam.php?table='+encodeURI(table)+'&column='+encodeURI(column)+'&q='+Math.random();
    $('#edit'+table).load(url);
  }

  function loadUserPage(name, param) {
    loading('main-right-window');
    var url = name+'?'+param+'&'+Math.random();
//    alert(url);
    $('#main-right-window').load(url);
    // document.getElementById('navSearchBar').style = 'hidden'
  }

  function editRow(name, primary, primaryValue, page) {
    var url = 'editrow.php?name='+encodeURI(name)+'&primary='+encodeURI(primary)+'&primaryValue='+encodeURI(primaryValue)+'&page='+encodeURI(page)+'&q='+Math.random();
    loading('main-right-window');
    $('#main-right-window').load(url);
  }

  function addRow(name, primary) {
    var url = 'addrow.php?name='+encodeURI(name)+'&primary='+encodeURI(primary)+'&q='+Math.random();
    loading('main-right-window');
    $('#main-right-window').load(url);
  }

  function viewRow(name, primary, primaryValue, type) {
    var url = 'viewrow.php?name='+encodeURI(name)+'&primary='+encodeURI(primary)+'&primaryValue='+encodeURI(primaryValue)+'&type='+type+'&q='+Math.random();
    loading('main-right-window');
    $('#main-right-window').load(url);
  }

  function copyRow(name, primary, primaryValue) {
//    console.log('copyrow');
    var url = 'copyrow.php?name='+encodeURI(name)+'&primary='+encodeURI(primary)+'&primaryValue='+encodeURI(primaryValue)+'&q='+Math.random();
    $.ajax({
      url: url,
      async: false,
      success: function(data) {
//          console.log('success url');
//          var storage = document.getElementById('copyToClipboard');
//          storage.value = data;
          navigator.clipboard.writeText(data);
          Swal.fire({ title: 'Copied!', text: 'The record from the table '+name+' has been copied to the clipboard'})
      }
    });
  }

  function cloneRow(name, primary, primaryValue) {
    var url = 'clonerow.php?name='+encodeURI(name)+'&primary='+encodeURI(primary)+'&primaryValue='+encodeURI(primaryValue)+'&q='+Math.random();
    loading('main-right-window');
    $('#main-right-window').load(url);
  }

  function rotateImage(id, file, deg) {
    var url = 'rotateimage.php?id='+encodeURI(id)+'&file='+encodeURI(file)+'&deg='+deg+'&q='+Math.random();
    document.getElementById(id).src = '';
    $('#voidDiv').load(url);
  }

  function deleteRow(name, primary, primaryValue, page) {
<?php
 if (@$cfgDefault["chkAskForDelete"]) { ?>
        Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          cancelButtonText: 'No, do NOT delete it!',
          confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
          if (result.value) {
            loading('errorReturn');
            var url;
            url = 'deleterow.php?name='+encodeURI(name)+'&primary='+encodeURI(primary)+'&primaryValue='+encodeURI(primaryValue)+'&q='+Math.random();
            $('#errorReturn').load(url, function() {
              var url = 'loadtable.php?name='+encodeURI(name)+'&currPage='+page+'&q='+Math.random();
              $('#main-right-window').load(url);
            });
          }
        })
<?php
 } else { ?>
        loading('errorReturn');
        var url;
        url = 'deleterow.php?name='+encodeURI(name)+'&primary='+encodeURI(primary)+'&primaryValue='+encodeURI(primaryValue)+'&q='+Math.random();
        $.when( $('#errorReturn').load(url) ).then(function( data, textStatus, jqXHR ) {
          var url = 'loadtable.php?name='+encodeURI(name)+'&currPage='+page+'&q='+Math.random();
          $('#main-right-window').load(url);
        });        
<?php
 } ?>      
  }

  function loadTable(name, page, search = "", searchType = "", orderBy = "", ascDesc = "", type='table') {
    document.getElementById('navSearchBar').style = 'visible'
    var url = 'loadtable.php?name='+encodeURI(name)+'&currPage='+page+'&search='+encodeURI(search)+'&searchType='+encodeURI(searchType)+'&orderBy='+encodeURI(orderBy)+'&ascDesc='+encodeURI(ascDesc)+'&type='+type+'&q='+Math.random();
    //alert(url);
    loading('main-right-window');
    $('#main-right-window').load(url);
  }

  function editField(table, primary, primaryValue, col, type, page) {
    var url = 'editfield.php?table='+encodeURI(table)+'&primary='+encodeURI(primary)+'&primaryValue='+encodeURI(primaryValue)+'&colname='+col+'&coltype='+type+'&page='+page+'&q='+Math.random();
    loading('main-right-window');
    $('#main-right-window').load(url);
  }

  function deleteFile(table, col, primary, primaryValue) {
    var url = 'deletefile.php?table='+encodeURI(table)+'&colname='+col+'&primary='+encodeURI(primary)+'&primaryValue='+encodeURI(primaryValue)+'&q='+Math.random();
    $('#voidDiv').load(url);
  }

  function updateField(table, primary, primaryValue, colname, value, page) {
    var url = 'updatefield.php?table='+encodeURI(table)+'&primary='+encodeURI(primary)+'&primaryValue='+encodeURI(primaryValue)+'&colname='+encodeURI(colname)+'&page='+encodeURIComponent(page)+'&q='+Math.random();
    $.post(url, { value: value })
      .done(function( data ) {
        $('#errorReturn').append(data);
    })
  }

  function exportPDF(table, type) {
    var url = 'exportpdf.php?table='+encodeURI(table)+'&type='+type+'&q='+Math.random();
    window.open(url, '_blank');
  }

  function exportExcel(table, type) {
    var url = 'exportexcel.php?table='+encodeURI(table)+'&type='+type+'&q='+Math.random();
    window.open(url, '_blank');
  }

  function expandRow(table, primary, primaryValue) {
    var url = 'expandrow.php?table='+encodeURI(table)+'&primary='+encodeURI(primary)+'&primaryValue='+encodeURI(primaryValue)+'&q='+Math.random();
    loading('main-right-window');
    $('#main-right-window').load(url);
  }

  function setPicture(table, column, primary, primaryValue, picture) {
    var id = 'img_'+column;
    loading(id);
    var url = 'setpicture.php?table='+encodeURI(table)+'&column='+encodeURI(column)+'&primary='+encodeURI(primary)+'&primaryValue='+encodeURI(primaryValue)+'&picture='+encodeURI(picture)+'&q='+Math.random();
    $.ajax( url )
      .done(function(data) {
        document.getElementById(id).src = data;
        document.getElementById('serverimg_'+table+'_'+column).style.display = 'none';
        $.notify("Picture changed!", "success"); 
      })
  }

  function loadImgFromServer(table, column, primary, primaryValue) {
    loading('serverimg_'+table+'_'+column);
    var url = 'loadimgfromserver.php?table='+encodeURI(table)+'&column='+encodeURI(column)+'&primary='+encodeURI(primary)+'&primaryValue='+encodeURI(primaryValue)+'&q='+Math.random();
    $('#serverimg_'+table+'_'+column).load(url);
  }
  
  function searchFormOnSubmit(event) {
    if (event.which == 13 || event.keyCode == 13) {
      loadTable(_v('searchInWhatPage'), 0, _v('search'), _v('typeOfSearch'), '', '', _v('typeOfTable'));
      return false;
    }
    return true;
  };

  function searchForm(event) {
    if (event.which == 13 || event.keyCode == 13) {
      //alert('enter pressed');
      return false;
    }
    return true;
  };

  function isNumberTime(evt, id) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    v = document.getElementById(id).selectionStart;
    if ((v == 2) || (v == 5)) {
      return (charCode == 58);
    }
    if (charCode>=48 && charCode<=57) {
      return true;
    }
    return false;
  }

  function isNumberTimestamp(evt, id) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    v = document.getElementById(id).selectionStart;
    if ((v == 4) || (v == 7)) {
      return (charCode == 45);
    }
    if (v == 10) {
      return (charCode == 32);
    }
    if ((v == 13) || (v == 16)) {
      return (charCode == 58);
    }
    if (charCode>=48 && charCode<=57) {
      return true;
    }
    return false;
  }

  function isNumberFloat(evt, id) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    v = document.getElementById(id).selectionStart;
    if (charCode==45 && v==0)  // accept a '-' only as the first char
      return true;
    var hasPointAlready = _v(id).indexOf('.');
    if (hasPointAlready < 0) {
      if ( (charCode==46) || (charCode>=48 && charCode<=57) ) {
          return true;
      }
    } else {
      if ( charCode>=48 && charCode<=57 ) {
          return true;
      }
    }
    return false;
  }

  function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode==45 && v==0)  // accept a '-' only as the first char
      return true;
    if ( (charCode > 31 && charCode < 48) || charCode > 57) {
      return false;
    }
    return true;
  }

  function isBinaryNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode!=48 && charCode !=49) {
        return false;
    }
    return true;
  }
<?php
 if (substr($pageid, 0, 10)=='userpages_') { $description = substr($pageid, 10, 999); $key = array_search($description, $cfgPages); $n = substr($key, -1); $fileToLoad = $cfgPages["file-$n"]; $url = "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]"; $extraParam = parse_url($url, PHP_URL_QUERY); echo "loadUserPage('$fileToLoad', '$extraParam');"; } ?>

</script>
<?php
if ($pageid=='search') { $table = @mysqli_real_escape_string($conn, $_GET["table"]); $type = @mysqli_real_escape_string($conn, $_GET["type"]); $search = @mysqli_real_escape_string($conn, $_GET["search"]); } ?>
  <script>
  $.widget.bridge('uibutton', $.ui.button)
</script>
<script src="plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
<script src="quill.min.js"></script>
<script src="plugins/moment/moment.min.js"></script>
<script src="plugins/daterangepicker/daterangepicker.js"></script>
<script src="plugins/tempusdominus-bootstrap-4/js/tempusdominus-bootstrap-4.min.js"></script>
<script src="plugins/overlayScrollbars/js/jquery.overlayScrollbars.min.js"></script>
<script src="dist/js/adminlte.js"></script>
<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/v/bs4/dt-1.12.1/b-2.2.3/b-html5-2.2.3/b-print-2.2.3/sl-1.4.0/datatables.min.css"/>
<script type="text/javascript" src="https://cdn.datatables.net/v/bs4/dt-1.12.1/b-2.2.3/b-html5-2.2.3/b-print-2.2.3/sl-1.4.0/datatables.min.js"></script>

</body>
</html>
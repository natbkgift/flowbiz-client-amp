<?php
  session_start();

  require_once "const.php";

  $pageid = @mysqli_real_escape_string($conn, $_GET["pageid"]);
  if (strlen($pageid)<1)
    $pageid = @mysqli_real_escape_string($conn, @$_POST["pageid"]);

  $sellRent = @mysqli_real_escape_string($conn, $_GET["sellRent"]);
  
  // load all the settings
  $s = "SELECT * FROM settings";
  $result = $conn->query($s);
  $settings = $result->fetch_array(MYSQLI_ASSOC);

  $lang = @$_COOKIE["lang"];
  if (strlen($lang)<1) {
    $lang = $settings["defaultLanguage"];
    if ($lang == "")
      $lang = "en";
  }
  
  // load all the translation  
  $s = "SELECT word, en, cn, ar, ru, th FROM languages";
  $result = $conn->query($s);
  $languages = array("en", "cn", "ar", "ru", "th");
  while ($r = $result->fetch_array(MYSQLI_ASSOC)) {
      foreach ($languages as $currLang) {
          $word = strval(trim($r["word"]));
          $translated_word = strval(trim($r[$currLang]));
          (strlen($translated_word) > 0) ? $w[$word][$currLang] = $translated_word : $w[$word][$currLang] = $w[$word]["en"];
      }
  }  

  $s = "SELECT rightToLeft FROM availableLanguages WHERE name='$lang'";
  $r = $conn->query($s)->fetch_array(MYSQLI_ASSOC)["rightToLeft"];
  if ($r == 'Y')
    $rtl = 'rtl';
  else
    $rtl = 'ltr';

  $priceRentOptions = "<select name=\"priceRent\" class=\"selectpicker\" title=\"{$w["priceRange"][$lang]}\" data-hide-disabled=\"true\"><option value='0 - 0'>{$w["anyPrice"][$lang]}</option><option value='{$settings["rentRange1Value"]}'>{$settings["rentRange1Text"]}</option><option value='{$settings["rentRange2Value"]}'>{$settings["rentRange2Text"]}</option><option value='{$settings["rentRange3Value"]}'>{$settings["rentRange3Text"]}</option><option value='{$settings["rentRange4Value"]}'>{$settings["rentRange4Text"]}</option><option value='{$settings["rentRange5Value"]}'>{$settings["rentRange5Text"]}</option></select>";
  $priceSaleOptions = "<select name=\"priceSale\" class=\"form-control\" title=\"{$w["priceRange"][$lang]}\" data-hide-disabled=\"true\"><option value='0 - 0'>{$w["anyPrice"][$lang]}</option><option value='{$settings["saleRange1Value"]}'>{$settings["saleRange1Text"]}</option><option value='{$settings["saleRange2Value"]}'>{$settings["saleRange2Text"]}</option><option value='{$settings["saleRange3Value"]}'>{$settings["saleRange3Text"]}</option><option value='{$settings["saleRange4Value"]}'>{$settings["saleRange4Text"]}</option><option value='{$settings["saleRange5Value"]}'>{$settings["saleRange5Text"]}</option></select>";
?>

<!doctype html>
<html class="no-js" <?="dir=$rtl"?> lang="<?=$lang?>" id=html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title><?php echo $w["title"][$lang];?></title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Favicon -->
    <link rel="shortcut icon" type="image/x-icon" href="images/icons/favicon.png">

    <!-- All css files are included here. -->
    <!-- Bootstrap fremwork main css -->
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <!-- nivo slider CSS -->
    <link rel="stylesheet" href="lib/css/nivo-slider.css"/>
    <!-- This core.css file contents all plugings css file. -->
    <link rel="stylesheet" href="css/core.css">
    <!-- Theme shortcodes/elements style -->
    <link rel="stylesheet" href="css/shortcode/shortcodes.css">
    <!-- Theme main style -->
    <link rel="stylesheet" href="style.css">
    <!-- Responsive css -->
    <link rel="stylesheet" href="css/responsive.css">
    <!-- Template color css -->
    <link href="css/color/color-core.css" data-style="styles" rel="stylesheet">
    <!-- User style -->
    <link rel="stylesheet" href="css/custom.css">

    <script src="https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/8.11.8/sweetalert2.all.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/8.11.8/sweetalert2.css">

    <!-- Modernizr JS -->
    <script src="js/vendor/modernizr-2.8.3.min.js"></script>
    <script>
      document.addEventListener("DOMContentLoaded", function(event) { 

        $('#cat1').on('change', function() {
          var cat1 = encodeURIComponent(document.getElementById('cat1').value)
          var url = "<?=WEBSITE_URL?>/ajaxcat2.php?cat1="+cat1
          // alert(url)
          $("#cat2").load(url)      
          // $.ajax(url).done(function(result){
          //   var cat2 = document.getElementById('cat2')
          //   cat2.innerHTML = result
          // })
        })

        $('#typeOfSale').on('change', function() {
          if ((this.value == 'any') || (this.value == 'sale')) {
            document.getElementById('bigDivSelectPriceRent').style.display = "none";
            document.getElementById('bigDivSelectPriceSale').style.display = "block";
          } else {
            document.getElementById('bigDivSelectPriceRent').style.display = "block";
            document.getElementById('bigDivSelectPriceSale').style.display = "none";
          }
        })
      });    
    </script>

<script src="//cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>

</head>

<body>
    <!--[if lt IE 8]>
        <p class="browserupgrade">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
    <![endif]-->  

    <!-- Body main wrapper start -->
    <div class="wrapper">
	
        <!-- HEADER AREA START -->
        <header class="header-area header-wrapper">
            <div class="header-top-bar bg-white">
                <div class="container">
                    <div class="row">
                        <div class="col-md-3 col-sm-6 col-xs-12">
                            <div class="logo">
                                <a href="index.php">
                                    <img src="images/logo/logo.png" alt="">
                                </a>
                            </div>
                        </div>
                        <div class="col-md-9 hidden-sm hidden-xs">
                            <div class="company-info clearfix">
                                <div class="company-info-item">
                                  <div class="header-icon">
                                      <img src="images/icons/phone.png" alt="">
                                  </div>
                                  <div class="header-info">
                                      <h6><a href="tel:<?php echo $settings["phoneCleanWithoutExtraCharacters"];?>"><?php echo $w["phone"][$lang];?></a></h6>
                                      <p><?php echo $w["openingHours"][$lang];?></p>
                                  </div>
                                </div>
                                <div class="company-info-item">
                                  <div class="header-icon">
                                      <img src="images/icons/mail-open.png" alt="">
                                  </div>
                                  <div class="header-info">
                                      <h6><a href="mailto:<?php echo $w["email"][$lang];?>"><?php echo $w["email"][$lang];?></a></h6>
                                      <p><?php echo $w["emailText"][$lang];?></p>
                                  </div>
                                </div>
                            </div>
                        </div>
                        <?php /*
                        <div class="col-md-2 col-sm-6 col-xs-12">
                            <div class="header-search clearfix">
                                <form action="#">
                                    <input type=hidden name=pageid value=search>
                                    <button class="search-icon" type="submit">
                                        <img src="images/icons/search.png" alt="">
                                    </button>
                                    <input type="text" placeholder="Search...">
                                </form>
                            </div>
                        </div>                        
                        */ ?>
                    </div>
                </div>
            </div>
            <!-- <div id="sticky-header" class="header-middle-area  transparent-header hidden-xs" style="background: rgba(0, 150, 216, 0.9)"> -->
            <div id="sticky-header" class="header-middle-area  transparent-header hidden-xs" style="background: rgba(255, 255, 255, 0.8)">
                <div class="container">
                    <div class="full-width-mega-drop-menu">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="sticky-logo">
                                    <a href="index.php">
                                        <img src="images/logo/logo.png" alt="">
                                    </a>
                                </div>
                                <nav id="primary-menu">
                                    <ul class="main-menu text-center">
                                        <li><a href="index.php"><?php echo $w["menuHome"][$lang];?></a>
                                        </li>
                                        <li><a href="?index.php#servicesLink"><?php echo $w["menuServices"][$lang];?></a>
                                        </li>
                                        <li><a href="?pageid=all"><?php echo $w["menuProperty"][$lang];?></a>
                                            <ul class="drop-menu">
                                                <li><a href="?pageid=all"><?php echo $w["allProperty"][$lang];?></a></li>
<?php
                                                  $cat1 = zbSQLAssocMulti("SELECT DISTINCT UPPER(cat1) AS cat1 FROM home WHERE cat1<>'' AND importCrawlId>0 ORDER BY cat1");
                                                  // $result = $conn->query("SELECT DISTINCT UPPER(cat1) AS cat1 FROM home WHERE cat1<>'' ORDER BY cat1");
                                                  for($i=0; $i<count($cat1); ++$i) {
                                                    echo "<li><a href='?pageid=all&search=true&cat1={$cat1[$i]["cat1"]}'>{$cat1[$i]["cat1"]}</a></li>";
                                                  }
?>                  
                                            </ul>
                                        </li>
                                        <li><a href="?index.php#agentsLink"><?php echo $w["menuAgents"][$lang];?></a>
                                        </li>
                                        <li><a href="?pageid=aboutus"><?php echo $w["menuAboutUs"][$lang];?></a>
                                        </li>
                                        <li><a href="?pageid=contactus"><?php echo $w["menuContactUs"][$lang];?></a></li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
        <!-- HEADER AREA END -->

        <!-- MOBILE MENU AREA START -->
        <div class="mobile-menu-area hidden-sm hidden-md hidden-lg">
            <div class="container">
                <div class="row">
                    <div class="col-xs-12">
                        <div class="mobile-menu">
                            <nav id="dropdown">
                                <ul>
                                    <li><a href="index.php"><?php echo $w["menuHome"][$lang];?></a>
                                    </li>
                                    <li><a href="?index.php#servicesLink"><?php echo $w["menuServices"][$lang];?></a>
                                    </li>
                                    <li><a href="?pageid=all"><?php echo $w["menuProperties"][$lang];?></a>
                                        <ul>
                                                <li><a href="?pageid=all"><?php echo $w["allProperty"][$lang];?></a></li>
<?php
                                                  $cat1 = zbSQLAssocMulti("SELECT DISTINCT UPPER(cat1) AS cat1 FROM home WHERE cat1<>'' AND importCrawlId>0 ORDER BY cat1");
                                                  // $result = $conn->query("SELECT DISTINCT UPPER(cat1) AS cat1 FROM home WHERE cat1<>'' ORDER BY cat1");
                                                  for($i=0; $i<count($cat1); ++$i) {
                                                    echo "<li><a href='?pageid=all&search=true&cat1={$cat1[$i]["cat1"]}'>{$cat1[$i]["cat1"]}</a></li>";
                                                  }
?>                  
                                        </ul>
                                    </li>
                                    <li><a href="?index.php#agentsLink"><?php echo $w["menuAgents"][$lang];?></a>
                                    </li>
                                    <li><a href="?pageid=aboutus"><?php echo $w["menuAboutUs"][$lang];?></a>
                                    </li>
                                    <li><a href="?pageid=contactus"><?php echo $w["menuContactUs"][$lang];?></a></li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- MOBILE MENU AREA END -->

<?php
  if ($pageid=='') {
?>        
        <!-- SLIDER SECTION START -->
        <div class="slider-1 pos-relative slider-overlay">
            <div class="bend niceties preview-1">
                <div id="ensign-nivoslider-3" class="slides">   
<?php
                  $result = $conn->query("SELECT img1920x880 FROM slider");
                  $n = 1;
                  while ($r = $result->fetch_array(MYSQLI_ASSOC)) {
                    echo "<img src=\"images/slider/".$r["img1920x880"]."\" alt=\"\" title=\"#slider-direction-$n\"/>";
                    $n++;
                  }
?>
                </div>               
<?php				
                $result = $conn->query("SELECT * FROM slider");
                $n = 1;
                $currLang = $lang;
                while ($r = $result->fetch_array(MYSQLI_ASSOC)) {
                  if (strlen($r["title1_$lang"])==0)
                    $currLang = "en";
?>                    
                <div id="slider-direction-<?php echo $n;?>" class="slider-direction">
                    <div class="slider-content text-center">
                        <div class="wow fadeInUp" data-wow-duration="1s" data-wow-delay="0.5s">
                            <h4 class="slider-1-title-1"><?php echo $r["title1_$currLang"];?></h4>
                        </div>
                        <div class="wow fadeInUp" data-wow-duration="1s" data-wow-delay="1s">
                            <h1 class="slider-1-title-2"><?php echo $r["title2_$currLang"];?></h1>
                        </div>
                        <div class="wow fadeInUp" data-wow-duration="1s" data-wow-delay="1.5s">
                            <p class="slider-1-desc"><?php echo $r["title3_$currLang"];?></p>
                        </div>
<?php
                          if ($r["homeLink"]>0) {
?>
                            <div class="wow fadeInUp" data-wow-duration="1s" data-wow-delay="2s">
                              <a class="slider-button mt-40" href="?pageid=home&id=<?php echo $r["homeLink"];?>"><?php echo $w["moreDetails"][$lang];?></a>
                            </div>
<?php
                          }
?>
                    </div>
                </div>
<?php
                  $n++;
                }                
?>
				
            </div>
        </div>
        <!-- SLIDER SECTION END -->

        <!-- Start page content -->
        <section id="page-content" class="page-wrapper">
            
<?php    findYourHome(); ?>
           

            <!-- LOCATIONS -->
            <div class="featured-flat-area pt-115 pb-80">
                <div class="container">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="section-title-2 text-center">
                                <h2><?php echo $w["featuredCities"][$lang];?></h2>
                                <p><?php echo $w["featuredCitiesSubtitle"][$lang];?></p>
                            </div>
                        </div>
                    </div>
                    <div class="featured-flat">
                        <div class="row">
<?php                        
                          $result = $conn->query("SELECT * FROM cities ORDER BY sortOrder");
                          $n = 1;
                          while ($r = $result->fetch_array(MYSQLI_ASSOC)) {
                            $nameSanitized = strtoupper(mysqli_real_escape_string($conn, $r['nameInDB']));
                            $link = "?pageid=all&search=true&type=sale&cat1=".urlencode($r['nameInDB']);
?>
<div class="col-md-4 hidden-sm col-xs-12">

  <div class="flat-item">
      <div class="flat-item-image">
          <a href="<?=$link?>"><img src="<?=WEBSITE_URL?>/mv/cities/<?=$r["pic"]?>" alt="<?=$r['name']?>"></a>
          <div class="flat-link">
              <a href="<?=$link?>"><?=$w["moreDetails"][$lang]?></a>
          </div>
          <ul class="flat-desc">
              <li>
                  <span style='color:white'><?=number_format(zbSQL("SELECT COUNT(*) FROM home WHERE UPPER(cat1)='$nameSanitized'"))." ".$w['propertiesIn'][$lang]." ".$r['name']?></span>
              </li>
          </ul>
      </div>
  </div>

</div>

<?php
                            $n++;
                          }
?>
                        </div>
                    </div>
                </div>
            </div>
            <!-- LOCATIONS -->

            <!-- ABOUT AREA START -->
            <div class="about-sheltek-area ptb-115">
                <div class="container">
                    <div class="row">
                        <div class="col-sm-6 col-xs-12">
                            <div class="section-title mb-30">
                                <h3><?php echo $w["ourCompanyTitle"][$lang];?></h3>
                                <h2><?php echo $w["ourCompanySubtitle"][$lang];?></h2>
                            </div>
                            <div class="about-sheltek-info">
                                <p><?php echo $w["companyDescription"][$lang];?></p>
                            </div>
                        </div>
                        <div class="col-sm-6 col-xs-12">
                            <div class="about-image">
                                <a href="?pageid=aboutus"><img src="images/about/<?php echo $settings["imgCompany528x385"];?>" alt=""></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- ABOUT AREA END -->
            
            <!-- SERVICES AREA START -->
            <a name="servicesLink"></a>
            <div class="services-area pb-60">
                <div class="container">
                  <div class="row">
                      <div class="col-md-12">
                          <div class="section-title-2 text-center">
                              <h2><?php echo $w["ourServices"][$lang];?></h2>
                              <p><?php echo $w["ourServicesSubtitle"][$lang];?></p>
                          </div>
                      </div>
                  </div>
                    <div class="row">
                        <div class="service-carousel">
<?php
                            $n = 1;
                            $result = $conn->query("SELECT * FROM service");
                            while ($r = $result->fetch_array(MYSQLI_ASSOC)) {
?>                  
                            <!-- service-item -->
                            <div class="col-md-12">
                                <div class="service-item">
                                    <div class="service-item-image">
                                        <a href="?pageid=aboutus"><img src="images/service/<?php echo $r["image270x211"];?>" alt=""></a>
                                    </div>
                                    <div class="service-item-info">
                                        <h5><a href="?pageid=aboutus"><?php if (!$r["title_$lang"]) $r["title_$lang"] = $r["title_en"]; echo $r["title_$lang"];?></a></h5>
                                        <p><?php if (!$r["description_$lang"]) $r["description_$lang"] = $r["description_en"]; echo $r["description_$lang"];?></p>
                                    </div>
                                </div>
                            </div>
<?php
                            }
?>
                        </div>
                    </div>
                </div>
            </div>
            <!-- SERVICES AREA END -->
            
            <!-- BOOKING AREA START -->
            <!--<div class="booking-area bg-1 call-to-bg plr-140 pt-75"> -->
            <div style='background: url(images/<?php echo $settings["imgCentralBanner1765x245"];?>);' class="booking-area call-to-bg plr-140 pt-75">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-md-3 col-sm-4 col-xs-12">
                            <div class="section-title text-white">
                                <h3><?php echo $w["centralBanner1"][$lang];?></h3>
                                <h2 class="h1"><?php echo $w["centralBanner2"][$lang];?></h2>
                            </div>
                        </div>
                        <div class="col-md-9 col-sm-8 col-xs-12">
                            <div class="booking-conternt clearfix">
                                <div class="book-house text-white">
                                    <h2><?php echo $w["centralBannerText1"][$lang];?></h2>
                                    <h2 class="h5"><?php echo $w["centralBannerText2"][$lang];?></h2>
                                </div>
                                <div class="booking-imgae">
                                    <img src="images/<?php echo $settings["imgCentralBannerRight177x270"];?>" alt="">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- BOOKING AREA END -->
            
            <!-- FEATURED FLAT AREA START -->
            <div class="featured-flat-area pt-115 pb-80">
                <div class="container">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="section-title-2 text-center">
                                <h2><?php echo $w["featuredTitle"][$lang];?></h2>
                                <p><?php echo $w["featuredText"][$lang];?></p>
                            </div>
                        </div>
                    </div>
                    <div class="featured-flat">
                        <div class="row">
<?php                        
                          $result = $conn->query("SELECT * FROM home WHERE isFeatured='Y'");
                          $n = 1;
                          while ($r = $result->fetch_array(MYSQLI_ASSOC)) {
                            ?><div class="col-md-4 hidden-sm col-xs-12"><?php
                            printSingleHome($r);
                            ?></div><?php
                            $n++;
                          }
?>
                        </div>
                    </div>
                </div>
            </div>
            <!-- FEATURED FLAT AREA END -->
            
            <!-- OUR AGENTS AREA START -->
            <a name="agentsLink"></a>
            <div class="our-agents-area pt-115 pb-55">
                <div class="container">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="section-title-2 text-center">
                                <h2><?php echo $w["ourAgents"][$lang];?></h2>
                                <p><?php echo $w["ourAgentsDescription"][$lang];?></p>
                            </div>
                        </div>
                    </div>
                    <div class="our-agents">
                        <div class="row">
                            <div class="agents-carousel">
    							<!-- single-agent -->
<?php
                              $n = 1;
                              $result = $conn->query("SELECT * FROM agent");
                              while ($r = $result->fetch_array(MYSQLI_ASSOC)) {
?>                  
                                <div class="col-md-12">
                                    <div class="single-agent">
                                        <div class="agent-image">
                                          <a 
                                          <?
                                          if (strlen($r["cv"])>0) {
                                            echo "onclick=\"Swal.fire({
                                              icon: 'info',
                                              title: '{$r["name"]}',
                                              html: '{$r["cv"]}'
                                            })\" return false;'";
                                          }
                                          ?> 
                                         >                                         
                                          <img src="images/agents/<?php echo $r["image"];?>" alt="">
                                          </a>
                                        </div>
                                        <div class="agent-info">
                                            <div class="agent-name">
                                                <h5>
                                                <a href='#'>
                                                <?php echo $r["name"];?></a>
                                                </h5>
                                                <p><?php echo $r["title"];?></p>
                                            </div>
                                        </div>
                                        <div class="agent-info-hover">
                                            <div class="agent-name">
                                                <h5>
                                                <a 
                                                <?
                                                if (strlen($r["cv"])>0) {
                                                  echo "onclick=\"Swal.fire({
                                                    icon: 'info',
                                                    title: '{$r["name"]}',
                                                    html: '{$r["cv"]}'
                                                  })\" return false;'";
                                                }
                                                ?>     
                                                ><?php echo $r["name"];?>
                                                </a>
                                                </h5>
                                                <p><?php echo $r["title"];?></p>
                                            </div>
                                            <ul class="agent-address">
                                                <li><img src="images/icons/phone-2.png" alt=""><a href='tel:<?php echo $r["phone"];?>'><?php echo $r["phone"];?></a></li>
                                                <li><img src="images/icons/mail-close.png" alt=""><a href='mailto:<?php echo $r["email"];?>'><?php echo $r["email"];?></a></li>
                                            </ul>
                                            <ul class="social-media">
                                            <?php
                                              if (strlen($r["facebook"])>0) {
                                                echo "<li><a href=\"".$r["facebook"]."\"><i class=\"fa fa-facebook\" aria-hidden=\"true\"></i></a></li>";
                                              }
                                              if (strlen($r["twitter"])>0) {
                                                echo "<li><a href=\"".$r["twitter"]."\"><i class=\"fa fa-twitter\" aria-hidden=\"true\"></i></a></li>";
                                              }
                                              if (strlen($r["linkedin"])>0) {
                                                echo "<li><a href=\"".$r["linkedin"]."\"><i class=\"fa fa-linkedin\" aria-hidden=\"true\"></i></a></li>";
                                              }
                                              if (strlen($r["googleplus"])>0) {
                                                echo "<li><a href=\"".$r["googleplus"]."\"><i class=\"fa fa-google-plus\" aria-hidden=\"true\"></i></a></li>";
                                              }
                                              if (strlen($r["wechat"])>0) {
                                                echo "<li><a href=\"weixin://dl/chat?{".$r["wechat"]."}\"><i class=\"fa fa-weixin\" aria-hidden=\"true\"></i></a></li>";
                                              }
                                              if (strlen($r["whatsapp"])>0) {
                                                echo "<li><a href=\"https://api.whatsapp.com/send?phone=".$r["whatsapp"]."\"><i class=\"fa fa-whatsapp\" aria-hidden=\"true\"></i></a></li>";
                                              }
                                              if (strlen($r["line"])>0) {
// https://line.me/ti/p/~pattayacentral
                                                echo "<li><a target='_blank' href=\"".$r["line"]."\"><font style=\"background-color:#00b900;\">&nbsp;&nbsp;<i class=\"fa fa-comment-o\"></i>&nbsp;&nbsp;LINE&nbsp;&nbsp;</font></a>";
                                              }
                                            ?>
                                            </ul>
                                            
                                        </div>
                                    </div>
                                </div>
<?php
                              }
?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- OUR AGENTS AREA END -->

        </section>
        <!-- End page content -->

<?php
  }        
?>

<?php
  if ($pageid=='aboutus') {
?>

  <!-- BREADCRUMBS AREA START -->
      <div class="breadcrumbs-area bg-opacity-black-70" style='background: url(images/<?php echo $settings["imgAboutUs1920x433"];?>);'>
      <div class="container">
          <div class="row">
              <div class="col-xs-12">
                  <div class="breadcrumbs">
                      <h2 class="breadcrumbs-title"><?php echo $w["menuAboutUs"][$lang];?></h2>
                      <ul class="breadcrumbs-list">
                          <li><a href="index.php"><?php echo $w["menuHome"][$lang];?></a></li>
                          <li><?php echo $w["menuAboutUs"][$lang];?></li>
                      </ul>
                  </div>
              </div>
          </div>
      </div>
  </div>
  <!-- BREADCRUMBS AREA END -->

  <!-- Start page content -->
  <section id="page-content" class="page-wrapper">
    <!-- ABOUT SHELTEK AREA START -->
    <div class="about-sheltek-area ptb-115">
        <div class="container">
  
<?php
    $n = 1;
    $result = $conn->query("SELECT * FROM aboutUs");
    $currLang = $lang;
    while ($r = $result->fetch_array(MYSQLI_ASSOC)) {
      if (strlen($r["title1_$lang"])==0)
        $currLang = "en";
?>
              <div class="row">
                  <div class="col-sm-6 col-sm-push-6 col-xs-12">
                  <?php if ($r["title1_$currLang"]) { ?>
                      <div class="section-title mb-30">
                          <h3><?php echo $r["title1_$currLang"];?></h3>
                          <h2><?php echo $r["title2_$currLang"];?></h2>
                      </div>
                  <?php } ?>    
                      <div class="about-sheltek-info">
                          <p><?php echo $r["description_$currLang"];?></p>
                          <div class="author-quote">
                            <?php if ($r["list1_$currLang"]) echo "<p>".$r["list1_$currLang"]."</p>";?>
                            <?php if ($r["list2_$currLang"]) echo "<p>".$r["list2_$currLang"]."</p>";?>
                            <?php if ($r["list3_$currLang"]) echo "<p>".$r["list3_$currLang"]."</p>";?>
                          </div>
                      </div>
                  </div>
                  <div class="col-sm-6 col-sm-pull-6 col-xs-12">
                      <div class="about-image">
                          <img src="images/about/<?php echo $r["img561x408"];?>" alt="">
                      </div>
                  </div>
              </div>
              <hr>
<?php
    }
?>
        </div>
    </div>
    <!-- ABOUT SHELTEK AREA END -->
    <?php findYourHome(); ?>
  </section>
  <!-- End page content -->

<?php
  }        
?>

<?php
  if ($pageid=='all') {
    $search = @mysqli_real_escape_string($conn, $_GET["search"]);

?>
            <!-- FEATURED FLAT AREA START -->
            <div class="featured-flat-area pt-115 pb-80">
                <div class="container">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="section-title-2 text-center">
                                <h2><?php if ($search=='true') echo $w["searchResults"][$lang]; else echo $w["allProperty"][$lang];?></h2>
                            </div>
                        </div>
                    </div>
                    <div class="featured-flat">
<?php                        
                          if ($search=='true') {
                            // $s = "SELECT * FROM home WHERE (1=1) ";
                            // print_r($_GET);
                            $s = "";
                            $page     = intval(@mysqli_real_escape_string($conn, $_GET["page"]));
                            $cat1     = @mysqli_real_escape_string($conn, $_GET["cat1"]);
                            $cat1new  = @zbSQL("SELECT nameInDB FROM cities WHERE UPPER(`name`)=UPPER('$cat1')");
                            $cat2     = @mysqli_real_escape_string($conn, $_GET["cat2"]);
                            $minArea  = @mysqli_real_escape_string($conn, $_GET["min-area"]);
                            $maxArea  = @mysqli_real_escape_string($conn, $_GET["max-area"]);
                            $bed      = @mysqli_real_escape_string($conn, $_GET["bed"]);
                            $type     = @mysqli_real_escape_string($conn, $_GET["type"]);

                            if ($type == 'sale') {
                              $price  = @mysqli_real_escape_string($conn, $_GET["priceSale"]);
                            } else {
                              if ($type == 'rent') {
                                $price  = @mysqli_real_escape_string($conn, $_GET["priceRent"]);
                              } else {
                                $price = "0 - 999999999";
                              }
                            }
                            if ($cat1new) 
                              if ($cat1new != $w["any"][$lang])
                                $s .= " AND UPPER(cat1)=UPPER('$cat1new') ";
                            if ($cat2) 
                              if ($cat2 != $w["any"][$lang])
                                $s .= " AND UPPER(importLocation)=UPPER('$cat2') ";
                            if ($minArea) 
                              $s .= " AND area>=$minArea ";
                            if ($maxArea) 
                              $s .= " AND area<=$maxArea ";
                            if ($bed) {
                              if ($bed != $w["any"][$lang]) {
                                if ($bed=='4')
                                  $s .= " AND nBedrooms >= 4 ";
                                else
                                  $s .= " AND nBedrooms = '$bed' ";
                              }
                            }
                            if ($type) {
                              if ($type=='sale') {
                                  $s .= " AND type = 'SALE' ";
                              } 
                              if ($type=='rent') {
                                  $s .= " AND type = 'RENT' ";
                              } 
                            }
                            $priceMinMax = explode("-", $price);
                            $priceMin = @intval($priceMinMax[0]*1000000);
                            $priceMax = @intval($priceMinMax[1]*1000000);
                            if ($priceMax==10000000)
                              $priceMax=999999999;
                            if (($priceMin!=0)&&($priceMax!=0))
                              $s .= " AND price>=$priceMin AND price<=$priceMax ";
                            $pageLength = 15;
                            $total = @zbSQL("SELECT COUNT(*) FROM home WHERE (1=1) $s");

                            $url1 = "?pageid=all&search=true&page=0&cat1=".urlencode($cat1)."&cat2=".urlencode($cat2)."&minArea=$minArea-area&max-area=$maxArea&bed=$bed&type=$type";
                            $url2 = "?pageid=all&search=true&page=".($page>0?$page-1:0)."&cat1=".urlencode($cat1)."&cat2=".urlencode($cat2)."&minArea=$minArea-area&max-area=$maxArea&bed=$bed&type=$type";
                            $url3 = "?pageid=all&search=true&page=".($page<($total/$pageLength)-1?$page+1:(intval($total/$pageLength)))."&cat1=".urlencode($cat1)."&cat2=".urlencode($cat2)."&minArea=$minArea&max-area=$maxArea&bed=$bed&type=$type";
                            $url4 = "?pageid=all&search=true&page=".(intval($total/$pageLength))."&cat1=".urlencode($cat1)."&cat2=".urlencode($cat2)."&minArea=$minArea&max-area=$maxArea&bed=$bed&type=$type";
                        
                            $s = "SELECT * FROM home WHERE (1=1) $s LIMIT ".($page*$pageLength).",$pageLength";
                            // echo "***$s***<br>";
                            $result = $conn->query($s);
                          } else {
                            $result = $conn->query("SELECT * FROM home");
                          }
?>
<?php
  if ($total > $pageLength) {
?>    
  <center>
    <a href='<?=$url1?>' class='btn btn-primary'>|&lt;&lt;</a>&nbsp;&nbsp;
    <a href='<?=$url2?>' class='btn btn-primary'>&lt;&lt;</a>&nbsp;&nbsp;
    <a class='btn btn-primary'><?=(1+$page*15)." / $total"?></a>
    <a href='<?=$url3?>' class='btn btn-primary'>&gt;&gt;</a>&nbsp;&nbsp;
    <a href='<?=$url4?>' class='btn btn-primary'>&gt;&gt;|</a>&nbsp;&nbsp;
  </center>  
  <br><br>
<?php
  }
?>    
<?php
                          $r = zbSQLAssocMulti($s);
                          for($n=0; $n<count($r); ++$n) {
                            if ($n%3 == 0) {
                              echo "<div class=row>";
                            }
?>
                            <div class="col-md-4 hidden-sm col-xs-12">
<?php
                              $lazudiLink = @zbSQL("SELECT link FROM crawl WHERE id=".$r[$n]['importCrawlId']);
                              printSingleHome2($r[$n]);
                              // echo "<a class='btn btn-warning' target=_blank href='$lazudiLink'>Open</a>";
?>
                            </div>
<?php
                            if ($n%3 == 2) {
                              echo "</div>";
                            }
                          }
                          if (($n-1)%3 != 2) {
                            echo "</div>";
                          }
                        if ($n == 0) {
                            echo "<center><h3>".$w["noHomeFound"][$lang]."</h3></center>";
                            echo "<hr>";
                            echo "<div class=\"section-title-2 text-center\">";
                            echo "    <h2>".$w["featuredTitle"][$lang]."</h2>";
                            echo "    <p>".$w["featuredText"][$lang]."</p>";
                            echo "</div>";
                            $result = $conn->query("SELECT * FROM home WHERE isFeatured='Y'");
                            while ($r = $result->fetch_array(MYSQLI_ASSOC)) {
?>
                              <div class="col-md-4 hidden-sm col-xs-12">
<?php
                                printSingleHome2($r);
?>
                              </div>
<?php
                              $n++;
                            }
                          }
?>

<?php
  if ($total > $pageLength) {
?>    
  <center>
    <a href='<?=$url1?>' class='btn btn-primary'>|&lt;&lt;</a>&nbsp;&nbsp;
    <a href='<?=$url2?>' class='btn btn-primary'>&lt;&lt;</a>&nbsp;&nbsp;
    <a class='btn btn-primary'><?=(1+$page*15)." / $total"?></a>
    <a href='<?=$url3?>' class='btn btn-primary'>&gt;&gt;</a>&nbsp;&nbsp;
    <a href='<?=$url4?>' class='btn btn-primary'>&gt;&gt;|</a>&nbsp;&nbsp;
  </center>  
  <br><br>
<?php
  }
?>  
                        </div>
                    </div>
                </div>
            </div>
            <!-- FEATURED FLAT AREA END -->           
<?php
    findYourHome();
  }
?>
  
<?php
  if ($pageid=='home') {
    $id = @mysqli_real_escape_string($conn, $_GET["id"]);
    $h = $conn->query("SELECT * FROM home WHERE id='$id'")->fetch_array(MYSQLI_ASSOC);
?>        
        <div class="breadcrumbs-area bg-opacity-black-70" style='background: url(images/<?php echo $settings["imgProperty1920x433"];?>);'>
            <div class="container">
                <div class="row">
                    <div class="col-xs-12">
                        <div class="breadcrumbs">
                            <h2 class="breadcrumbs-title"><?php echo $w["propertyDetails"][$lang];?></h2>
                            <ul class="breadcrumbs-list">
                                <li><a href="index.php"><?php echo $w["home"][$lang];?></a></li>
                                <li><a href="?pageid=all"><?php echo $w["properties"][$lang];?></a></li>
                                <li><?php echo $w["propertyDetails"][$lang];?></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- BREADCRUMBS AREA END -->

        <!-- Start page content -->
        <section id="page-content" class="page-wrapper">

            <!-- PROPERTIES DETAILS AREA START -->
            <div class="properties-details-area pt-115 pb-60">
                <div class="container">
                    <div class="row">
                        <div class="col-md-8">
                        <h1><?php echo $h["name"];?></h1>
                            <!-- pro-details-image -->
                            <div class="pro-details-image mb-60">
                                <div class="pro-details-big-image">
                                    <div class="tab-content">
<?php                                    
                                      $n = 1;
                                      while ($h["img$n"]) {
                                        $path = 'big';
                                        if ($h['importCrawlId']) {
                                          $path = 'lz';
                                        }
?>
                                        <div role="tabpanel" class="tab-pane fade in <?php if ($n==1) echo "active";?>" id="pro-<?php echo $n;?>">
                                            <a href="images/single-property/<?=$path?>/<?php echo $h["img$n"]; ?>" data-lightbox="image-1" data-title="Property <?php echo $n;?>">
                                                <img src="images/single-property/<?=$path?>/<?php echo $h["img$n"];?>" alt="">
                                            </a>
                                        </div>
<?php
                                        $n++;
                                        if ($n>10)
                                          break;
                                      }
?>                                      
                                    </div>
                                </div>
                                <div class="pro-details-carousel">
<?php                                    
                                    $n = 1;
                                    while ($h["img$n"]) {
?>
                                    <div class="pro-details-item">
                                        <a href="#pro-<?php echo $n;?>" data-toggle="tab"><img src="images/single-property/<?=$path?>/<?php echo $h["img$n"];?>" alt=""></a>
                                    </div>
<?php
                                        $n++;
                                        if ($n>10)
                                          break;
                                      }
?>                                      
                                </div>                           
                            </div>
                            <!-- pro-details-short-info -->
                            <div class="pro-details-short-info mb-60">
                                <div class="row">
                                    <div class="col-sm-6 col-xs-12">
                                        <div class="pro-details-condition">
                                            <h5><?php echo $w["propertyDetails"][$lang];?></h5>
                                            <div class="pro-details-condition-inner bg-gray">
                                                <ul class="condition-list">
                                                    <?php
                                                      if ($h["type"]=='SALE')
                                                        echo $w["propertyForSale"][$lang];
                                                      else
                                                        echo $w["propertyForRent"][$lang];
                                                    ?>
                                                    <li>&nbsp;</li>
                                                    <li><img style="background: black; mix-blend-mode: difference;" src="images/icons/4.png" alt=""><?php echo $h["area"];?> m<sup>2</sup></li>
                                                    <li><img style="background: black; mix-blend-mode: difference;" src="images/icons/5.png" alt=""><?php if ($h["nBedrooms"]==0) echo "STUDIO"; else echo $h["nBedrooms"];?></li>
                                                    <li><img style="background: black; mix-blend-mode: difference;" src="images/icons/6.png" alt=""><?php echo $h["nBathrooms"];?></li>
<?php
                                                    if ($h["nGarage"]>0) {
                                                      echo "<li><img style='background: black; mix-blend-mode: difference;' src='images/icons/13.png'>".$h["nGarage"]."</li>";
                                                    }
                                                    if ($h["nKitchen"]>0) {
                                                      echo "<li><img style='background: black; mix-blend-mode: difference;' src='images/icons/14.png'>".$h["nKitchen"]."</li>";
                                                    }
?>                                                    
                                                    <li><img src="images/icons/money.png" alt=""><?php echo number_format($h["price"]);?> &#3647;</li>

<?php
                                                    if ($pTmp = strpos($h["importExtraInfo"], 'Floors')) {
                                                      $floors = intval(substr($h["importExtraInfo"], $pTmp+8,3));
                                                      $floors = $w['totalFloors'][$lang].": $floors";
?>
                                                      <li>
                                                          <img src="images/icons/13.png"  style='background: black; mix-blend-mode: difference;' alt="">
                                                          <span><?=$floors?></span>
                                                      </li>
<?php
                                                    }
                                                    if ($pTmp = strpos($h["importExtraInfo"], 'Completed')) {
                                                      $year = intval(substr($h["importExtraInfo"], $pTmp+11,5));
                                                      $year = $w['yearCompleted'][$lang]." $year";
?>
                                                      <li>
                                                          <span><?=$year?></span>
                                                      </li>
<?php
                                                    }
?>
                                                </ul>
<?php
          if ($h['cat2']) {
?>
          <p><img style="background: black; mix-blend-mode: difference;" src="images/icons/location.png" alt=""><?=$h['cat2']?></p>
<?php
          }
?>                    
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-sm-6 col-xs-12">
                                        <div class="pro-details-amenities">
                                            <h5><?php echo $w["amenities"][$lang];?></h5>
                                            <div class="pro-details-amenities-inner bg-gray">
                                                <ul class="amenities-list">
<?php
  if ($h['importCrawlId']) {
    if (strpos($h["importExtraInfo"], 'Pool')) {
      echo "<li>".$w["hasPool"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'Gym')) {
      echo "<li>".$w["hasGym"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'Balcony')) {
      echo "<li>".$w["hasBalcony"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'Pool')) {
      echo "<li>".$w["hasAirCon"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'WiFi')) {
      echo "<li>".$w["hasInternet"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'Elevator')) {
      echo "<li>".$w["hasLift"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'Parking')) {
      echo "<li>".$w["hasParking"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'Cable')) {
      echo "<li>".$w["hasCableTV"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'Sauna')) {
      echo "<li>".$w["hasSauna"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'Steam')) {
      echo "<li>".$w["hasSteamRoom"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'Security')) {
      echo "<li>".$w["hasSecurity"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'CCTV')) {
      echo "<li>".$w["hasCCTV"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'Game')) {
      echo "<li>".$w["hasGameRoom"][$lang]."</li>";
    }
    if (strpos($h["importExtraInfo"], 'Washing')) {
      echo "<li>".$w["hasWashingMachine"][$lang]."</li>";
    }
} else {
                                                  if (strtoupper($h["hasPool"])=='Y') {
                                                    echo "<li>".$w["hasPool"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasGym"])=='Y') {
                                                    echo "<li>".$w["hasGym"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasBalcony"])=='Y') {
                                                    echo "<li>".$w["hasBalcony"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasAirCon"])=='Y') {
                                                    echo "<li>".$w["hasAirCon"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasInternet"])=='Y') {
                                                    echo "<li>".$w["hasInternet"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasLift"])=='Y') {
                                                    echo "<li>".$w["hasLift"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasParking"])=='Y') {
                                                    echo "<li>".$w["hasParking"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasCableTV"])=='Y') {
                                                    echo "<li>".$w["hasCableTV"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasSauna"])=='Y') {
                                                    echo "<li>".$w["hasSauna"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasSteamRoom"])=='Y') {
                                                    echo "<li>".$w["hasSteamRoom"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasSecurity"])=='Y') {
                                                    echo "<li>".$w["hasSecurity"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasCCTV"])=='Y') {
                                                    echo "<li>".$w["hasCCTV"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasGameRoom"])=='Y') {
                                                    echo "<li>".$w["hasGameRoom"][$lang]."</li>";
                                                  }
                                                  if (strtoupper($h["hasWashingMachine"])=='Y') {
                                                    echo "<li>".$w["hasWashingMachine"][$lang]."</li>";
                                                  }
  }
?>                                                
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- pro-details-description -->
                            <div class="pro-details-description mb-50">
                              <h5><?php echo $w["description"][$lang];?></h5>
                              <p><?php if (!$h["description_$lang"]) $h["description_$lang"] = $h["description_en"]; echo $h["description_$lang"];?></p>
                            </div>
<?php
  if ($h["agentId"]>0) {
    $a = $conn->query("SELECT * FROM agent WHERE id='".$h["agentId"]."'")->fetch_array(MYSQLI_ASSOC);
?>
                            <!-- agent-review -->
                            <div class="pro-details-agent-review">
                                <div class="row">
                                    <!-- single-agent -->
                                    <div class="col-md-5 col-sm-5 col-xs-12">
                                        <div class="pro-details-agent">
                                            <h5><?php echo $w["contactAgent"][$lang];?></h5>
                                            <div class="single-agent">
                                                <div class="agent-image">
                                                    <img src="images/agents/<?php echo $a["image"];?>" alt="">
                                                </div>
                                                <div class="agent-info">
                                                    <div class="agent-name">
                                                        <h5><a href="#"><?php echo $a["name"];?></a></h5>
                                                        <p><?php echo $a["title"];?></p>
                                                    </div>
                                                </div>
                                                <div class="agent-info-hover">
                                                    <div class="agent-name">
                                                        <h5><a href="#"><?php echo $a["name"];?></a></h5>
                                                        <p><?php echo $a["title"];?></p>
                                                    </div>
                                                    <ul class="agent-address">
                                                        <li><img src="images/icons/phone-2.png" alt=""><a href='tel:<?php echo $a["phone"];?>'><?php echo $a["phone"];?></a></li>
                                                        <li><img src="images/icons/mail-close.png" alt=""><?php echo $a["email"];?></li>
                                                    </ul>
                                                    <ul class="social-media">
                                                      <?php
                                                        if (strlen($a["facebook"])>0) {
                                                          echo "<li><a href=\"".$a["facebook"]."\"><i class=\"fa fa-facebook\" aria-hidden=\"true\"></i></a></li>";
                                                        }
                                                        if (strlen($a["twitter"])>0) {
                                                          echo "<li><a href=\"".$a["twitter"]."\"><i class=\"fa fa-twitter\" aria-hidden=\"true\"></i></a></li>";
                                                        }
                                                        if (strlen($a["linkedin"])>0) {
                                                          echo "<li><a href=\"".$a["linkedin"]."\"><i class=\"fa fa-linkedin\" aria-hidden=\"true\"></i></a></li>";
                                                        }
                                                        if (strlen($a["googleplus"])>0) {
                                                          echo "<li><a href=\"".$a["googleplus"]."\"><i class=\"fa fa-google-plus\" aria-hidden=\"true\"></i></a></li>";
                                                        }
                                                        if (strlen($a["wechat"])>0) {
                                                          echo "<li><a href=\"weixin://dl/chat?{".$a["wechat"]."}\"><i class=\"fa fa-weixin\" aria-hidden=\"true\"></i></a></li>";
                                                        }
                                                        if (strlen($a["whatsapp"])>0) {
                                                          echo "<li><a href=\"https://api.whatsapp.com/send?phone=".$a["whatsapp"]."\"><i class=\"fa fa-whatsapp\" aria-hidden=\"true\"></i></a></li>";
                                                        }
                                                        if (strlen($a["line"])>0) {
          // https://line.me/ti/p/~pattayacentral
                                                          echo "<li><a target='_blank' href=\"".$a["line"]."\"><font style=\"background-color:#00b900;\">&nbsp;&nbsp;<i class=\"fa fa-comment-o\"></i>&nbsp;&nbsp;LINE&nbsp;&nbsp;</font></a>";
                                                        }
                                                      ?>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
<?php
  }                            
?>
                        </div>
                        <div class="col-md-4">
                        <?php
                          if ($h["video"]) {
                        ?>
                            <!-- widget-video -->
                            <aside class="widget widget-video">
                                <h5><?php echo $w["takeALook"][$lang];?></h5>
                                <div class="properties-video">
                                    <div class="embed-responsive embed-responsive-16by9">
                                      <iframe src="<?php echo $h["video"];?>" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                                    </div>
                                </div>
                            </aside>
                        <?php 
                          } 
                        ?>
                            <br>
                            <aside class="widget widget-featured-property">
                                <h5><?php echo $w["featuredTitle"][$lang];?></h5>
                                <div class="row">
<?php
                                $result = $conn->query("SELECT * FROM home WHERE isFeatured='Y' LIMIT 0,5");
                                $n = 1;
                                while ($r = $result->fetch_array(MYSQLI_ASSOC)) {
                                  $path = 'big';
                                  if ($r['importCrawlId']) {
                                    $path = 'lz';
                                  }
?>
                                    <!-- flat-item -->
                                    <div class="col-md-12 col-sm-6 col-xs-12">
                                        <div class="flat-item">
                                            <div class="flat-item-image">
                                                <!-- <span class="for-sale"><?php echo $r["award"];?></span> -->
                                                <a href="?pageid=home&id=<?php echo $r["id"];?>"><img src="images/single-property/<?=$path?>/<?php echo $r["img1"];?>" alt=""></a>
                                                <div class="flat-link">
                                                    <a href="?pageid=home&id=<?php echo $r["id"];?>"><?php echo $w["moreDetails"][$lang];?></a>
                                                </div>
                                                <ul class="flat-desc">
                                                    <li>
                                                        <img src="images/icons/4.png" alt="">
                                                        <span><?php echo $r["area"];?> m<sup>2</sup></span>
                                                    </li>
                                                    <li>
                                                        <img src="images/icons/5.png" alt="">
                                                        <span><?php echo $r["nBedrooms"];?></span>
                                                    </li>
                                                    <li>
                                                        <img src="images/icons/6.png" alt="">
                                                        <span><?php echo $r["nBathrooms"];?></span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div class="flat-item-info">
                                                <div class="flat-title-price">
                                                    <h5><a href="?pageid=home&id=<?php echo $r["id"];?>"><?php echo $r["name"];?></a></h5>
                                                    <span class="price"><?php echo number_format($r["price"]);?></span>
                                                </div>
                                                <p><img src="images/icons/location.png" alt=""><?php echo $r["address"];?></p>
                                            </div>
                                        </div>
                                    </div>
<?php
                                }
?>
                                  </div>
                            </aside>
                        </div>
                    </div>
                </div>
            </div>
            <!-- PROPERTIES DETAILS AREA END -->          
            <?php findYourHome(); ?>
        </section>
        <!-- End page content -->
<?php
  }
?>

<?php
  if ($pageid=='home2') {
    $id = @mysqli_real_escape_string($conn, $_GET["id"]);
    $h = $conn->query("SELECT * FROM home WHERE id='$id'")->fetch_array(MYSQLI_ASSOC);
?>        
        <div class="breadcrumbs-area bg-opacity-black-70" style='background: url(images/<?php echo $settings["imgProperty1920x433"];?>);'>
            <div class="container">
                <div class="row">
                    <div class="col-xs-12">
                        <div class="breadcrumbs">
                            <h2 class="breadcrumbs-title"><?php echo $w["propertyDetails"][$lang];?></h2>
                            <ul class="breadcrumbs-list">
                                <li><a href="index.php"><?php echo $w["home"][$lang];?></a></li>
                                <li><a href="?pageid=all"><?php echo $w["properties"][$lang];?></a></li>
                                <li><?php echo $w["propertyDetails"][$lang];?></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- BREADCRUMBS AREA END -->

        <!-- Start page content -->
        <section id="page-content" class="page-wrapper">

            <!-- PROPERTIES DETAILS AREA START -->
            <div class="properties-details-area pt-115 pb-60">
                <div class="container">
                    <div class="row">
                        <div class="col-md-8">
                        <h1><?php echo $h["name"];?></h1>
                            <!-- pro-details-image -->
                            <div class="pro-details-image mb-60">
                                <div class="pro-details-big-image">
                                    <div class="tab-content">
<?php                                    
                                      $n = 1;
                                      while ($h["img$n"]) {
?>
                                        <div role="tabpanel" class="tab-pane fade in <?php if ($n==1) echo "active";?>" id="pro-<?php echo $n;?>">
                                            <a href="images/single-property/lz/<?php echo $h["img$n"]; ?>" data-lightbox="image-1" data-title="Property <?php echo $n;?>">
                                                <img src="images/single-property/lz/<?php echo $h["img$n"];?>" alt="">
                                            </a>
                                        </div>
<?php
                                        $n++;
                                        if ($n>10)
                                          break;
                                      }
?>                                      
                                    </div>
                                </div>
                                <div class="pro-details-carousel">
<?php                                    
                                    $n = 1;
                                    while ($h["img$n"]) {
?>
                                    <div class="pro-details-item">
                                        <a href="#pro-<?php echo $n;?>" data-toggle="tab"><img src="images/single-property/lz/<?php echo $h["img$n"];?>" alt=""></a>
                                    </div>
<?php
                                        $n++;
                                        if ($n>10)
                                          break;
                                      }
?>                                      
                                </div>                           
                            </div>
                            <!-- pro-details-short-info -->
                            <div class="pro-details-short-info mb-60">
                                <div class="row">
                                    <div class="col-sm-6 col-xs-12">
                                        <div class="pro-details-condition">
                                            <h5><?php echo $w["propertyDetails"][$lang];?></h5>
                                            <div class="pro-details-condition-inner bg-gray">
                                                <ul class="condition-list">
                                                    <?php
                                                      if ($h["type"]=='SALE')
                                                        echo $w["propertyForSale"][$lang];
                                                      else
                                                        echo $w["propertyForRent"][$lang];
                                                    ?>
                                                    <li>&nbsp;</li>
                                                    <li><img style="background: black; mix-blend-mode: difference;" src="images/icons/4.png" alt=""><?php echo $h["area"];?> m<sup>2</sup></li>
                                                    <li><img style="background: black; mix-blend-mode: difference;" src="images/icons/5.png" alt=""><?php if ($h["nBedrooms"]==0) echo "STUDIO"; else echo $h["nBedrooms"];?></li>
                                                    <li><img style="background: black; mix-blend-mode: difference;" src="images/icons/6.png" alt=""><?php echo $h["nBathrooms"];?></li>
<?php
                                                    if ($h["nGarage"]>0) {
                                                      echo "<li><img style='background: black; mix-blend-mode: difference;' src='images/icons/13.png'>".$h["nGarage"]."</li>";
                                                    }
                                                    if ($h["nKitchen"]>0) {
                                                      echo "<li><img style='background: black; mix-blend-mode: difference;' src='images/icons/14.png'>".$h["nKitchen"]."</li>";
                                                    }
                                                    if ($pTmp = strpos($h["importExtraInfo"], 'Floors')) {
                                                      $floors = intval(substr($h["importExtraInfo"], $pTmp+8,3));
                                                      $floors = $w['totalFloors'][$lang].": $floors";
?>
                                                      <li>
                                                          <img src="images/icons/13.png"  style='background: black; mix-blend-mode: difference;' alt="">
                                                          <span><?=$floors?></span>
                                                      </li>
<?php
                                                    }
                                                    if ($pTmp = strpos($h["importExtraInfo"], 'Completed')) {
                                                      $year = intval(substr($h["importExtraInfo"], $pTmp+11,5));
                                                      $year = $w['yearCompleted'][$lang]." $year";
?>
                                                      <li>
                                                          <span><?=$year?></span>
                                                      </li>
<?php
                                                    }
?>
                                                    <li><img src="images/icons/money.png" alt=""><?php echo number_format($h["price"]);?> &#3647;</li>
                                                </ul>
<?php
  if ($h["cat2"]) {
?>                                                
                                                <p><img style="background: black; mix-blend-mode: difference;" src="images/icons/location.png" alt=""><?=$h["cat2"]?></p>
<?php
  }
?>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-sm-6 col-xs-12">
                                        <div class="pro-details-amenities">
                                            <h5><?php echo $w["amenities"][$lang];?></h5>
                                            <div class="pro-details-amenities-inner bg-gray">
                                                <ul class="amenities-list">
<?php
                                                  if (strpos($h["importExtraInfo"], 'Pool')) {
                                                    echo "<li>".$w["hasPool"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'Gym')) {
                                                    echo "<li>".$w["hasGym"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'Balcony')) {
                                                    echo "<li>".$w["hasBalcony"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'Pool')) {
                                                    echo "<li>".$w["hasAirCon"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'WiFi')) {
                                                    echo "<li>".$w["hasInternet"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'Elevator')) {
                                                    echo "<li>".$w["hasLift"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'Parking')) {
                                                    echo "<li>".$w["hasParking"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'Cable')) {
                                                    echo "<li>".$w["hasCableTV"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'Sauna')) {
                                                    echo "<li>".$w["hasSauna"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'Steam')) {
                                                    echo "<li>".$w["hasSteamRoom"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'Security')) {
                                                    echo "<li>".$w["hasSecurity"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'CCTV')) {
                                                    echo "<li>".$w["hasCCTV"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'Game')) {
                                                    echo "<li>".$w["hasGameRoom"][$lang]."</li>";
                                                  }
                                                  if (strpos($h["importExtraInfo"], 'Washing')) {
                                                    echo "<li>".$w["hasWashingMachine"][$lang]."</li>";
                                                  }
?>                                                
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- pro-details-description -->
                            <div class="pro-details-description mb-50">
                              <h5><?php echo $w["description"][$lang];?></h5>
                              <p><?php if (!$h["description_$lang"]) $h["description_$lang"] = $h["description_en"]; echo $h["description_$lang"];?></p>
                            </div>
<?php
  if ($h["agentId"]>0) {
    $a = $conn->query("SELECT * FROM agent WHERE id='".$h["agentId"]."'")->fetch_array(MYSQLI_ASSOC);
?>
                            <!-- agent-review -->
                            <div class="pro-details-agent-review">
                                <div class="row">
                                    <!-- single-agent -->
                                    <div class="col-md-5 col-sm-5 col-xs-12">
                                        <div class="pro-details-agent">
                                            <h5><?php echo $w["contactAgent"][$lang];?></h5>
                                            <div class="single-agent">
                                                <div class="agent-image">
                                                    <img src="images/agents/<?php echo $a["image"];?>" alt="">
                                                </div>
                                                <div class="agent-info">
                                                    <div class="agent-name">
                                                        <h5><a href="#"><?php echo $a["name"];?></a></h5>
                                                        <p><?php echo $a["title"];?></p>
                                                    </div>
                                                </div>
                                                <div class="agent-info-hover">
                                                    <div class="agent-name">
                                                        <h5><a href="#"><?php echo $a["name"];?></a></h5>
                                                        <p><?php echo $a["title"];?></p>
                                                    </div>
                                                    <ul class="agent-address">
                                                        <li><img src="images/icons/phone-2.png" alt=""><a href='tel:<?php echo $a["phone"];?>'><?php echo $a["phone"];?></a></li>
                                                        <li><img src="images/icons/mail-close.png" alt=""><?php echo $a["email"];?></li>
                                                    </ul>
                                                    <ul class="social-media">
                                                      <?php
                                                        if (strlen($a["facebook"])>0) {
                                                          echo "<li><a href=\"".$a["facebook"]."\"><i class=\"fa fa-facebook\" aria-hidden=\"true\"></i></a></li>";
                                                        }
                                                        if (strlen($a["twitter"])>0) {
                                                          echo "<li><a href=\"".$a["twitter"]."\"><i class=\"fa fa-twitter\" aria-hidden=\"true\"></i></a></li>";
                                                        }
                                                        if (strlen($a["linkedin"])>0) {
                                                          echo "<li><a href=\"".$a["linkedin"]."\"><i class=\"fa fa-linkedin\" aria-hidden=\"true\"></i></a></li>";
                                                        }
                                                        if (strlen($a["googleplus"])>0) {
                                                          echo "<li><a href=\"".$a["googleplus"]."\"><i class=\"fa fa-google-plus\" aria-hidden=\"true\"></i></a></li>";
                                                        }
                                                        if (strlen($a["wechat"])>0) {
                                                          echo "<li><a href=\"weixin://dl/chat?{".$a["wechat"]."}\"><i class=\"fa fa-weixin\" aria-hidden=\"true\"></i></a></li>";
                                                        }
                                                        if (strlen($a["whatsapp"])>0) {
                                                          echo "<li><a href=\"https://api.whatsapp.com/send?phone=".$a["whatsapp"]."\"><i class=\"fa fa-whatsapp\" aria-hidden=\"true\"></i></a></li>";
                                                        }
                                                        if (strlen($a["line"])>0) {
          // https://line.me/ti/p/~pattayacentral
                                                          echo "<li><a target='_blank' href=\"".$a["line"]."\"><font style=\"background-color:#00b900;\">&nbsp;&nbsp;<i class=\"fa fa-comment-o\"></i>&nbsp;&nbsp;LINE&nbsp;&nbsp;</font></a>";
                                                        }
                                                      ?>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
<?php
  }                            
?>
                        </div>
                        <div class="col-md-4">
                        <?php
                          if ($h["video"]) {
                        ?>
                            <!-- widget-video -->
                            <aside class="widget widget-video">
                                <h5><?php echo $w["takeALook"][$lang];?></h5>
                                <div class="properties-video">
                                    <div class="embed-responsive embed-responsive-16by9">
                                      <iframe src="<?php echo $h["video"];?>" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                                    </div>
                                </div>
                            </aside>
                        <?php 
                          } 
                        ?>
                            <br>
                            <aside class="widget widget-featured-property">
                                <h5><?php echo $w["featuredTitle"][$lang];?></h5>
                                <div class="row">
<?php
                                $result = $conn->query("SELECT * FROM home WHERE isFeatured='Y' LIMIT 0,5");
                                $n = 1;
                                while ($r = $result->fetch_array(MYSQLI_ASSOC)) {
                                  $path = 'big';
                                  if ($r['importCrawlId']) {
                                    $path = 'lz';
                                  }
?>
                                    <!-- flat-item -->
                                    <div class="col-md-12 col-sm-6 col-xs-12">
                                        <div class="flat-item">
                                            <div class="flat-item-image">
                                                <!-- <span class="for-sale"><?php echo $r["award"];?></span> -->
                                                <a href="?pageid=home&id=<?php echo $r["id"];?>"><img src="images/single-property/<?=$path?>/<?php echo $r["img1"];?>" alt=""></a>
                                                <div class="flat-link">
                                                    <a href="?pageid=home&id=<?php echo $r["id"];?>"><?php echo $w["moreDetails"][$lang];?></a>
                                                </div>
                                                <ul class="flat-desc" style='color:white'>
                                                    <li>
                                                        <img src="images/icons/4.png" style="filter: brightness(0) invert(1);" alt="">
                                                        <span><?php echo $r["area"];?> m<sup>2</sup></span>
                                                    </li>
                                                    <li>
                                                        <img src="images/icons/5.png" style="filter: brightness(0) invert(1);" alt="">
                                                        <span><?php echo $r["nBedrooms"];?></span>
                                                    </li>
                                                    <li>
                                                        <img src="images/icons/6.png" style="filter: brightness(0) invert(1);" alt="">
                                                        <span><?php echo $r["nBathrooms"];?></span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div class="flat-item-info">
                                                <div class="flat-title-price">
                                                    <h5><a href="?pageid=home&id=<?php echo $r["id"];?>"><?php echo $r["name"];?></a></h5>
                                                    <span class="price"><?php echo number_format($r["price"]);?></span>
                                                </div>
                                                <p><img src="images/icons/location.png" alt=""><?php echo $r["address"];?></p>
                                            </div>
                                        </div>
                                    </div>
<?php
                                }
?>
                                  </div>
                            </aside>
                        </div>
                    </div>
                </div>
            </div>
            <!-- PROPERTIES DETAILS AREA END -->          
            <?php findYourHome(); ?>
        </section>
        <!-- End page content -->
<?php
  }
?>

<?php
  if ($pageid=='contactus') {
?>        
        <!-- BREADCRUMBS AREA START -->
        <div class="breadcrumbs-area bg-opacity-black-70" style='background: url(images/<?php echo $settings["imgContact1920x433"];?>);'>
            <div class="container">
                <div class="row">
                    <div class="col-xs-12">
                        <div class="breadcrumbs">
                            <h2 class="breadcrumbs-title"><?php echo $w["menuContact"][$lang];?></h2>
                            <ul class="breadcrumbs-list">
                                <li><a href="index.php"><?php echo $w["menuHome"][$lang];?></a></li>
                                <li><?php echo $w["menuContact"][$lang];?></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- BREADCRUMBS AREA END -->

        <!-- Start page content -->
        <section id="page-content" class="page-wrapper">

            <!-- CONTACT AREA START -->
            <div class="contact-area pt-115 pb-115">
                <div class="container">
                    <div class="row">
                        <div class="col-sm-5 col-xs-12">
                            <!-- get-in-toch -->
                            <div class="get-in-toch">
                                <div class="section-title mb-30">
                                    <h3><?php echo $w["contactTitle"][$lang];?></h3>
                                    <h2><?php echo $w["contactSubtitle"][$lang];?></h2>
                                </div>
                                <div class="contact-desc mb-50">
<!--                                    <p><span data-placement="top" data-toggle="tooltip" data-original-title="" class="tooltip-content">Sheltek</span> is the best theme for  elit, sed do eiusmod tempor dolor sit ame   tse ctetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et lorna aliquatd minim veniam, quis nostrud exercitation oris nisi ut aliquip</p>-->
                                    <p><?php echo $w["companyDescription"][$lang];?></p>
                                </div>
                                <ul class="contact-address">
                                    <li>
                                        <div class="contact-address-icon">
                                            <img src="images/icons/location-2.png" alt="">
                                        </div>
                                        <div class="contact-address-info">
                                            <span><?php echo $settings["address1"];?></span>
                                            <span><?php echo $settings["address2"];?></span>
                                        </div>
                                    </li>
                                    <li>
                                        <div class="contact-address-icon">
                                            <img src="images/icons/phone-3.png" alt="">
                                        </div>
                                        <div class="contact-address-info">
                                            <span><a href="tel:<?php echo $settings["phoneCleanWithoutExtraCharacters"];?>"><?php echo $settings["footerPhone1"];?></a></span>
                                            <span><a href="tel:<?php echo $settings["phoneCleanWithoutExtraCharacters"];?>"><?php echo $settings["footerPhone2"];?></a></span>
                                        </div>
                                    </li>
                                    <li>
                                        <div class="contact-address-icon">
                                            <img src="images/icons/world.png" alt="">
                                        </div>
                                        <div class="contact-address-info">
                                            <span><a href='mailto:<?php echo $settings["footerEmailfooterEmail"];?>'><?php echo $settings["footerEmail"];?></a></span>
                                            <span><a href="<?php echo $settings["footerWeb"];?>" target="_blank"><?php echo $settings["footerWeb"];?></a></span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="col-sm-7 col-xs-12">
                            <div class="contact-messge contact-bg">
                                <!-- blog-details-reply -->
                                <div class="leave-review">
                                    <h5><?php echo $w["leaveAMessage"][$lang];?></h5>
                                    <form  id="contact-form" action="mail.php" method="post">
                                        <input type="text" name="name" placeholder="<?php echo $w["yourName"][$lang];?>">
                                        <input type="email" name="email" placeholder="<?php echo $w["typeYourEmail"][$lang];?>">
                                        <textarea name="message" placeholder="<?php echo $w["writeHere"][$lang];?>"></textarea>
                                        <button type="submit" class="submit-btn-1"><?php echo $w["send"][$lang];?></button>
                                    </form>
                                    <p class="form-messege mb-0"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- CONTACT AREA END -->

            <!-- GOOGLE MAP AREA START -->
            <div class="google-map-area">
                <div id="googleMap"></div>
            </div>
            <!-- GOOGLE MAP AREA END -->
<?php findYourHome(); ?>
        </section>
        <!-- End page content -->
<?php
  }        
?>
        
        <!-- Start footer area -->
<!--        <footer id="footer" class="footer-area bg-2 bg-opacity-black-90"> -->
        <footer id="footer" style='background: url(images/<?php echo $settings["imgFooter1920x593"];?>);' class="footer-area bg-opacity-black-90">
            <div class="footer-top pt-110 pb-80">
                <div class="container">
                    <div class="row">
                        <!-- footer-address -->
                        <div class="col-lg-3 col-md-3 col-sm-6 col-xs-12">
                            <div class="footer-widget">
                                <h6 class="footer-titel"><?php echo $w["getInTouch"][$lang];?></h6>
                                <ul class="footer-address">
                                    <li>
                                        <div class="address-icon">
                                            <img src="images/icons/location-2.png" alt="">
                                        </div>
                                        <div class="address-info">
                                            <span><a href='?pageid=contactus'><?php echo $settings["address1"];?></a></span>
                                            <span><a href='?pageid=contactus'><?php echo $settings["address2"];?></a></span>
                                        </div>
                                    </li>
                                    <li>
                                        <div class="address-icon">
                                            <img src="images/icons/phone-3.png" alt="">
                                        </div>
                                        <div class="address-info">
                                            <span><a href="tel:<?php echo $settings["phoneCleanWithoutExtraCharacters"];?>"><?php echo $settings["footerPhone1"];?></a></span>
                                            <span><a href="tel:<?php echo $settings["phoneCleanWithoutExtraCharacters"];?>"><?php echo $settings["footerPhone2"];?></a></span>
                                        </div>
                                    </li>
                                    <li>
                                        <div class="address-icon">
                                            <img src="images/icons/world.png" alt="">
                                        </div>
                                        <div class="address-info">
                                            <span><a href='mailto:<?php echo $settings["footerEmail"];?>'><?php echo $settings["footerEmail"];?></a></span>
                                            <span><?php echo $settings["footerWeb"];?></span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="col-lg-6 col-md-5 hidden-sm col-xs-12">
                            <div class="footer-widget">
                                <h6 class="footer-titel"><?php echo $w["quickContact"][$lang];?></h6>
                                <div class="footer-contact">
                                    <p><?php echo $w["quickContactMessage"][$lang];?></p>
                                    <form  id="contact-form-2" action="mail_footer.php" method="post">
                                        <input type="email" name="email2" placeholder="<?php echo $w["typeYourEmail"][$lang];?>">
                                        <textarea name="message2" placeholder="<?php echo $w["writeHere"][$lang];?>"></textarea>
                                        <button type="submit" value="send"><?php echo $w["send"][$lang];?></button>
                                    </form>
                                    <p class="form-messege"></p>
                                </div>
                            </div>
                        <!-- footer-latest-news 
                            <div class="footer-widget middle">
                                <h6 class="footer-titel">LATEST NEWS</h6>
                                <ul class="footer-latest-news">
                                    <li>
                                        <div class="latest-news-image">
                                            <a href="single-blog.html"><img src="images/blog/1.jpg" alt=""></a>
                                        </div>
                                        <div class="latest-news-info">
                                            <h6><a href="single-blog.html">Beautiful Home</a></h6>
                                            <p>Lorem ipsum dolor sit amet, consectetur acinglit sed do eiusmod tempor inciidunt ut labore </p>
                                        </div>
                                    </li>
                                    <li>
                                        <div class="latest-news-image">
                                            <a href="single-blog.html"><img src="images/blog/2.jpg" alt=""></a>
                                        </div>
                                        <div class="latest-news-info">
                                            <h6><a href="single-blog.html">Beautiful Home</a></h6>
                                            <p>Lorem ipsum dolor sit amet, consectetur acinglit sed do eiusmod tempor inciidunt ut labore </p>
                                        </div>
                                    </li>
                                    <li>
                                        <div class="latest-news-image">
                                            <a href="single-blog.html"><img src="images/blog/3.jpg" alt=""></a>
                                        </div>
                                        <div class="latest-news-info">
                                            <h6><a href="single-blog.html">Beautiful Home</a></h6>
                                            <p>Lorem ipsum dolor sit amet, consectetur acinglit sed do eiusmod tempor inciidunt ut labore </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        -->
                        </div>
                        <!-- footer-contact -->
                        <div class="col-lg-3 col-md-4 col-sm-6 col-xs-12">
       
                            <div class="footer-widget">
                              <h6 class="footer-titel"><?php echo $w["language"][$lang];?></h6>
                            <form>
                            <select onchange="changedLanguage(this);">
<?php
                              $result = $conn->query("SELECT name, extendedName FROM availableLanguages WHERE UPPER(availableYN)='Y'");
                              while ($r = $result->fetch_array(MYSQLI_ASSOC)) {
                                $selected = "";
                                if ($lang == $r["name"])
                                  $selected = "selected";
                                echo "<option id='language-{$r["name"]}' style='max-width:100%;' $selected onclick=\"setCookie('lang', '{$r["name"]}', 1000); window.location.href='index.php';\">{$r["extendedName"]}</option>";
//                                echo "<option style='max-width:100%;' $selected >{$r["extendedName"]}</option>";
                              }
?>                            
                            </select>
                            </form>
       
                            </div>
                        
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <div class="container">
                    <div class="row">
                        <div class="col-xs-12">
                            <div class="copyright text-center">
                                <p><?php echo $w["copyright"][$lang];?></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
        <!-- End footer area -->
    </div>
        
    <!-- Body main wrapper end -->
    <!-- Placed js at the end of the document so the pages load faster -->
    <!-- jquery latest version -->
    <script src="js/vendor/jquery-3.1.1.min.js"></script>
    <!-- Bootstrap framework js -->
    <script src="js/bootstrap.min.js"></script>
    <!-- Nivo slider js -->    
    <script src="lib/js/jquery.nivo.slider.js"></script>
    <!-- ajax-mail js -->
    <script src="js/ajax-mail.js"></script>
    <!-- All js plugins included in this file. -->
    <script src="js/plugins.js"></script>
    <script>    
      function changedLanguage(s) {
        console.log('changed language');
        console.log(s[s.selectedIndex].id);
        var lang = s[s.selectedIndex].id;
        setCookie('lang', lang.slice(-2), 1000); 
        window.location.href='index.php';
      }

      function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
      }
    </script>
<?php 
  if ($pageid=='contactus') {
?>
    <!-- Google Map js -->
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAlukY6hk3xxd1ZNBkuvMP1nSZlgAvh0nE"></script>
    <script> var mapZoom=<?php echo $settings["mapZoom"];?>; var latitude=<?php echo $settings["latitude"];?>; var longitude=<?php echo $settings["longitude"];?>; </script>
    <script src="js/google-map.js"></script>
<?php
  }
?>  
    <!-- Main js file that contents all jQuery plugins activation. -->
    <script src="js/main4.js"></script>

<!--Start of Tawk.to Script-->
<!-- <script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/5dc251dce4c2fa4b6bda341c/default';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script> -->
<!--End of Tawk.to Script-->

</body>
</html>

<?php
function printSingleHome($r) {
  global $w, $lang;
?>
  <div class="flat-item">
      <div class="flat-item-image">
          <!-- <span class="for-sale"><?php echo $r["award"];?></span> -->
          <a href="?pageid=home&id=<?php echo $r["id"];?>"><img src="images/single-property/big/<?php echo $r["img1"];?>" alt=""></a>
          <div class="flat-link">
              <a href="?pageid=home&id=<?php echo $r["id"];?>"><?php echo $w["moreDetails"][$lang];?></a>
          </div>
          <ul class="flat-desc">
              <li>
                  <img style="background: black; mix-blend-mode: screen;" src="images/icons/4.png" alt="">
                  <span style='color:white'><?php echo $r["area"];?> m<sup>2</sup></span>
              </li>
              <li>
                  <img style="background: black; mix-blend-mode: screen;" src="images/icons/5.png" alt="">
                  <span style='color:white'><?php echo $r["nBedrooms"];?></span>
              </li>
              <li>
                  <!-- TO MAKE IT BLACK <img style="background: #black; mix-blend-mode: difference;" src="images/icons/6.png" alt=""> -->
                  <img style="background: #black; mix-blend-mode: screen;" src="images/icons/6.png" alt="">
                  <span style='color:white'><?php echo $r["nBathrooms"];?></span>
              </li>
          </ul>
      </div>
      <div class="flat-item-info">
          <div class="flat-title-price">
              <h5><a href="?pageid=home&id=<?php echo $r["id"];?>"><?php echo $r["name"];?></a></h5>
              <span class="price"><?php echo number_format($r["price"]);?> &#3647;</span>
          </div>
          <p><img src="images/icons/location.png" alt=""><?php echo $r["address"];?></p>
      </div>
  </div>
<?php  
}

function printSingleHome2($r) {
  global $w, $lang, $conn;
  $path = 'big';
  if ($r['importCrawlId']) {
    $path = 'lz';
  }
?>
  <div class="flat-item">
      <div class="flat-item-image">
          <a href="?pageid=home&id=<?php echo $r["id"];?>"><img src="images/single-property/<?=$path?>/<?php echo $r["img1"];?>" alt=""></a>
          <div class="flat-link">
              <a href="?pageid=home&id=<?=$r["id"]?>"><?=$w["moreDetails"][$lang]?></a>
          </div>
          <ul class="flat-desc">
              <li>
                  <img style="background: black; mix-blend-mode: screen;" src="images/icons/4.png" alt="">
                  <span style='color:white'><?php echo $r["area"];?> m<sup>2</sup></span>
              </li>
              <li>
                  <img style="background: black; mix-blend-mode: screen;" src="images/icons/5.png" alt="">
                  <span style='color:white'><?php echo $r["nBedrooms"];?></span>
              </li>
              <li>
                  <!-- TO MAKE IT BLACK <img style="background: #black; mix-blend-mode: difference;" src="images/icons/6.png" alt=""> -->
                  <img style="background: #black; mix-blend-mode: screen;" src="images/icons/6.png" alt="">
                  <span style='color:white'><?php echo $r["nBathrooms"];?></span>
              </li>
          </ul>
      </div>
      <div class="flat-item-info">
          <div class="flat-title-price">
              <h5><a href="?pageid=home&id=<?php echo $r["id"];?>"><?php echo $r["name"];?></a></h5>
              <span class="price"><?php echo number_format($r["price"]);?> &#3647;</span>
          </div>
<?php
          if ($path == 'big') {
            if ($r['cat2']) {
?>
              <p><img src="images/icons/location.png" alt=""><?=$r['cat2']?></p>
<?php
            }
          } else {
            if ($r['importLocation']) {
              $sanitizedCat2 = @mysqli_real_escape_string($conn, $r['importLocation']);
              $sanitizedCat1 = @mysqli_real_escape_string($conn, $r['cat1']);
?>
              <a href='?pageid=all&search=true&type=sale&cat1=<?=urlencode($sanitizedCat1)?>&cat2=<?=urlencode($sanitizedCat2)?>'>
                <p><img src="images/icons/location.png" alt=""><?=$r['importLocation']?></p>
              </a>  
<?php
            }
          }
?>                    
      </div>
  </div>
<?php  
}

function findYourHome() {
  global $w, $lang, $conn, $priceSaleOptions, $settings, $priceRentOptions, $priceSaleOptions;
  $cat1 = zbSQLAssocMulti("SELECT DISTINCT UPPER(cat1) AS cat1 FROM home WHERE cat1<>'' AND importCrawlId>0 ORDER BY cat1");
?>  
  <a name="priceBar"></a>
  <div class="find-home-area bg-blue call-to-bg plr-140 pt-40 pb-20">
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-3 col-xs-12">
          <div class="section-title text-white">
            <h3><?=$w["findHome1"][$lang];?></h3>
            <h2 class="h1"><?=$w["findHome2"][$lang];?></h2>
          </div>
        </div>
        <form id="searchForm">
          <input type=hidden name=pageid value=all>
          <input type=hidden name=search value=true>
          <input type=hidden name=type value=sale>
          <div class="col-md-9 col-xs-12">
            <div class="row">
              <div class="col-sm-3 col-xs-12">
                <label style='color:white' for=cat1><?=$w["location"][$lang]?></label>
                <!-- <select class=form-control onchange="loadAjaxCat2()" name=cat1 id=cat1> -->
                <select class=form-control name=cat1 id=cat1>
                  <option><?=$w["any"][$lang]?></option>
<?php
                  for($i=0; $i<count($cat1); ++$i) {
                    $catName = zbSQL("SELECT `name` FROM cities WHERE UPPER(nameInDB)=UPPER('{$cat1[$i]["cat1"]}')");
                    echo "<option>$catName</option>";
                  }
?>                                                
                </select>
              </div>
              <div class="col-sm-3 col-xs-12">
                <label style='color:white' for=cat2><?=$w["sublocation"][$lang]?></label>
                <select class=form-control name=cat2 id=cat2 >
                  <option><?=$w["any"][$lang]?></option>
                </select>
              </div>
              <div class="col-sm-3 col-xs-12">
                <label style='color:white' for=min-area><?=$w["minArea"][$lang]?></label>
                  <input style='color:white' class=form-control type="text" id=min-area name="min-area" value=0>
              </div>
              <div class="col-sm-3 col-xs-12">
                <label style='color:white' for=max-area><?=$w["maxArea"][$lang]?></label>
                <input style='color:white' class=form-control type="text" id=max-area name="max-area" value=9999>
              </div>
              <div class="col-sm-3 col-xs-12">
                <label style='color:white' for=bed><?=$w["bedrooms"][$lang]?></label>
                <select name="bed" id="bed" class=form-control data-hide-disabled="true">
                  <option value=0><?php echo $w["any"][$lang];?></option>
                  <option value=1>1 <?php echo $w["bedroom"][$lang];?></option>
                  <option value=2>2 <?php echo $w["bedrooms"][$lang];?></option>
                  <option value=3>3 <?php echo $w["bedrooms"][$lang];?></option>
                  <option value=4>4+ <?php echo $w["bedrooms"][$lang];?></option>
                </select>
              </div>
              <div class="col-sm-3 col-xs-12">
                <!-- nothing -->
              </div>
              <div class="col-sm-3 col-xs-12">
                <label style='color:white' for=pricesale><?=$w["priceRange"][$lang]?></label>
<?php 
                echo $priceSaleOptions;
?>
              </div>
              <div class="col-sm-3 col-xs-12">
                <label style='color:white'>&nbsp;</label>
                <a class="button-1 btn-block btn-hover-1" onclick="document.getElementById('searchForm').submit();"><?php echo $w["search"][$lang];?></a>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
<?php
}

?>
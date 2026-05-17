/* ═══════════════════════════════════════════════════════
   ICEVAULT — MAIN SCRIPT
   Covers: Objects, Arrays, Loops, BOM, DOM,
           setInterval/setTimeout, location.href,
           Event Handlers, Form Validation,
           Scroll Animations, Cart, Clock
═══════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────
   1. ВЛАСНИЙ ОБ'ЄКТ — Product
───────────────────────────────────────── */
class Product {
  constructor({ id, name, brand, category, price, badge, imgDesc, img, sizes }) {
    this.id       = id;
    this.name     = name;
    this.brand    = brand;
    this.category = category;
    this.price    = price;
    this.badge    = badge || null;
    this.imgDesc  = imgDesc;
    this.img      = img || null;
    this.sizes    = sizes || defaultSizesFor(category);
  }
  formatPrice() {
    return this.price.toLocaleString('uk-UA') + ' ₴';
  }
  getLabel() {
    return `${this.brand} ${this.name}`;
  }
  matchesSearch(query) {
    if (!query) return true;
    const q = query.toLowerCase().trim();
    return (
      this.name.toLowerCase().includes(q) ||
      this.brand.toLowerCase().includes(q) ||
      this.category.toLowerCase().includes(q) ||
      (this.badge ? this.badge.toLowerCase().includes(q) : false)
    );
  }
}

function defaultSizesFor(category) {
  switch (category) {
    case 'skates':       return ['6','6.5','7','7.5','8','8.5','9','9.5','10','11'];
    case 'helmets':      return ['S','M','L','XL'];
    case 'gloves':       return ['11','12','13','14','15'];
    case 'pads':         return ['S','M','L','XL'];
    case 'sticks':       return ['JR','INT','SR'];
    case 'bags':         return ['JR','SR','PRO'];
    case 'accessories':  return ['JR','SR','ONE'];
    default:             return ['S','M','L','XL'];
  }
}

/* ─────────────────────────────────────────
   2. МАСИВ ПРОДУКТІВ (тільки преміум)
───────────────────────────────────────── */
const products = [
  // ── Bauer ──
  new Product({ id:'bauer-supreme-mach',name:'Supreme MACH Skates',    brand:'Bauer',      category:'skates',  price:48000, badge:'TOP PRO', img:'photo/613471_01_9b29dde3-0f7c-4abe-ae25-5cbbe61857ff.png.webp', imgDesc:'Bauer Supreme MACH' }),
  new Product({ id:'bauer-vapor-x4',  name:'Vapor X4 Pro Skates',     brand:'Bauer',      category:'skates',  price:38500, badge:'TOP PRO', img:'photo/x4sr__1.png.webp',                 imgDesc:'Bauer Vapor X4 Pro' }),
  new Product({ id:'bauer-vapor-3x',  name:'Vapor 3X Skates',         brand:'Bauer',      category:'skates',  price:24800, badge:null,      img:'photo/bauer-vapor-3x-intermediate-ice-hockey-skates-all-star-skates.webp', imgDesc:'Bauer Vapor 3X' }),
  new Product({ id:'bauer-pro-goal',  name:'Pro Goalie Skates',       brand:'Bauer',      category:'skates',  price:42000, badge:'GOALIE',  img:'photo/proskate__1.png.webp',             imgDesc:'Bauer Pro Goalie' }),
  new Product({ id:'bauer-supreme-flylite',name:'Vapor Flylite Stick',brand:'Bauer',      category:'sticks',  price:13200, badge:'NEW',     img:'photo/20251118_162052-removebg-preview__36806.webp', imgDesc:'Bauer Vapor Flylite' }),
  new Product({ id:'bauer-hyp2',      name:'Vapor Hyperlite 2 Stick', brand:'Bauer',      category:'sticks',  price:15200, badge:'NEW',     img:'photo/hyperlitestk__black_1_839e347d-e6b9-47cd-998c-26a5705bc34a_1250x.png.webp', imgDesc:'Bauer Vapor Hyperlite 2' }),
  new Product({ id:'bauer-flypro',    name:'Vapor FlyPro Stick',      brand:'Bauer',      category:'sticks',  price:13800, badge:null,      img:'photo/VaporFlyPro-SR-PLP-Image_fae11337-cb63-4172-bb69-8fd9d2673f70.png.webp', imgDesc:'Bauer Vapor FlyPro' }),
  new Product({ id:'bauer-twitch',    name:'Vapor Twitch Stick',      brand:'Bauer',      category:'sticks',  price:12500, badge:null,      img:'photo/VAPOR_STICK_TWITCH_SR_351x428_53ec89f8-cb5d-404a-bc20-c72f587f8cd2.png.webp', imgDesc:'Bauer Vapor Twitch' }),
  new Product({ id:'bauer-reakt-65',  name:'RE-AKT 65 Helmet',        brand:'Bauer',      category:'helmets', price:7200,  badge:null,      img:'photo/reakt65__black_1.png.webp',        imgDesc:'Bauer RE-AKT 65' }),
  new Product({ id:'bauer-reakt-200', name:'RE-AKT 200 PRO Helmet',   brand:'Bauer',      category:'helmets', price:8500,  badge:null,      img:'assets/p-bauer-reakt-new.avif',          imgDesc:'Bauer RE-AKT 200 PRO' }),
  new Product({ id:'bauer-reakt-75',  name:'RE-AKT 75 Helmet',        brand:'Bauer',      category:'helmets', price:6400,  badge:null,      img:'photo/2D35C410-6403-4C8C-BF13-B85B374F8AD8_1_201_a-removebg-preview__14957.png', imgDesc:'Bauer RE-AKT 75' }),
  new Product({ id:'bauer-gloves',    name:'Vapor 3X Pro Gloves',     brand:'Bauer',      category:'gloves',  price:9200,  badge:null,      img:'photo/Screenshot_2024-06-19_120431-removebg-preview.png.webp', imgDesc:'Bauer Vapor 3X Pro' }),
  new Product({ id:'bauer-x-shin',    name:'Bauer X Shin Guards',     brand:'Bauer',      category:'pads',    price:4800,  badge:null,      img:'photo/BAUERXShinGuardIntermediate_1200x1200.png.webp', imgDesc:'Bauer X Shin' }),
  new Product({ id:'bauer-nsx-shin',  name:'NSX Shin Guards',         brand:'Bauer',      category:'pads',    price:3900,  badge:null,      img:'photo/BauerNSXSHINGUARD_1200x1200.png.webp', imgDesc:'Bauer NSX Shin' }),
  new Product({ id:'bauer-x-elbow',   name:'Bauer X Elbow Pads',      brand:'Bauer',      category:'pads',    price:3200,  badge:null,      img:'photo/Bauer-X-Ice-Hockey-Elbow-Pads-1.png', imgDesc:'Bauer X Elbow' }),
  new Product({ id:'bauer-flylite-eb',name:'Vapor Flylite Elbow JR',  brand:'Bauer',      category:'pads',    price:2950,  badge:'JR',      img:'photo/1064796_BTH25_PROTECTIVE_ELBOW_VAPOR_FLYLITE_JR_back_large.png.webp', imgDesc:'Bauer Flylite Elbow JR' }),
  new Product({ id:'bauer-pro-pant',  name:'Pro Pant (Women)',        brand:'Bauer',      category:'pads',    price:5400,  badge:null,      img:'photo/1063710_BTH24_PROTECTIVE_PANT_WMNS-PRO-PANT_catalog-threequarter-front_REV.png.webp', imgDesc:'Bauer Pro Pant' }),
  new Product({ id:'bauer-goal-chest', name:'Reactor Pro Goalie Chest',brand:'Bauer',      category:'pads',    price:14800, badge:'GOALIE',  img:'photo/687121_01.png.webp',               imgDesc:'Bauer Reactor Pro Chest' }),
  new Product({ id:'bauer-knee-pro',  name:'Goal Knee Guard Pro',     brand:'Bauer',      category:'pads',    price:4100,  badge:'GOALIE',  img:'photo/1064956_BTH25_GOAL_KNEE-GUARD_PRO_SR_catalog-pair-front_23a0c4ca-c22b-4590-89ea-619c7e041782.png.webp', imgDesc:'Bauer Knee Guard Pro' }),

  // ── CCM ──
  new Product({ id:'ccm-ribcor',      name:'Ribcor 100K Pro Skates',  brand:'CCM',        category:'skates',  price:32000, badge:'PRO',     img:'photo/SK100KP-SR_7_512x512.png.webp',    imgDesc:'CCM Ribcor 100K Pro' }),
  new Product({ id:'ccm-tacks-as550', name:'Tacks AS 550 Skates',     brand:'CCM',        category:'skates',  price:18900, badge:'NEW',     img:'photo/SKAS550_1024x1024.png.webp',       imgDesc:'CCM Tacks AS 550' }),
  new Product({ id:'ccm-tacks-as5',   name:'Tacks AS5 Pro Skates',    brand:'CCM',        category:'skates',  price:29500, badge:null,      img:'photo/SKAS5P-BLACKSTEEL_01.png',         imgDesc:'CCM Tacks AS5 Pro' }),
  new Product({ id:'ccm-tacks-as580', name:'Tacks AS 580 Skates',     brand:'CCM',        category:'skates',  price:22400, badge:null,      img:'photo/SKAS580_SR_01.png',                imgDesc:'CCM Tacks AS 580' }),
  new Product({ id:'ccm-tacks-xfp',   name:'Tacks XF Pro Skates',     brand:'CCM',        category:'skates',  price:34800, badge:'PRO',     img:'photo/SKXFP-SR_01.png',                  imgDesc:'CCM Tacks XF Pro' }),
  new Product({ id:'ccm-as-v-pro',    name:'Tacks AS-V Pro Skates',   brand:'CCM',        category:'skates',  price:26900, badge:null,      img:'photo/ccm-hockey-ccm-tacks-as-v-pro-skate-int.jpg.png', imgDesc:'CCM Tacks AS-V Pro' }),
  new Product({ id:'ccm-ft7',         name:'Jetspeed FT7 Pro Stick',  brand:'CCM',        category:'sticks',  price:14500, badge:'NEW',     img:'photo/HSFT7P-SR_06.png',                 imgDesc:'CCM Jetspeed FT7 Pro' }),
  new Product({ id:'ccm-ft8',         name:'Jetspeed FT8 Pro Stick',  brand:'CCM',        category:'sticks',  price:16200, badge:null,      img:'photo/HSFT8P-SR-L_03.png',               imgDesc:'CCM Jetspeed FT8 Pro' }),
  new Product({ id:'ccm-ft8cr',       name:'Jetspeed FT8 Stick',      brand:'CCM',        category:'sticks',  price:13900, badge:null,      img:'photo/HSFT8PCR.png',                     imgDesc:'CCM Jetspeed FT8' }),
  new Product({ id:'ccm-ftw',         name:'Jetspeed FTW Women Stick',brand:'CCM',        category:'sticks',  price:11800, badge:null,      img:'photo/HSFTWP26B.png',                    imgDesc:'CCM Jetspeed FTW' }),
  new Product({ id:'ccm-ht720',       name:'Tacks 720 Helmet',        brand:'CCM',        category:'helmets', price:7400,  badge:null,      img:'photo/HT720_WH_01.png.webp',             imgDesc:'CCM Tacks 720' }),
  new Product({ id:'ccm-tacks-hat',   name:'Tacks 710 Helmet',        brand:'CCM',        category:'helmets', price:6200,  badge:null,      img:'assets/p-ccm-tacks.webp',                imgDesc:'CCM Tacks 710' }),
  new Product({ id:'ccm-next-elbow',  name:'NEXT Elbow Pads',         brand:'CCM',        category:'pads',    price:2800,  badge:null,      img:'photo/EPNEXT23_01.png.webp',             imgDesc:'CCM NEXT Elbow' }),
  new Product({ id:'ccm-goal-mask',    name:'Axis A1 Pro Goalie Mask', brand:'CCM',        category:'helmets', price:16500, badge:'GOALIE',  img:'photo/image_29309018-5c98-41c3-9bcc-5a8eec06da57.png.webp', imgDesc:'CCM Axis A1 Goalie Mask' }),
  new Product({ id:'ccm-asv-pants',   name:'Tacks AS-V Pro Pants',    brand:'CCM',        category:'pads',    price:7200,  badge:null,      img:'photo/Screenshot2024-02-26at20.04.14.png.webp', imgDesc:'CCM Tacks AS-V Pants' }),
  new Product({ id:'ccm-xf-pants',    name:'XF Pro Pants',            brand:'CCM',        category:'pads',    price:6500,  badge:null,      img:'photo/HPXF-SR-12_01-blue.png',           imgDesc:'CCM XF Pro Pants' }),

  // ── Reebok ──
  new Product({ id:'reebok-helm',     name:'11K Pro Helmet',          brand:'Reebok',     category:'helmets', price:5500,  badge:null,      img:'assets/p-reebok-helm.png',               imgDesc:'Reebok 11K Helmet' }),
  new Product({ id:'reebok-helm-blue',name:'RBK 6K Pro Helmet',       brand:'Reebok',     category:'helmets', price:4900,  badge:'CLASSIC', img:'photo/reebok-blue-hockey-helmet-hfi5c6qimd6ko8j8.jpg.png', imgDesc:'Reebok 6K Helmet' }),

  // ── Graf ──
  new Product({ id:'graf-ultra',      name:'Ultra G9035 Skates',      brand:'Graf',       category:'skates',  price:28000, badge:'HANDMADE',img:'photo/graf_9035_75_flex_ice_skates_1_grande.png.webp', imgDesc:'Graf Ultra G9035' }),

  // ── True Hockey ──
  new Product({ id:'true-catalyst',   name:'Catalyst 9X4 Skates',     brand:'True Hockey',category:'skates',  price:36200, badge:'NEW',     img:'photo/2024_Hockey_Catalyst_9x4_PlayerSkate_45AngleFront_Main-1600x1600-210612d_512x512.png.webp', imgDesc:'True Catalyst 9X4' }),
  new Product({ id:'true-cat-goal',   name:'Catalyst 7 Goalie Skates',brand:'True Hockey',category:'skates',  price:34800, badge:'GOALIE',  img:'photo/33.png',                           imgDesc:'True Catalyst Goalie' }),
  new Product({ id:'true-ax9',        name:'AX9 Pro Stick',           brand:'True Hockey',category:'sticks',  price:16800, badge:'TOP',     img:'assets/p-true-ax9-new.webp',             imgDesc:'True AX9' }),

  // ── Sher-Wood ──
  new Product({ id:'sw-rekker',       name:'Rekker M90 Stick',        brand:'Sher-Wood',  category:'sticks',  price:11200, badge:null,      img:'assets/p-sw-rekker.webp',                imgDesc:'Sher-Wood Rekker M90' }),
  new Product({ id:'sw-pads',         name:'Code I Pro Shoulder Pads',brand:'Sher-Wood',  category:'pads',    price:6900,  badge:null,      img:'assets/p-sw-pads.png',                   imgDesc:'Sher-Wood Code I Pro' }),
  new Product({ id:'sw-rx3-eb',       name:'Rekker RX3 Elbow Pads',   brand:'Sher-Wood',  category:'pads',    price:3400,  badge:null,      img:'photo/icehockey_elbow_pad_rx3_front_036_1.png.webp', imgDesc:'Sher-Wood RX3 Elbow' }),

  // ── Warrior ──
  new Product({ id:'warrior-covert-qr5',name:'Covert QR5 Pro Stick',  brand:'Warrior',    category:'sticks',  price:12800, badge:null,      img:'photo/de016cf3918edfa6_original.png.webp', imgDesc:'Warrior Covert QR5 Pro' }),
  new Product({ id:'warrior-v4-goal', name:'V4 Pro Goalie Stick',     brand:'Warrior',    category:'sticks',  price:14200, badge:'GOALIE',  img:'photo/1.png',                            imgDesc:'Warrior V4 Pro Goalie' }),
  new Product({ id:'warrior-ritual-asg',name:'Ritual ASG Pro Stick',  brand:'Warrior',    category:'sticks',  price:15800, badge:'GOALIE',  img:'photo/QR1021L6_BK_P_1.png',              imgDesc:'Warrior Ritual ASG Pro' }),
  new Product({ id:'warrior-ritual-g6', name:'Ritual G6E Goal Stick', brand:'Warrior',    category:'sticks',  price:13500, badge:'GOALIE',  img:'photo/QRM23L6_TWI_A_1.png',              imgDesc:'Warrior Ritual G6E' }),
  new Product({ id:'warrior-qre',     name:'Covert QRE 20 Pro Stick', brand:'Warrior',    category:'sticks',  price:13500, badge:'PRO',     img:'assets/p-warrior-qre-new.webp',          imgDesc:'Warrior Covert QRE 20' }),
  new Product({ id:'warrior-gloves',  name:'Alpha DX Pro Gloves',     brand:'Warrior',    category:'gloves',  price:8900,  badge:null,      img:'assets/p-warrior-gloves.webp',           imgDesc:'Warrior Alpha DX Pro' }),

  // ── Jersey & extras ──
  new Product({ id:'jersey-canada',   name:'Vintage Canada Jersey',   brand:'Reebok',     category:'pads',    price:4800,  badge:'RETRO',   img:'photo/VS-IH-CAN-1b_593e11f9-8b0e-46b8-a907-d328be46b97e.png.webp', imgDesc:'Canada Jersey' }),

  // ── Fischer ──
  new Product({ id:'fischer-rc-one-xpro', name:'RC One XPro Stick',   brand:'Fischer',    category:'sticks',  price:11400, badge:'NEW',     img:'photo/stick-fischer-rc-one-xpro-sr.jpg', imgDesc:'Fischer RC One XPro' }),
  new Product({ id:'fischer-rc-one-is2',  name:'RC One IS2 Stick',    brand:'Fischer',    category:'sticks',  price:9800,  badge:null,      img:'photo/FischerRCOneIS2_2_1200x1200.png.webp', imgDesc:'Fischer RC One IS2' }),

  // ── Sher-Wood (нові) ──
  new Product({ id:'sw-morph-pro',    name:'Rekker Morph Pro Stick',  brand:'Sher-Wood',  category:'sticks',  price:13800, badge:'PRO',     img:'photo/sherwood-sw-rekker-morph-pro-stick-sr.jpg.png', imgDesc:'Sher-Wood Rekker Morph Pro' }),
  new Product({ id:'sw-pmp-700',      name:'Feather-Balanced PMP 700',brand:'Sher-Wood',  category:'sticks',  price:4200,  badge:'CLASSIC', img:'photo/tkachu_transparent.png.webp', imgDesc:'Sher-Wood PMP 700' }),
  new Product({ id:'sw-icon',         name:'Icon Composite Stick',    brand:'Sher-Wood',  category:'sticks',  price:6900,  badge:null,      img:'photo/sherwood-icon-composite-stick-senior-right-3bf63035-6cd4-4e47-b918-1df36edafb9e.png.avif', imgDesc:'Sher-Wood Icon Composite' }),
  new Product({ id:'sw-t60x-shin',    name:'T60x Shin Guards',        brand:'Sher-Wood',  category:'pads',    price:3400,  badge:null,      img:'photo/334489420__01______a_480x480.png.webp', imgDesc:'Sher-Wood T60x Shin' }),

  // ── Warrior (нові) ──
  new Product({ id:'warrior-swagger', name:'Swagger Pro Goal Stick',  brand:'Warrior',    category:'sticks',  price:12900, badge:'GOALIE',  img:'photo/8688349e-8e54-4f86-bbbc-0fce4dba4890.0ac61630f5876f51fde36db5caeb13b3.png', imgDesc:'Warrior Swagger Pro Goalie' }),

  // ── Bags ──
  new Product({ id:'bauer-bag-premium-jr', name:'Premium Carry Bag JR',brand:'Bauer',     category:'bags',    price:2800,  badge:'JR',      img:'photo/bauerpremiumcarrybagjunior__black_1_1445x.png.webp', imgDesc:'Bauer Premium Carry Bag JR' }),
  new Product({ id:'bauer-bag-core-jr',    name:'Core Carry Bag JR',  brand:'Bauer',     category:'bags',    price:2200,  badge:null,      img:'photo/1063630_BTH24_BAG_CORECARRY_JR_BLK_catalog-threequarter-front_1445x.png.webp', imgDesc:'Bauer Core Carry Bag JR' }),
  new Product({ id:'bauer-bag-elite-sr',   name:'Elite Wheeled Bag SR',brand:'Bauer',    category:'bags',    price:4900,  badge:'WHEELED', img:'photo/1063632_BTH24_BAG_ELITEWHEELED_SR_BLK_catalog-threequarter-front_edit_1250x.png.webp', imgDesc:'Bauer Elite Wheeled Bag SR' }),
  new Product({ id:'ccm-bag-pro',     name:'Pro Carry Bag',           brand:'CCM',        category:'bags',    price:2600,  badge:null,      img:'photo/B54037-12_01.png', imgDesc:'CCM Pro Carry Bag' }),
  new Product({ id:'ccm-bag-t9',      name:'Team Pro T9 Bag',         brand:'CCM',        category:'bags',    price:3100,  badge:'PRO',     img:'photo/BTPRO-T9_01.png', imgDesc:'CCM Team Pro T9 Bag' }),
  new Product({ id:'ccm-bag-sports',  name:'Sports Duffle Bag',       brand:'CCM',        category:'bags',    price:1900,  badge:null,      img:'photo/BSPORTS-12_01.png', imgDesc:'CCM Sports Duffle' }),

  // ── Accessories ──
  new Product({ id:'shock-gel-max',   name:'Gel Max Mouthguard',      brand:'Shock Doctor',category:'accessories',price:650, badge:null,      img:'photo/shock-doctor-gel-max-mouthguard-mouthguard-sd-gmm-bk-ad-black-888748.png.webp', imgDesc:'Shock Doctor Gel Max' }),
  new Product({ id:'shock-ultra2',    name:'Ultra 2 STC Mouthguard',  brand:'Shock Doctor',category:'accessories',price:890, badge:'PRO',     img:'photo/SD_7501_Ultra2.png.webp', imgDesc:'Shock Doctor Ultra 2 STC' }),

  // ── Bauer Goalie ──
  new Product({ id:'bauer-mask-930',   name:'Profile 930 Goalie Mask', brand:'Bauer',       category:'helmets',    price:9800,  badge:'GOALIE',  img:'photo/1063231_BTH24_GOAL_MASK_930_SR_catalog-threequarter-front_90c9d6b5-b674-43a6-b486-63741cdf19ba.png.webp', imgDesc:'Bauer Profile 930 Mask' }),
  new Product({ id:'bauer-mask-940',   name:'Profile 940 Cat-Eye Mask',brand:'Bauer',       category:'helmets',    price:14200, badge:'GOALIE',  img:'photo/1064943_BTH25_GOAL_MASK_940_CAT-EYE_WHT_front.png.webp', imgDesc:'Bauer Profile 940 Cat-Eye' }),
  new Product({ id:'bauer-elite-chest',name:'Elite Goalie Chest',      brand:'Bauer',       category:'pads',       price:18900, badge:'GOALIE',  img:'photo/Bauer-Elite-Goalie-Chest-Arms-Protector-copy.png', imgDesc:'Bauer Elite Goalie Chest' }),
  new Product({ id:'bauer-shadow-chest',name:'Shadow Goalie Chest',    brand:'Bauer',       category:'pads',       price:21500, badge:'PRO',     img:'photo/shadowchest__1.png.webp', imgDesc:'Bauer Shadow Goalie Chest' }),
  new Product({ id:'bauer-gsx-chest',  name:'GSX Goalie Chest',        brand:'Bauer',       category:'pads',       price:8400,  badge:'GOALIE',  img:'photo/gsxchest__black_1.png.webp', imgDesc:'Bauer GSX Goalie Chest' }),
  new Product({ id:'bauer-elite-goal-stick',name:'Elite Goalie Stick', brand:'Bauer',       category:'sticks',     price:11800, badge:'GOALIE',  img:'photo/elitegoalstick__black_1_9400f896-a88b-466e-9989-2a21065038c8.png.webp', imgDesc:'Bauer Elite Goal Stick' }),
  new Product({ id:'bauer-gsx-goal',   name:'GSX Goalie Stick',        brand:'Bauer',       category:'sticks',     price:6400,  badge:'GOALIE',  img:'photo/Bauer-GSX-Goalie-Stick-Silver-Black.png', imgDesc:'Bauer GSX Goalie Stick' }),
  new Product({ id:'bauer-pro-goal-jock',name:'Pro Goalie Jock',       brand:'Bauer',       category:'pads',       price:2400,  badge:'GOALIE',  img:'photo/Bauer-Pro-Goalie-Jock2.png', imgDesc:'Bauer Pro Goalie Jock' }),
  new Product({ id:'bauer-elite-goal-jock',name:'Elite Goalie Jock',   brand:'Bauer',       category:'pads',       price:3100,  badge:'GOALIE',  img:'photo/1065224_BTH25_GOAL_JOCK_ELITE_SR_catalog-front_276f92bb-b2e6-4e17-8452-917d1b175a6f_1946x.png.webp', imgDesc:'Bauer Elite Goalie Jock' }),
  new Product({ id:'bauer-crew-sock',  name:'Crew Sock',               brand:'Bauer',       category:'accessories',price:320,   badge:null,      img:'photo/Bauercrewsock_Black__01_1250x.png.webp', imgDesc:'Bauer Crew Sock' }),
  new Product({ id:'bauer-skate-socks',name:'Performance Skate Socks', brand:'Bauer',       category:'accessories',price:480,   badge:null,      img:'photo/1065353_BTH25_APPAREL_SKATE-SOCKS_PERF-TALL_SR_9945_1445x.png.webp', imgDesc:'Bauer Skate Socks' }),

  // ── CCM Goalie ──
  new Product({ id:'ccm-axis19-mask',  name:'Axis 19 Goalie Mask',     brand:'CCM',         category:'helmets',    price:8200,  badge:'GOALIE',  img:'photo/CCM-Axis-19-Mask-Certified.png', imgDesc:'CCM Axis 19 Mask' }),
  new Product({ id:'ccm-axis-a15-mask',name:'Axis A1.5 Goalie Mask',   brand:'CCM',         category:'helmets',    price:10400, badge:'GOALIE',  img:'photo/goalie-masks-ccm-axis-a1-5-senior-goalie-mask-decal-1221726744_1800x1800.png.webp', imgDesc:'CCM Axis A1.5 Mask' }),
  new Product({ id:'ccm-axis-a19-chest',name:'Axis A19 Goalie Chest',  brand:'CCM',         category:'pads',       price:17200, badge:'GOALIE',  img:'photo/CCM-Axis-A19-Goalie-Chest-Arms-Protector.png', imgDesc:'CCM Axis A19 Chest' }),
  new Product({ id:'ccm-tacks-pro-pads',name:'Tacks Pro Goalie Pads',  brand:'CCM',         category:'pads',       price:34500, badge:'TOP PRO', img:'photo/CCM26_DTC_TACKS PRO.png', imgDesc:'CCM Tacks Pro Goalie Pads' }),
  new Product({ id:'ccm-ab-pro-chest', name:'AB Pro Spec Goalie Chest',brand:'CCM',         category:'pads',       price:24800, badge:'PRO',     img:'photo/ABPROSPEC_01.png', imgDesc:'CCM AB Pro Spec Chest' }),
  new Product({ id:'ccm-next-shin',    name:'Next Shin Guards',        brand:'CCM',         category:'pads',       price:3400,  badge:'NEW',     img:'photo/SGNEXT23_01_62023f4d-9216-4e37-9ebd-a6e90b93a2a4_1200x1200.png.webp', imgDesc:'CCM Next Shin' }),
  new Product({ id:'ccm-xf-shin',      name:'Tacks XF Shin Guards',    brand:'CCM',         category:'pads',       price:5200,  badge:null,      img:'photo/SGXF-SR_01.png', imgDesc:'CCM Tacks XF Shin' }),
  new Product({ id:'ccm-xf-goal-stick',name:'XF Pro Goalie Stick',     brand:'CCM',         category:'sticks',     price:13600, badge:'GOALIE',  img:'photo/HSGXFP_RD_07.png', imgDesc:'CCM XF Pro Goal Stick' }),
  new Product({ id:'ccm-vector-goal-stick',name:'Vector Goalie Stick', brand:'CCM',         category:'sticks',     price:8900,  badge:'GOALIE',  img:'photo/HSGVZ25C-NV.png', imgDesc:'CCM Vector Goalie Stick' }),

  // ── CCM Pro Goalie Masks ──
  new Product({ id:'ccm-pro-mask-wht', name:'Axis Pro Goalie Mask (White)', brand:'CCM',    category:'helmets',    price:13800, badge:'PRO',     img:'photo/GFAF9-SR-01_01.png', imgDesc:'CCM Axis Pro Mask White' }),
  new Product({ id:'ccm-pro-mask-blk', name:'Axis Pro Goalie Mask (Black)', brand:'CCM',    category:'helmets',    price:13800, badge:'PRO',     img:'photo/GFAF9CCE-BK_01.png', imgDesc:'CCM Axis Pro Mask Black' }),

  // ── Vaughn ──
  new Product({ id:'vaughn-gp-e79',    name:'GP E7.9 Goalie Pads',     brand:'Vaughn',      category:'pads',       price:21800, badge:'GOALIE',  img:'photo/GPE7.9CC-WH.WH.BK.BK.png', imgDesc:'Vaughn GP E7.9 Pads' }),
  new Product({ id:'vaughn-vp-ion-pro',name:'VP Ion Pro Goalie Chest', brand:'Vaughn',      category:'pads',       price:19400, badge:'PRO',     img:'photo/vp-ion-pro-front_1530.png', imgDesc:'Vaughn VP Ion Pro Chest' }),

  // ── Warrior (нові) ──
  new Product({ id:'warrior-v4-pro-wh',name:'V4 Pro White Goal Stick', brand:'Warrior',     category:'sticks',     price:14800, badge:'GOALIE',  img:'photo/V4P23L4_WH_A_1.png', imgDesc:'Warrior V4 Pro White' }),
  new Product({ id:'warrior-jock',     name:'Alpha Pro Jock',          brand:'Warrior',     category:'accessories',price:1450,  badge:null,      img:'photo/warrior-alpha-jock-roller-hockey-accessories-31.webp', imgDesc:'Warrior Alpha Jock' }),

  // ── CCM Next Shin Youth ──
  new Product({ id:'ccm-next-shin-yt',name:'Next Shin Guards Youth',   brand:'CCM',         category:'pads',       price:2200,  badge:'JR',      img:'photo/SGNEXT23_YT_01.png', imgDesc:'CCM Next Shin YT' }),

  // ── CP51 (generic body armor) ──
  new Product({ id:'cp51-evo',         name:'CP51 EVO Chest Protector',brand:'Byte',        category:'pads',       price:6200,  badge:null,      img:'photo/CP51_EVO_0.1_FRONT_9891176b-9cf0-4df4-904b-9607b2d6c5f2.png.webp', imgDesc:'Byte CP51 EVO' }),

  // ── Byte ──
  new Product({ id:'byte-knee',        name:'Knee/Shin Pads',          brand:'Byte',        category:'pads',       price:1800,  badge:null,      img:'photo/ByteKneePadsFront.png.webp', imgDesc:'Byte Knee/Shin Pads' }),

  // ── Apparel ──
  new Product({ id:'usa-tee',          name:'Team USA Hockey Tee',     brand:'Reebok',      category:'accessories',price:1290,  badge:'RETRO',   img:'photo/tshirt-usa-white-back-510x510-1.png', imgDesc:'USA Hockey Tee' }),
];

/* ─────────────────────────────────────────
   3. КОШИК (localStorage + власний об'єкт)
───────────────────────────────────────── */
let cart = JSON.parse(localStorage.getItem('iv_cart') || '[]');

function saveCart() {
  localStorage.setItem('iv_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) {
    cartCountEl.textContent = count;
    cartCountEl.style.transform = 'scale(1.5)';
    setTimeout(() => { cartCountEl.style.transform = 'scale(1)'; }, 300);
  }

  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = total.toLocaleString('uk-UA') + ' ₴';

  const itemsEl = document.getElementById('cartItems');
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="cart-empty">Кошик порожній</div>';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-brand">${item.brand}</span>
      </div>
      <div class="cart-item-right">
        <div class="cart-item-qty">
          <button class="qty-btn" data-id="${item.id}" data-op="minus">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-id="${item.id}" data-op="plus">+</button>
        </div>
        <span class="cart-item-price">${(item.price * item.qty).toLocaleString('uk-UA')} ₴</span>
        <button class="cart-item-remove" data-id="${item.id}">✕</button>
      </div>
    </div>
  `).join('');

  // Qty buttons
  itemsEl.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const op = btn.dataset.op;
      const idx = cart.findIndex(i => i.id === id);
      if (idx === -1) return;
      if (op === 'plus') { cart[idx].qty++; }
      else if (op === 'minus') {
        cart[idx].qty--;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
      }
      saveCart();
      updateCartUI();
    });
  });

  // Remove buttons
  itemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cart = cart.filter(i => i.id !== btn.dataset.id);
      saveCart();
      updateCartUI();
    });
  });
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  // prompt для вибору розміру (BOM window.prompt)
  const size = prompt(`Оберіть розмір для "${product.getLabel()}":\n(наприклад: 7, 7.5, 8, 8.5, 9, 9.5, S, M, L, XL)`);
  if (size === null) return; // скасовано

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: product.id, name: product.name, brand: product.brand, price: product.price, qty: 1, size: size.trim() });
  }
  saveCart();
  updateCartUI();

  // Показати drawer
  openCart();
}

function openCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Cart button
const cartBtn = document.getElementById('cartBtn');
if (cartBtn) cartBtn.addEventListener('click', openCart);

const cartClose = document.getElementById('cartClose');
if (cartClose) cartClose.addEventListener('click', closeCart);

const cartOverlay = document.getElementById('cartOverlay');
if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

updateCartUI();

/* ─────────────────────────────────────────
   4. РЕНДЕР КАТАЛОГУ (цикли + умови)
───────────────────────────────────────── */
const searchState = { query: '', brand: '', size: '' };

function renderProducts(filter = 'all', opts = {}) {
  const { skipStagger = false } = opts;
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  // Фільтрація масиву (умова + ланцюжок)
  let filtered = filter === 'all'
    ? products.slice()
    : products.filter(p => p.category === filter);

  if (searchState.query)  filtered = filtered.filter(p => p.matchesSearch(searchState.query));
  if (searchState.brand)  filtered = filtered.filter(p => p.brand === searchState.brand);
  if (searchState.size)   filtered = filtered.filter(p => p.sizes.includes(searchState.size));

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="no-products">Товарів не знайдено</p>';
    return;
  }

  // Рендер через цикл .map()
  grid.innerHTML = filtered.map((p, i) => `
    <div class="product-card" data-cat="${p.category}" data-id="${p.id}" style="--i:${i}">
      <div class="product-img">
        <div class="img-placeholder ${p.img ? 'has-img has-img--contain' : ''}">
          ${p.img
            ? `<img src="${p.img}" alt="${p.imgDesc}" loading="lazy" />`
            : `<div class="ph-label sm"><span class="ph-tag">${p.imgDesc}</span></div>`}
        </div>
        <button class="btn-share" data-share-id="${p.id}" aria-label="Поділитися">↗</button>
        <div class="product-hover-overlay">
          <button class="btn-add-full" data-product-id="${p.id}">Додати в кошик</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-meta">
          <span class="product-brand">${p.brand}</span>
          ${p.badge ? `<span class="item-badge-sm">${p.badge}</span>` : ''}
        </div>
        <h4 class="product-name">${p.name}</h4>
        <span class="product-price">${p.formatPrice()}</span>
      </div>
    </div>
  `).join('');

  // Hover overlay listeners
  grid.querySelectorAll('.btn-add-full').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.productId));
  });

  // Share buttons
  grid.querySelectorAll('.btn-share').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); shareProduct(btn.dataset.shareId); });
  });

  // Stagger animation (skipped when FLIP handles transitions)
  if (!skipStagger) {
    grid.querySelectorAll('.product-card').forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(28px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 55);
    });
  }
}

/* FLIP technique — animate cards smoothly when filter changes
   F-irst, L-ast, I-nvert, P-lay
*/
function renderProductsFLIP(filter) {
  const grid = document.getElementById('productsGrid');
  if (!grid || grid.children.length === 0) {
    renderProducts(filter);
    return;
  }
  // FIRST: snapshot positions of every existing card
  const first = new Map();
  grid.querySelectorAll('.product-card').forEach(card => {
    first.set(card.dataset.id, card.getBoundingClientRect());
  });

  // Render new state without staggered fade
  renderProducts(filter, { skipStagger: true });

  // LAST + INVERT + PLAY
  requestAnimationFrame(() => {
    grid.querySelectorAll('.product-card').forEach((card, i) => {
      const f = first.get(card.dataset.id);
      const l = card.getBoundingClientRect();
      if (f) {
        const dx = f.left - l.left;
        const dy = f.top - l.top;
        if (dx === 0 && dy === 0) return;
        card.style.transform = `translate(${dx}px, ${dy}px)`;
        card.style.transition = 'none';
        requestAnimationFrame(() => {
          card.style.transition = 'transform .55s cubic-bezier(.16,1,.3,1)';
          card.style.transform = '';
        });
      } else {
        // new card — soft fade-in from below
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px) scale(.96)';
        setTimeout(() => {
          card.style.transition = 'opacity .45s, transform .45s cubic-bezier(.16,1,.3,1)';
          card.style.opacity = '1';
          card.style.transform = '';
        }, i * 30);
      }
    });
  });
}

/* SKELETON SCREENS — placeholder cards while products "load" */
function renderSkeletons(count = 8) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const html = Array.from({ length: count }, () => `
    <div class="product-card skeleton">
      <div class="product-img"><div class="skel-block"></div></div>
      <div class="product-info">
        <div class="skel-line skel-line--sm"></div>
        <div class="skel-line skel-line--lg"></div>
        <div class="skel-line skel-line--md"></div>
      </div>
    </div>
  `).join('');
  grid.innerHTML = html;
}

// Initial render: skeleton screens → products (uses URL filter if present)
const _initialFilter = new URLSearchParams(window.location.search).get('filter') || 'all';
renderSkeletons();
setTimeout(() => renderProducts(_initialFilter), 700);

/* ─────────────────────────────────────────
   5. FILTER BUTTONS (addEventListener)
───────────────────────────────────────── */
const filterRow = document.getElementById('filterRow');
function activeCategory() {
  const btn = filterRow ? filterRow.querySelector('.filter-btn.active') : null;
  return btn ? btn.dataset.filter : 'all';
}
if (filterRow) {
  filterRow.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterRow.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProductsFLIP(btn.dataset.filter);
    });
  });
}

/* ── 5b. Search input + brand/size selects ── */
function populateSearchSelects() {
  const brandSel = document.getElementById('filterBrand');
  const sizeSel  = document.getElementById('filterSize');
  if (!brandSel || !sizeSel) return;

  const brands = [...new Set(products.map(p => p.brand))].sort();
  brands.forEach(b => {
    const o = document.createElement('option');
    o.value = b; o.textContent = b;
    brandSel.appendChild(o);
  });

  const sizes = [...new Set(products.flatMap(p => p.sizes))];
  // Sort numeric-first, then alpha
  sizes.sort((a,b) => {
    const na = parseFloat(a), nb = parseFloat(b);
    const aNum = !isNaN(na), bNum = !isNaN(nb);
    if (aNum && bNum) return na - nb;
    if (aNum) return -1;
    if (bNum) return 1;
    return a.localeCompare(b);
  });
  sizes.forEach(s => {
    const o = document.createElement('option');
    o.value = s; o.textContent = s;
    sizeSel.appendChild(o);
  });
}
populateSearchSelects();

const searchInput  = document.getElementById('searchInput');
const filterBrand  = document.getElementById('filterBrand');
const filterSize   = document.getElementById('filterSize');
const searchReset  = document.getElementById('searchReset');

let searchDebounce = null;
function applySearch() {
  renderProductsFLIP(activeCategory());
}

if (searchInput) {
  searchInput.addEventListener('input', e => {
    searchState.query = e.target.value;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(applySearch, 180);
  });
}
if (filterBrand) {
  filterBrand.addEventListener('change', e => {
    searchState.brand = e.target.value;
    applySearch();
  });
}
if (filterSize) {
  filterSize.addEventListener('change', e => {
    searchState.size = e.target.value;
    applySearch();
  });
}
if (searchReset) {
  searchReset.addEventListener('click', () => {
    searchState.query = ''; searchState.brand = ''; searchState.size = '';
    if (searchInput)  searchInput.value  = '';
    if (filterBrand)  filterBrand.value  = '';
    if (filterSize)   filterSize.value   = '';
    applySearch();
  });
}

// Brand links filter
document.querySelectorAll('[data-filter-brand]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const brand = link.dataset.filterBrand;
    const catalogSection = document.getElementById('catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        // Знайти фільтр і показати всі цього бренду
        renderProducts('all');
        const grid = document.getElementById('productsGrid');
        if (grid) {
          grid.querySelectorAll('.product-card').forEach(card => {
            const brandEl = card.querySelector('.product-brand');
            if (brandEl && !brandEl.textContent.includes(brand)) {
              card.style.opacity = '0.25';
            }
          });
        }
      }, 600);
    }
  });
});

/* ─────────────────────────────────────────
   6. ADD TO CART (featured collection)
───────────────────────────────────────── */
document.querySelectorAll('.btn-add').forEach(btn => {
  btn.addEventListener('click', () => {
    addToCart(btn.dataset.id);
  });
});

/* ─────────────────────────────────────────
   7. LIVE CLOCK — setInterval
───────────────────────────────────────── */
function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hh}:${mm}:${ss}`;

  const dd = String(now.getDate()).padStart(2, '0');
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dateStr = `${dd} / ${mo} / ${yyyy}`;

  // Год у навбарі
  const navClock = document.getElementById('navClock');
  if (navClock) navClock.textContent = timeStr;

  // Hero date + time
  const heroDate = document.getElementById('heroDate');
  if (heroDate) heroDate.textContent = dateStr;

  const heroTime = document.getElementById('heroTime');
  if (heroTime) heroTime.textContent = timeStr;

  // Mobile menu date
  const mobileDate = document.getElementById('mobileDate');
  if (mobileDate) mobileDate.textContent = `${dd}.${mo}.${yyyy}`;

  // Footer year
  const footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.textContent = yyyy;

  // Developer year
  const devYear = document.getElementById('devYear');
  if (devYear) devYear.textContent = yyyy;
}

updateClock();
setInterval(updateClock, 1000);

/* ─────────────────────────────────────────
   8. SESSION TIMER + PAGE VISIBILITY API
───────────────────────────────────────── */
let sessionSeconds = 0;
const sessionEl = document.getElementById('sessionTimer');

function tickSession() {
  sessionSeconds++;
  const m = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
  const s = String(sessionSeconds % 60).padStart(2, '0');
  if (sessionEl) sessionEl.textContent = `${m}:${s}`;
}

let sessionInterval = setInterval(tickSession, 1000);

// Page Visibility API — pause timer when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(sessionInterval);
  } else {
    sessionInterval = setInterval(tickSession, 1000);
  }
});

/* ─────────────────────────────────────────
   9. BOM — navigator, alert, confirm
───────────────────────────────────────── */

// Показати браузер у секції розробника
const devBrowserEl = document.getElementById('devBrowser');
if (devBrowserEl) {
  const ua = navigator.userAgent;
  let browserName = 'Невідомий';
  if (ua.includes('Edg/'))          browserName = 'Microsoft Edge';
  else if (ua.includes('Chrome/'))  browserName = 'Google Chrome';
  else if (ua.includes('Firefox/')) browserName = 'Mozilla Firefox';
  else if (ua.includes('Safari/'))  browserName = 'Apple Safari';
  else if (ua.includes('Opera/'))   browserName = 'Opera';
  devBrowserEl.textContent = browserName;
}

// Перше відвідування — alert
if (!localStorage.getItem('iv_visited')) {
  setTimeout(() => {
    alert('Ласкаво просимо до ICEVAULT!\n\nТільки преміум-сегмент хокейного екіпірування.\nПідпишись та отримай знижку 10% на перше замовлення.');
    localStorage.setItem('iv_visited', '1');
  }, 1800);
}

/* ─────────────────────────────────────────
   10. CUSTOM CURSOR
───────────────────────────────────────── */
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mouseX = 0, mouseY = 0, folX = 0, folY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursor) { cursor.style.left = mouseX + 'px'; cursor.style.top = mouseY + 'px'; }
});

(function animFol() {
  folX += (mouseX - folX) * 0.11;
  folY += (mouseY - folY) * 0.11;
  if (follower) { follower.style.left = folX + 'px'; follower.style.top = folY + 'px'; }
  requestAnimationFrame(animFol);
})();

document.querySelectorAll('a, button, .product-card, .col-item, .brand-block, .faq-q').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

/* ─────────────────────────────────────────
   11. NAVBAR + SCROLL PROGRESS
───────────────────────────────────────── */
const nav = document.getElementById('nav');
const progressBar = document.getElementById('scrollProgress');

window.addEventListener('scroll', () => {
  // Navbar scrolled state
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);

  // Scroll progress bar
  if (progressBar) {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
    progressBar.style.width = pct + '%';
  }

  // Back-to-top
  const bt = document.getElementById('backTop');
  if (bt) bt.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });

/* ─────────────────────────────────────────
   12. SCROLL ANIMATIONS (clip-reveal + fade-up)
───────────────────────────────────────── */
function initScrollAnimations() {
  const opts = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = el.style.getPropertyValue('--delay') || '0s';
      el.style.transitionDelay = delay;
      el.classList.add('visible');
      obs.unobserve(el);
    });
  }, opts);

  document.querySelectorAll('.clip-reveal, .fade-up').forEach(el => obs.observe(el));
}

// requestIdleCallback — defer non-critical init for better performance
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => initScrollAnimations(), { timeout: 400 });
} else {
  initScrollAnimations();
}

// Parallax на hero bg (через CSS var, не конфліктує з mouse parallax)
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    // Reduced multiplier — keeps edges within hidden buffer zone
    heroBg.style.setProperty('--sy', (window.scrollY * 0.18) + 'px');
  }, { passive: true });
}

/* ─────────────────────────────────────────
   13. HISTORY API — URL state для фільтра
───────────────────────────────────────── */
function applyFilterFromURL() {
  const filter = new URLSearchParams(window.location.search).get('filter') || 'all';
  // Only update active button — initial render handled by skeleton + timeout above
  const filterRow2 = document.getElementById('filterRow');
  if (filterRow2) {
    filterRow2.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === filter);
    });
  }
}

window.addEventListener('popstate', e => {
  const filter = e.state?.filter || 'all';
  renderProducts(filter);
  const fr = document.getElementById('filterRow');
  if (fr) fr.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
});

// Patch filter buttons to push history state
const filterRowHistory = document.getElementById('filterRow');
if (filterRowHistory) {
  filterRowHistory.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      const url = new URL(window.location);
      if (filter === 'all') { url.searchParams.delete('filter'); }
      else { url.searchParams.set('filter', filter); }
      history.pushState({ filter }, '', url);
    });
  });
}

// Apply on load (handles direct URL share)
applyFilterFromURL();

/* ─────────────────────────────────────────
   14. COUNT-UP ANIMATION (числа у статистиці)
───────────────────────────────────────── */
function countUp(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1600;
  const step = 16;
  const steps = duration / step;
  let current = 0;
  const inc = target / steps;

  const timer = setInterval(() => {
    current += inc;
    if (current >= target) {
      el.textContent = target + (el.dataset.suffix || '');
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current) + (el.dataset.suffix || '');
    }
  }, step);
}

const countObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      countUp(entry.target);
      countObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.count-up').forEach(el => countObs.observe(el));

/* ─────────────────────────────────────────
   15. MOBILE MENU
───────────────────────────────────────── */
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuBtn.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  document.querySelectorAll('[data-close]').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      menuBtn.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ─────────────────────────────────────────
   16. BACK TO TOP — location scroll
───────────────────────────────────────── */
const backTop = document.getElementById('backTop');
if (backTop) {
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ─────────────────────────────────────────
   17. SMOOTH ANCHOR SCROLL
───────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ─────────────────────────────────────────
   18. NEWSLETTER FORM (index.html)
───────────────────────────────────────── */
const ctaForm = document.getElementById('ctaForm');
if (ctaForm) {
  ctaForm.addEventListener('submit', e => {
    e.preventDefault();
    const input = ctaForm.querySelector('input');
    const btn = ctaForm.querySelector('button[type="submit"]');
    if (!input.value || !/\S+@\S+\.\S+/.test(input.value)) {
      alert('Будь ласка, введіть коректний email.');
      return;
    }
    btn.textContent = 'Підписано! ✓';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    input.value = '';
    setTimeout(() => { btn.textContent = 'Підписатися'; btn.disabled = false; btn.style.opacity = ''; }, 4000);
  });
}

/* ─────────────────────────────────────────
   19. CONTACTS FORM VALIDATION
───────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {

  function setError(fieldId, msg) {
    const fg = document.getElementById('fg-' + fieldId);
    const err = document.getElementById('err-' + fieldId);
    if (fg) fg.classList.add('has-error');
    if (err) err.textContent = msg;
  }

  function clearError(fieldId) {
    const fg = document.getElementById('fg-' + fieldId);
    const err = document.getElementById('err-' + fieldId);
    if (fg) fg.classList.remove('has-error');
    if (err) err.textContent = '';
  }

  function validateForm() {
    let valid = true;
    ['name','email','subject','msg','agree'].forEach(f => clearError(f));

    const name = document.getElementById('cName');
    const email = document.getElementById('cEmail');
    const phone = document.getElementById('cPhone');
    const subject = document.getElementById('cSubject');
    const msg = document.getElementById('cMsg');
    const agree = document.getElementById('cAgree');

    if (!name || name.value.trim().length < 2) { setError('name', "Введіть ім'я (мін. 2 символи)"); valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { setError('email', 'Введіть коректний email'); valid = false; }
    if (phone && phone.value && !/^[\d\s\+\(\)\-]{7,18}$/.test(phone.value)) { setError('phone', 'Невірний формат телефону'); valid = false; }
    if (!subject || !subject.value) { setError('subject', 'Оберіть тему'); valid = false; }
    if (!msg || msg.value.trim().length < 10) { setError('msg', 'Повідомлення мін. 10 символів'); valid = false; }
    if (!agree || !agree.checked) { setError('agree', 'Необхідно прийняти умови'); valid = false; }

    return valid;
  }

  // Real-time validation on blur
  ['cName','cEmail','cPhone','cMsg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', validateForm);
  });

  // Submit
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    const formStatus = document.getElementById('formStatus');

    // Симуляція відправки
    if (submitText) submitText.style.display = 'none';
    if (submitSpinner) submitSpinner.style.display = 'inline-block';
    if (submitBtn) submitBtn.disabled = true;

    setTimeout(() => {
      if (submitText) { submitText.style.display = ''; submitText.textContent = 'Надіслано ✓'; }
      if (submitSpinner) submitSpinner.style.display = 'none';
      if (formStatus) {
        formStatus.textContent = 'Дякуємо! Ваше повідомлення успішно надіслано. Ми зв\'яжемось з вами протягом 24 годин.';
        formStatus.className = 'form-status success';
      }
      contactForm.reset();
      setTimeout(() => {
        if (submitBtn) { submitBtn.disabled = false; }
        if (submitText) submitText.textContent = 'Надіслати';
      }, 4000);
    }, 1500);
  });

  // Reset
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      ['name','email','phone','subject','msg','agree'].forEach(f => clearError(f));
      const formStatus = document.getElementById('formStatus');
      if (formStatus) { formStatus.textContent = ''; formStatus.className = 'form-status'; }
    });
  }
}

/* ─────────────────────────────────────────
   20. FAQ ACCORDION
───────────────────────────────────────── */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* ─────────────────────────────────────────
   21. location.href — Навігація через confirm
───────────────────────────────────────── */
document.querySelectorAll('.cart-checkout').forEach(btn => {
  btn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Ваш кошик порожній. Додайте товари перед оформленням.');
      return;
    }
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const ok = confirm(`Підтвердити замовлення на суму ${total.toLocaleString('uk-UA')} ₴?\n\nТовари:\n${cart.map(i => `• ${i.name} × ${i.qty}`).join('\n')}`);
    if (ok) {
      cart = [];
      saveCart();
      updateCartUI();
      closeCart();
      alert('Дякуємо за замовлення!\nМи зв\'яжемося з вами найближчим часом.');
      // location.href для переходу на contacts
      // location.href = 'contacts.html';
    }
  });
});

/* ─────────────────────────────────────────
   22. TOAST NOTIFICATION
───────────────────────────────────────── */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast--show'));
  });
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

/* ─────────────────────────────────────────
   23. NAVIGATOR.SHARE / CLIPBOARD — поділитись товаром
───────────────────────────────────────── */
async function shareProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const url = new URL(window.location.href);
  url.searchParams.set('filter', product.category);

  const shareData = {
    title: product.getLabel(),
    text: `${product.getLabel()} — ${product.formatPrice()} | ICEVAULT`,
    url: url.toString(),
  };

  try {
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(url.toString());
      showToast('Посилання скопійовано ✓');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      showToast('Помилка при копіюванні');
    }
  }
}

/* ─────────────────────────────────────────
   24. KEYBOARD SHORTCUTS (accessibility + UX)
───────────────────────────────────────── */
document.addEventListener('keydown', e => {
  // Ignore when typing in inputs
  if (e.target.matches('input, textarea, select')) return;

  switch (e.key) {
    case 'c': case 'C':
      // C — toggle cart
      if (document.getElementById('cartDrawer')?.classList.contains('open')) { closeCart(); }
      else { openCart(); }
      break;

    case 'Escape':
      closeCart();
      if (mobileMenu?.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        menuBtn?.classList.remove('open');
        document.body.style.overflow = '';
      }
      break;

    case 'ArrowUp':
      if (e.altKey) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      break;

    case '?': {
      showToast('C — кошик  ·  Esc — закрити  ·  Alt+↑ — вгору');
      break;
    }
  }
});

/* ─────────────────────────────────────────
   26. THEME TOGGLE — prefers-color-scheme + manual override
───────────────────────────────────────── */
const THEME_KEY = 'iv_theme';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}
const userTheme = localStorage.getItem(THEME_KEY);
if (userTheme) {
  applyTheme(userTheme);
} else {
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(prefersLight ? 'light' : 'dark');
}
// React to system theme change (only if user hasn't explicitly chosen)
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
  if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'light' : 'dark');
});
const themeToggleBtn = document.getElementById('themeToggle');
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    showToast(next === 'light' ? 'Світла тема' : 'Темна тема');
  });
}

/* ─────────────────────────────────────────
   27. THREE.JS — moved to three3d.js (ESM + GLTFLoader)
───────────────────────────────────────── */

/* ─────────────────────────────────────────
   28. DYNAMIC FAVICON — canvas-based, reflects cart count
───────────────────────────────────────── */
function updateFavicon() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background puck
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Gold ring
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 7, 0, Math.PI * 2);
  ctx.stroke();

  // "IV" mark
  ctx.fillStyle = '#f0ede8';
  ctx.font = 'bold 22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('IV', size/2, size/2 + 1);

  // Cart count badge
  const count = cart.reduce((s, i) => s + i.qty, 0);
  if (count > 0) {
    ctx.fillStyle = '#e62e2e';
    ctx.beginPath();
    ctx.arc(size - 14, 14, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(count > 9 ? '9+' : String(count), size - 14, 15);
  }

  let link = document.getElementById('favicon');
  if (!link) {
    link = document.createElement('link');
    link.id = 'favicon';
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/png';
  link.href = canvas.toDataURL('image/png');
}

// Run on load + on cart change (patch updateCartUI)
updateFavicon();
const _origUpdateCartUI = updateCartUI;
updateCartUI = function() {
  _origUpdateCartUI.apply(this, arguments);
  updateFavicon();
};

/* ─────────────────────────────────────────
   29. MOUSE-MOVE PARALLAX (hero)
───────────────────────────────────────── */
const heroEl = document.getElementById('hero');
const heroBgEl = document.querySelector('.hero-bg');
const heroContentEl = document.querySelector('.hero-content');
let parallaxRAF = null;

if (heroEl && heroBgEl && heroContentEl) {
  let mouseDx = 0, mouseDy = 0;
  heroEl.addEventListener('mousemove', e => {
    const rect = heroEl.getBoundingClientRect();
    mouseDx = ((e.clientX - rect.left) / rect.width - 0.5);
    mouseDy = ((e.clientY - rect.top) / rect.height - 0.5);
    if (!parallaxRAF) {
      parallaxRAF = requestAnimationFrame(() => {
        // bg moves opposite to mouse (depth illusion)
        heroBgEl.style.setProperty('--mx', (mouseDx * -22) + 'px');
        heroBgEl.style.setProperty('--my', (mouseDy * -22) + 'px');
        // content moves WITH mouse (subtle)
        heroContentEl.style.setProperty('--mx', (mouseDx * 14) + 'px');
        heroContentEl.style.setProperty('--my', (mouseDy * 8)  + 'px');
        parallaxRAF = null;
      });
    }
  });
  heroEl.addEventListener('mouseleave', () => {
    heroBgEl.style.setProperty('--mx', '0px');
    heroBgEl.style.setProperty('--my', '0px');
    heroContentEl.style.setProperty('--mx', '0px');
    heroContentEl.style.setProperty('--my', '0px');
  });
}

/* ─────────────────────────────────────────
   30. HOVER TILT effect
───────────────────────────────────────── */
document.querySelectorAll('.hover-tilt').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});


/* ═══════════════════════════════════════════════════════
   31. AI GEAR ASSISTANT (rule-based wizard)
═══════════════════════════════════════════════════════ */
const AI_STEPS = [
  {
    key: 'position',
    title: 'Яка твоя позиція на льоду?',
    options: [
      { value: 'forward',  label: 'Нападник',  hint: 'Швидкість і кидок' },
      { value: 'defense',  label: 'Захисник',  hint: 'Сила і силова боротьба' },
      { value: 'goalie',   label: 'Воротар',   hint: 'Воротарська позиція' },
    ],
  },
  {
    key: 'level',
    title: 'Який твій рівень гри?',
    options: [
      { value: 'beginner', label: 'Початківець', hint: 'Перші сезони на льоду' },
      { value: 'amateur',  label: 'Аматор',      hint: 'Граю регулярно у лізі' },
      { value: 'pro',      label: 'Просунутий',  hint: 'Турніри, високий рівень' },
    ],
  },
  {
    key: 'budget',
    title: 'Який орієнтовний бюджет?',
    options: [
      { value: 'low',  label: 'до 8 000 ₴',     hint: 'Доступний сегмент' },
      { value: 'mid',  label: '8 000–20 000 ₴', hint: 'Збалансовано' },
      { value: 'high', label: '20 000+ ₴',      hint: 'Топ-екіпіровка' },
    ],
  },
  {
    key: 'need',
    title: 'Що шукаєш насамперед?',
    options: [
      { value: 'skates',       label: 'Ковзани' },
      { value: 'sticks',       label: 'Ключку' },
      { value: 'helmets',      label: 'Шолом' },
      { value: 'pads',         label: 'Захист' },
      { value: 'gloves',       label: 'Рукавиці' },
      { value: 'bags',         label: 'Сумку' },
      { value: 'accessories',  label: 'Аксесуари' },
    ],
  },
];

const aiState = { step: 0, answers: {} };

function priceBucket(p) {
  if (p < 8000)  return 'low';
  if (p < 20000) return 'mid';
  return 'high';
}

function aiRecommend() {
  const { need, budget, position, level } = aiState.answers;
  let pool = products.filter(p => p.category === need);

  // GOALIE filter
  if (position === 'goalie') {
    const goalieItems = pool.filter(p => (p.badge || '').toUpperCase().includes('GOAL') || /goal/i.test(p.name));
    if (goalieItems.length > 0) pool = goalieItems;
  } else {
    pool = pool.filter(p => !/goal|goalie/i.test(p.name) && !(p.badge || '').toUpperCase().includes('GOAL'));
  }

  // BUDGET filter
  let inBudget = pool.filter(p => priceBucket(p.price) === budget);
  if (inBudget.length < 2) {
    // expand by ±1 bucket
    inBudget = pool.sort((a, b) => Math.abs(a.price - bucketTarget(budget)) - Math.abs(b.price - bucketTarget(budget)));
  }

  // LEVEL ranking
  const proWords = ['PRO','TOP','TOP PRO','NEW','HANDMADE'];
  const score = (p) => {
    let s = 0;
    if (level === 'pro' && proWords.includes((p.badge || '').toUpperCase()))    s += 3;
    if (level === 'beginner' && !proWords.includes((p.badge || '').toUpperCase())) s += 2;
    if (level === 'amateur') s += 1;
    return s;
  };
  inBudget.sort((a, b) => score(b) - score(a));

  return inBudget.slice(0, 3);
}

function bucketTarget(b) {
  return b === 'low' ? 5000 : b === 'mid' ? 14000 : 30000;
}

function renderAiStep() {
  const body = document.getElementById('aiBody');
  if (!body) return;
  const step = AI_STEPS[aiState.step];
  if (!step) { renderAiResult(); return; }

  const progress = Math.round(((aiState.step) / AI_STEPS.length) * 100);
  body.innerHTML = `
    <div class="ai-progress"><div class="ai-progress-bar" style="width:${progress}%"></div></div>
    <div class="ai-step-num">Крок ${aiState.step + 1} з ${AI_STEPS.length}</div>
    <h4 class="ai-q">${step.title}</h4>
    <div class="ai-options">
      ${step.options.map(o => `
        <button class="ai-option" data-val="${o.value}">
          <span class="ai-option-label">${o.label}</span>
          ${o.hint ? `<span class="ai-option-hint">${o.hint}</span>` : ''}
        </button>
      `).join('')}
    </div>
    ${aiState.step > 0 ? `<button class="ai-back" id="aiBack">← Назад</button>` : ''}
  `;
  body.querySelectorAll('.ai-option').forEach(btn => {
    btn.addEventListener('click', () => {
      aiState.answers[step.key] = btn.dataset.val;
      aiState.step++;
      renderAiStep();
    });
  });
  const back = document.getElementById('aiBack');
  if (back) back.addEventListener('click', () => { aiState.step--; renderAiStep(); });
}

function renderAiResult() {
  const body = document.getElementById('aiBody');
  if (!body) return;
  const recs = aiRecommend();
  body.innerHTML = `
    <div class="ai-progress"><div class="ai-progress-bar" style="width:100%"></div></div>
    <h4 class="ai-q">Підібрали для тебе:</h4>
    <p class="ai-result-sub">На основі позиції, рівня та бюджету.</p>
    <div class="ai-results">
      ${recs.length === 0 ? '<p class="ai-empty">Не знайшли точних збігів. Спробуй розширити бюджет.</p>' :
        recs.map(p => `
          <div class="ai-rec">
            <div class="ai-rec-img">${p.img ? `<img src="${p.img}" alt="${p.imgDesc}" loading="lazy"/>` : ''}</div>
            <div class="ai-rec-info">
              <span class="ai-rec-brand">${p.brand}</span>
              <span class="ai-rec-name">${p.name}</span>
              <span class="ai-rec-price">${p.formatPrice()}</span>
            </div>
            <button class="ai-rec-add" data-add="${p.id}">+ Кошик</button>
          </div>
        `).join('')}
    </div>
    <div class="ai-actions">
      <button class="ai-restart" id="aiRestart">↺ Спочатку</button>
      <a class="ai-to-catalog" href="index.html#catalog">До каталогу →</a>
    </div>
  `;
  body.querySelectorAll('.ai-rec-add').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.add));
  });
  const restart = document.getElementById('aiRestart');
  if (restart) restart.addEventListener('click', () => {
    aiState.step = 0; aiState.answers = {}; renderAiStep();
  });
}

function openAi() {
  document.getElementById('aiModal')?.classList.add('open');
  document.getElementById('aiOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  aiState.step = 0; aiState.answers = {};
  renderAiStep();
}
function closeAi() {
  document.getElementById('aiModal')?.classList.remove('open');
  document.getElementById('aiOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('aiBtn')?.addEventListener('click', openAi);
document.getElementById('aiClose')?.addEventListener('click', closeAi);
document.getElementById('aiOverlay')?.addEventListener('click', closeAi);

/* ═══════════════════════════════════════════════════════
   32. CHECKOUT FORM (FormSubmit + autoresponder)
═══════════════════════════════════════════════════════ */
function buildOrderSummary() {
  if (cart.length === 0) return 'Кошик порожній';
  const lines = cart.map(i => `${i.brand} ${i.name} — розмір ${i.size}, ${i.qty} шт × ${i.price.toLocaleString('uk-UA')} ₴ = ${(i.price * i.qty).toLocaleString('uk-UA')} ₴`);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return lines.join('\n') + `\n\nРАЗОМ: ${total.toLocaleString('uk-UA')} ₴`;
}

function renderCheckoutSummary() {
  const box = document.getElementById('checkoutSummary');
  if (!box) return;
  if (cart.length === 0) {
    box.innerHTML = '<p class="checkout-empty">Кошик порожній — додай товари перед оформленням.</p>';
    return;
  }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  box.innerHTML = `
    <div class="checkout-summary-title">Ваше замовлення (${cart.length})</div>
    <ul class="checkout-list">
      ${cart.map(i => `<li><span>${i.brand} ${i.name} <em>${i.size}</em> × ${i.qty}</span><b>${(i.price*i.qty).toLocaleString('uk-UA')} ₴</b></li>`).join('')}
    </ul>
    <div class="checkout-total"><span>Разом:</span><b>${total.toLocaleString('uk-UA')} ₴</b></div>
  `;
}

function openCheckout() {
  if (cart.length === 0) {
    alert('Кошик порожній. Додайте товари перед оформленням.');
    return;
  }
  closeCart();
  document.getElementById('checkoutModal')?.classList.add('open');
  document.getElementById('checkoutOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCheckoutSummary();
  const sumHidden = document.getElementById('orderSummaryHidden');
  if (sumHidden) sumHidden.value = buildOrderSummary();
  const auto = document.getElementById('autoresponseHidden');
  if (auto) auto.value = `Дякуємо за замовлення в ICEVAULT!\n\nМи отримали ваше замовлення та звʼяжемося з вами найближчим часом для підтвердження доставки.\n\nДеталі:\n${buildOrderSummary()}\n\nЗ повагою, команда ICEVAULT.`;
}

function closeCheckout() {
  document.getElementById('checkoutModal')?.classList.remove('open');
  document.getElementById('checkoutOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('cartCheckoutBtn')?.addEventListener('click', openCheckout);
document.getElementById('checkoutClose')?.addEventListener('click', closeCheckout);
document.getElementById('checkoutOverlay')?.addEventListener('click', closeCheckout);

const ADMIN_EMAIL = 'sinelnikovruslan45@gmail.com';

function buildMailto(d, to) {
  const subject = encodeURIComponent('ICEVAULT — нове замовлення від ' + (d.name || 'клієнта'));
  const body = encodeURIComponent(
    `Замовлення з сайту ICEVAULT\n\n` +
    `Імʼя: ${d.name}\nEmail клієнта: ${d.email}\nТелефон: ${d.phone}\nМісто: ${d.city}\n` +
    (d.comment ? `Коментар: ${d.comment}\n` : '') +
    `\n${d.order_summary}\n`
  );
  return `mailto:${to}?subject=${subject}&body=${body}&cc=${d.email}`;
}

const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = document.getElementById('checkoutNote');
    const submitBtn = checkoutForm.querySelector('.checkout-submit');
    const fd = new FormData(checkoutForm);
    /* FormSubmit потребує _replyto для коректної reply-адреси */
    if (!fd.has('_replyto')) fd.append('_replyto', fd.get('email') || '');
    const formObj = Object.fromEntries(fd);

    if (note) { note.textContent = '⏳ Надсилаємо…'; note.classList.remove('ok','warn'); }
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch(checkoutForm.action, {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === 'false' || data.success === false) {
        throw new Error(data.message || ('HTTP ' + res.status));
      }
      note.innerHTML = '✓ Замовлення прийнято! Лист-підтвердження надіслано на <b>' + formObj.email + '</b>.<br><small>Перший раз? Зайди на пошту ' + ADMIN_EMAIL + ' і натисни Activate у листі FormSubmit — тоді всі наступні замовлення приходитимуть автоматично.</small>';
      note.classList.add('ok');
      cart = []; saveCart(); updateCartUI();
      setTimeout(() => {
        closeCheckout(); checkoutForm.reset();
        note.innerHTML = ''; note.classList.remove('ok');
        if (submitBtn) submitBtn.disabled = false;
      }, 5500);
    } catch (err) {
      const link = buildMailto(formObj, ADMIN_EMAIL);
      note.innerHTML = `⚠ Автонадсилання недоступне (${err.message}). <a href="${link}" target="_blank" style="color:#c4b5fd;text-decoration:underline">Відкрити поштовий клієнт →</a>`;
      note.classList.add('warn');
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

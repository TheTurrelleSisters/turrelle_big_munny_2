var BUILD_VERSION=(function(){
  try{
    var s=(document.currentScript&&document.currentScript.src)||'';
    var m=s.match(/[?&]v=([\d.]+)/);
    return m?m[1]:'unknown';
  }catch(e){return 'unknown';}
})();
/* ── game.js v1.0.0 — The Turrelle Sisters Big Munny II ──
 * Engine, UI, audio, Red Spin, splash/init. Loads LAST.
 * Rule 14: verify every required file loaded; visible error + halt on failure. */
(function(){
  var required=[
    ['BASE_STRIPS','js/reel_strips.js'],
    ['COMBO_POSITIONS','js/combo_positions.js'],
    ['WIN_POOLS','js/win_pools.js'],
    ['BINGO_PATTERNS','js/paytable.js'],
    ['NOWIN_POOL','js/nowin_pool.js'],
    ['WABC','js/wabc.js'],
    ['Progressive','js/progressive.js']
  ];
  var missing=[];
  for(var i=0;i<required.length;i++){
    if(typeof window[required[i][0]]==='undefined') missing.push(required[i][1]);
  }
  if(missing.length){
    var d=document.createElement('div');
    d.style.cssText='position:fixed;inset:0;background:#1a0000;color:#ff6666;z-index:9999;padding:30px;font-family:monospace;font-size:14px;';
    d.innerHTML='<h2 style="color:#ff2d55">GAME FILE LOAD ERROR</h2>'+
      '<p>The following required files failed to load:</p><ul><li>'+missing.join('</li><li>')+
      '</li></ul><p>Check your connection and reload. If installed as an app, clear the app cache.</p>';
    document.body?document.body.appendChild(d):window.addEventListener('load',function(){
  /* v1.0.2: re-fit after the browser UI settles (URL bar collapse changes height) */
  setTimeout(function(){if(typeof _applyAppHeight==='function'){_applyAppHeight();sizeLayout();}},400);
  setTimeout(function(){if(typeof _applyAppHeight==='function'){_applyAppHeight();sizeLayout();}},1200);
document.body.appendChild(d);});
    throw new Error('Missing game files: '+missing.join(', '));
  }
})();

/* ── SUPABASE CONFIG ── */
var SB_URL  = 'https://gdmmoeggkqsvqnqyrubx.supabase.co';
var SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbW1vZWdna3FzdnFucXlydWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDYzNTQsImV4cCI6MjA5NjM4MjM1NH0.i86afL3CMpmru4z3LZAbCJkxBiwo25QbwEji8tDBAis';
var GAME_ID = 'sp5d_test';

/* ── SVG SYMBOLS ── */
/* Symbol art — external assets (Rule 13). SP(0)=progressive pup art,
   JP(8)=Turrelle Sisters jackpot art, 1-6=vector symbol files. */
var SYM_ASSETS={
  0:'assets/progressive_pup.png?v=1.1.12',
  1:'assets/sym_red_7.svg?v=1.1.12',
  2:'assets/sym_blue_7.svg?v=1.1.12',
  3:'assets/sym_3bar.svg?v=1.1.12',
  4:'assets/sym_2bar.svg?v=1.1.12',
  5:'assets/sym_1bar.svg?v=1.1.12',
  6:'assets/sym_cherry.svg?v=1.1.12',
  7:null,
  8:'assets/jackpot_sisters.png?v=1.1.12'
};
/* Preload all symbol art so first render never pops in */
(function(){for(var k in SYM_ASSETS){if(SYM_ASSETS[k]){var im=new Image();im.src=SYM_ASSETS[k];}}})();

/* ── REEL STRIPS: SP(0) and JP(8) on R2(idx1) and R4(idx3) ONLY ── */

/* ── REEL KEYS ── */
var REEL_KEYS={
  // PROGRESSIVE
  'lazyt'     :{label:'Lazy-T — 7R+JP+7R+JP+7R Progressive', syms:[1,8,1,8,1]},
  // TOP JACKPOTS (R2+R4 = SP wild)
  'jk392'     :{label:'392,000 — 7R+SP+7R+SP+7R CENTER', syms:[1,0,1,0,1]},
  'jk19600'   :{label:'19,600 — 7R+SP+7R+SP+7R TOP/BOT', syms:[1,0,1,0,1]},
  'jk12250'   :{label:'12,250 — 7B+SP+7B+SP+7B ANY',     syms:[2,0,2,0,2]},
  // RED 7 — 5OAK
  '7Rw4'      :{label:'5× 7R + 4 wilds',                 syms:[0,0,0,0,1]},
  '7Rw3'      :{label:'5× 7R + 3 wilds',                 syms:[0,0,0,1,1]},
  '7Rw2'      :{label:'5× 7R + 2 wilds (R2+R4)',         syms:[1,0,1,0,1]},
  '7Rw1r2'    :{label:'5× 7R + 1 wild (R2)',             syms:[1,0,1,1,1]},
  '7Rw1r4'    :{label:'5× 7R + 1 wild (R4)',             syms:[1,1,1,0,1]},
  '7R5'       :{label:'5× 7R no wilds',                  syms:[1,1,1,1,1]},
  // RED 7 — 4OAK
  '7Rw2_4'    :{label:'4× 7R + 2 wilds',                 syms:[1,0,1,0,7]},
  '7Rw1r2_4'  :{label:'4× 7R + 1 wild R2',               syms:[1,0,1,1,7]},
  '7Rw1r4_4'  :{label:'4× 7R + 1 wild R4',               syms:[1,1,1,0,7]},
  '7R4'       :{label:'4× 7R no wilds',                  syms:[1,1,1,1,7]},
  // RED 7 — 3OAK
  '7Rw2_3'    :{label:'3× 7R + 2 wilds',                 syms:[1,0,1,0,7]},
  '7Rw1r2_3'  :{label:'3× 7R + 1 wild R2',               syms:[1,0,1,7,7]},
  '7Rw1r4_3'  :{label:'3× 7R + 1 wild R4',               syms:[1,1,7,0,7]},
  '7R3'       :{label:'3× 7R no wilds',                  syms:[1,1,1,7,7]},
  // BLUE 7 — 5OAK
  '7Bw2'      :{label:'5× 7B + 2 wilds (R2+R4)',         syms:[2,0,2,0,2]},
  '7Bw1r2'    :{label:'5× 7B + 1 wild R2',               syms:[2,0,2,2,2]},
  '7Bw1r4'    :{label:'5× 7B + 1 wild R4',               syms:[2,2,2,0,2]},
  '7B5'       :{label:'5× 7B no wilds',                  syms:[2,2,2,2,2]},
  // BLUE 7 — 4OAK
  '7Bw2_4'    :{label:'4× 7B + 2 wilds',                 syms:[2,0,2,0,7]},
  '7Bw1r2_4'  :{label:'4× 7B + 1 wild R2',               syms:[2,0,2,2,7]},
  '7Bw1r4_4'  :{label:'4× 7B + 1 wild R4',               syms:[2,2,2,0,7]},
  '7B4'       :{label:'4× 7B no wilds',                  syms:[2,2,2,2,7]},
  // BLUE 7 — 3OAK
  '7Bw2_3'    :{label:'3× 7B + 2 wilds',                 syms:[2,0,7,0,7]},
  '7Bw1r2_3'  :{label:'3× 7B + 1 wild R2',               syms:[2,0,2,7,7]},
  '7Bw1r4_3'  :{label:'3× 7B + 1 wild R4',               syms:[2,2,7,0,7]},
  '7B3'       :{label:'3× 7B no wilds',                  syms:[2,2,2,7,7]},
  // TRIPLE BAR — 5OAK
  '3Bw2'      :{label:'5× 3B + 2 wilds',                 syms:[3,0,3,0,3]},
  '3Bw1r2'    :{label:'5× 3B + 1 wild R2',               syms:[3,0,3,3,3]},
  '3Bw1r4'    :{label:'5× 3B + 1 wild R4',               syms:[3,3,3,0,3]},
  '3B5'       :{label:'5× 3B no wilds',                  syms:[3,3,3,3,3]},
  // TRIPLE BAR — 4OAK
  '3Bw2_4'    :{label:'4× 3B + 2 wilds',                 syms:[3,0,3,0,7]},
  '3Bw1r2_4'  :{label:'4× 3B + 1 wild R2',               syms:[3,0,3,3,7]},
  '3Bw1r4_4'  :{label:'4× 3B + 1 wild R4',               syms:[3,3,3,0,7]},
  '3B4'       :{label:'4× 3B no wilds',                  syms:[3,3,3,3,7]},
  // TRIPLE BAR — 3OAK
  '3Bw2_3'    :{label:'3× 3B + 2 wilds',                 syms:[3,0,7,0,7]},
  '3Bw1r2_3'  :{label:'3× 3B + 1 wild R2',               syms:[3,0,3,7,7]},
  '3Bw1r4_3'  :{label:'3× 3B + 1 wild R4',               syms:[3,3,7,0,7]},
  '3B3'       :{label:'3× 3B no wilds',                  syms:[3,3,3,7,7]},
  // DOUBLE BAR — 5OAK
  '2Bw2'      :{label:'5× 2B + 2 wilds',                 syms:[4,0,4,0,4]},
  '2Bw1r2'    :{label:'5× 2B + 1 wild R2',               syms:[4,0,4,4,4]},
  '2Bw1r4'    :{label:'5× 2B + 1 wild R4',               syms:[4,4,4,0,4]},
  '2B5'       :{label:'5× 2B no wilds',                  syms:[4,4,4,4,4]},
  // DOUBLE BAR — 4OAK
  '2Bw2_4'    :{label:'4× 2B + 2 wilds',                 syms:[4,0,4,0,7]},
  '2Bw1r2_4'  :{label:'4× 2B + 1 wild R2',               syms:[4,0,4,4,7]},
  '2Bw1r4_4'  :{label:'4× 2B + 1 wild R4',               syms:[4,4,4,0,7]},
  '2B4'       :{label:'4× 2B no wilds',                  syms:[4,4,4,4,7]},
  // DOUBLE BAR — 3OAK
  '2Bw2_3'    :{label:'3× 2B + 2 wilds',                 syms:[4,0,7,0,7]},
  '2Bw1r2_3'  :{label:'3× 2B + 1 wild R2',               syms:[4,0,4,7,7]},
  '2Bw1r4_3'  :{label:'3× 2B + 1 wild R4',               syms:[4,4,7,0,7]},
  '2B3'       :{label:'3× 2B no wilds',                  syms:[4,4,4,7,7]},
  // SINGLE BAR — 5OAK
  '1Bw2'      :{label:'5× 1B + 2 wilds',                 syms:[5,0,5,0,5]},
  '1Bw1r2'    :{label:'5× 1B + 1 wild R2',               syms:[5,0,5,5,5]},
  '1Bw1r4'    :{label:'5× 1B + 1 wild R4',               syms:[5,5,5,0,5]},
  '1B5'       :{label:'5× 1B no wilds',                  syms:[5,5,5,5,5]},
  // SINGLE BAR — 4OAK
  '1Bw2_4'    :{label:'4× 1B + 2 wilds',                 syms:[5,0,5,0,7]},
  '1Bw1r2_4'  :{label:'4× 1B + 1 wild R2',               syms:[5,0,5,5,7]},
  '1Bw1r4_4'  :{label:'4× 1B + 1 wild R4',               syms:[5,5,5,0,7]},
  '1B4'       :{label:'4× 1B no wilds',                  syms:[5,5,5,5,7]},
  // SINGLE BAR — 3OAK
  '1Bw2_3'    :{label:'3× 1B + 2 wilds',                 syms:[5,0,7,0,7]},
  '1Bw1r2_3'  :{label:'3× 1B + 1 wild R2',               syms:[5,0,5,7,7]},
  '1Bw1r4_3'  :{label:'3× 1B + 1 wild R4',               syms:[5,5,7,0,7]},
  '1B3'       :{label:'3× 1B no wilds',                  syms:[5,5,5,7,7]},
  // CHERRY
  'CHR5'      :{label:'5× CHR no wilds',                 syms:[6,6,6,6,6]},
  'CHRw2'     :{label:'5× CHR + 2 wilds',                syms:[6,0,6,0,6]},
  'CHRw1r2'   :{label:'5× CHR + 1 wild R2',              syms:[6,0,6,6,6]},
  'CHRw1r4'   :{label:'5× CHR + 1 wild R4',              syms:[6,6,6,0,6]},
  'CHR4'      :{label:'4× CHR no wilds',                 syms:[6,6,6,6,7]},
  'CHRw2_4'   :{label:'4× CHR + 2 wilds',                syms:[6,0,6,0,7]},
  'CHRw1r2_4' :{label:'4× CHR + 1 wild R2',              syms:[6,0,6,6,7]},
  'CHRw1r4_4' :{label:'4× CHR + 1 wild R4',              syms:[6,6,6,0,7]},
  'CHR3'      :{label:'3× CHR no wilds',                 syms:[6,6,6,7,7]},
  'CHRw2_3'   :{label:'3× CHR + 2 wilds',                syms:[6,0,7,0,7]},
  'CHRw1r2_3' :{label:'3× CHR + 1 wild R2',              syms:[6,0,6,7,7]},
  'CHRw1r4_3' :{label:'3× CHR + 1 wild R4',              syms:[6,6,7,0,7]},
  'CHR2'      :{label:'2× CHR no wilds',                 syms:[6,6,7,7,7]},
  'CHRw1r2_2' :{label:'2× CHR + 1 wild R2',              syms:[6,0,7,7,7]},
  'CHRw1r4_2' :{label:'2× CHR + 1 wild R4',              syms:[6,7,7,0,7]},
  // MIXED BARS
  'bar5mix'   :{label:'Any 5 bars mixed',                syms:[3,4,5,3,4]},
  'bar5mixw2' :{label:'5 bars + 2 wilds',                syms:[3,0,5,0,4]},
  'bar5mixw1r2':{label:'5 bars + 1 wild R2',             syms:[3,0,5,3,4]},
  'bar5mixw1r4':{label:'5 bars + 1 wild R4',             syms:[3,4,5,0,3]},
  'bar4mix'   :{label:'Any 4 bars mixed',                syms:[3,4,5,4,7]},
  'bar4mixw2' :{label:'4 bars + 2 wilds',                syms:[3,0,4,0,7]},
  'bar4mixw1r2':{label:'4 bars + 1 wild R2',             syms:[3,0,4,5,7]},
  'bar4mixw1r4':{label:'4 bars + 1 wild R4',             syms:[3,4,5,0,7]},
  'bar3mix'   :{label:'Any 3 bars mixed',                syms:[3,4,5,7,7]},
  'bar3mixw2' :{label:'3 bars + 2 wilds',                syms:[3,0,7,0,7]},
  'bar3mixw1r2':{label:'3 bars + 1 wild R2',             syms:[3,0,4,7,7]},
  'bar3mixw1r4':{label:'3 bars + 1 wild R4',             syms:[3,4,7,0,7]},
  // MIXED 7s
  '7mix5'     :{label:'5× mixed 7s',                     syms:[1,2,1,2,1]},
  '7mix5w2'   :{label:'5× mixed 7s + 2 wilds',           syms:[1,0,2,0,1]},
  '7mix4'     :{label:'4× mixed 7s',                     syms:[1,2,1,2,7]},
  '7mix4w2'   :{label:'4× mixed 7s + 2 wilds',           syms:[1,0,2,0,7]},
  '7mix3'     :{label:'3× mixed 7s',                     syms:[1,2,1,7,7]},
  '7mix3w2'   :{label:'3× mixed 7s + 2 wilds',           syms:[1,0,7,0,7]},
  // NO WIN
  'none'      :{label:'No-win stop',                     syms:[7,5,7,3,7]},
  // ── MULTI-PAYLINE COMBO REEL KEYS (595-pattern system v2) ──
  'combo_250_1_4_5_6_7_8_9':{label:'Multi-payline combo',syms:[6,8,6,0,3]},
  // ── 9-LINE GEOMETRY COMBO REEL KEYS ──
  'combo_2560_1_4_5':{label:'Multi-payline combo',syms:[4,0,4,0,2]},
  // ── DIVERSE PAY 9-LINE COMBO REEL KEYS (v1.24) ──
  'combo_2560_1_4_5':{label:'Multi-payline combo',syms:[4,0,4,0,2]},
  'combo_250_1_3_4_5_6_7_8_9':{label:'Multi-payline combo',syms:[4,0,4,3,6]},
  'combo_250_2_3_7':{label:'Multi-payline combo',syms:[4,4,5,3,1]},
  'combo_400_2_8':{label:'Multi-payline combo',syms:[1,2,1,0,2]},
  'combo_1834_1_2_3_5_8_9':{label:'Multi-payline combo',syms:[1,8,1,0,1]},
  'combo_400_3':{label:'Multi-payline combo',syms:[5,1,1,0,5]},
  'combo_896_1_3_4_5_8_9':{label:'Multi-payline combo',syms:[1,8,1,1,1]},
  'combo_200_6':{label:'Multi-payline combo',syms:[5,1,2,3,5]},
  'combo_852_1_3_9':{label:'Multi-payline combo',syms:[4,1,6,6,2]},
  'combo_360_2_3':{label:'Multi-payline combo',syms:[5,1,5,4,1]},
  'combo_1020_3_8':{label:'Multi-payline combo',syms:[5,6,5,4,4]},
  'combo_400_4':{label:'Multi-payline combo',syms:[5,3,6,0,5]},
  'combo_258_1_2_3_4_5_8_9':{label:'Multi-payline combo',syms:[1,8,1,1,4]},
  'combo_250_2':{label:'Multi-payline combo',syms:[5,1,5,1,5]},
  'combo_80_1':{label:'Multi-payline combo',syms:[4,4,4,0,1]},
  'combo_80_7':{label:'Multi-payline combo',syms:[5,1,2,4,1]},
  'combo_80_8':{label:'Multi-payline combo',syms:[4,2,4,0,1]},
  'combo_250_3_7_8':{label:'Multi-payline combo',syms:[3,4,3,3,1]},
  'combo_60_3_4_6_7_8_9':{label:'Multi-payline combo',syms:[6,1,3,2,5]},
  'combo_536_1_2_4_5_6_8_9':{label:'Multi-payline combo',syms:[2,0,2,2,2]},
  'combo_231_1_4_5_6_7_8':{label:'Multi-payline combo',syms:[4,0,6,3,6]},
  'combo_150_1_2_4_5':{label:'Multi-payline combo',syms:[1,0,1,6,4]},
  'combo_510_1_3_4_5_9':{label:'Multi-payline combo',syms:[5,0,5,6,4]},
  'combo_564_1_2_3_5_8_9':{label:'Multi-payline combo',syms:[1,8,1,5,1]},
  'combo_830_3_4_7_8':{label:'Multi-payline combo',syms:[3,4,3,3,3]},
  'combo_60_1_3_4_5_9':{label:'Multi-payline combo',syms:[6,6,2,6,3]},
  'combo_50_2_4_5_6_8_9':{label:'Multi-payline combo',syms:[1,0,5,2,1]},
  'combo_2054_1_2_3_4_6_8_9':{label:'Multi-payline combo',syms:[6,0,5,8,4]},
  'combo_100_5':{label:'Multi-payline combo',syms:[3,5,2,5,1]},
  'combo_100_4':{label:'Multi-payline combo',syms:[6,5,4,5,2]},
  'combo_80_3':{label:'Multi-payline combo',syms:[3,1,5,5,4]},
  'combo_1776_1_2_4_5_6_8_9':{label:'Multi-payline combo',syms:[1,0,1,8,1]},
  'combo_651_1_2_4_5_6_8':{label:'Multi-payline combo',syms:[5,0,5,8,5]},
  'combo_40_2_4_5_6_7_8':{label:'Multi-payline combo',syms:[5,3,5,5,6]},
  'combo_30_2_4_5_6_7_8':{label:'Multi-payline combo',syms:[2,0,4,3,6]},
  'combo_100_2':{label:'Multi-payline combo',syms:[3,1,2,2,1]},
  'combo_712_2_3_4_7_9':{label:'Multi-payline combo',syms:[1,4,3,3,3]},
  'combo_20_6':{label:'Multi-payline combo',syms:[5,1,2,2,1]},
  'combo_862_1_2_3_8':{label:'Multi-payline combo',syms:[4,4,4,5,5]},
  'combo_50_9':{label:'Multi-payline combo',syms:[4,1,4,3,1]},
  'combo_20_1_2_3_4_7_9':{label:'Multi-payline combo',syms:[2,6,2,1,6]},
  'combo_849_3_4_5_7_8_9':{label:'Multi-payline combo',syms:[3,4,3,3,3]},
  'combo_816_1_3_4_5_7_9':{label:'Multi-payline combo',syms:[1,6,4,6,1]},
  'combo_1780_1_8_9':{label:'Multi-payline combo',syms:[4,0,4,8,2]},
  'combo_40_5':{label:'Multi-payline combo',syms:[3,0,2,5,4]},
  'combo_30_1_3_4_5_9':{label:'Multi-payline combo',syms:[6,6,2,6,3]},
  'combo_476_1_2_3_4_9':{label:'Multi-payline combo',syms:[1,0,1,0,3]},
  'combo_346_2_3_7_8_9':{label:'Multi-payline combo',syms:[1,4,1,3,4]},
  'combo_404_1_4_6_8':{label:'Multi-payline combo',syms:[5,0,5,0,6]},
  'combo_800_3':{label:'Multi-payline combo',syms:[5,1,1,4,5]},
  'combo_10_5':{label:'Multi-payline combo',syms:[3,5,2,3,1]},
  'combo_40_2_4_5':{label:'Multi-payline combo',syms:[5,3,5,5,4]},
  'combo_40_4':{label:'Multi-payline combo',syms:[6,5,4,0,1]},
  'combo_30_2_4_5':{label:'Multi-payline combo',syms:[2,0,4,6,4]},
  'combo_20_2':{label:'Multi-payline combo',syms:[3,2,2,6,1]},
  'combo_20_1_2_3_4_5_6':{label:'Multi-payline combo',syms:[6,6,2,5,4]},
  'combo_195_1_6_7_8_9':{label:'Multi-payline combo',syms:[6,0,6,1,6]},
  'combo_2_2':{label:'Multi-payline combo',syms:[5,2,1,3,1]},
  'combo_4_6_7':{label:'Multi-payline combo',syms:[6,1,1,3,1]},
  'combo_116_1_3_4_7_8_9':{label:'Multi-payline combo',syms:[1,6,6,1,5]},
  'combo_4_5_7':{label:'Multi-payline combo',syms:[6,1,3,5,4]},
  'combo_1606_1_3_7_8':{label:'Multi-payline combo',syms:[6,4,6,4,2]},
  'combo_80_2':{label:'Multi-payline combo',syms:[3,2,2,3,4]},
  'combo_100_9':{label:'Multi-payline combo',syms:[6,5,3,5,2]},
  'combo_600_3':{label:'Multi-payline combo',syms:[3,1,5,4,1]},
  'combo_167_2_4_5':{label:'Multi-payline combo',syms:[1,0,3,0,4]},
  'combo_197_1_2_4_5_8':{label:'Multi-payline combo',syms:[1,8,1,6,4]},
  'combo_30_2':{label:'Multi-payline combo',syms:[4,4,5,2,1]},
  'combo_20_5':{label:'Multi-payline combo',syms:[3,0,2,3,1]},
  'combo_10_1_2_5_6_8':{label:'Multi-payline combo',syms:[6,0,5,6,4]},
  'combo_2_3':{label:'Multi-payline combo',syms:[5,1,5,3,5]},
  'combo_195_1_5_6_7_8':{label:'Multi-payline combo',syms:[6,0,6,1,6]},
  'combo_20_1':{label:'Multi-payline combo',syms:[5,5,5,5,1]},
  'combo_162_1_5_9':{label:'Multi-payline combo',syms:[5,8,6,6,1]},
  'combo_519_1_3_4_5_7_9':{label:'Multi-payline combo',syms:[2,6,6,6,2]},
  'combo_50_2_3_4_5_8_9':{label:'Multi-payline combo',syms:[1,0,6,3,4]},
  'combo_2_8':{label:'Multi-payline combo',syms:[3,0,6,3,1]},
  'combo_2_4':{label:'Multi-payline combo',syms:[3,2,1,6,1]},
  'combo_1008_1_3_4_7_9':{label:'Multi-payline combo',syms:[2,1,6,6,2]},
  'combo_816_2_3_6_7_8_9':{label:'Multi-payline combo',syms:[6,4,3,5,5]},
  'combo_2_6':{label:'Multi-payline combo',syms:[6,5,1,5,1]},
  'combo_4_2_4':{label:'Multi-payline combo',syms:[5,2,1,5,5]},
  'combo_10_1_4_6_7_8':{label:'Multi-payline combo',syms:[6,4,4,6,1]},
  'combo_944_1_2_3_7_8':{label:'Multi-payline combo',syms:[4,4,4,3,4]},
  'combo_1124_1_2_4_5_9':{label:'Multi-payline combo',syms:[2,0,2,0,1]},
  'combo_1280_1_4_5':{label:'Multi-payline combo',syms:[4,8,4,0,6]},
  'combo_20_2_5_6':{label:'Multi-payline combo',syms:[5,6,4,2,4]},
  'combo_25_3_4_5_9':{label:'Multi-payline combo',syms:[2,5,2,6,5]},
  'combo_4_3_7':{label:'Multi-payline combo',syms:[6,1,2,3,5]},
  'combo_2_5':{label:'Multi-payline combo',syms:[5,1,5,6,1]},
  'combo_612_3_5_6_7':{label:'Multi-payline combo',syms:[4,4,3,3,4]},
  'combo_664_1_3_5_8_9':{label:'Multi-payline combo',syms:[5,0,6,6,4]},
  'combo_2_1':{label:'Multi-payline combo',syms:[6,8,1,6,1]},
  'combo_177_1_2_4_6_8':{label:'Multi-payline combo',syms:[6,0,5,2,4]},
  'combo_869_2_4_5_6_8':{label:'Multi-payline combo',syms:[4,0,6,1,4]},
  'combo_372_3_4_5_8_9':{label:'Multi-payline combo',syms:[1,4,1,4,5]},
  'combo_2_7':{label:'Multi-payline combo',syms:[6,1,5,3,1]},
  'combo_764_1_2_3_7_8':{label:'Multi-payline combo',syms:[2,2,2,3,6]},
  'combo_394_4_5_6_9':{label:'Multi-payline combo',syms:[4,0,1,0,4]},
  'combo_247_1_2_5_8':{label:'Multi-payline combo',syms:[2,2,2,8,4]},
  'combo_199_1_3_4_5_7_8_9':{label:'Multi-payline combo',syms:[6,6,6,6,3]},
  'combo_99_1_2_3_4_6':{label:'Multi-payline combo',syms:[1,1,1,2,5]},
  'combo_59_1_3_5_8':{label:'Multi-payline combo',syms:[6,5,6,6,4]},
  'combo_39_3_4_5_7_8_9':{label:'Multi-payline combo',syms:[5,4,5,6,3]},
  'combo_19_2_3_6_7_8':{label:'Multi-payline combo',syms:[6,5,5,2,3]},
  'combo_394_3_4_7_8':{label:'Multi-payline combo',syms:[3,4,3,4,1]},
  'combo_431_1_3_4_5_6_9':{label:'Multi-payline combo',syms:[4,6,1,6,4]},
  'combo_199_1_2_3_6_8':{label:'Multi-payline combo',syms:[4,4,6,2,6]},
  'combo_99_1_2_3_4_5_7_9':{label:'Multi-payline combo',syms:[5,0,5,1,3]},
  'combo_59_1_5_6_8':{label:'Multi-payline combo',syms:[6,1,6,2,1]},
  'combo_39_1_4_5_7_9':{label:'Multi-payline combo',syms:[5,6,2,6,5]},
  'combo_19_1_4_5_7_9':{label:'Multi-payline combo',syms:[6,6,3,6,1]},
  'combo_213_2_3_5_7_8_9':{label:'Multi-payline combo',syms:[5,4,5,2,5]},
  'combo_199_2_3_4_5_6_8_9':{label:'Multi-payline combo',syms:[1,4,1,8,3]},
  'combo_99_2_3_4_6_8_9':{label:'Multi-payline combo',syms:[2,4,2,2,3]},
  'combo_59_2_3_5_7':{label:'Multi-payline combo',syms:[6,3,3,2,4]},
  'combo_39_1_3_7_9':{label:'Multi-payline combo',syms:[3,3,3,1,5]},
  'combo_19_2_4_5_7':{label:'Multi-payline combo',syms:[5,2,2,5,3]},
  'combo_582_1_4_8':{label:'Multi-payline combo',syms:[2,2,2,0,2]},
  'combo_59_1_3_4_5_6_7_9':{label:'Multi-payline combo',syms:[4,6,3,6,6]},
  'combo_19_2_3_6_8':{label:'Multi-payline combo',syms:[6,2,2,2,1]},
  'combo_902_3_8_9':{label:'Multi-payline combo',syms:[4,1,6,8,2]},
  'combo_59_2_3_4_6_7_8':{label:'Multi-payline combo',syms:[6,5,4,8,3]},
  'combo_39_1_3_6_7_8':{label:'Multi-payline combo',syms:[5,5,5,3,6]},
  'combo_19_3_4_5_9':{label:'Multi-payline combo',syms:[2,5,3,3,5]},
  'combo_40_2_3_4_5_6_7_8_9':{label:'Multi-payline combo',syms:[1,5,3,2,3]},
  'combo_99_3_4_5_8_9':{label:'Multi-payline combo',syms:[2,5,2,1,5]},
  'combo_59_1_5_7_8':{label:'Multi-payline combo',syms:[6,1,6,6,1]},
  'combo_39_2_3_4_6':{label:'Multi-payline combo',syms:[5,1,4,2,5]},
  'combo_19_2_5_6_8':{label:'Multi-payline combo',syms:[5,1,6,2,4]},
  'combo_1654_1_3_7_9':{label:'Multi-payline combo',syms:[6,1,4,6,2]},
  'combo_99_1_2_4_5_6_7_8':{label:'Multi-payline combo',syms:[5,0,5,2,6]},
  'combo_59_3_4_7_8':{label:'Multi-payline combo',syms:[1,3,1,1,1]},
  'combo_39_2_4_5_6_9':{label:'Multi-payline combo',syms:[2,5,2,6,4]},
  'combo_19_2_3_4_5':{label:'Multi-payline combo',syms:[2,5,4,2,3]},
  'combo_123_2_3_4_5_6_8_9':{label:'Multi-payline combo',syms:[2,5,2,2,3]},
  'combo_59_3_4_7_8_9':{label:'Multi-payline combo',syms:[3,4,3,1,5]},
  'combo_19_1_4_6_7_8':{label:'Multi-payline combo',syms:[6,4,4,6,6]},
  'combo_926_1_2_5_6_9':{label:'Multi-payline combo',syms:[1,0,1,0,6]},
  'combo_59_1_6_8_9':{label:'Multi-payline combo',syms:[4,1,6,2,6]},
  'combo_39_2_3_4_9':{label:'Multi-payline combo',syms:[4,4,6,1,5]},
  'combo_19_1_2_4_5':{label:'Multi-payline combo',syms:[2,5,6,6,4]},
  'combo_75_1_2_3_5_6_7_8_9':{label:'Multi-payline combo',syms:[6,4,3,6,6]},
  'combo_99_3_4_5_6_7_9':{label:'Multi-payline combo',syms:[4,6,3,3,3]},
  'combo_59_2_4_5_6_8':{label:'Multi-payline combo',syms:[5,3,6,2,4]},
  'combo_39_2_3_4_6_7_9':{label:'Multi-payline combo',syms:[4,3,1,3,3]},
  'combo_19_3_4_7_9':{label:'Multi-payline combo',syms:[5,6,2,3,5]},
  'combo_59_3_4_5_7':{label:'Multi-payline combo',syms:[6,1,3,3,4]},
  'combo_19_2_4_6_8':{label:'Multi-payline combo',syms:[2,5,4,2,1]},
  'combo_369_1_3_4_5_7_9':{label:'Multi-payline combo',syms:[1,6,4,6,3]},
  'combo_1440_2_4_8':{label:'Multi-payline combo',syms:[5,2,5,3,5]},
  'combo_539_1_3_4_5_8_9':{label:'Multi-payline combo',syms:[1,8,1,0,5]},
  'combo_487_1_2_5_9':{label:'Multi-payline combo',syms:[1,0,1,0,4]},
  'combo_866_1_2_3_4_8_9':{label:'Multi-payline combo',syms:[4,4,4,6,5]},
  'combo_344_1_2_4_9':{label:'Multi-payline combo',syms:[1,0,1,8,4]},
  'combo_18_1_4_5_6_9':{label:'Multi-payline combo',syms:[5,1,6,6,5]},
  'combo_109_1_2_4_6_8':{label:'Multi-payline combo',syms:[5,0,5,1,4]},
  'combo_882_1_2_9':{label:'Multi-payline combo',syms:[3,0,3,0,3]},
  'combo_426_3_4_5_6_9':{label:'Multi-payline combo',syms:[4,0,1,3,4]},
  'combo_724_1_2_5_9':{label:'Multi-payline combo',syms:[2,8,2,0,1]},
  'combo_204_2_4_8':{label:'Multi-payline combo',syms:[5,3,6,3,5]},
  'combo_844_1_2_5_6':{label:'Multi-payline combo',syms:[4,0,4,0,4]},
  'combo_193_2_3_4_5_6_8_9':{label:'Multi-payline combo',syms:[1,0,3,8,3]},
  'combo_91_3_4_5_7_9':{label:'Multi-payline combo',syms:[4,1,3,1,3]},
  'combo_206_1_2_3_4_5':{label:'Multi-payline combo',syms:[1,0,1,1,5]},
  'combo_149_1_2_3_6_8_9':{label:'Multi-payline combo',syms:[6,0,6,1,1]},
  'combo_66_2_3_5_7_9':{label:'Multi-payline combo',syms:[5,3,4,1,4]},
  'combo_41_2_4_5_6_7_9':{label:'Multi-payline combo',syms:[5,2,2,6,3]},
  'combo_106_3_6_7_8':{label:'Multi-payline combo',syms:[1,1,4,1,6]},
  'combo_1611_2_3_6_7_8':{label:'Multi-payline combo',syms:[6,2,3,3,4]},
  'combo_1010_1_2_9':{label:'Multi-payline combo',syms:[4,8,4,0,5]},
  'combo_55_1_3_4_5_6_7_9':{label:'Multi-payline combo',syms:[4,2,3,6,6]},
  'combo_1604_1_3_7':{label:'Multi-payline combo',syms:[6,4,4,6,2]},
  'combo_68_2_3_5_6_9':{label:'Multi-payline combo',syms:[3,2,5,2,3]},
  'combo_321_1_2_3_4_5_7_9':{label:'Multi-payline combo',syms:[6,6,3,3,3]},
  'combo_619_1_3_4_5_7_9':{label:'Multi-payline combo',syms:[4,6,5,6,4]},
  'combo_804_3_6_8':{label:'Multi-payline combo',syms:[6,2,4,4,2]},
  'combo_402_4_8':{label:'Multi-payline combo',syms:[4,0,6,3,5]},
  'combo_1627_2_3_7_9':{label:'Multi-payline combo',syms:[4,4,3,3,5]},
  'combo_2000_1_4_5':{label:'Multi-payline combo',syms:[4,0,4,0,5]},
  'combo_113_1_2_3_4_8_9':{label:'Multi-payline combo',syms:[2,6,6,2,6]},
  'combo_63_1_2_4_5_7_9':{label:'Multi-payline combo',syms:[1,2,6,6,3]},
  'combo_74_3_4_5_6_7':{label:'Multi-payline combo',syms:[4,3,4,3,6]},
  'combo_258_1_4_7_8_9':{label:'Multi-payline combo',syms:[2,0,6,6,2]},
  'combo_413_1_2_4_6_7_8':{label:'Multi-payline combo',syms:[5,3,6,8,6]},
  'combo_157_2_3_6':{label:'Multi-payline combo',syms:[1,3,1,5,1]},
  'combo_132_1_5_6_7_8':{label:'Multi-payline combo',syms:[6,0,6,5,6]},
  'combo_891_1_2_4_5_6_8':{label:'Multi-payline combo',syms:[5,0,5,8,4]},
  'combo_180_1_3':{label:'Multi-payline combo',syms:[4,4,4,2,1]},
  'combo_448_2_3_4_5_8_9':{label:'Multi-payline combo',syms:[3,4,3,6,3]},
  'combo_193_1_2_3_6_7_8_9':{label:'Multi-payline combo',syms:[6,1,6,1,4]},
  'combo_194_1_2_3_5_6_8':{label:'Multi-payline combo',syms:[2,2,2,2,4]},
  'combo_686_1_3_4_6_8_9':{label:'Multi-payline combo',syms:[6,0,5,0,1]},
  'combo_212_3_4_8':{label:'Multi-payline combo',syms:[4,6,4,0,4]},
  'combo_306_1_5_8_9':{label:'Multi-payline combo',syms:[1,0,6,4,6]},
  'combo_17_1_3_4_5_7_8_9':{label:'Multi-payline combo',syms:[6,6,6,3,3]},
  'combo_749_1_2_5_6_8_9':{label:'Multi-payline combo',syms:[2,0,2,8,1]},
  'combo_85_1_3_7':{label:'Multi-payline combo',syms:[3,3,3,3,6]},
  'combo_67_3_6_7_9':{label:'Multi-payline combo',syms:[4,4,3,1,5]},
  'combo_1849_2_4_5_6_8':{label:'Multi-payline combo',syms:[4,0,6,8,4]},
  'combo_952_1_2_3':{label:'Multi-payline combo',syms:[4,4,4,4,4]},
  'combo_491_1_2_4_5_6_8_9':{label:'Multi-payline combo',syms:[2,0,2,8,1]},
  'combo_460_1_4_5':{label:'Multi-payline combo',syms:[3,0,3,3,3]},
  'combo_43_2_3_4_5_7_9':{label:'Multi-payline combo',syms:[5,3,5,1,5]},
  'combo_333_2_3_5_6_7_9':{label:'Multi-payline combo',syms:[1,2,3,3,5]},
  'combo_35_1_2_4_5_6_7_8':{label:'Multi-payline combo',syms:[2,0,6,3,6]},
  'combo_318_1_2_3_4_5_6_8':{label:'Multi-payline combo',syms:[1,3,1,6,6]},
  'combo_66_1_2_3_5_7_9':{label:'Multi-payline combo',syms:[6,8,3,1,3]},
  'combo_36_1_2_3_5_6_8':{label:'Multi-payline combo',syms:[1,3,6,6,6]},
  'combo_587_1_3_8_9':{label:'Multi-payline combo',syms:[6,0,6,6,4]},
  'combo_290_4_8_9':{label:'Multi-payline combo',syms:[2,5,2,5,2]},
  'combo_132_1_3_4_5_8_9':{label:'Multi-payline combo',syms:[4,0,4,6,5]},
  'combo_128_2_3_4_5_7':{label:'Multi-payline combo',syms:[5,3,5,8,1]},
  'combo_103_1_2_3_4_5_6_7_9':{label:'Multi-payline combo',syms:[6,6,2,6,4]},
  'combo_1102_1_2_3':{label:'Multi-payline combo',syms:[1,1,1,0,1]},
  'combo_482_5_6_9':{label:'Multi-payline combo',syms:[5,8,4,0,6]},
  'combo_196_2_3_4_5_6_7_9':{label:'Multi-payline combo',syms:[1,4,3,6,3]},
  'combo_354_3_4_5_6_7_8':{label:'Multi-payline combo',syms:[1,4,1,3,6]},
  'combo_121_2_3_4_5_6_7_9':{label:'Multi-payline combo',syms:[1,4,3,6,5]},
  'combo_369_1_3_5_6_8_9':{label:'Multi-payline combo',syms:[5,0,6,2,6]},
  'combo_887_1_2_4_5':{label:'Multi-payline combo',syms:[5,8,5,0,4]},
  'combo_562_1_2_3_8':{label:'Multi-payline combo',syms:[2,2,2,4,1]},
  'combo_242_1_5':{label:'Multi-payline combo',syms:[3,8,3,0,4]},
  'combo_726_1_2_4_6_8':{label:'Multi-payline combo',syms:[5,0,5,8,5]},
  'combo_1080_1_4':{label:'Multi-payline combo',syms:[5,0,5,0,4]},
  'combo_81_1_3_4_5_8_9':{label:'Multi-payline combo',syms:[3,6,3,6,6]},
  'combo_8_2_3_6_8':{label:'Multi-payline combo',syms:[3,5,5,2,5]},
  'combo_335_1_3_4_5_7_8_9':{label:'Multi-payline combo',syms:[6,1,6,6,3]},
  'combo_97_3_4_5_6_9':{label:'Multi-payline combo',syms:[1,3,4,6,3]},
  'combo_137_2_3_4_5_8_9':{label:'Multi-payline combo',syms:[2,1,2,6,3]},
  'combo_20_4':{label:'Multi-payline combo',syms:[6,5,4,5,1]},
  'combo_27_2_6_8':{label:'Multi-payline combo',syms:[5,3,1,2,1]},
  'combo_15_1_4_5_6_8_9':{label:'Multi-payline combo',syms:[6,2,6,6,3]},
  'combo_12_1_4':{label:'Multi-payline combo',syms:[6,5,4,6,1]},
  'combo_6_2_3_4':{label:'Multi-payline combo',syms:[5,2,1,3,5]},
  'combo_31_1_2_5_7_9':{label:'Multi-payline combo',syms:[6,6,3,5,4]},
  'combo_922_2_3_8':{label:'Multi-payline combo',syms:[1,2,1,3,2]},
  'combo_1600_7':{label:'Multi-payline combo',syms:[1,1,4,4,1]},
  'combo_402_5_7':{label:'Multi-payline combo',syms:[5,1,2,6,5]},
  'combo_67_1_2_6_8_9':{label:'Multi-payline combo',syms:[6,0,2,2,4]},
  'combo_844_1_2_6_9':{label:'Multi-payline combo',syms:[4,0,4,0,4]},
  'combo_1040_1_4_5_9':{label:'Multi-payline combo',syms:[5,8,5,0,1]},
  'combo_26_3_4_6_7':{label:'Multi-payline combo',syms:[6,1,2,5,5]},
  'combo_4_2_6':{label:'Multi-payline combo',syms:[6,5,1,5,4]},
  'combo_38_1_4_5_6_8_9':{label:'Multi-payline combo',syms:[5,6,6,6,6]},
  'combo_78_2_3_4_5_6_8':{label:'Multi-payline combo',syms:[1,3,1,2,3]},
  'combo_47_4_5_9':{label:'Multi-payline combo',syms:[1,8,3,6,1]},
  'combo_33_1_2_3_4_5_6_8_9':{label:'Multi-payline combo',syms:[6,6,2,2,3]},
  'combo_8_1_4_6_7':{label:'Multi-payline combo',syms:[6,1,1,6,1]},
  'combo_926_2_3_4_8_9':{label:'Multi-payline combo',syms:[1,2,1,4,3]},
  'combo_806_1_4_5_8':{label:'Multi-payline combo',syms:[5,8,6,0,6]},
  'combo_269_1_2_4_5_6_8':{label:'Multi-payline combo',syms:[6,0,6,8,1]},
  'combo_220_3_8':{label:'Multi-payline combo',syms:[4,6,4,8,5]},
  'combo_94_2_3_5_7_8':{label:'Multi-payline combo',syms:[5,4,5,3,1]},
  'combo_262_2_6_9':{label:'Multi-payline combo',syms:[4,0,1,8,3]},
  'combo_232_1_2_3_6_8_9':{label:'Multi-payline combo',syms:[6,0,6,2,4]},
  'combo_692_2_3_5_6_8_9':{label:'Multi-payline combo',syms:[5,0,6,8,4]},
  'combo_6_1_3_8':{label:'Multi-payline combo',syms:[1,1,6,5,6]},
  'combo_966_1_4_5_6_9':{label:'Multi-payline combo',syms:[4,8,4,0,6]},
  'combo_311_2_5_6_7_8':{label:'Multi-payline combo',syms:[6,4,1,8,2]},
  'combo_560_1_4_5_8':{label:'Multi-payline combo',syms:[4,0,4,3,4]},
  'combo_234_1_3_4_5_6_9':{label:'Multi-payline combo',syms:[3,6,5,6,3]},
  'combo_370_2_3_8':{label:'Multi-payline combo',syms:[3,2,3,0,2]},
  'combo_604_4_5_9':{label:'Multi-payline combo',syms:[1,0,5,0,2]},
  'combo_392_1_2_3':{label:'Multi-payline combo',syms:[4,4,4,4,4]},
  'combo_1004_1_3_7':{label:'Multi-payline combo',syms:[6,1,5,6,4]},
  'combo_91_2_3_4_5_9':{label:'Multi-payline combo',syms:[3,8,1,6,3]},
  'combo_648_1_2_3_4_5_9':{label:'Multi-payline combo',syms:[5,0,5,0,5]},
  'combo_19_1_3_7_9':{label:'Multi-payline combo',syms:[5,5,5,3,5]},
  'combo_98_1_2_3_4_5_7_9':{label:'Multi-payline combo',syms:[6,6,3,4,3]},
  'combo_69_2_5_6_7_8':{label:'Multi-payline combo',syms:[2,0,6,2,4]},
  'combo_756_1_2_3_5_6_8_9':{label:'Multi-payline combo',syms:[1,8,1,4,6]},
  'combo_104_1_4_6_8':{label:'Multi-payline combo',syms:[5,0,5,4,6]},
  'combo_97_2_4_5_7_9':{label:'Multi-payline combo',syms:[5,1,2,6,3]},
  'combo_1752_2_8_9':{label:'Multi-payline combo',syms:[1,4,1,4,1]},
  'combo_624_1_4_8_9':{label:'Multi-payline combo',syms:[4,0,4,8,4]},
  'combo_16_3_6_7_8_9':{label:'Multi-payline combo',syms:[6,2,3,3,5]},
  'combo_18_2_3_4_7_8':{label:'Multi-payline combo',syms:[2,5,6,3,1]},
  'combo_1630_1_3_4_5_7_8_9':{label:'Multi-payline combo',syms:[6,6,6,6,2]},
  'combo_1006_1_4_6_8_9':{label:'Multi-payline combo',syms:[6,8,5,2,4]},
  'combo_289_3_4_7_8_9':{label:'Multi-payline combo',syms:[3,4,3,4,5]},
  'combo_1084_1_4_5_9':{label:'Multi-payline combo',syms:[2,0,2,0,2]},
  'combo_67_1_2_4_5_7_9':{label:'Multi-payline combo',syms:[3,6,1,6,3]},
  'combo_602_5_9':{label:'Multi-payline combo',syms:[1,0,5,0,1]},
  'combo_1646_2_3_6_7_8_9':{label:'Multi-payline combo',syms:[6,4,3,3,5]},
  'combo_90_1_4_5_6_8_9':{label:'Multi-payline combo',syms:[6,0,5,6,5]},
  'combo_387_1_2_3_8':{label:'Multi-payline combo',syms:[4,4,6,6,6]},
  'combo_756_1_2_3_4_8':{label:'Multi-payline combo',syms:[4,4,4,4,4]},
  'combo_7_2_5':{label:'Multi-payline combo',syms:[5,0,2,3,4]},
  'combo_23_1_3_4_6_8_9':{label:'Multi-payline combo',syms:[6,2,2,6,5]},
  'combo_629_2_3_6_7_8':{label:'Multi-payline combo',syms:[6,4,3,3,2]},
  'combo_115_1_2_3_4_6_8_9':{label:'Multi-payline combo',syms:[1,0,1,2,3]},
  'combo_1084_2_3_7_8':{label:'Multi-payline combo',syms:[5,4,5,3,1]},
  'combo_182_1_3_4_5_7_9':{label:'Multi-payline combo',syms:[1,6,6,6,4]},
  'combo_151_1_2_3_4_5_9':{label:'Multi-payline combo',syms:[1,0,1,5,3]},
  'combo_408_2_3_5_7_9':{label:'Multi-payline combo',syms:[4,4,5,6,2]},
  'combo_950_1_3':{label:'Multi-payline combo',syms:[4,4,4,4,4]},
  'combo_23_2_3_4_5_6_9':{label:'Multi-payline combo',syms:[5,6,4,1,3]},
  'combo_83_2_3_4_5_6_7_9':{label:'Multi-payline combo',syms:[1,3,3,2,3]},
  'combo_334_3_4_6_7_8':{label:'Multi-payline combo',syms:[2,4,2,3,6]},
  'combo_126_1_2_4_6_8':{label:'Multi-payline combo',syms:[2,2,2,1,1]},
  'combo_138_1_2_3_4_5_8_9':{label:'Multi-payline combo',syms:[2,2,2,6,5]},
  'combo_186_1_2_3_4_9':{label:'Multi-payline combo',syms:[3,6,6,4,5]},
  'combo_1124_1_4_5_8':{label:'Multi-payline combo',syms:[4,8,6,0,6]},
  'combo_219_1_3_6_8_9':{label:'Multi-payline combo',syms:[4,1,6,2,6]},
  'combo_340_1_3':{label:'Multi-payline combo',syms:[4,4,4,6,1]},
  'combo_161_3_4_5_6_9':{label:'Multi-payline combo',syms:[4,6,3,0,4]},
  'combo_689_2_3_5_6_8_9':{label:'Multi-payline combo',syms:[5,0,6,8,1]},
  'combo_118_1_2_3_5_6_7_9':{label:'Multi-payline combo',syms:[1,4,3,6,6]},
  'combo_514_1_2_5_6_8':{label:'Multi-payline combo',syms:[6,0,5,2,5]},
  'combo_1007_3_6_7':{label:'Multi-payline combo',syms:[2,4,5,3,2]},
  'combo_616_1_3_4_5_7_9':{label:'Multi-payline combo',syms:[4,6,5,6,4]},
  'combo_867_2_3_7_9':{label:'Multi-payline combo',syms:[4,3,4,3,5]},
  'combo_8_5_6_7_8':{label:'Multi-payline combo',syms:[6,2,3,5,4]},
  'combo_608_3_4_5_7_9':{label:'Multi-payline combo',syms:[4,1,5,6,4]},
  'combo_29_2_5_6_8':{label:'Multi-payline combo',syms:[5,0,3,2,4]},
  'combo_106_1_2_4_5_9':{label:'Multi-payline combo',syms:[2,8,2,6,1]},
  'combo_664_1_4_5_8_9':{label:'Multi-payline combo',syms:[4,0,4,4,4]},
  'combo_347_2_3_7_9':{label:'Multi-payline combo',syms:[4,4,3,3,3]},
  'combo_38_1_2_4_8_9':{label:'Multi-payline combo',syms:[4,6,6,2,5]},
  'combo_856_1_2_4_5_6_8_9':{label:'Multi-payline combo',syms:[1,0,1,1,1]},
  'combo_434_1_2_4_5_6_8_9':{label:'Multi-payline combo',syms:[2,0,2,8,6]},
  'combo_339_1_3_4_5_7_9':{label:'Multi-payline combo',syms:[1,6,4,6,6]},
  'combo_158_2_3_4_5_7':{label:'Multi-payline combo',syms:[1,4,3,4,1]},
  'combo_4_1_5':{label:'Multi-payline combo',syms:[6,8,5,6,4]},
  'combo_54_1_3_4_5_7_9':{label:'Multi-payline combo',syms:[6,6,3,6,3]},
  'combo_18_2_4_5_8_9':{label:'Multi-payline combo',syms:[5,6,5,2,5]},
  'combo_68_1_3_4_7_8_9':{label:'Multi-payline combo',syms:[4,0,4,1,6]},
  'combo_70_1_2_3_4_5_6':{label:'Multi-payline combo',syms:[5,1,4,6,6]},
  'combo_31_3_5_6_7_9':{label:'Multi-payline combo',syms:[4,6,3,1,4]},
  'combo_113_2_3_4_5_6_9':{label:'Multi-payline combo',syms:[1,4,4,6,3]},
  'combo_193_1_3_4_5_7_8_9':{label:'Multi-payline combo',syms:[6,6,6,6,4]},
  'combo_92_3_4_5_6_9':{label:'Multi-payline combo',syms:[4,0,1,6,5]},
  'combo_937_1_2_4_5_6_8':{label:'Multi-payline combo',syms:[1,0,1,8,6]},
  'combo_48_1_5_6_7_8':{label:'Multi-payline combo',syms:[6,0,5,3,1]},
  'combo_67_1_2_4_5_9':{label:'Multi-payline combo',syms:[1,1,1,6,3]},
  'combo_229_1_2_5_6_7_8':{label:'Multi-payline combo',syms:[6,0,6,2,6]},
  'combo_2202_1_4_5':{label:'Multi-payline combo',syms:[1,0,1,0,1]},
  'combo_109_1_6_8_9':{label:'Multi-payline combo',syms:[4,0,6,5,6]},
  'combo_428_2_3_5_7_8_9':{label:'Multi-payline combo',syms:[5,4,5,6,2]},
  'combo_74_1_2_3_4_9':{label:'Multi-payline combo',syms:[4,2,6,6,5]},
  'combo_924_1_4_5_9':{label:'Multi-payline combo',syms:[1,0,1,0,2]},
  'combo_1129_2_4_5_6_8':{label:'Multi-payline combo',syms:[4,0,6,8,5]},
  'combo_1613_1_3_4_5_7_9':{label:'Multi-payline combo',syms:[6,6,4,6,2]},
  'combo_510_5_8':{label:'Multi-payline combo',syms:[2,5,2,4,2]},
  'combo_386_1_2_4_5_8_9':{label:'Multi-payline combo',syms:[4,0,4,4,4]},
  'combo_165_1_2_3_4_5_7_9':{label:'Multi-payline combo',syms:[6,6,3,0,3]},
  'combo_364_2_3_7_9':{label:'Multi-payline combo',syms:[4,3,4,3,5]},
  'combo_404_1_2_3_4_8':{label:'Multi-payline combo',syms:[2,2,2,4,5]},
  'combo_91_2_3_4_5_7':{label:'Multi-payline combo',syms:[1,4,3,0,4]},
  'combo_175_1_2_3_6_7_8_9':{label:'Multi-payline combo',syms:[6,0,6,1,3]},
  'combo_68_1_5_6_7_9':{label:'Multi-payline combo',syms:[3,2,5,6,6]},
  'combo_8_2_4_6_9':{label:'Multi-payline combo',syms:[1,0,4,5,1]},
  'combo_147_1_3_4_5_9':{label:'Multi-payline combo',syms:[1,6,3,6,3]},
  'combo_106_1_3_6_8':{label:'Multi-payline combo',syms:[6,6,2,1,2]},
  'combo_13_2_3_4_6_9':{label:'Multi-payline combo',syms:[3,5,1,6,5]},
  'combo_889_1_2_6_8_9':{label:'Multi-payline combo',syms:[3,0,3,8,3]},
  'combo_380_1_2_9':{label:'Multi-payline combo',syms:[3,0,3,4,2]},
  'combo_511_1_4_5_7_9':{label:'Multi-payline combo',syms:[2,6,5,6,2]},
  'combo_49_2_4_6_8_9':{label:'Multi-payline combo',syms:[3,0,2,2,4]},
  'combo_101_2_3_4_5_8_9':{label:'Multi-payline combo',syms:[2,5,2,1,3]},
  'combo_894_1_2_4_6_7_8':{label:'Multi-payline combo',syms:[5,0,5,8,6]},
  'combo_136_2_3_4_5_6_9':{label:'Multi-payline combo',syms:[5,6,4,8,5]},
  'combo_228_1_2_3_4_5_9':{label:'Multi-payline combo',syms:[2,6,2,6,4]},
  'combo_127_2_4_5_8':{label:'Multi-payline combo',syms:[1,4,1,6,4]},
  'combo_4_2_3':{label:'Multi-payline combo',syms:[5,2,1,3,5]},
  'combo_18_1_3_5_7_9':{label:'Multi-payline combo',syms:[5,5,5,6,1]},
  'combo_253_2_4_5_6_8_9':{label:'Multi-payline combo',syms:[4,0,1,8,4]},
  'combo_29_2_3_6_7':{label:'Multi-payline combo',syms:[5,4,2,1,5]},
  'combo_154_4_6_9':{label:'Multi-payline combo',syms:[4,6,1,0,4]},
  'combo_11_1_6_7_8':{label:'Multi-payline combo',syms:[6,0,6,3,1]},
  'combo_53_1_3_4_6_7_8':{label:'Multi-payline combo',syms:[6,5,6,0,5]},
  'combo_214_2_5_6_7_8':{label:'Multi-payline combo',syms:[3,5,2,8,6]},
  'combo_1771_1_2_4_5_6_8':{label:'Multi-payline combo',syms:[1,0,1,8,1]},
  'combo_89_1_3_4_8_9':{label:'Multi-payline combo',syms:[4,4,4,4,5]},
  'combo_610_2_4_5_6_7_8':{label:'Multi-payline combo',syms:[1,0,3,0,6]},
  'combo_377_1_3_8_9':{label:'Multi-payline combo',syms:[4,1,6,6,6]},
  'combo_68_2_3_4_5_9':{label:'Multi-payline combo',syms:[5,8,4,1,5]},
  'combo_1629_2_3_6_7_8':{label:'Multi-payline combo',syms:[6,4,3,3,4]},
  'combo_920_1_4_5':{label:'Multi-payline combo',syms:[3,8,3,0,6]},
  'combo_148_2_3_4_5_6_8_9':{label:'Multi-payline combo',syms:[1,4,1,2,3]},
  'combo_354_1_2_3_8':{label:'Multi-payline combo',syms:[4,4,6,4,6]},
  'combo_249_2_5_6_9':{label:'Multi-payline combo',syms:[5,0,4,0,1]},
  'combo_81_2_3_4_7_8_9':{label:'Multi-payline combo',syms:[1,3,1,1,3]},
  'combo_167_1_3_8':{label:'Multi-payline combo',syms:[3,1,6,6,6]},
  'combo_239_1_2_3_4_5_7_9':{label:'Multi-payline combo',syms:[4,6,5,6,6]},
  'combo_11_1_4_8_9':{label:'Multi-payline combo',syms:[6,8,6,6,5]},
  'combo_206_1_3_5_7_8_9':{label:'Multi-payline combo',syms:[5,0,6,3,6]},
  'combo_158_1_2_3_7_9':{label:'Multi-payline combo',syms:[6,0,3,0,3]},
  'combo_1030_1_3_4_5_7_8_9':{label:'Multi-payline combo',syms:[6,6,6,6,4]},
  'combo_198_1_2_3_4_5_8_9':{label:'Multi-payline combo',syms:[3,6,6,6,6]},
  'combo_28_1_3_4_6_7':{label:'Multi-payline combo',syms:[6,1,2,6,1]},
  'combo_852_3_8_9':{label:'Multi-payline combo',syms:[4,1,6,2,2]},
  'combo_42_1_8':{label:'Multi-payline combo',syms:[4,2,4,6,6]},
  'combo_377_1_2_3_5_8':{label:'Multi-payline combo',syms:[2,2,2,3,4]},
  'combo_174_1_2_4_6_8':{label:'Multi-payline combo',syms:[6,0,5,2,1]},
  'combo_514_1_2_4_6_8':{label:'Multi-payline combo',syms:[6,0,5,2,4]},
  'combo_148_2_3_4_5_6_9':{label:'Multi-payline combo',syms:[5,0,4,3,3]},
  'combo_79_1_4_5_6_7_9':{label:'Multi-payline combo',syms:[3,6,5,6,6]},
  'combo_1650_3_9':{label:'Multi-payline combo',syms:[4,1,4,4,2]},
  'combo_67_1_5_6_7_8':{label:'Multi-payline combo',syms:[6,1,6,3,6]},
  'combo_59_1_2_3_4_5_9':{label:'Multi-payline combo',syms:[2,6,2,6,3]},
  'combo_4_1_7':{label:'Multi-payline combo',syms:[6,1,5,6,1]},
  'combo_554_1_2_3_5_8_9':{label:'Multi-payline combo',syms:[1,8,1,0,4]},
  'combo_26_2_3_4_6_7_8':{label:'Multi-payline combo',syms:[6,5,4,3,3]},
  'combo_682_1_3_4_9':{label:'Multi-payline combo',syms:[6,0,5,0,1]},
  'combo_78_1_2_3_4_5_6_8':{label:'Multi-payline combo',syms:[5,6,4,8,6]},
  'combo_203_1_2_3_4_5_6_8_9':{label:'Multi-payline combo',syms:[1,8,1,2,5]},
  'combo_1084_1_3_4_5_6_8_9':{label:'Multi-payline combo',syms:[5,0,5,0,6]},
  'combo_666_1_3_4_6_8_9':{label:'Multi-payline combo',syms:[6,0,5,4,4]},
  'combo_348_1_2_4_6_8_9':{label:'Multi-payline combo',syms:[1,0,1,8,6]},
  'combo_11_2_3_6_8':{label:'Multi-payline combo',syms:[5,5,2,2,5]},
  'combo_516_1_3_4_5_7_9':{label:'Multi-payline combo',syms:[2,6,5,6,2]},
  'combo_852_1_2_6_8_9':{label:'Multi-payline combo',syms:[4,0,4,8,4]},
  'combo_118_1_2_5_6_7_8_9':{label:'Multi-payline combo',syms:[6,2,3,6,6]},
  'combo_334_1_2_4_6_8':{label:'Multi-payline combo',syms:[6,0,5,8,1]},
  'combo_266_1_4_5_6_7_8':{label:'Multi-payline combo',syms:[4,0,4,3,6]},
  'combo_289_1_2_5_6_9':{label:'Multi-payline combo',syms:[2,0,2,5,2]},
  'combo_742_1_2_8_9':{label:'Multi-payline combo',syms:[4,0,4,3,4]},
  'combo_60_7':{label:'Multi-payline combo',syms:[3,1,1,3,1]},
  'combo_1011_1_4_5_7_9':{label:'Multi-payline combo',syms:[2,6,5,6,2]},
  'combo_502_4_5_8':{label:'Multi-payline combo',syms:[4,0,6,3,5]},
  'combo_150_6':{label:'Multi-payline combo',syms:[4,6,1,0,4]},
  'combo_230_3_8':{label:'Multi-payline combo',syms:[3,4,3,1,2]},
  'combo_942_1_4_5_8':{label:'Multi-payline combo',syms:[1,8,1,3,1]},
  'combo_389_1_2_3_6_8_9':{label:'Multi-payline combo',syms:[6,0,6,8,1]},
  'combo_462_1_2_5_8':{label:'Multi-payline combo',syms:[4,0,4,3,4]},
  'combo_78_2_3_5_6_7_9':{label:'Multi-payline combo',syms:[1,3,3,6,4]},
  'combo_171_2_3_5_6_7':{label:'Multi-payline combo',syms:[2,4,5,1,3]},
  'combo_141_1_2_3_4_5_8_9':{label:'Multi-payline combo',syms:[5,6,5,6,3]},
  'combo_834_1_2_3_4_5_9':{label:'Multi-payline combo',syms:[5,6,4,6,4]},
  'combo_176_1_2_3_5_6_8_9':{label:'Multi-payline combo',syms:[6,0,6,6,4]},
  'combo_379_1_3_7_8_9':{label:'Multi-payline combo',syms:[6,1,6,6,1]},
  'combo_586_1_2_4_6_8':{label:'Multi-payline combo',syms:[2,2,2,8,2]},
  'combo_933_1_2_3_4_5_6_9':{label:'Multi-payline combo',syms:[1,0,1,0,3]},
  'combo_46_1_2_4_5_7_9':{label:'Multi-payline combo',syms:[3,6,4,6,4]},
  'combo_300_4':{label:'Multi-payline combo',syms:[3,0,1,4,1]},
  'combo_12_3_4_9':{label:'Multi-payline combo',syms:[1,0,2,6,5]},
  'combo_386_1_2_3_4_9':{label:'Multi-payline combo',syms:[4,4,6,6,5]},
  'combo_442_3_5_8':{label:'Multi-payline combo',syms:[2,1,2,6,2]},
  'combo_60_1_2_3_4_5_6_7_8':{label:'Multi-payline combo',syms:[6,0,1,3,3]},
  'combo_1802_1_4_5_9':{label:'Multi-payline combo',syms:[2,8,2,0,2]},
  'combo_941_1_2_3_4_5_6_8_9':{label:'Multi-payline combo',syms:[1,0,1,8,3]},
  'combo_31_1_2_3_6_8':{label:'Multi-payline combo',syms:[1,3,6,5,6]},
  'combo_263_1_2_3_4_5_6_8_9':{label:'Multi-payline combo',syms:[1,8,1,1,5]},
  'combo_2000_2_3':{label:'Multi-payline combo',syms:[4,4,6,4,2]},
  'combo_431_1_3_4_5_8_9':{label:'Multi-payline combo',syms:[4,6,4,6,4]},
  'combo_638_1_2_3_4_5_8_9':{label:'Multi-payline combo',syms:[3,6,6,6,6]},
  'combo_497_1_2_4_5_6_8_9':{label:'Multi-payline combo',syms:[2,0,2,8,6]},
  'combo_382_1_2_3':{label:'Multi-payline combo',syms:[4,4,6,6,1]},
  'combo_829_3_5_6_7_9':{label:'Multi-payline combo',syms:[3,4,5,3,3]},
  'combo_444_1_2_6_9':{label:'Multi-payline combo',syms:[4,0,4,3,5]},
  'combo_70_1_2_3_6_8_9':{label:'Multi-payline combo',syms:[3,0,3,2,5]},
  'combo_21_1_2_4_5_6_9':{label:'Multi-payline combo',syms:[6,6,1,6,4]},
  'combo_7_5_9':{label:'Multi-payline combo',syms:[5,1,3,6,1]},
  'combo_85_3_4_5_6_9':{label:'Multi-payline combo',syms:[1,8,3,6,3]},
  'combo_71_1_2_6_7_8':{label:'Multi-payline combo',syms:[4,4,6,2,6]},
  'combo_46_1_6_7_8':{label:'Multi-payline combo',syms:[5,1,6,3,6]},
  'combo_14_1_5_8':{label:'Multi-payline combo',syms:[5,1,5,6,6]},
  'combo_29_2_4_6_9':{label:'Multi-payline combo',syms:[3,0,2,2,3]},
  'combo_656_1_2_3_4_5':{label:'Multi-payline combo',syms:[1,1,1,6,1]},
  'combo_33_1_4_5_7_8_9':{label:'Multi-payline combo',syms:[6,4,6,6,5]},
  'combo_43_1_3_5_6_7_9':{label:'Multi-payline combo',syms:[3,6,5,1,6]},
  'combo_19_2_3_4_7':{label:'Multi-payline combo',syms:[2,5,4,3,5]},
  'combo_319_1_2_3_4_5_8_9':{label:'Multi-payline combo',syms:[1,8,1,4,3]},
  'combo_34_2_4_5':{label:'Multi-payline combo',syms:[5,3,5,5,1]},
  'combo_504_4_7_9':{label:'Multi-payline combo',syms:[2,0,5,4,2]},
  'combo_428_1_2_4_5_7_9':{label:'Multi-payline combo',syms:[3,6,1,6,3]},
  'combo_101_1_4_5_6_8_9':{label:'Multi-payline combo',syms:[1,8,1,6,6]},
  'combo_120_2_8':{label:'Multi-payline combo',syms:[5,4,5,2,1]},
  'combo_229_1_4_5_6_8':{label:'Multi-payline combo',syms:[4,8,6,1,6]},
  'combo_64_1_2_8':{label:'Multi-payline combo',syms:[4,2,6,5,6]},
  'combo_760_2_4_8':{label:'Multi-payline combo',syms:[5,2,5,3,5]},
  'combo_924_1_4_5_6_8':{label:'Multi-payline combo',syms:[3,0,3,0,6]},
  'combo_314_2_6_7_8_9':{label:'Multi-payline combo',syms:[1,4,1,8,6]},
  'combo_69_2_3_5_7_9':{label:'Multi-payline combo',syms:[1,4,3,1,4]},
  'combo_124_2_5_6':{label:'Multi-payline combo',syms:[4,3,4,0,1]},
  'combo_74_2_3_4_5_6_9':{label:'Multi-payline combo',syms:[2,6,2,1,3]},
  'combo_36_2_3_4_8':{label:'Multi-payline combo',syms:[5,3,6,1,5]},
  'combo_95_1_2_3_5_6_7_8':{label:'Multi-payline combo',syms:[6,4,6,8,3]},
  'combo_440_1_5_8':{label:'Multi-payline combo',syms:[4,0,4,0,1]},
  'combo_63_2_3_4_5_8_9':{label:'Multi-payline combo',syms:[1,3,1,6,4]},
  'combo_244_3_7_8':{label:'Multi-payline combo',syms:[3,2,3,3,1]},
  'combo_456_2_3_4_5_8_9':{label:'Multi-payline combo',syms:[3,2,3,6,3]},
  'combo_13_1_3_5_7_9':{label:'Multi-payline combo',syms:[6,6,3,3,1]},
  'combo_77_1_4_5_6_7_8':{label:'Multi-payline combo',syms:[6,8,6,3,6]},
  'combo_58_2_3_4_6_8':{label:'Multi-payline combo',syms:[1,3,1,2,1]},
  'combo_137_1_2_3_5_8':{label:'Multi-payline combo',syms:[2,2,2,6,4]},
  'combo_1620_1_3':{label:'Multi-payline combo',syms:[4,4,4,6,2]},
  'combo_111_3_4_6_7_8':{label:'Multi-payline combo',syms:[4,0,3,3,6]},
  'combo_613_1_2_4_6_8_9':{label:'Multi-payline combo',syms:[4,0,4,8,4]},
  'combo_89_1_3_4_5_7_9':{label:'Multi-payline combo',syms:[4,6,5,6,3]},
  'combo_1090_1_2_4_5_6_8_9':{label:'Multi-payline combo',syms:[2,0,2,8,2]},
  'combo_4_2_8':{label:'Multi-payline combo',syms:[5,2,6,2,1]}
};





/* PAY_TO_REEL_KEYS removed - legacy single-line lookup, superseded by 595-pattern COMBO_POSITIONS system */

/* Pick a reel key for a bingo pattern win.
   Uses pay-based pool for variety, falls back to pattern's assigned reel.
   Validates that picked key does not create 2+ cherries on any payline
   unless the pattern is a cherry pattern. */
/* isCherryPattern removed - legacy, unreachable in 595-pattern COMBO_POSITIONS system */
/* reelKeyHasCherryConflict removed - legacy, unreachable in 595-pattern COMBO_POSITIONS system */
/* ── SHARED WIN-DETECTION HELPERS ── */
function isBar(s){return s===3||s===4||s===5;}
function isWild(s){return s===0||s===8;}
function is7(s){return s===1||s===2;}

function calcLineBasePay(L){
  /* Cherry: count ALL cherries+wilds anywhere on line, min 1 real cherry.
     Bars/7s: consecutive from R1 only, wilds substitute at x2 each.
     Mixed bars: any bar category satisfies a bar run from R1. */
  var chr_r=0,chr_t=0;
  for(var i=0;i<5;i++){
    if(L[i]===6){chr_r++;chr_t++;}
    else if(isWild(L[i])) chr_t++;
  }
  if(chr_r>=1&&chr_t>=2) return ({2:2,3:5,4:20,5:100}[chr_t])||0;
  var nw=[],wilds=0;
  for(var i2=0;i2<5;i2++){
    if(isWild(L[i2])) wilds++;
    else if(L[i2]!==7) nw.push(L[i2]);
    else break;
  }
  if(!nw.length) return 0;
  var dom=nw[0];
  var scat=isBar(dom)?isBar:(is7(dom)?is7:function(s){return s===dom;});
  var run=0;
  for(var i3=0;i3<5;i3++){
    if(isWild(L[i3])){run++;continue;}
    if(L[i3]===7) break;
    if(scat(L[i3])) run++;
    else break;
  }
  if(run<3) return 0;
  var mult=wilds?wilds*2:1;
  if(isBar(dom)){
    var sameBar=true;
    for(var i4=0;i4<run-wilds;i4++){if(nw[i4]!==dom){sameBar=false;break;}}
    if(sameBar) return (({5:{3:10,4:20,5:100},4:{3:20,4:40,5:150},3:{3:30,4:60,5:200}}[dom])||{})[run]*mult||0;
    return ({3:2,4:5,5:25}[run]||0)*mult;
  }
  if(is7(dom)){
    var same7=true;
    for(var i5=0;i5<run-wilds;i5++){if(nw[i5]!==dom){same7=false;break;}}
    if(same7) return (({1:{3:50,4:100,5:400},2:{3:40,4:80,5:250}}[dom])||{})[run]*mult||0;
    return ({3:10,4:20,5:100}[run]||0)*mult;
  }
  return 0;
}

/* WIN_POS_TABLE removed - replaced by COMBO_POSITIONS (exact validated positions) */


/* Pick strip positions for a winning spin using the reverse lookup table.
   Returns {syms, ghosts} same format as forcedSpinResult. */
var _predetWinLines=null; /* winning paylines pre-determined from COMBO_POSITIONS stops */
var _winCycleTimer=null;  /* repeating payline-cycle timer for the current win display */

/* v1.6.0: last stop set shown per total, so a pattern never repeats the
   display it just showed (Sasha's rule). */
var _lastPoolPick={};

function pickWinPositions(pat){
  if(!pat) return null;
  if(pat.name==='Cover All 40'||pat.reel==='none'){_predetWinLines=null;return null;}

  /* ══════════════════════════════════════════════════════════════════════
     v1.6.0 — WIN_POOLS path. A bingo pattern is a PRIZE VALUE: every stop
     set that sums to pat.pay across all 9 paylines belongs to it, and one is
     drawn at random. Stops come from the exhaustive enumeration and are used
     EXACTLY as calculated, so the displayed paylines always sum to pat.pay.
     Falls through to COMBO_POSITIONS / REEL_KEYS for the fixed jackpots and
     anything not in the enumeration. */
  var pool=(typeof WIN_POOLS!=='undefined'&&!pat.payFixed)?WIN_POOLS[pat.pay]:null;
  if(pool&&pool.length){
    /* Never repeat the display shown immediately before. Compare the visible
       CENTRE ROW, not the pool index — different stop sets can render the
       same row, so index comparison alone let ~31% repeat on screen.
       Bounded retry; if every set renders identically we accept a repeat
       rather than loop. */
    var pick=0,pstops,pkey,lastKey=_lastPoolPick[pat.pay];
    for(var ptry=0;ptry<pool.length*3;ptry++){
      pick=(pool.length===1)?0:rng.int(0,pool.length-1);
      pstops=pool[pick];
      pkey=BASE_STRIPS[0][pstops[0]]+','+BASE_STRIPS[1][pstops[1]]+','+
           BASE_STRIPS[2][pstops[2]]+','+BASE_STRIPS[3][pstops[3]]+','+
           BASE_STRIPS[4][pstops[4]];
      if(pool.length===1||pkey!==lastKey) break;
    }
    _lastPoolPick[pat.pay]=pkey;
    var pgrid=[[],[],[]],pghosts=[],psyms=[];
    for(var pr=0;pr<5;pr++){
      var psrc=BASE_STRIPS[pr],pn=psrc.length,pp=pstops[pr];
      psyms.push(psrc[pp]);
      var pt=psrc[(pp-2+pn)%pn]; if(pt===7) pt=psrc[(pp-4+pn)%pn];
      var pb=psrc[(pp+2)%pn];    if(pb===7) pb=psrc[(pp+4)%pn];
      pgrid[0].push(pt); pgrid[1].push(psrc[pp]); pgrid[2].push(pb);
      pghosts.push({above2:pt,above:psrc[(pp-1+pn)%pn],sym:psrc[pp],
                    below:psrc[(pp+1)%pn],below2:pb});
    }
    _predetWinLines=[];
    var pfirst=null,pfirstRows=null;
    for(var ppi=0;ppi<PAYLINES.length;ppi++){
      var ppl=PAYLINES[ppi],pL=[];
      for(var pc=0;pc<5;pc++) pL.push(pgrid[ppl.rows[pc]][pc]);
      if(calcLineBasePay(pL)>0){
        _predetWinLines.push(ppl.id);
        if(pfirst===null){ pfirst=ppl.id; pfirstRows=ppl.rows; }
      }
    }
    return{syms:psyms,ghosts:pghosts,winPayline:pfirst,winRows:pfirstRows};
  }

  var opts=COMBO_POSITIONS[pat.reel];
  if(opts && opts.length){
    /* RANDOMIZATION: pick randomly among the pre-calculated payline variants.
       Stops are used EXACTLY as pre-calculated — this guarantees the winning
       paylines sum to pat.pay per the verified math. */
    var choice=opts[rng.int(0,opts.length-1)];
    var stops=choice.stops;

    /* Build the full 3x5 grid from the exact stops and pre-determine ALL
       winning paylines. These, and only these, will animate. */
    var grid=[[],[],[]];
    var ghosts=[];var syms=[];
    for(var r=0;r<5;r++){
      var src=BASE_STRIPS[r];var n=src.length;var p=stops[r];
      syms.push(src[p]);
      /* Vary stop: find alternative even stops showing same symbol at winning payline row */
      var _reqRow=choice.rows[r];
      var _reqSym=getSymAt(r,stops[r],_reqRow);
      var _saltArr=_rowSymStops[r][_reqRow][_reqSym];
      if(_saltArr&&_saltArr.length>1) stops[r]=_saltArr[rng.int(0,_saltArr.length-1)];
      var p=stops[r]; /* use varied stop for ghost building */
      var _top=src[(p-2+n)%n];if(_top===7)_top=src[(p-4+n)%n];
      var _bot=src[(p+2)%n];if(_bot===7)_bot=src[(p+4)%n];
      grid[0].push(_top);grid[1].push(src[p]);grid[2].push(_bot);
      ghosts.push({
        above2:_top,above:src[(p-1+n)%n],
        sym:src[p],
        below:src[(p+1)%n],below2:_bot
      });
    }
    /* Pre-determine winning paylines from this exact grid */
    _predetWinLines=[];
    for(var pi=0;pi<PAYLINES.length;pi++){
      var pl=PAYLINES[pi];var L=[];
      for(var c=0;c<5;c++) L.push(grid[pl.rows[c]][c]);
      if(calcLineBasePay(L)>0) _predetWinLines.push(pl.id);
    }
    return{syms:syms,ghosts:ghosts,winPayline:choice.pl,winRows:choice.rows};
  }
  _predetWinLines=null;
  var rk=REEL_KEYS[pat.reel];
  if(rk) return forcedSpinResult(rk.syms);
  return null;
}
/* ── BET LADDER ── */
var BET_LEVELS = [9,18,27,36,45,54,63,72,81,90,99,108,117,126,135,144,153,162,171,180];
var BET_IDX = 0;
var DENOM = 1; /* cents */

/* ── GAME STATE ── */
var S = {bal:200000000, spinning:false, lastWin:0}; /* 200,000,000 cents = $2,000,000... use display only */
/* Actually $20,000 = 2,000,000 cents at 1c. Display as dollars. */
S.bal = 2000000; /* cents */

function getBetPerLine(){ return BET_LEVELS[BET_IDX]; }
/* getTotalBet returns total bet in cents */
/* BET_LEVELS are TOTAL credits across all 9 lines (9,18,...,180 = 9 x 1..20),
   so the wager is credits x denom. The old code multiplied by 9 a SECOND time,
   deducting 9x the displayed bet ($162 instead of $18 at 10c max). */
function getTotalBet(){ return getBetPerLine() * DENOM; }
function getDenomMult(){ return DENOM; }
function centsToDisplay(c){ return '$'+(c/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','); }

function updUI(){
  document.getElementById('bval').textContent = centsToDisplay(S.bal);
  var _totalCents = getBetPerLine() * DENOM;
  document.getElementById('betval').textContent = '$'+(_totalCents/100).toFixed(2);
}

function onDenomChange(){
  /* v1.0.7: keep the suite-wide denom in sync for progressive + reporting */
  try{PROG_DENOM=getDenomMult()/100;}catch(e){}
  DENOM = parseInt(document.getElementById('sel-denom').value,10);
  updUI();
}

function doBet(){
  if(S.spinning) return;
  BET_IDX = (BET_IDX + 1) % BET_LEVELS.length;
  updUI();
}

function doMaxBet(){
  if(S.spinning) return;
  BET_IDX = BET_LEVELS.length - 1;
  updUI();
  setTimeout(doSpin, 80);
}

/* ── RNG ── */
function RNG(){this.b=new Uint32Array(64);this.i=64;}
RNG.prototype.fill=function(){crypto.getRandomValues(this.b);this.i=0;};
RNG.prototype.next=function(){if(this.i>=this.b.length)this.fill();return this.b[this.i++]/0x100000000;};
RNG.prototype.int=function(lo,hi){return Math.floor(this.next()*(hi-lo+1))+lo;};
RNG.prototype.shuffle=function(arr){for(var i=arr.length-1;i>0;i--){var j=this.int(0,i);var t=arr[i];arr[i]=arr[j];arr[j]=t;}return arr;};
var rng = new RNG();

/* ── BINGO CARD ── */
var COL_RANGES = [[1,15],[16,30],[31,45],[46,60],[61,75]];
var BG = {
  card:[],cardNumSet:{},callSeq:[],matchedCells:{},
  ballPos:40,winPatterns:[],usingServerBalls:false,
  seqExhausted:false,awaitingNewSeq:false,
  _coverAll1to40:false,_coverAll75Fired:false,_coverAllPending:false,
  patternCycle:null,cycleIdx:0,entTimer:false
};
var GS = {state:'idle',hasSpun:false};
var _celebCardLocked = false;
var _celebCardSnapshot = null;
var _rsCardLocked = false;
var _rsCardSnapshot = null;
/* v1.9.0: set when BLACKOUT (all 25) is reached while the card is locked
   during Red Spin. The card then stays frozen on the blacked-out display
   until the bonus finishes AND the player presses play — the pending new
   sequence is not applied before that. */
var _blackoutHold = false;
var _pendingNewSeq = null;
var _spinDebounce = 0;
var _spinWatchdog = null;

function genBingoCard(){
  var card=[];
  var used={};
  for(var col=0;col<5;col++){
    var lo=COL_RANGES[col][0],hi=COL_RANGES[col][1];
    var pool=[];
    for(var n=lo;n<=hi;n++) pool.push(n);
    rng.shuffle(pool);
    for(var row=0;row<5;row++) card.push(pool[row]);
  }
  var ordered=[];
  for(var r=0;r<5;r++) for(var c=0;c<5;c++) ordered.push(card[c*5+r]);
  ordered[12]=null;
  return ordered;
}

/* ── CARD RENDER ── */
var _cardNodes = null;
function buildBingoCardNodes(){
  var grid=document.getElementById('bingo-grid');
  grid.innerHTML='';_cardNodes=[];
  for(var i=0;i<25;i++){
    var cell=document.createElement('div');
    cell.className='bc'+(i===12?' free':'');
    cell.textContent=i===12?'*':'';
    grid.appendChild(cell);_cardNodes.push(cell);
  }
  sizeCard();
}

function renderBingoCard(card,matchedCells,winPatternCells){
  if(!_cardNodes||_cardNodes.length<25) buildBingoCardNodes();
  if(matchedCells) matchedCells[12]=true;
  var wpSet={};
  if(winPatternCells){for(var wi=0;wi<winPatternCells.length;wi++) wpSet[winPatternCells[wi]]=true;}
  for(var i=0;i<25;i++){
    var cell=_cardNodes[i];
    var isFree=(i===12);
    var isDaubed=!!matchedCells[i];
    var isWin=!!wpSet[i];
    var cls='bc';
    if(isFree){ cls+=isWin?' free-winning':' free'; cls+=' daubed'; }
    else if(isWin) cls+=' winning';
    else if(isDaubed) cls+=' daubed';
    cell.className=cls;
    cell.textContent=isFree?'*':(card&&card[i]?card[i]:'');
  }
}

/* ── BALL STRIP ── */
var _ballNodes = null;
function buildBallStrip(){
  var bsGrid=document.getElementById('ball-strip-grid');
  bsGrid.innerHTML='';_ballNodes=[];
  for(var row=0;row<5;row++){
    var rowDiv=document.createElement('div');rowDiv.className='bsr';
    for(var col=0;col<15;col++){
      var div=document.createElement('div');div.className='ball empty';div.textContent='';
      rowDiv.appendChild(div);_ballNodes.push(div);
    }
    bsGrid.appendChild(rowDiv);
  }
  sizeBallStrip();
}

function renderBallStrip(callSeq,calledCount,cardNumSet){
  if(!_ballNodes||_ballNodes.length<75) buildBallStrip();
  for(var i=0;i<75;i++){
    var node=_ballNodes[i];
    if(i<calledCount){
      var ball=callSeq[i];var isPre=(i<40);var isMatch=(cardNumSet[ball]!==undefined);
      node.textContent=ball;
      if(isPre&&isMatch) node.className='ball match';
      else if(isPre&&!isMatch) node.className='ball pre';
      else node.className='ball called';
    } else {
      node.className='ball empty';node.textContent='';
    }
  }
}

function clearBallStrip(){
  if(!_ballNodes||_ballNodes.length<75) buildBallStrip();
  for(var i=0;i<75;i++){_ballNodes[i].className='ball empty';_ballNodes[i].textContent='';}
}

/* ── PATTERN CYCLE ── */
function startPatternCycle(winPatterns){
  stopPatternCycle();
  if(!winPatterns||winPatterns.length===0){ document.getElementById('bingo-pattern-name').textContent='\u00a0'; return; }
  var _snapCard=BG.card.slice();
  var _snapMatched={};
  var _smk=Object.keys(BG.matchedCells);
  for(var _smi=0;_smi<_smk.length;_smi++) _snapMatched[_smk[_smi]]=true;
  _celebCardSnapshot={card:_snapCard,matchedCells:_snapMatched};
  _celebCardLocked=true;
  BG.cycleIdx=0;
  function showNext(){
    var pat=winPatterns[BG.cycleIdx%winPatterns.length];
    var _pnEl=document.getElementById('bingo-pattern-name');
    _pnEl.textContent=pat.name.toUpperCase()+' \u2014 '+pat.balls+' BALLS';
    _pnEl.classList.remove('pn-flash');
    void _pnEl.offsetWidth;
    _pnEl.classList.add('pn-flash');
    renderBingoCard(_celebCardSnapshot.card,_celebCardSnapshot.matchedCells,pat.cells);
    BG.cycleIdx++;
  }
  showNext();
  BG.patternCycle=setInterval(showNext,2000);
}
function stopPatternCycle(){
  if(BG.patternCycle){clearInterval(BG.patternCycle);BG.patternCycle=null;}
  document.getElementById('bingo-pattern-name').textContent='\u00a0';
  _celebCardLocked=false;_celebCardSnapshot=null;
}

/* ── PATTERN SHOWCASE ── */
var _showcaseTimer=null;var _showcaseIdx=0;var _showcaseRunning=false;
function startPatternShowcase(){
  stopPatternShowcase();_showcaseIdx=0;_showcaseRunning=true;_showNextPattern();
}
function stopPatternShowcase(){
  _showcaseRunning=false;
  if(_showcaseTimer){clearTimeout(_showcaseTimer);_showcaseTimer=null;}
  document.getElementById('bingo-pattern-name').textContent='\u00a0';
  if(_cardNodes&&_cardNodes.length===25){
    for(var i=0;i<25;i++){
      _cardNodes[i].className='bc'+(i===12?' free':'');
      _cardNodes[i].textContent=i===12?'*':'';
    }
  }
}
function _showNextPattern(){
  if(!_showcaseRunning||GS.state!=='idle') return;
  var nameEl=document.getElementById('bingo-pattern-name');
  nameEl.textContent='\u00a0';
  if(_cardNodes&&_cardNodes.length===25){
    for(var _bi=0;_bi<25;_bi++){
      _cardNodes[_bi].className='bc'+(_bi===12?' free':'');
      _cardNodes[_bi].textContent=_bi===12?'*':'';
    }
  }
  _showcaseTimer=setTimeout(function(){
    if(GS.state!=='idle') return;
    var pat=BINGO_PATTERNS[_showcaseIdx%BINGO_PATTERNS.length];
    _showcaseIdx++;
    nameEl.textContent=pat.name.toUpperCase()+' \u2014 '+pat.balls+' Balls';
    var dummyCells=[];
    for(var i=0;i<25;i++) dummyCells.push(i===12?null:0);
    var patMatched={12:true};
    for(var ci=0;ci<pat.cells.length;ci++) patMatched[pat.cells[ci]]=true;
    renderBingoCard(dummyCells,patMatched,pat.cells);
    _showcaseTimer=setTimeout(_showNextPattern,4000);
  },250);
}

/* ── LAYOUT SIZING ── */
var _reelWinH=0;
var _cachedSymH=40;
var _cachedBlkH=2;
function sizeLayout(){
  if(typeof _applyAppHeight==='function') _applyAppHeight();
  sizeCard();sizeBallStrip();sizePaylines();
  setTimeout(initReelSlots,50); /* delay so flex layout settles */
}
function sizeCard(){
  /* v1.4.0: sizing math ported verbatim from StrayPups (sizeBingoElements)
     so the bingo card renders at identical proportions across the sister
     games. The old version hard-capped the card at 140px
     (Math.min(vpw*0.36,140)), which kept it tiny on wide screens while
     StrayPups scaled with the viewport, and used smaller font ratios. */
  var sec=document.getElementById('bingo-section');
  if(!sec) return;
  var bingoH=sec.offsetHeight;
  var vpw=window.innerWidth;

  var cardW=Math.round(vpw*0.34);                      /* uncapped, as SP1D */
  var cellW=Math.max(10,Math.floor((cardW-4)/5));      /* 4px = 4 gaps of 1px */
  var cardWrapW=(cellW*5)+4;

  var nameH=18, padV=5;
  var hdrFontSz=Math.max(10,Math.round(cellW*0.60));
  var colHdrH=Math.round(hdrFontSz*1.25);
  var maxCellFromH=Math.max(10,Math.floor((bingoH-nameH-padV-colHdrH-5)/5));
  var cellH=Math.min(cellW,maxCellFromH);              /* square, never overflows */
  var cellFontSz=Math.max(8,Math.round(cellH*0.58));

  var grid=document.getElementById('bingo-grid');
  if(grid){
    grid.style.gridTemplateColumns='repeat(5,'+cellW+'px)';
    var cells=grid.querySelectorAll('.bc');
    for(var i=0;i<cells.length;i++){
      cells[i].style.height=cellH+'px';
      cells[i].style.width=cellW+'px';
      cells[i].style.minWidth=cellW+'px';
      cells[i].style.maxWidth=cellW+'px';
      cells[i].style.fontSize=cellFontSz+'px';
    }
  }
  var hdrs=document.getElementById('bingo-col-hdrs');
  if(hdrs){
    hdrs.style.gridTemplateColumns='repeat(5,'+cellW+'px)';
    hdrs.style.width=cardWrapW+'px';
    var hdrCells=hdrs.querySelectorAll('.bcol-hdr');
    for(var h=0;h<hdrCells.length;h++){
      hdrCells[h].style.width=cellW+'px';
      hdrCells[h].style.minWidth=cellW+'px';
      hdrCells[h].style.maxWidth=cellW+'px';
      hdrCells[h].style.fontSize=hdrFontSz+'px';
      hdrCells[h].style.lineHeight=colHdrH+'px';
    }
  }
  var wrap=document.getElementById('bingo-card-wrap');
  if(wrap){
    wrap.style.width=cardWrapW+'px';
    wrap.style.minWidth=cardWrapW+'px';
    wrap.style.maxWidth=cardWrapW+'px';
    wrap.style.flexShrink='0';
  }
  _bingoCellH=cellH; _bingoCardWrapW=cardWrapW;        /* handed to sizeBallStrip */
}

var _bingoCellH=0, _bingoCardWrapW=0;

function sizeBallStrip(){
  /* Ported from SP1D: strip width is derived from the viewport rather than
     offsetWidth (which is 0 before layout settles), and ball height matches
     the card cell height so the two grids line up exactly. */
  var bsGrid=document.getElementById('ball-strip-grid');
  if(!bsGrid) return;
  var vpw=window.innerWidth;
  var cardWrapW=_bingoCardWrapW||Math.round(vpw*0.34);
  var cellH=_bingoCellH||14;

  var stripW=vpw-cardWrapW-4-8;                        /* 4px gap, 8px padding */
  var slotW=Math.max(7,Math.floor((stripW-14)/15));    /* 15 slots, 14 gaps */
  var ballFontSz=Math.max(6,Math.round(slotW*0.70));
  var ballH=cellH;

  bsGrid.style.width=stripW+'px';
  bsGrid._slotW=slotW; bsGrid._ballH=ballH;
  bsGrid._ballFontSz=ballFontSz; bsGrid._stripW=stripW;

  /* v1.4.2: vertical alignment. In StrayPups a #ball-call-badge sits above
     the ball grid and happens to offset it by the same amount the card is
     pushed down by #bingo-pattern-name + #bingo-col-hdrs. TSBMII has no such
     badge (its LIVE indicator lives in the top bar), so the ball rows started
     flush at the top while the card sat ~34px lower and the two grids never
     lined up. Measure the card grid's real offset inside its wrapper and
     apply the same offset to the ball grid, so row 1 of the strip always
     aligns with row 1 of the card regardless of font or header size. */
  var _cardGrid=document.getElementById('bingo-grid');
  var _cardWrap=document.getElementById('bingo-card-wrap');
  if(_cardGrid&&_cardWrap){
    var off=_cardGrid.offsetTop-_cardWrap.offsetTop;
    if(off>0&&off<200) bsGrid.style.marginTop=off+'px';
  }

  var rows=bsGrid.querySelectorAll('.bsr');
  for(var r=0;r<rows.length;r++){
    rows[r].style.height=ballH+'px';
    rows[r].style.width=stripW+'px';
  }
  if(!_ballNodes||_ballNodes.length<75) return;
  for(var i=0;i<75;i++){
    var b=_ballNodes[i];
    b.style.width=slotW+'px';
    b.style.minWidth=slotW+'px';
    b.style.maxWidth=slotW+'px';
    b.style.height=ballH+'px';
    b.style.fontSize=ballFontSz+'px';
    b.style.flex='none';
    b.style.overflow='hidden';
  }
}

function sizePaylines(){
  var frame=document.getElementById('reel-frame');
  if(!frame) return;
  var fH=frame.clientHeight;
  var pad=5,usable=fH-pad*2,rowH=usable/3;
        if(Object.keys(_paylineOverlays).length>0) positionPaylineOverlays();
}
function initReelSlots(){
  var frame=document.getElementById('reel-frame');if(!frame) return;
  var frameH=frame.clientHeight;if(frameH<30) return;
  /* Use frame height like the mapper - symH from full frame, not individual reel */
  var reel=document.getElementById('r0');if(!reel) return;
  var reelH=reel.clientHeight;
  if(reelH<10) reelH=frameH-10; /* fallback: frame minus padding */
  _reelWinH=reelH;
  /* Pre-compute and cache sym/blk heights */
  _cachedSymH=Math.round(reelH/3.8); /* v1.0: 10% smaller symbols per Sasha */
  _cachedBlkH=Math.max(2,Math.round(_cachedSymH*0.07));
  sizePaylines();
  renderReels(CURRENT_SYMS,CURRENT_GHOSTS);
}

/* ── REEL RENDERER (5-reel, 3-row visible) ── */
/* Reel sizing: matches standalone reel preview (proven correct).
   symH = winH/3.8, blkH = max(2, symH*0.07)
   Strip: [above2, above, SYM(payline), below, below2]
   Center slot[2] at winH/2. */
function symSlotH(wh){
  /* Use cached value if available and wh matches reel window height */
  if(_cachedSymH>0 && Math.abs(wh-_reelWinH)<5) return _cachedSymH;
  return Math.round(wh/3.8);
}
function blkSlotH(wh){
  if(_cachedBlkH>0 && Math.abs(wh-_reelWinH)<5) return _cachedBlkH;
  return Math.max(2,Math.round(symSlotH(wh)*0.07));
}
function slotHFor(id,wh){return id===7?blkSlotH(wh):symSlotH(wh);}
function stripTopFor(slots,wh,centerIdx){
  /* Center slot[centerIdx] (default 2 — payline symbol / blank) vertically in window */
  if(centerIdx===undefined) centerIdx=2;
  var acc=0;
  for(var i=0;i<centerIdx;i++) acc+=slotHFor(slots[i],wh);
  acc+=slotHFor(slots[centerIdx],wh)/2;
  return Math.round(wh/2 - acc);
}
function stripTotalH(slots,wh){
  var t=0;for(var i=0;i<slots.length;i++) t+=slotHFor(slots[i],wh);return t;
}
var CURRENT_SYMS=[6,5,3,4,6];
var CURRENT_GHOSTS=[];
(function(){
  /* Build initial ghosts from actual strip positions so 3 real symbols show */
  var initSyms=[6,5,3,4,6];
  for(var r=0;r<5;r++){
    var src=BASE_STRIPS[r];var n=src.length;
    var sym=initSyms[r];
    /* Find first occurrence of this sym in the strip */
    var pos=0;
    for(var i=0;i<n;i++){if(src[i]===sym){pos=i;break;}}
    /* Get neighbors - skip blanks to find real symbols */
    function findPrev(strip,p,len){
      var q=(p-1+len)%len;
      while(strip[q]===7) q=(q-1+len)%len;
      return strip[q];
    }
    function findNext(strip,p,len){
      var q=(p+1)%len;
      while(strip[q]===7) q=(q+1)%len;
      return strip[q];
    }
    var prevSym=findPrev(src,pos,n);
    var nextSym=findNext(src,pos,n);
    /* above2=prev of prev, above=prev, sym=sym, below=next, below2=next of next */
    var prev2=findPrev(src,(src.indexOf(prevSym)>=0?src.lastIndexOf(prevSym):pos),n);
    var next2=findNext(src,(src.indexOf(nextSym)>=0?src.indexOf(nextSym):pos),n);
    CURRENT_GHOSTS.push({
      above2:prev2, above:prevSym,
      sym:sym,
      below:nextSym, below2:next2
    });
  }
})();

function buildSlot(symId){
  var slot=document.createElement('div');
  slot.className=symId===7?'reel-slot reel-slot-blank':'reel-slot reel-slot-sym';
  if(symId!==7&&SYM_ASSETS[symId]){
    var img=document.createElement('img');
    img.src=SYM_ASSETS[symId];
    img.alt='';
    /* v1.4.1: was width/height 100%, which overrode the stylesheet's
       intended 95% (inline styles win) and pushed each symbol flush to
       the edges of a slot with overflow:hidden — symbols clipped on
       desktop where slot rounding is larger. 95% restores the inset. */
    img.style.cssText='width:95%;height:95%;object-fit:contain;display:block;pointer-events:none;margin:auto;';
    slot.appendChild(img);
  }
  return slot;
}
function renderReels(syms,ghosts){
  CURRENT_SYMS=syms.slice();CURRENT_GHOSTS=ghosts;
  for(var r=0;r<5;r++){
    var strip=document.getElementById('rs'+r);
    var win=document.getElementById('r'+r);
    if(!strip||!win) continue;
    var wH=win.clientHeight>10?win.clientHeight:(_reelWinH>10?_reelWinH:150);
    var sH=Math.round(wH/3.8);
    var bH=Math.max(2,Math.round(sH*0.07));
    var src=BASE_STRIPS[r];var n=src.length;
    var targetSym=syms[r];
    /* Use ghost positions when available (validated by genNoWinResult/forcedSpinResult).
       Ghost contains exact strip neighbors — never re-search independently. */
    var slots=[];var centerIdx=2;
    var ghost=ghosts&&ghosts[r];
    if(ghost&&ghost.sym===targetSym){
      /* Use pre-validated ghost data directly (7-slot layout for blank centers) */
      if(ghost.slots){slots=ghost.slots.slice();centerIdx=ghost.centerIdx;}
      else slots=[ghost.above2,ghost.above,ghost.sym,ghost.below,ghost.below2];
    } else {
      /* Fallback: find first occurrence (only used for forced win displays) */
      var pos=0;
      for(var i=0;i<n;i++){if(src[i]===targetSym){pos=i;break;}}
      for(var off=-2;off<=2;off++) slots.push(src[(pos+off+n)%n]);
    }
    /* Render strip */
    strip.innerHTML='';
    var totalH=0;var heights=[];
    for(var si=0;si<slots.length;si++){
      var s=buildSlot(slots[si]);
      var h=slots[si]===7?bH:sH;
      s.style.height=h+'px';s.style.flex='none';
      strip.appendChild(s);
      heights.push(h);totalH+=h;
    }
    /* Center slot[centerIdx] in window */
    var acc=heights[centerIdx]/2;
    for(var ai=0;ai<centerIdx;ai++) acc+=heights[ai];
    strip.style.height=totalH+'px';
    strip.style.top=Math.round(wH/2-acc)+'px';
  }
}



/* Flash specific row on each reel based on payline geometry
   reelIndices: which reels [0..4]
   rowPerReel: which row on each reel (0=top,1=mid,2=bot)
   duration: ms */
/* _glowSymbolsOnPayline: light each symbol on the payline in the payline's color.
   paylineId: 1-9, rowPerReel: [r0..r4], duration ms, persist: keep lit */
function _glowSymbolsOnPayline(paylineId, rowPerReel, duration, persist){
  var glowClass='sym-glow-'+paylineId;
  var lit=[];
  for(var _r=0;_r<5;_r++){
    var strip=document.getElementById('rs'+_r);
    if(!strip) continue;
    var row=rowPerReel[_r];
    var slotIdx=row===0?0:row===1?2:4;
    var slots=strip.querySelectorAll('.reel-slot');
    var s=slots[slotIdx];
    if(s&&s.classList.contains('reel-slot-sym')){
      s.classList.add('sym-glow',glowClass);
      lit.push({el:s,cls:glowClass});
    }
  }
  if(!persist){
    setTimeout(function(){
      for(var _l=0;_l<lit.length;_l++){
        lit[_l].el.classList.remove('sym-glow',lit[_l].cls);
      }
    }, duration||1800);
  }
  return lit;
}
/* Clear all sym-glow classes from every visible reel slot */
function clearAllSymGlows(){
  var GLOW_CLASSES=['sym-glow','sym-glow-1','sym-glow-2','sym-glow-3','sym-glow-4',
    'sym-glow-5','sym-glow-6','sym-glow-7','sym-glow-8','sym-glow-9'];
  var slots=document.querySelectorAll('.reel-slot-sym');
  for(var _s=0;_s<slots.length;_s++){
    for(var _c=0;_c<GLOW_CLASSES.length;_c++) slots[_s].classList.remove(GLOW_CLASSES[_c]);
    slots[_s].style.opacity='';
  }
}

/* Flash all reels on winning paylines */



/* Cycle through paylines animating them one at a time with reel flash */

/* evalCosmetic -- evaluate all 9 paylines on the visible 3x5 grid.
   Returns array of payline IDs that show a cosmetically winning combination.
   NO credits awarded -- purely for animation and win message display.
   Called after reels stop on a bingo win. */
function evalCosmetic(allRowSyms){
  /* Must recognize every win type calcLineBasePay() can pay, so a payline
     that pays credits always gets visually flashed - no silent mismatch. */
  var winLines=[];
  for(var _pi=0;_pi<PAYLINES.length;_pi++){
    var pl=PAYLINES[_pi];
    var L=[];
    for(var _r=0;_r<5;_r++) L.push(allRowSyms[pl.rows[_r]][_r]);
    if(calcLineBasePay(L) > 0) winLines.push(pl.id);
  }
  return winLines;
}

/* getVisibleGrid -- extract 3x5 visible symbols from current reel strips.
   Returns [[top5],[mid5],[bot5]] */
function getVisibleGrid(){
  /* Read directly from CURRENT_GHOSTS - the validated source-of-truth data
     set by genNoWinResult/pickWinPositions/forcedSpinResult. Never re-derive
     symbols by scraping rendered SVG/DOM, which is fragile and can silently
     misread symbols (color/text matching), causing the win calculator to
     disagree with what was actually validated as a no-win or win grid. */
  var grid=[[],[],[]];
  for(var r=0;r<5;r++){
    var g=CURRENT_GHOSTS&&CURRENT_GHOSTS[r];
    if(!g){grid[0].push(7);grid[1].push(7);grid[2].push(7);continue;}
    grid[0].push(g.above2); /* top */
    grid[1].push(g.sym);    /* mid */
    grid[2].push(g.below2); /* bot */
  }
  return grid;
}

/* animateCosmeticWins: lights ALL pre-determined winning paylines simultaneously.
   Returns a timer handle. Caller cancels with clearInterval when done. */
function animateCosmeticWins(patternName, duration, persist){
  var winLines=_predetWinLines&&_predetWinLines.length?_predetWinLines.slice():null;
  if(!winLines){
    var g=getVisibleGrid();winLines=evalCosmetic(g);
  }
  for(var _k0 in _paylineOverlays) _paylineOverlays[_k0].style.opacity='0';
  clearAllSymGlows();
  if(!winLines||!winLines.length) return 0;
  /* Light ALL winning paylines at once: symbol glow + payline LINE overlay.
     Flash briefly (1.5s) then fade — per Sasha, makes payline path unmistakable
     without permanently cluttering the display. */
  if(_flashFadeTimer){clearTimeout(_flashFadeTimer);_flashFadeTimer=null;}
  for(var wi=0;wi<winLines.length;wi++){
    var _pl=null;
    for(var _p=0;_p<PAYLINES.length;_p++){if(PAYLINES[_p].id===winLines[wi]){_pl=PAYLINES[_p];break;}}
    if(_pl){
      _glowSymbolsOnPayline(_pl.id,_pl.rows,999999,true);
      var _ov=_paylineOverlays[_pl.id];
      if(_ov) _ov.style.opacity='1';
    }
  }
  _flashFadeTimer=setTimeout(function(){
    _flashFadeTimer=null;
    for(var _k in _paylineOverlays) _paylineOverlays[_k].style.opacity='0';
    setTimeout(function(){
      /* Only clear if no NEWER flash started since this fade began —
         prevents a stale timer from wiping the next display's glows */
      if(!_flashFadeTimer) clearAllSymGlows();
    },450);
  },1500);
  return 1; /* non-zero handle so callers know animation is active */
}



/* ── FORCED SPIN RESULT (5 reels) ── */
function forcedSpinResult(syms){
  var shuffled=syms.slice();
  /* Shuffle non-wild reel symbols (R1,R3,R5 indices 0,2,4) */
  var nw=[shuffled[0],shuffled[2],shuffled[4]];
  for(var i=nw.length-1;i>0;i--){var j=rng.int(0,i);var t=nw[i];nw[i]=nw[j];nw[j]=t;}
  shuffled[0]=nw[0];shuffled[2]=nw[1];shuffled[4]=nw[2];
  /* Determine if this is a cherry-authorized spin */
  var cherryCount=0;
  for(var _ci=0;_ci<5;_ci++){if(shuffled[_ci]===6) cherryCount++;}
  var isCherrySpin=(cherryCount>=2);
  /* Build ghosts - for non-cherry spins, avoid cherry neighbors */
  var ghosts=[];
  for(var r=0;r<5;r++){
    var sym=shuffled[r];var src=BASE_STRIPS[r];var n=src.length;
    var positions=[];
    for(var s=0;s<n;s++){if(src[s]===sym) positions.push(s);}
    if(!positions.length) positions=[0];
    /* Shuffle positions for variety */
    for(var pi=positions.length-1;pi>0;pi--){
      var pj=rng.int(0,pi);var pt=positions[pi];positions[pi]=positions[pj];positions[pj]=pt;
    }
    var pos=positions[0];
    /* If not a cherry spin, prefer positions where top/bot neighbors are not cherries */
    if(!isCherrySpin){
      for(var _pi2=0;_pi2<positions.length;_pi2++){
        var _p=positions[_pi2];
        var _top=src[(_p-2+n)%n];
        var _bot=src[(_p+2)%n];
        if(_top!==6&&_bot!==6){pos=_p;break;}
      }
    }
    ghosts.push({
      above2:src[(pos-2+n)%n],above:src[(pos-1+n)%n],
      sym:sym,
      below:src[(pos+1)%n],below2:src[(pos+2)%n]
    });
  }
  /* Final validation: build grid and check for accidental cherry paylines */
  /* on non-cherry spins */
  if(!isCherrySpin){
    var _grid=[[],[],[]];
    for(var _gr=0;_gr<5;_gr++){
      var _g=ghosts[_gr];
      var _top2=_g.above2===7?_g.above2:_g.above2;
      /* above2 = top row, sym = mid row, below2 = bot row */
      _grid[0].push(_g.above2);
      _grid[1].push(_g.sym);
      _grid[2].push(_g.below2);
    }
    /* If grid has cherry win, retry with safe fallback positions */
    if(gridHasWin(_grid)){
      /* Rebuild using only positions with no cherry neighbors */
      for(var _r2=0;_r2<5;_r2++){
        var _sym2=shuffled[_r2];var _src2=BASE_STRIPS[_r2];var _n2=_src2.length;
        var _safePos=0;
        for(var _sp=0;_sp<_n2;_sp++){
          if(_src2[_sp]===_sym2){
            var _st=_src2[(_sp-2+_n2)%_n2];
            var _sb=_src2[(_sp+2)%_n2];
            if(_st!==6&&_sb!==6){_safePos=_sp;break;}
          }
        }
        ghosts[_r2]={
          above2:_src2[(_safePos-2+_n2)%_n2],above:_src2[(_safePos-1+_n2)%_n2],
          sym:_src2[_safePos],
          below:_src2[(_safePos+1)%_n2],below2:_src2[(_safePos+2)%_n2]
        };
      }
    }
  }
  return{syms:shuffled.slice(),ghosts:ghosts};
}

/* gridHasWin -- shared win checker used by genNoWinResult and forcedSpinResult */
function gridHasWin(grid){
  /* From-R1 only — matches calcLineBasePay exactly.
     Partial R2/R3 visual blocking removed: staircase paylines (PL8/PL9)
     sample all 3 rows making R2/R3 blocking produce zero clean positions.
     Cherry: anywhere on line (wilds count), min 1 real cherry.
     Any wild on any payline = flagged.
     Bars/7s: consecutive run from R1 only. */
  for(var pi=0;pi<PAYLINES.length;pi++){
    var pl=PAYLINES[pi]; var L=[];
    for(var r=0;r<5;r++) L.push(grid[pl.rows[r]][r]);
    var chr_r=0,chr_t=0;
    for(var c=0;c<5;c++){
      if(L[c]===6){chr_r++;chr_t++;}
      else if(isWild(L[c])) chr_t++;
    }
    if(chr_r>=1&&chr_t>=2) return true;
    if(chr_t>0) return true;
    var nw=[],wi=0;
    for(var j=0;j<5;j++){
      if(isWild(L[j])) wi++;
      else if(L[j]!==7) nw.push(L[j]);
      else break;
    }
    if(!nw.length) continue;
    var dom=nw[0];
    var sc=isBar(dom)?isBar:(is7(dom)?is7:function(s){return s===dom;});
    var run=0;
    for(var k=0;k<5;k++){
      if(isWild(L[k])){run++;continue;}
      if(L[k]===7) break;
      if(sc(L[k])) run++;
      else break;
    }
    if(run>=3) return true;
  }
  return false;
}



/* genNoWinResult: synchronous random search.
   Includes odd (blank center) stops — 15% clean rate = ~7 attempts avg.
   Excludes wild positions on R2/R4. Max 500 attempts, then minimal fallback. */
/* getSymAt: returns symbol on reel r at stop position for given row (0=top,1=mid,2=bot) */
function getSymAt(r,stop,row){
  var s=BASE_STRIPS[r],n=s.length;
  var center=s[stop];
  if(row===1) return center;
  if(center===7){
    /* ODD center (blank): TOP ROW = symbol directly above blank (pos-1 = even = symbol)
       BOT ROW = symbol directly below blank (pos+1 = even = symbol).
       This matches _buildGhosts odd-center layout so grid and display always agree. */
    if(row===0) return s[(stop-1+n)%n];  /* TOP ROW */
    return s[(stop+1)%n];               /* BOT ROW */
  }
  /* EVEN center (symbol): standard skip-blank logic */
  if(row===0){var p=(stop-2+n)%n;return s[p]===7?s[(p-2+n)%n]:s[p];}
  var p2=(stop+2)%n;return s[p2]===7?s[(p2+2)%n]:s[p2];
}

/* _symStops[r][sym] = all EVEN stops on reel r whose CENTER is sym (no wilds/blanks).
   Used by genNoWinResult to vary stop position while keeping the same center symbol. */
var _symStops=(function(){
  /* _symStops[r][sym] = all even stops showing sym as CENTER — excluding wilds on R2/R4 */
  var wilds=[[],[0,12,24,36,48,60],[],[6,18,30,42,54,62],[]];
  var res=[];
  for(var r=0;r<5;r++){
    var d={};var s=BASE_STRIPS[r];
    for(var pos=0;pos<s.length;pos+=2){
      if(wilds[r].indexOf(pos)>=0) continue; /* skip wild positions */
      var sym=s[pos];
      if(sym===7) continue;
      if(!d[sym]) d[sym]=[];
      d[sym].push(pos);
    }
    res.push(d);
  }
  return res;
})();

/* _rowSymStops[r][row][sym] = all EVEN stops on reel r where getSymAt(r,stop,row)==sym.
   Used by pickWinPositions to vary stop while preserving symbol at winning payline row. */
var _rowSymStops=(function(){
  /* _rowSymStops[r][row][sym] = all even stops where getSymAt(r,stop,row)==sym — excluding wilds */
  var wilds=[[],[0,12,24,36,48,60],[],[6,18,30,42,54,62],[]];
  var res=[];
  for(var r=0;r<5;r++){
    var rows=[{},{},{}];
    for(var pos=0;pos<BASE_STRIPS[r].length;pos+=2){
      if(wilds[r].indexOf(pos)>=0) continue;
      if(BASE_STRIPS[r][pos]===7) continue;
      for(var row=0;row<3;row++){
        var sym=getSymAt(r,pos,row);
        if(sym===7) continue;
        if(!rows[row][sym]) rows[row][sym]=[];
        rows[row][sym].push(pos);
      }
    }
    res.push(rows);
  }
  return res;
})();


function genNoWinResult(){
  /* ══════════════════════════════════════════════════════════════════════
     v1.5.0 — REJECTION SAMPLING (replaces the 300-entry NOWIN_POOL lookup)

     A no-win is simply any stop set that isn't a win. Rather than pick from
     a hand-curated pool and then "vary" it — which produced an accidental
     win 43.6% of the time and had to revert, and which only ever showed 300
     distinct grids — we draw random stops and keep the first that pays zero.

     Measured over 20,000 generations on these strips:
       average 14.5 attempts, worst case 124, sub-millisecond
       19,997 distinct grids out of 20,000
       99.5% include at least one blank-centre reel (physical VGT look)
       zero paying grids

     Stops span the FULL 64 positions per reel, so odd (blank-centre) stops
     occur naturally — no separate mixed pool is needed to get them.
     NOWIN_POOL is retained ONLY as a last-resort fallback so this function
     can never fail to return a valid result. */
  var MAX_TRIES = 400;   /* ~27x the measured average; overshoot is free */
  for(var t=0;t<MAX_TRIES;t++){
    var pos=[];
    for(var r=0;r<5;r++) pos.push(rng.int(0,BASE_STRIPS[r].length-1));
    var g=[[],[],[]];
    for(var r2=0;r2<5;r2++){
      g[0].push(getSymAt(r2,pos[r2],0));
      g[1].push(getSymAt(r2,pos[r2],1));
      g[2].push(getSymAt(r2,pos[r2],2));
    }
    if(!gridHasWin(g)) return {syms:g[1].slice(),ghosts:_buildGhosts(pos)};
  }
  /* Fallback: unreachable in practice (p of 400 consecutive misses is
     vanishingly small), but never leave the caller without a grid. */
  var fb=NOWIN_POOL[rng.int(0,NOWIN_POOL.length-1)].slice();
  var fg=[[],[],[]];
  for(var r3=0;r3<5;r3++){
    fg[0].push(getSymAt(r3,fb[r3],0));
    fg[1].push(getSymAt(r3,fb[r3],1));
    fg[2].push(getSymAt(r3,fb[r3],2));
  }
  return {syms:fg[1].slice(),ghosts:_buildGhosts(fb)};
}

function _buildGhosts(pos){
  var ghosts=[];
  for(var r=0;r<5;r++){
    var s=BASE_STRIPS[r],n=s.length,p=pos[r];
    var sym=s[p];
    if(sym===7){
      /* Blank center (odd pos) — 7-slot physical layout fills the window:
           [ s[p-3] partial-ghost | blk | s[p-1] TOP | BLK center | s[p+1] BOT | blk | s[p+3] partial-ghost ]
         Outer ghosts clip at window edges (overflow hidden) — matches physical
         VGT look when reel stops between symbols. centerIdx=3 centers the blank.
         Named fields keep the payline mapping (row0=s[p-1], row1=blank, row2=s[p+1])
         so getVisibleGrid / gridHasWin / getSymAt all agree with the display. */
      ghosts.push({
        above2:s[(p-1+n)%n], above:s[(p-2+n)%n],
        sym:sym,
        below:s[(p+2)%n], below2:s[(p+1)%n],
        slots:[s[(p-3+n)%n],s[(p-2+n)%n],s[(p-1+n)%n],sym,s[(p+1)%n],s[(p+2)%n],s[(p+3)%n]],
        centerIdx:3
      });
    } else {
      /* Symbol center (even pos): standard 5-slot layout */
      ghosts.push({
        above2:s[(p-2+n)%n], above:s[(p-1+n)%n],
        sym:sym,
        below:s[(p+1)%n], below2:s[(p+2)%n]
      });
    }
  }
  return ghosts;
}

/* ── SPIN ANIMATION (5 reels) ── */
function spinReel(reelIdx,finalGhost,stopDelay,onStop){
  var strip=document.getElementById('rs'+reelIdx);
  var reel=document.getElementById('r'+reelIdx);
  if(!strip||!reel){onStop();return;}
  var wH=reel.clientHeight>10?reel.clientHeight:(_reelWinH>10?_reelWinH:120);
  var slotH=symSlotH(wH);
  if(slotH<10) slotH=Math.floor(wH/3);
  /* Center spin strip: slot at center index should be at mid-window */
  var spinTopOff=Math.round(wH/2-slotH*1.5);
  /* Use only symbols that actually appear on this reel — no blanks (7) during animation */
  var _reelSymSet=[];
  var _rsrc=BASE_STRIPS[reelIdx];
  for(var _si=0;_si<_rsrc.length;_si+=2){
    if(_rsrc[_si]!==7&&_reelSymSet.indexOf(_rsrc[_si])<0) _reelSymSet.push(_rsrc[_si]);
  }
  var spinSyms=[];
  for(var i=0;i<20;i++) spinSyms.push(_reelSymSet[rng.int(0,_reelSymSet.length-1)]);
  spinSyms.push(finalGhost.above2);spinSyms.push(finalGhost.above);
  spinSyms.push(finalGhost.sym);
  spinSyms.push(finalGhost.below);spinSyms.push(finalGhost.below2);
  strip.innerHTML='';strip.style.top='0px';strip.style.transition='none';
  for(var j=0;j<spinSyms.length;j++){
    var slot=buildSlot(spinSyms[j]);slot.style.height=slotH+'px';slot.style.flex='none';
    strip.appendChild(slot);
  }
  var centerIdx=spinSyms.length-3;
  var targetY=spinTopOff-centerIdx*slotH;
  var overshootY=targetY-Math.round(slotH*0.5);
  var t1=Math.round(stopDelay*0.75);var t2=Math.round(stopDelay*0.9);
  strip.style.willChange='top';reel.classList.add('spinning');
  var startTime=null;var snapped=false;var _rafDone=false;
  var _fb=setTimeout(function(){
    if(_rafDone) return;_rafDone=true;
    if(!snapped){snapped=true;_finishReel();}
  },stopDelay+500);
  function _finishReel(){
    strip.style.top=targetY.toFixed(1)+'px';
    reel.classList.remove('spinning');reel.classList.add('stopping');
    setTimeout(function(){
      reel.classList.remove('stopping');strip.innerHTML='';strip.style.willChange='';
      var wH2=reel.clientHeight||_reelWinH||120;
      sndReelStop(); /* v1.0: thunk on each reel landing */
      var restSlots,restCenter;
      if(finalGhost.slots){restSlots=finalGhost.slots;restCenter=finalGhost.centerIdx;}
      else{restSlots=[finalGhost.above2,finalGhost.above,finalGhost.sym,finalGhost.below,finalGhost.below2];restCenter=2;}
      strip.style.height=stripTotalH(restSlots,wH2)+'px';
      strip.style.top=stripTopFor(restSlots,wH2,restCenter)+'px';
      for(var si=0;si<restSlots.length;si++){
        var rs=buildSlot(restSlots[si]);rs.style.height=slotHFor(restSlots[si],wH2)+'px';rs.style.flex='none';
        strip.appendChild(rs);
      }
      /* Keep CURRENT_GHOSTS in sync for THIS reel - getVisibleGrid() (used by
         evalCosmetic/animateCosmeticWins during Red Spin) reads this global,
         and it was previously only updated by renderReels() on the FIRST
         spin of a session. During Red Spin, spinReel() runs independently
         per award and never refreshed it, so every Red Spin step was being
         evaluated against the stale first-spin grid - explaining why the
         same fixed set of paylines kept flashing regardless of the actual
         reel result. */
      if(!CURRENT_GHOSTS) CURRENT_GHOSTS=[];
      CURRENT_GHOSTS[reelIdx]=finalGhost;
      if(!CURRENT_SYMS) CURRENT_SYMS=[];
      CURRENT_SYMS[reelIdx]=finalGhost.sym;
      onStop();
    },80);
  }
  function frame(ts){
    if(_rafDone) return;
    if(!startTime) startTime=ts;
    var elapsed=ts-startTime;
    if(elapsed<t1){strip.style.top=(elapsed/t1*overshootY).toFixed(1)+'px';requestAnimationFrame(frame);}
    else if(elapsed<t2){strip.style.top=overshootY.toFixed(1)+'px';requestAnimationFrame(frame);}
    else{
      if(!snapped){snapped=true;_rafDone=true;clearTimeout(_fb);_finishReel();}
    }
  }
  requestAnimationFrame(frame);
}

function animateReels(spinData,cb){
  var STOP_DELAYS=[600,900,1200,1500,1800];
  sndSpinStart(); /* v1.0 */
  var _origCb=cb;cb=function(){sndSpinEnd();if(_origCb)_origCb.apply(null,arguments);};
  var done=0;
  function onReelStop(){done++;if(done===5) setTimeout(cb,100);}
  for(var ri=0;ri<5;ri++){ (function(r){spinReel(r,spinData.ghosts[r],STOP_DELAYS[r],onReelStop);})(ri); }
}

var PAYLINES=[
  {id:1,rows:[1,1,1,1,1],name:'Center'},
  {id:2,rows:[0,0,0,0,0],name:'Top'},
  {id:3,rows:[2,2,2,2,2],name:'Bottom'},
  {id:4,rows:[2,1,0,1,2],name:'V-Up'},
  {id:5,rows:[0,1,2,1,0],name:'V-Down'},
  {id:6,rows:[1,0,1,2,1],name:'PL6'},
  {id:7,rows:[1,2,1,0,1],name:'PL7'},
  {id:8,rows:[0,0,1,2,2],name:'Staircase-Down'},
  {id:9,rows:[2,2,1,0,0],name:'Staircase-Up'}
];

/* Build payline overlay elements dynamically over reel frame */
var _paylineOverlays = {};
var _flashFadeTimer=null;
var PAYLINE_NEON = {
  1:'#ff2d55', 2:'#ffee00', 3:'#00e5ff', 4:'#ff8c00', 5:'#a259ff',
  6:'#39ff14', 7:'#ff3cac', 8:'#00ffd5', 9:'#ffa500'
};
function buildPaylineOverlays(){
  var frame = document.getElementById('reel-frame');
  var old = frame.querySelectorAll('.pl-overlay-svg');
  for(var _o=0;_o<old.length;_o++) old[_o].parentNode.removeChild(old[_o]);
  _paylineOverlays = {};
  for(var pi=0;pi<PAYLINES.length;pi++){
    var pl = PAYLINES[pi];
    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','pl-overlay-svg');
    svg.setAttribute('id','pl-overlay-'+pl.id);
    svg.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:25;opacity:0;transition:opacity 0.45s ease;';
    var poly = document.createElementNS('http://www.w3.org/2000/svg','polyline');
    poly.setAttribute('class','pl-poly');
    poly.setAttribute('fill','none');
    poly.setAttribute('stroke', PAYLINE_NEON[pl.id]||'#ff8800');
    poly.setAttribute('stroke-width','3');
    poly.setAttribute('stroke-linecap','round');
    poly.setAttribute('stroke-linejoin','round');
    poly.style.filter='drop-shadow(0 0 4px '+(PAYLINE_NEON[pl.id]||'#ff8800')+') drop-shadow(0 0 8px '+(PAYLINE_NEON[pl.id]||'#ff8800')+')';
    svg.appendChild(poly);
    frame.appendChild(svg);
    _paylineOverlays[pl.id] = svg;
  }
  positionPaylineOverlays();
}

function positionPaylineOverlays(){
  var frame = document.getElementById('reel-frame');
  var fW = frame.clientWidth, fH = frame.clientHeight;
  if(fW<10||fH<10) return;
  var pad = 5, usable = fH - pad*2, rowH = usable/3;
  var colW = fW/5;
  for(var pi=0;pi<PAYLINES.length;pi++){
    var pl = PAYLINES[pi];
    var svg = _paylineOverlays[pl.id];
    if(!svg) continue;
    var poly = svg.querySelector('.pl-poly');
    if(!poly) continue;
    var pts=[];
    for(var ri=0;ri<5;ri++){
      var x = colW*ri + colW/2;
      var y = pad + rowH*pl.rows[ri] + rowH/2;
      pts.push(Math.round(x)+','+Math.round(y));
    }
    poly.setAttribute('points', pts.join(' '));
  }
}






/* ── BINGO PATTERNS ── */

/* ── BINGO ENGINE ── */
function doBingoSpin(){
  stopPatternCycle();
  var prevBallPos=BG.ballPos||0;
  /* Accept live WABC or local sequence */
  if(BG.usingServerBalls&&typeof WABC!=='undefined'){
    var _wabcSeq=WABC.getSequence();
    if(_wabcSeq&&_wabcSeq.length===75) BG.callSeq=_wabcSeq;
    if(BG.seqExhausted){_requestNewWABCSeq();prevBallPos=40;}
    BG.seqExhausted=false;
  }
  if(!BG.callSeq||BG.callSeq.length!==75){
    toast('Ball call unavailable - please wait');
    S.spinning=false;_applyPendingSeq();S.bal+=getTotalBet();setCtrl(true);updUI();return null;
  }
  BG.card=genBingoCard();
  BG.cardNumSet={};
  for(var i=0;i<25;i++){if(BG.card[i]!==null) BG.cardNumSet[BG.card[i]]=i;}
  BG.matchedCells={12:true};
  var wonPatterns={};var winPatterns=[];
  for(var b=0;b<40;b++){
    var ball=BG.callSeq[b];
    var cellIdx=BG.cardNumSet[ball];
    if(cellIdx!==undefined) BG.matchedCells[cellIdx]=true;
    var ballsCalledSoFar=b+1;
    for(var pi=0;pi<BINGO_PATTERNS.length;pi++){
      if(wonPatterns[pi]) continue;
      var pat=BINGO_PATTERNS[pi];
      if(ballsCalledSoFar>pat.balls) continue;
      var complete=true;
      for(var ci=0;ci<pat.cells.length;ci++){
        var c=pat.cells[ci];if(c===12) continue;
        if(!BG.matchedCells[c]){complete=false;break;}
      }
      if(complete){wonPatterns[pi]=true;winPatterns.push(pat);}
    }
  }
  for(var eb=40;eb<prevBallPos;eb++){
    var eball=BG.callSeq[eb];
    if(BG.cardNumSet[eball]!==undefined) BG.matchedCells[BG.cardNumSet[eball]]=true;
  }
  BG.winPatterns=winPatterns;
  BG.ballPos=(prevBallPos>40?prevBallPos:40);
  BG._coverAll1to40=false;
  for(var _capi=0;_capi<BINGO_PATTERNS.length;_capi++){
    if(BINGO_PATTERNS[_capi].isCoverAll&&wonPatterns[_capi]){BG._coverAll1to40=true;break;}
  }
  renderBingoCard(BG.card,BG.matchedCells,null);
  renderBallStrip(BG.callSeq,BG.ballPos,BG.cardNumSet);
  return BG.winPatterns;
}

/* ── COVER ALL ── */
function _handleCoverAll(){
  BG.seqExhausted=true;BG.awaitingNewSeq=true;BG._coverAll75Fired=true;
  _requestNewWABCSeq();
  S.bal+=1;updUI();toast('Cover All \u2014 $0.01');
}

function _requestNewWABCSeq(){
  if(!BG.usingServerBalls||!window._floorSupabaseClient) return;
  window._floorSupabaseClient.rpc('upsert_ball_call',{p_game_id:'WABC'}).then(function(res){
    if(res.error||!res.data) return;
    var _newSeq=res.data.sequence||[];var _newIAt=res.data.issued_at||new Date().toISOString();
    if(_newSeq.length!==75) return;
    if(window._wabcChannel){window._wabcChannel.send({type:'broadcast',event:'new_call',payload:{sequence:_newSeq,issued_at:_newIAt}});}
    if(typeof WABC!=='undefined'&&WABC.applyLocalNewCall) WABC.applyLocalNewCall(_newSeq,_newIAt);
    if(_cardChangeBlocked()){_pendingNewSeq={seq:_newSeq,issuedAt:_newIAt};BG.awaitingNewSeq=false;BG.seqExhausted=false;BG._coverAll75Fired=false;updateBallCallBadge();return;}
    BG.callSeq=_newSeq;BG.ballPos=40;BG.usingServerBalls=true;BG.seqExhausted=false;BG.awaitingNewSeq=false;BG._coverAll75Fired=false;
    if(BG.card&&Object.keys(BG.cardNumSet).length>0){
      BG.matchedCells={12:true};
      for(var _nc=0;_nc<40;_nc++){var _b=BG.callSeq[_nc];if(BG.cardNumSet[_b]!==undefined) BG.matchedCells[BG.cardNumSet[_b]]=true;}
      if(GS.state==='active'&&!_celebCardLocked) renderBingoCard(BG.card,BG.matchedCells,null);
      renderBallStrip(BG.callSeq,40,BG.cardNumSet);
    }
    updateBallCallBadge();
  }).catch(function(){});
}

/* ── SERVER BALL POS ── */
function _onServerBallPos(newPos){
  /* Server-driven ball position. The wide-area call broadcasts positions 41-75
     (the live "entertainment" phase); balls 1-40 are daubed by the spin itself
     in doBingoSpin, so positions <=40 are not live-called here. A NEW sequence
     (rollover at 75) arrives via WABC.onNewCall, which re-baselines to 40 — it
     is NOT inferred from a downward newPos here. This matches the sister game
     exactly. */
  _wabcNotePos(newPos); /* diagnostic: log every arrival */
  if(GS.state!=='active') return;
  if(!BG.card||!BG.callSeq||BG.callSeq.length!==75) return;
  if(newPos<=40||newPos>75) return;   /* server only sends 41-75 */
  if(newPos<=BG.ballPos) return;      /* ignore stale or duplicate */
  BG.ballPos=newPos;
  for(var _bp=40;_bp<BG.ballPos;_bp++){
    var _bball=BG.callSeq[_bp];
    if(BG.cardNumSet[_bball]!==undefined) BG.matchedCells[BG.cardNumSet[_bball]]=true;
  }
  /* v1.9.0: while the card is locked for Red Spin we still repaint, so the
     player sees the call continuing to daub. Once blackout is reached the
     card is held on the blacked-out state and no longer repainted. */
  if(GS.state==='active'&&!_celebCardLocked&&!_blackoutHold&&(!S.spinning||_rsCardLocked))
    renderBingoCard(BG.card,BG.matchedCells,null);
  renderBallStrip(BG.callSeq,BG.ballPos,BG.cardNumSet);
  if(!BG._coverAll75Fired&&!BG.awaitingNewSeq&&Object.keys(BG.matchedCells).length===25){
    /* Class II rule (Sasha): Cover All can only be AWARDED on a spin. */
    BG._coverAll75Fired=true;BG.seqExhausted=true;BG.awaitingNewSeq=true;
    BG._coverAllPending=true;
    /* v1.9.0: blackout while locked -> freeze on the blacked-out card. */
    if(_rsCardLocked){
      _blackoutHold=true;
      renderBingoCard(BG.card,BG.matchedCells,null);
    }
    _requestNewWABCSeq();
  }
}


/* ── CARD/RS LOCK HELPERS ── */
function _acquireRsCardLock(){
  _rsCardLocked=true;
  var snapCard=BG.card.slice();var snapCallSeq=BG.callSeq.slice();
  var snapMatched={};var _mk=Object.keys(BG.matchedCells);for(var _mi=0;_mi<_mk.length;_mi++) snapMatched[_mk[_mi]]=true;
  var snapNumSet={};var _nk=Object.keys(BG.cardNumSet);for(var _ni=0;_ni<_nk.length;_ni++) snapNumSet[_nk[_ni]]=BG.cardNumSet[_nk[_ni]];
  _rsCardSnapshot={card:snapCard,callSeq:snapCallSeq,matchedCells:snapMatched,cardNumSet:snapNumSet};
}
/* v1.10.0: the card must not be replaced mid-spin either. Previously only
   _rsCardLocked deferred a new sequence, so if the ball call rolled over or
   Cover All fired DURING a normal spin the card refreshed underneath the
   player. Any of these three states now holds it. */
function _cardChangeBlocked(){
  return _rsCardLocked || _blackoutHold || S.spinning;
}

/* Apply a sequence that was parked while the card was locked. Safe to call
   repeatedly — it no-ops once the pending sequence is consumed. */
function _applyPendingSeq(){
  if(!_pendingNewSeq || _cardChangeBlocked()) return;
  var _pSeq=_pendingNewSeq.seq;_pendingNewSeq=null;
  BG.callSeq=_pSeq;BG.ballPos=40;BG.usingServerBalls=true;
  BG.seqExhausted=false;BG.awaitingNewSeq=false;BG._coverAll75Fired=false;
  if(BG.card&&Object.keys(BG.cardNumSet).length>0){
    BG.matchedCells={12:true};
    for(var _ri=0;_ri<40;_ri++){var _rb=_pSeq[_ri];if(BG.cardNumSet[_rb]!==undefined) BG.matchedCells[BG.cardNumSet[_rb]]=true;}
    if(GS.state==='active'&&!_celebCardLocked) renderBingoCard(BG.card,BG.matchedCells,null);
    renderBallStrip(BG.callSeq,40,BG.cardNumSet);
  }
  updateBallCallBadge();
}

function _releaseRsCardLock(){
  _rsCardLocked=false;_rsCardSnapshot=null;
  /* v1.9.0: if blackout was reached during the bonus, hold the blacked-out
     card. The pending sequence is applied by _applyPendingSeq() on the next
     spin press, not here. */
  if(_blackoutHold) return;
  _applyPendingSeq();
}

/* ── RED SPIN ── */
/* v1.8.0: baseAmt is passed in so the win box can show the RUNNING TOTAL
   (base + bonus so far) at every step. Previously each Red Spin step
   overwrote the box with only that step's pay, so the running total was
   never visible and the trigger spin's award appeared to vanish.
   Award ORDER is unchanged: rsPatterns arrives sorted lowest->highest
   and is stepped through in that order. */
function runRS(rsPatterns,onDone,baseAmt){
  baseAmt=baseAmt||0;
  if(!rsPatterns||rsPatterns.length===0){onDone(0);return;}
  var frame2=document.getElementById('reel-frame');
  var redOv=document.getElementById('red-ov');
  var badge=document.getElementById('rs-badge');
  var btBox=document.getElementById('bt-box');
  var btVal=document.getElementById('bt-val');
  frame2.style.borderColor='#cc0000';
  redOv.classList.add('on');badge.classList.add('on');
  sndRsMusicStart(); /* v1.0: music while screen is red */
  btBox.classList.add('on');btVal.textContent='$0.00';
  /* v1.8.0: carry the triggering spin's award into Red Spin instead of
     leaving a stale or zero figure on screen. */
  if(baseAmt>0) setWin(baseAmt,'RED SPIN \u2014 TOTAL SO FAR');
  var bonusTotal=0;var seqIdx=0;
  /* betLvl = bet MULTIPLIER 1..20 (total credits / 9 lines). Award:wager ratio
     is unchanged by the getTotalBet fix, so RTP stays 96.26%. */
  var betLvl=getBetPerLine()/9;var denomMult=getDenomMult();
  var _activeCycleTimer=null; /* tracks the currently-running payline cycle so it can be cancelled by the next pattern */
  function playNext(){
    if(seqIdx>=rsPatterns.length){
      /* Hand the final pattern's cycle to the global timer so it keeps
         repeating until the next spin cancels it */
      _winCycleTimer=_activeCycleTimer;_activeCycleTimer=null;
      for(var _k in _paylineOverlays) _paylineOverlays[_k].style.opacity='0';
      frame2.style.borderColor='';
      sndRsMusicStop(); /* v1.0 */
      redOv.classList.remove('on');badge.classList.remove('on');
      toast('RED SPIN BONUS: '+centsToDisplay(bonusTotal));
      onDone(bonusTotal);return;
    }
    var pat=rsPatterns[seqIdx];seqIdx++;
    badge.textContent='RED SPIN '+seqIdx;
    var _pnEl=document.getElementById('bingo-pattern-name');
    /* Keep the PREVIOUS pattern name + ball threshold lit/flashing during this
       spin-up - do not blank it. It only changes once this pattern's award
       is confirmed below, so there's no dark gap between awards. */
    var _rsResult=pickWinPositions(pat);
    if(!_rsResult){
      /* pat.reel did not resolve via COMBO_POSITIONS or REEL_KEYS (should not
         happen for any of the 595 active patterns, but never fall back to an
         unvalidated display - use the fully-verified no-win generator). */
      _rsResult=genNoWinResult();
    }
    var sr=_rsResult;
    var rsDone=0;var RS_STOP=[500,800,1100,1400,1700];
    sndSpinStart(); /* v1.0: RS reels use the same spin sounds */
    for(var _ri=0;_ri<5;_ri++){ (function(r){spinReel(r,sr.ghosts[r],RS_STOP[r],_onReelDone);}(_ri)); }
    function _onReelDone(){
      rsDone++;if(rsDone<5) return;
      sndSpinEnd(); /* v1.0: all RS reels landed — stop spin loop */
      /* Pattern name + ball threshold - always re-trigger fresh flash even on
         consecutive repeats of the same pattern name */
      if(_pnEl) _pnEl.textContent=pat.name.toUpperCase()+' \u2014 '+pat.balls+' BALLS';
      _pnEl&&_pnEl.classList.remove('pn-flash');
      void (_pnEl&&_pnEl.offsetWidth); /* force reflow to restart animation */
      _pnEl&&_pnEl.classList.add('pn-flash');
      /* v1.9.0: the card is LOCKED (a new ball sequence is deferred by
         _rsCardLocked) but must KEEP DAUBING, so render the live BG.card /
         BG.matchedCells rather than the snapshot taken at Red Spin start.
         Rendering the snapshot froze the daubs for the whole bonus.
         Once blackout is reached the display holds on the blacked-out card. */
      var _rsCard=BG.card;
      var _rsMatched=BG.matchedCells;
      renderBingoCard(_rsCard,_rsMatched,pat.cells);
      setTimeout(function(){
        var _rsGrid=getVisibleGrid();
        var _rsLines=evalCosmetic(_rsGrid);
        var _rsTotalPay=0;
        for(var _rli=0;_rli<_rsLines.length;_rli++){
          var _rpl=PAYLINES[_rsLines[_rli]-1];
          var _rL=[];
          for(var _rlr=0;_rlr<5;_rlr++) _rL.push(_rsGrid[_rpl.rows[_rlr]][_rlr]);
          var _rlp=calcLineBasePay(_rL);
          if(_rlp>0) _rsTotalPay+=_rlp*betLvl*denomMult;
        }
        var payAmt=pat.pay*betLvl*denomMult; /* bingo authoritative */
        if(payAmt>0){
          bellRingTimes(1); /* step announce ring */
          /* v1.0: same incremental bell rules apply DURING Red Spin too —
             1 ring per $10 of this step's pay, starting just after the announce */
          (function(_pa){setTimeout(function(){bellForWinCents(_pa);},350);})(payAmt);
        }
        bonusTotal+=payAmt;S.bal+=payAmt;updUI();
        btVal.textContent=centsToDisplay(bonusTotal);
        /* v1.8.0: running total, with this step's contribution named. */
        setWin(baseAmt+bonusTotal,'RED SPIN \u2014 '+pat.name.toUpperCase()+
               ' +'+centsToDisplay(payAmt));
        /* Cancel any previous pattern's cycle timer before starting this one,
           so the winning lines/symbols stay continuously lit until THIS
           pattern's result replaces them - no gap between awards. */
        if(_activeCycleTimer){clearInterval(_activeCycleTimer);_activeCycleTimer=null;}
        clearAllSymGlows();
        /* Show ALL winning paylines for this step simultaneously, hold 2s then advance */
        animateCosmeticWins(pat.name.toUpperCase()+' — '+pat.balls+' BALLS',2000,true);
        setTimeout(function(){clearAllSymGlows();playNext();},2000);
        return; /* playNext called by 2s timeout above */
      },120);
    }
  }
  setTimeout(playNext,200);
}


/* ── BELL RING SYSTEM (v1.0) ──
   Incremental design per Sasha: 1 ring per $10 actually won this spin.
   $10=1 ring, $20=2, $50=5, $100=10, $250=25 ... capped at 30 rings so
   monster wins celebrate without ringing for a full minute.
   Cadence accelerates: first 8 rings 300ms apart, next 8 at 200ms, rest at 140ms.
   Thresholds are ABSOLUTE dollars (not denom-scaled) — more money = more bell.
   Uses Web Audio for precise overlapping scheduling; unlocked on first touch
   (Samsung Browser autoplay policy). Falls back to HTMLAudio pool if needed. */
var BELL_URL='assets/bell_ring.mp3?v=1.1.12';
var _bellCtx=null,_bellBuf=null,_bellReady=false,_bellPending=0,_bellHtmlPool=null,_bellPoolIdx=0;
function _bellInit(){
  if(_bellReady||_bellCtx) return;
  try{
    var AC=window.AudioContext||window.webkitAudioContext;
    if(AC){
      _bellCtx=new AC();
      var xhr=new XMLHttpRequest();
      xhr.open('GET',BELL_URL,true);xhr.responseType='arraybuffer';
      xhr.onload=function(){
      _bellCtx.decodeAudioData(xhr.response,function(buf){
        _bellBuf=buf;_bellReady=true;_sndDecodeAll();
        if(_bellPending>0){var n=_bellPending;_bellPending=0;bellRingTimes(n);}
      },function(){_bellFallback();});
      };
      xhr.onerror=function(){_bellFallback();};
      xhr.send();
      return;
    }
  }catch(e){}
  _bellFallback();
}
function _bellFallback(){
  _sndDecodeAll();
  _bellHtmlPool=[];
  for(var i=0;i<4;i++){
    var a=new Audio(BELL_URL);
    a.preload='auto';_bellHtmlPool.push(a);
  }
  _bellReady=true;
  if(_bellPending>0){var n=_bellPending;_bellPending=0;bellRingTimes(n);}
}
function _bellUnlock(){
  _bellInit();
  if(_bellCtx&&_bellCtx.state==='suspended'){try{_bellCtx.resume();}catch(e){}}
}
function bellRingTimes(n){
  if(n<=0) return;
  if(n>30) n=30; /* cap */
  if(!_bellReady){_bellPending=n;_bellInit();return;}
  var t=0;
  for(var i=0;i<n;i++){
    var gap=i<8?300:(i<16?200:140);
    (function(delay){
      setTimeout(function(){
        try{
          if(_bellCtx&&_bellBuf){
            var src=_bellCtx.createBufferSource();src.buffer=_bellBuf;
            src.connect(_bellCtx.destination);src.start(0);
          }else if(_bellHtmlPool){
            var a=_bellHtmlPool[_bellPoolIdx%_bellHtmlPool.length];_bellPoolIdx++;
            a.currentTime=0;a.play();
          }
        }catch(e){}
      },delay);
    })(t);
    t+=gap;
  }
}
function bellForWinCents(cents){
  /* 1 ring per $10 won; requires at least $10 */
  var rings=Math.floor(cents/1000);
  if(rings>0) bellRingTimes(rings);
}


/* ── GAME AUDIO ENGINE (v1.0) — reel sounds + Red Spin music ──
   Shares the bell AudioContext. WAV loops are seamless (mp3 padding clicks).
   Gains: spin loop 0.35, start 0.8, stop 0.7, RS music 0.6, bell 1.0. */
var SND_SRC={
  start:{url:'assets/reel_start.wav?v=1.1.12'},
  spinloop:{url:'assets/reel_spin_loop.wav?v=1.1.12'},
  stop:{url:'assets/reel_stop.wav?v=1.1.12'},
  rsmusic:{url:'assets/red_spin_music.mp3?v=1.1.12'}
};
var _sndBufs={},_sndHtml={},_sndDecoded=false;
function _sndDecodeAll(){
  if(_sndDecoded) return; _sndDecoded=true;
  for(var name in SND_SRC){
    (function(n){
      var url=SND_SRC[n].url;
      if(_bellCtx){
        var xhr=new XMLHttpRequest();
        xhr.open('GET',url,true);xhr.responseType='arraybuffer';
        xhr.onload=function(){
          _bellCtx.decodeAudioData(xhr.response,function(buf){_sndBufs[n]=buf;},function(){
            _sndHtml[n]=new Audio(url);
          });
        };
        xhr.onerror=function(){_sndHtml[n]=new Audio(url);};
        xhr.send();
      }else{
        _sndHtml[n]=new Audio(url);
      }
    })(name);
  }
}
function sndPlay(name,gain,loop){
  try{
    if(_bellCtx&&_sndBufs[name]){
      var src=_bellCtx.createBufferSource();src.buffer=_sndBufs[name];src.loop=!!loop;
      var g=_bellCtx.createGain();g.gain.value=gain||1;
      src.connect(g);g.connect(_bellCtx.destination);src.start(0);
      return {stop:function(){try{src.stop(0);}catch(e){}}};
    }
    if(_sndHtml[name]){
      var a=_sndHtml[name];a.loop=!!loop;a.volume=gain||1;try{a.currentTime=0;}catch(e){}a.play();
      return {stop:function(){try{a.pause();a.currentTime=0;}catch(e){}}};
    }
  }catch(e){}
  return {stop:function(){}};
}
var _spinLoopH=null,_rsMusicH=null;
function sndSpinStart(){
  sndPlay('start',0.8,false);
  if(_spinLoopH)_spinLoopH.stop();
  _spinLoopH=sndPlay('spinloop',0.35,true);
}
function sndReelStop(){sndPlay('stop',0.7,false);}
function sndSpinEnd(){if(_spinLoopH){_spinLoopH.stop();_spinLoopH=null;}}
function sndRsMusicStart(){if(_rsMusicH)_rsMusicH.stop();_rsMusicH=sndPlay('rsmusic',0.6,true);}
function sndRsMusicStop(){if(_rsMusicH){_rsMusicH.stop();_rsMusicH=null;}}


/* ── OPERATOR REPORTING FEED (v1.0.7) ──
   Mirrors the sister game exactly: game_history is a DIRECT table insert via the
   shared Supabase client, NOT an RPC. Fire-and-forget — never stalls a spin. */
var PROG_GAME_ID_FALLBACK='turrelle_big_munny_2';
function _writeGameHistory(rec){
  if(typeof Progressive==='undefined'||!Progressive.isConnected()) return;
  var _client=window._floorSupabaseClient;
  if(!_client) return;
  var _denom=(typeof PROG_DENOM!=='undefined'?PROG_DENOM:1);
  var _gameId=(typeof PROG_GAME_ID!=='undefined')?PROG_GAME_ID:PROG_GAME_ID_FALLBACK;
  var row={
    game_id:_gameId,
    game_title:'The Turrelle Sisters Big Munny II',
    denom:_denom,
    event_type:rec.type||'SPIN',
    game_serial:rec.gameSerial||null,
    card_serial:rec.cardSerial||null,
    session_key:(typeof Progressive!=='undefined'?Progressive.getSessionKey():null),
    nickname:window._playerNickname||null,
    bet:parseFloat(rec.bet)||0,
    win:parseFloat(rec.win)||0,
    bal_before:parseFloat(rec.balBefore)||0,
    bal_after:parseFloat(rec.balAfter)||0,
    patterns:(rec.patterns&&rec.patterns.length)?rec.patterns:[],
    balls_to_win:rec.balls||0,
    is_progressive:rec.isProgressive||false,
    prog_amount:rec.progAmount||null,
    archived:false
  };
  if(rec.type==='CASH_IN'){row.bet=parseFloat(rec.amount)||0;row.win=0;}
  if(rec.type==='CASH_OUT'){row.win=parseFloat(rec.amount)||0;row.bet=0;}
  try{
    _client.from('game_history').insert(row).then(function(res){
      if(res&&res.error) console.warn('[GameHistory] insert FAILED:',res.error.message);
    });
  }catch(e){}
}


/* v1.0.7: bring up the shared Progressive controller and bind the meter. */
var _progCtrlStarted=false;
function _initProgressiveController(){
  if(_progCtrlStarted) return;
  _progCtrlStarted=true;
  if(typeof Progressive==='undefined'||!Progressive.init) return;
  Progressive.onChange(function(v){
    var el=document.getElementById('prog-meter-val');
    if(el&&typeof v==='number') el.textContent=fmtMoney(v);
  });
  Progressive.init(function(){
    var el=document.getElementById('prog-meter-val');
    if(el) el.textContent=fmtMoney(Progressive.getValue());
  });
}


/* ══════════════════════════════════════════════════════════════════════════
   VIRTUAL WALLET  (v1.1.0)
   Ported from StrayPups Big Munny $1 for suite parity, with two differences:
     1. TSBMII keeps S.bal in CENTS; the wallet/vouchers tables store DOLLARS.
        Every boundary converts: redeem x100 into credits, sweep /100 out.
     2. EXIT SWEEP (new — SP1D does not have this): if the player leaves or
        closes the game with credits on the meter, those credits are written
        back to the wallet as a voucher instead of vanishing.
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  function _nick(){ return ((window._playerNickname||'')).toLowerCase().trim(); }
  function _fmtD(v){ var n=parseFloat(v); if(isNaN(n)||n<0)n=0;
    return '$'+n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','); }
  function _el(id){ return document.getElementById(id); }
  var GAME_SLUG='turrelle_big_munny_2';
  var LOBBY_URL='https://theturrellesisters.github.io/turrelle_gold_coins_casino/';
  var _gameLabels={
    'straypups_1d':'StrayPups $1','straypups_5d':'StrayPups $5',
    'maxines':"Maxine's",'tsbigmunny':'Turrelle Sisters',
    'turrelle_big_munny_2':'Turrelle Sisters II','pokeher':'Poke-Her','lobby':'Lobby'
  };

  /* ── Wallet overlay ── */
  /* ── Redeem a voucher: DOLLARS -> CENTS on the way in ── */
  /* ── Cash out: CENTS -> DOLLARS, voucher + wallet balance (SP1D parity) ── */
  /* ── EXIT SWEEP (new in TSBMII) ─────────────────────────────────────────
     Player leaves with credits on the meter -> write them back to the wallet
     as a voucher so nothing is stranded. Uses keepalive so the request still
     completes after the page is torn down (a normal fetch would be cancelled).
     Guards: fires once, only with a nickname, only with a positive balance. */
  var _swept=false;
  window._sweepCreditsToWallet=function(){
    if(_swept) return;
    var n=_nick();
    var cents=S.bal;
    if(!n||!cents||cents<=0) return;
    _swept=true;
    var amt=Math.round(cents)/100;              /* cents -> dollars */
    S.bal=0;
    try{ updUI(); }catch(e){}
    try{
      fetch(SB_URL+'/rest/v1/vouchers',{
        method:'POST',
        headers:{'apikey':SB_ANON,'Authorization':'Bearer '+SB_ANON,
                 'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify({nickname:n,amount:amt,status:'available',source_game:GAME_SLUG}),
        keepalive:true
      });
    }catch(e){}
  };
  window.addEventListener('pagehide',function(){ window._sweepCreditsToWallet(); });
  window.addEventListener('beforeunload',function(){ window._sweepCreditsToWallet(); });

  /* ── Buttons ── */
  document.addEventListener('DOMContentLoaded',function(){
    var cb=_el('wov-close');
    if(cb) cb.addEventListener('click',function(){ _el('wallet-ov').classList.remove('on'); });
    var ov=_el('wallet-ov');
    if(ov) ov.addEventListener('click',function(e){ if(e.target===ov) ov.classList.remove('on'); });

    var ic=_el('ic-btn');
    if(ic) ic.addEventListener('click',function(){ if(S.spinning) return; WalletUI.open(); });

    var co=_el('co-btn');
    if(co) co.addEventListener('click',function(){
      if(S.spinning) return;
      if(S.bal<=0){ toast('NOTHING TO CASH OUT'); return; }
      var amtD=Math.round(S.bal)/100;
      WalletUI.cashOut(function(ok){
        var prev=S.bal;
        S.bal=0; _swept=true;                    /* cashed out — no exit sweep */
        updUI();
        _writeGameHistory({type:'CASH_OUT',amount:amtD,balBefore:prev/100,balAfter:0});
        toast('CASHED OUT '+_fmtD(amtD)+(ok?' \u2022 SAVED TO WALLET':''));
        /* Cash out saved — player stays in game */
      });
    });
  });
}());

/* Nickname handed over by the Gold Coins Casino lobby (?player=nick).
   When a real player session exists the meter starts EMPTY — credits come from
   the wallet. Test bankroll only applies to standalone launches with no
   nickname, so test money can never be swept into the wallet. */
(function(){
  try{
    var p=new URLSearchParams(window.location.search).get('player');
    if(p&&p.trim().length>=2){
      window._playerNickname=p.trim().substring(0,16);
      S.bal=0;
    }
  }catch(e){}
}());


/* ── WABC DIAGNOSTIC (v1.1.4) ──────────────────────────────────────────────
   Tap the LIVE/WAITING badge to toggle a readout. This exists so a device can
   tell us WHY the call is or isn't advancing instead of us guessing: whether the
   channel subscribed, whether 'pos' broadcasts are actually arriving, what the
   ticker's position is, and what the game is displaying. */
var _wabcLastPos=null,_wabcLastAt=0,_wabcDiagEl=null,_wabcDiagTimer=null;
function _wabcNotePos(p){ _wabcLastPos=p; _wabcLastAt=Date.now(); updateBallCallBadge(); }
function _toggleWabcDiag(){
  if(_wabcDiagEl){
    clearInterval(_wabcDiagTimer);_wabcDiagTimer=null;
    _wabcDiagEl.parentNode.removeChild(_wabcDiagEl);_wabcDiagEl=null;
    return;
  }
  _wabcDiagEl=document.createElement('div');
  _wabcDiagEl.style.cssText='position:fixed;left:6px;right:6px;top:6px;z-index:400;'+
    'background:rgba(4,8,20,.96);border:1px solid #2a2a4a;border-radius:8px;padding:8px 10px;'+
    'font:11px/1.5 monospace;color:#9fd;white-space:pre;';
  _wabcDiagEl.addEventListener('click',_toggleWabcDiag);
  document.body.appendChild(_wabcDiagEl);
  function upd(){
    var ago=_wabcLastAt?Math.round((Date.now()-_wabcLastAt)/1000)+'s ago':'never';
    var wp='n/a';
    try{ if(typeof WABC!=='undefined'&&WABC.getBallPos) wp=WABC.getBallPos(); }catch(e){}
    _wabcDiagEl.textContent=
      'WABC DIAGNOSTIC  (tap to close)\n'+
      'build          : '+BUILD_VERSION+'\n'+
      'shared client  : '+(window._wabcSupabaseClient?'yes':'NO')+'\n'+
      'channel        : '+(window._wabcChannel?'created':'NONE')+'\n'+
      'server balls   : '+(BG.usingServerBalls?'yes (LIVE)':'no (WAITING)')+'\n'+
      'last pos event : '+(_wabcLastPos===null?'none received':_wabcLastPos)+'  ('+ago+')\n'+
      'WABC ball pos  : '+wp+'\n'+
      'game ball pos  : '+BG.ballPos+'\n'+
      'sequence len   : '+(BG.callSeq?BG.callSeq.length:0)+'\n'+
      'game state     : '+GS.state+(S.spinning?' (spinning)':'');
  }
  upd();_wabcDiagTimer=setInterval(upd,1000);
}
document.addEventListener('DOMContentLoaded',function(){
  var b=document.getElementById('ball-call-badge');
  if(b){ b.style.cursor='pointer'; b.addEventListener('click',_toggleWabcDiag); }
  setInterval(function(){ try{updateBallCallBadge();}catch(e){} },1000);
});


/* v1.1.10: money formatter matching the StrayPups sister games ($12,500.00). */
function fmtMoney(n){
  var v=parseFloat(n);if(isNaN(v)||v<0)v=0;
  var p=v.toFixed(2).split('.');
  p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');
  return '$'+p.join('.');
}

/* ── MAIN SPIN ── */
function setCtrl(en){
  var ids=['bet-btn','spin-btn','max-btn','sel-denom'];
  for(var i=0;i<ids.length;i++){
    var el=document.getElementById(ids[i]);if(el) el.disabled=!en;
  }
}

function setWin(amtCents,lbl){
  document.getElementById('wval').textContent=centsToDisplay(amtCents);
  document.getElementById('win-msg').textContent=lbl||'\u00a0';
}

function toast(m){
  var el=document.getElementById('toast');el.textContent=m;el.classList.add('on');
  setTimeout(function(){el.classList.remove('on');},2600);
}

function updateBallCallBadge(){
  var el=document.getElementById('ball-call-badge');if(!el) return;
  /* v1.1.5: the badge now carries the evidence — the last ball position actually
     RECEIVED from the wabc-ball-ticker, plus the channel state when it is not
     subscribed. "LIVE --" means the sequence loaded but no 'pos' broadcast has
     ever arrived; "LIVE 47" means broadcasts are arriving normally. */
  var st=window._wabcChannelStatus;
  var recv=(typeof _wabcLastPos!=='undefined'&&_wabcLastPos!==null)?_wabcLastPos:'--';
  if(BG.usingServerBalls){
    if(st&&st!=='SUBSCRIBED'){
      el.textContent='\u25cf '+String(st).substr(0,12);el.style.color='#ff5555';
    } else {
      el.textContent='\u25cf LIVE '+recv;
      el.style.color=(recv==='--')?'#ffaa00':'#00ff88';
    }
  } else {
    el.textContent='\u25cf WAITING';el.style.color='#ffaa00';
  }
}

function _refreshSpinWatchdog(){
  if(_spinWatchdog) clearTimeout(_spinWatchdog);
  _spinWatchdog=setTimeout(function(){
    if(S.spinning){console.warn('[Watchdog] Spin stuck >20s');_blackoutHold=false;_releaseRsCardLock();S.spinning=false;_applyPendingSeq();setCtrl(true);updUI();}
  },20000);
}
function _clearSpinWatchdog(){if(_spinWatchdog){clearTimeout(_spinWatchdog);_spinWatchdog=null;}}

function doSpin(){
  if(S.spinning) return;
  if(Date.now()-_spinDebounce<300) return;
  if(BG.awaitingNewSeq){toast('New ball sequence loading \u2014 please wait');return;}
  var totalBet=getTotalBet(); /* already in cents */
  if(S.bal<totalBet){toast('INSUFFICIENT CREDITS');return;}
  /* v1.10.0: release a blackout hold BEFORE S.spinning goes true, so the fresh
     card is dealt on the press rather than surfacing at the end of the spin.
     _cardChangeBlocked() includes S.spinning, so doing this afterwards would
     park the new sequence for the whole spin. */
  if(_blackoutHold){
    _blackoutHold=false;
    _releaseRsCardLock();
  }
  S.spinning=true;
  /* Cancel any running win-cycle animation and clear all glows the moment spin is pressed */
  if(_winCycleTimer){clearInterval(_winCycleTimer);_winCycleTimer=null;}
  _predetWinLines=null;
  if(_flashFadeTimer){clearTimeout(_flashFadeTimer);_flashFadeTimer=null;}
  for(var _ko in _paylineOverlays) _paylineOverlays[_ko].style.opacity='0';
  clearAllSymGlows();S.bal-=totalBet;
  var _balBefore=(S.bal+totalBet)/100; /* dollars, pre-wager */
  /* v1.0.7: real suite API — module applies contrib_rate and batches the flush */
  /* v1.1.11: register the player + refresh last-seen on each spin, matching the
     sister games — without these, player_registry gets no rows for this game and
     the operator's live-player list never shows Turrelle II players. */
  if(typeof Progressive!=='undefined'){
    if(Progressive.registerPlayer) Progressive.registerPlayer(null, window._playerNickname || null);
    if(Progressive.updateLastSpin) Progressive.updateLastSpin();
    if(Progressive.contribute) Progressive.contribute(totalBet/100);
  }
  setWin(0,'');document.getElementById('bt-box').classList.remove('on');
  updUI();setCtrl(false);_refreshSpinWatchdog();
  stopPatternCycle();
  if(GS.state==='idle'){
    stopPatternShowcase();
    document.getElementById('bingo-col-hdrs').style.display='';
    if(!_cardNodes||_cardNodes.length<25) buildBingoCardNodes();
  }
  GS.hasSpun=true;GS.state='active';
  var winPatterns=doBingoSpin();
  if(winPatterns===null) return;

  if(!BG.entTimer){BG.entTimer=true;}

  var spinData;
  if(winPatterns.length===0){
    spinData=genNoWinResult();
  } else {
    var _reelPats=[];var _progPats=[];
    for(var _rpi=0;_rpi<winPatterns.length;_rpi++){
      if(winPatterns[_rpi].jp) _progPats.push(winPatterns[_rpi]);
      else if(winPatterns[_rpi].reel) _reelPats.push(winPatterns[_rpi]);
    }
    _reelPats.sort(function(a,b){return (a.pay||0)-(b.pay||0);});
    winPatterns=_reelPats.concat(_progPats);
    var basePat=_reelPats.length>0?_reelPats[0]:null;
    /* Use multi-payline position lookup for winning spins */
    var _winResult=basePat?pickWinPositions(basePat):null;
    if(!_winResult){
      /* No reel-eligible win pattern (e.g. JP-only progressive trigger), or
         pat.reel did not resolve. NEVER fall back to an unvalidated display -
         the only safe path is the fully-verified no-win generator. The JP
         award itself (if any) is announced separately via toast/UI. */
      _winResult=genNoWinResult();
    }
    spinData=_winResult;
  }

  animateReels(spinData,function(){
    if(BG._coverAll1to40){BG._coverAll1to40=false;_handleCoverAll();}
    if(BG._coverAllPending){BG._coverAllPending=false;S.bal+=1;updUI();toast('Cover All 75 \u2014 $0.01');}
    if(winPatterns.length===0){
      _writeGameHistory({type:'SPIN',bet:totalBet/100,win:0,
        balBefore:_balBefore,balAfter:S.bal/100,patterns:[],balls:0}); /* v1.0.7 */
      setWin(0,'NO BINGO');
      _spinDebounce=Date.now();_clearSpinWatchdog();S.spinning=false;_applyPendingSeq();setCtrl(true);updUI();return;
    }
    /* betLvl = bet MULTIPLIER 1..20 (total credits / 9 lines). Award:wager ratio
     is unchanged by the getTotalBet fix, so RTP stays 96.26%. */
  var betLvl=getBetPerLine()/9;var denomMult=getDenomMult();
    var _reelPats2=[];var _progPat=null;
    for(var _pi=0;_pi<winPatterns.length;_pi++){
      if(winPatterns[_pi].jp||(winPatterns[_pi].pay===0&&winPatterns[_pi].reel==='lazy_t_0cr')){
        /* Rule 10: pay-0 Lazy-T is the progressive trigger — never an award pattern */
        _progPat=winPatterns[_pi];
      }
      else if(winPatterns[_pi].reel&&winPatterns[_pi].pay>0){_reelPats2.push(winPatterns[_pi]);}
    }
    /* Sort lowest to highest pay — lowest fires first, highest last */
    _reelPats2.sort(function(a,b){return (a.pay||0)-(b.pay||0);});
    /* Exactly ONE reel-eligible win -> show directly via the main spin
       display, no Red Spin. TWO OR MORE -> the triggering spin (already
       shown) displays the LOWEST pattern; Red Spin then steps through
       the REMAINING patterns from 2nd-lowest to highest — the lowest
       is NOT repeated in Red Spin since it was the triggering spin. */
    /* v1.0 FIX: basePat2 is ALWAYS the lowest pattern (was null for 2+ patterns,
       which skipped the base settlement entirely — lowest pay never credited and
       the trigger spin showed winning reels with a $0 win box). */
    var basePat2=_reelPats2.length>=1?_reelPats2[0]:null;
    /* rsPatterns starts at index 1: lowest already shown as trigger */
    var rsPatterns=_reelPats2.length>=2?_reelPats2.slice(1):[];
    var baseAmt=0;
    if(basePat2){
      setTimeout(function(){
        var grid=getVisibleGrid();
        var winLines=evalCosmetic(grid);
        var totalLineWins=0;
        var lineDetails=[];
        if(winLines.length>0){
          for(var _li=0;_li<winLines.length;_li++){
            var _pl=PAYLINES[winLines[_li]-1];
            var _L=[];
            for(var _lr=0;_lr<5;_lr++) _L.push(grid[_pl.rows[_lr]][_lr]);
            var _lp=calcLineBasePay(_L);
            if(_lp>0){
              totalLineWins+=_lp*betLvl*denomMult;
              lineDetails.push("L"+winLines[_li]+"="+_lp);
            }
          }
        }
        /* Fall back to pattern base pay if no paylines calculated */
        /* Bingo outcome is authoritative — always pay pat.pay, never totalLineWins */
        var awardAmt = basePat2.pay*betLvl*denomMult;
        baseAmt=awardAmt; /* v1.0: final RS total = base + bonus */
        S.bal+=awardAmt;S.lastWin=awardAmt;
        /* v1.1.11 FIX: credit the win to the balance BEFORE logging, so bal_after
           reflects the post-win balance. Previously the row was written first, so
           every winning spin logged bal_after = bal_before - bet (win omitted). */
        _writeGameHistory({type:'SPIN',bet:totalBet/100,win:awardAmt/100,
          balBefore:_balBefore,balAfter:S.bal/100,
          patterns:[basePat2.name],balls:basePat2.balls}); /* v1.0.7 */
        bellForWinCents(awardAmt);
        var lineStr=lineDetails.length>0?" ("+lineDetails.join(",")+")" : "";
        var _pnLabel=basePat2.name.toUpperCase()+' \u2014 '+basePat2.balls+' BALLS';
        setWin(awardAmt,_pnLabel+lineStr);
        var _pnEl2=document.getElementById('bingo-pattern-name');
        if(_pnEl2){
          _pnEl2.textContent=_pnLabel;
          _pnEl2.classList.remove('pn-flash');
          void _pnEl2.offsetWidth;
          _pnEl2.classList.add('pn-flash');
        }
        _winCycleTimer=animateCosmeticWins(_pnLabel, 2000);
        updUI();
      }, 100);
    }
    updUI();

    if(_progPat){
      toast('PROGRESSIVE JACKPOT! (Prototype \u2014 no claim in test)');
      startPatternCycle(winPatterns);
      _spinDebounce=Date.now();_clearSpinWatchdog();S.spinning=false;_applyPendingSeq();setCtrl(true);updUI();return;
    }

    if(rsPatterns.length>0){
      _acquireRsCardLock();
      /* Show triggering spin paylines immediately — all at once */
      bellRingTimes(1); /* v1.0: single ring announces Red Spin trigger */
      animateCosmeticWins((basePat2||winPatterns[0]).name+' — TRIGGERED RED SPIN',1500,true);
      startPatternCycle([basePat2||winPatterns[0]]);
      setTimeout(function(){
        clearAllSymGlows();
        stopPatternCycle();
        runRS(rsPatterns,function(bonusTotal){
          setWin(baseAmt+bonusTotal,'BINGO WIN + RED SPIN!');
          /* Ring for the RS bonus portion only — base award already rang at settlement */
          bellForWinCents(bonusTotal);
          document.getElementById('bt-box').classList.remove('on');
          startPatternCycle(winPatterns);
          _releaseRsCardLock();
          _spinDebounce=Date.now();updUI();_clearSpinWatchdog();S.spinning=false;_applyPendingSeq();setCtrl(true);
        },baseAmt);
      },600);return;
    }
    startPatternCycle(winPatterns);
    _spinDebounce=Date.now();_clearSpinWatchdog();S.spinning=false;_applyPendingSeq();setCtrl(true);updUI();
  });
}

/* ── SPLASH + INIT ── */
window.addEventListener('load',function(){
  var pct=0;
  var _sub=document.getElementById('splash-sub');
  if(_sub) _sub.textContent='5 REEL \u00b7 9 LINE \u00b7 BUILD '+BUILD_VERSION;
  console.log('[TSBMII] build '+BUILD_VERSION);
  var iv=setInterval(function(){pct+=2;if(pct>=100){pct=100;clearInterval(iv);}document.getElementById('splash-bar-fill').style.width=pct+'%';},30);

  /* v1.1.12: splash welcome sound (from the sister games). Browsers often block
     audio before the first user gesture, so we try immediately AND arm a one-time
     play on the first tap/keypress in case the autoplay attempt was blocked. */
  (function(){
    var w=document.getElementById('snd-welcome');
    if(!w) return;
    var played=false;
    function playWelcome(){
      if(played) return;
      try{ w.currentTime=0; var p=w.play(); if(p&&p.then){ p.then(function(){played=true;}).catch(function(){}); } }
      catch(e){}
    }
    playWelcome();
    var arm=function(){ if(!played){ playWelcome(); } document.removeEventListener('touchstart',arm); document.removeEventListener('click',arm); document.removeEventListener('keydown',arm); };
    document.addEventListener('touchstart',arm,{once:true});
    document.addEventListener('click',arm,{once:true});
    document.addEventListener('keydown',arm,{once:true});
  }());


  /* Load Supabase CDN */
  var script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload=function(){
    document.getElementById('splash-conn').textContent='Connecting to wide area\u2026';
    /* v1.1.1 FIX: bring the shared Progressive controller up FIRST. It creates the
       Supabase client and publishes window._floorSupabaseClient/_wabcSupabaseClient,
       which wabc.js REUSES. Before this fix _initProgressiveController() ran only
       AFTER WABC.init(), so WABC built a SECOND client and a SECOND subscription to
       the 'wabc-ballpos' channel. Duplicate subscriptions drop 'pos' broadcasts —
       the ball call would sit at 40 forever. progressive.js documents this ordering
       requirement explicitly. */
    _initProgressiveController();
        document.getElementById('splash-ball').textContent='Fetching ball call...';

    /* Wide area ball call comes from the DB server only — no local fallback */
    function _applySeq(seq, isLive){
      BG.callSeq=seq; BG.ballPos=40; BG.usingServerBalls=isLive;
      BG.seqExhausted=false; BG.awaitingNewSeq=false; BG._coverAll75Fired=false;
      updateBallCallBadge();
    }

    /* v1.1.3: local ball generation REMOVED. All WABC balls come from the DB
       server; if it cannot be reached the game waits and retries rather than
       inventing a sequence, so every player stays on the same call. */
    var _wabcRetryTimer=null;
    function _bindWabcListeners(){
      WABC.onChange(function(newPos){_onServerBallPos(newPos);});
      WABC.onNewCall(function(newSeq){
        if(!newSeq||newSeq.length!==75) return;
        if(_cardChangeBlocked()){_pendingNewSeq={seq:newSeq,issuedAt:null};BG.awaitingNewSeq=false;BG.seqExhausted=false;BG._coverAll75Fired=false;updateBallCallBadge();return;}
        _applySeq(newSeq, true);
        if(GS.state==='active'&&BG.card&&Object.keys(BG.cardNumSet).length>0){
          BG.matchedCells={12:true};
          for(var _nc=0;_nc<40;_nc++){var _ncball=BG.callSeq[_nc];if(BG.cardNumSet[_ncball]!==undefined) BG.matchedCells[BG.cardNumSet[_ncball]]=true;}
          if(!_celebCardLocked) renderBingoCard(BG.card,BG.matchedCells,null);
          renderBallStrip(BG.callSeq,40,BG.cardNumSet);
        } else if(GS.state!=='active'){clearBallStrip();}
      });
    }
    function _waitForServerBallCall(){
      BG.usingServerBalls=false;
      var el=document.getElementById('ball-call-badge');
      if(el){el.textContent='\u25cf WAITING';el.style.color='#ffaa00';}
      var sb=document.getElementById('splash-ball');
      if(sb) sb.textContent='Waiting for wide area ball call\u2026';
      if(_wabcRetryTimer) return;
      _wabcRetryTimer=setInterval(function(){
        WABC.init(function(){
          var s=WABC.getSequence();
          if(s&&s.length===75){
            clearInterval(_wabcRetryTimer);_wabcRetryTimer=null;
            _applySeq(s,true);
            _bindWabcListeners();
            updateBallCallBadge();
            console.log('[WABC] wide area ball call acquired');
          }
        });
      },5000);
    }

    /* Wait briefly for the shared client, then start WABC so it reuses it. */
    (function _waitShared(waited){
      if(window._wabcSupabaseClient||waited>=1500){
        document.getElementById('splash-conn').textContent =
          window._floorSupabaseClient ? '\u2714 Connected' : '\u26a0 Could not connect';
        _startWabc();
        return;
      }
      setTimeout(function(){_waitShared(waited+50);},50);
    })(0);

    /* Try live WABC with a 4s timeout */
    function _startWabc(){
    var _wabcTimeout=setTimeout(function(){
      console.warn('[SP5D] WABC timeout - waiting for server ball call');
      _waitForServerBallCall();
      _initProgressiveController();
      _finishInit();
    },4000);

    WABC.init(function(){
      var _seq=WABC.getSequence();
      if(_seq&&_seq.length===75){
        clearTimeout(_wabcTimeout);
        _applySeq(_seq, true);
        document.getElementById('splash-ball').textContent='Ball call ready (LIVE)';
        _bindWabcListeners();
        _initProgressiveController();
        _finishInit();
      } else {
        clearTimeout(_wabcTimeout);
        console.warn('[SP5D] WABC returned no sequence - waiting for server');
        _waitForServerBallCall();
        _initProgressiveController();
        _finishInit();
      }
    });
    } /* end _startWabc */

    function _finishInit(){
      buildPaylineOverlays();positionPaylineOverlays();
      /* Build bingo col headers */
      var hdrs=document.getElementById('bingo-col-hdrs');
      hdrs.innerHTML='';
      var cols=['B','I','N','G','O'];
      for(var c=0;c<5;c++){var d=document.createElement('div');d.className='bcol-hdr';d.textContent=cols[c];hdrs.appendChild(d);}
      hdrs.style.display='none';
      buildBingoCardNodes();buildBallStrip();clearBallStrip();
      sizeLayout();
      renderReels(CURRENT_SYMS,CURRENT_GHOSTS);
      startPatternShowcase();
      setTimeout(function(){
        var sp=document.getElementById('splash');
        sp.style.opacity='0';sp.style.transition='opacity 0.6s';
        setTimeout(function(){sp.style.display='none';sizeLayout();},650);
      },3000);
    }
  };
  script.onerror=function(){
    document.getElementById('splash-conn').textContent='\u26a0 Network error';
  };
  document.head.appendChild(script);
});


/* ── VIEWPORT FIT (v1.0.2) ──
   Mobile browsers report 100vh as the height INCLUDING the collapsible URL bar,
   so the bottom control bar fell below the fold and the flexible reel area
   inflated to fill the phantom space. We measure the true visible height
   (visualViewport when available) and publish it as --app-h. */
function _applyAppHeight(){
  var h=(window.visualViewport&&window.visualViewport.height)?window.visualViewport.height:window.innerHeight;
  if(!h) return;
  document.documentElement.style.setProperty('--app-h',Math.round(h)+'px');
}
_applyAppHeight();
window.addEventListener('resize',function(){_applyAppHeight();});
window.addEventListener('orientationchange',function(){setTimeout(_applyAppHeight,60);});
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',function(){_applyAppHeight();sizeLayout();});
  window.visualViewport.addEventListener('scroll',function(){_applyAppHeight();});
}
/* v1.4.1: desktop window resizes changed the reel window height without
   recomputing slot heights, leaving symbols sized for the old height. */
window.addEventListener('resize',function(){sizeLayout();
  clearTimeout(window._reelResizeT);
  window._reelResizeT=setTimeout(function(){
    if(typeof initReelSlots==='function') initReelSlots();
  },120);
});
window.addEventListener('orientationchange',function(){setTimeout(function(){sizeLayout();},250);});

/* Wire spin key */
document.addEventListener('keydown',function(e){if(e.code==='Space'||e.code==='Enter'){e.preventDefault();doSpin();}});

document.getElementById('lobby-btn') && document.getElementById('lobby-btn').addEventListener('click',function(){
  window.location.href='https://theturrellesisters.github.io/turrelle_gold_coins_casino/';
});
updUI();
if(typeof WalletUI!=="undefined")WalletUI.init();

document.addEventListener('touchstart',function _bu(){_bellUnlock();document.removeEventListener('touchstart',_bu);},false);
document.addEventListener('click',function _bc(){_bellUnlock();document.removeEventListener('click',_bc);},false);

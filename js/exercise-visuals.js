// ═══════════════════════════════════════════════════════════════════
// Awakened — Exercise Visuals v3 — 436 exercices couverts
// ═══════════════════════════════════════════════════════════════════
(function() {
'use strict';

var P = {
  bg:'#080c14', bg2:'#0d1220',
  skin:'#d4956a', skind:'#b07040', skinh:'#e8b090', hair:'#1a0e06',
  shirt:'#1e3a5f', shirtd:'#122540', pants:'#1a2a1a', pantsd:'#0f1a0f', shoe:'#111820',
  act:'#22c55e', actd:'#15803d', hi:'#4ade80',
  warn:'#f59e0b', chest:'#ef4444', back:'#3b82f6',
  legs:'#a855f7', arms:'#f59e0b', core:'#22c55e',
  shoulder:'#06b6d4', glute:'#ec4899', cardio:'#f97316',
  calf:'#8b5cf6', trap:'#14b8a6'
};

function uid() { return 'ev' + Math.random().toString(36).slice(2,8); }

function wrap(id, body, w, h) {
  w=w||280; h=h||280;
  return '<svg viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;border-radius:16px;overflow:hidden;">'
    +'<defs><radialGradient id="'+id+'bg" cx="50%" cy="55%" r="65%">'
    +'<stop offset="0%" stop-color="'+P.bg2+'"/><stop offset="100%" stop-color="'+P.bg+'"/>'
    +'</radialGradient></defs>'
    +'<rect width="'+w+'" height="'+h+'" fill="url(#'+id+'bg)" rx="16"/>'
    +'<line x1="0" y1="93" x2="'+w+'" y2="93" stroke="#22c55e" stroke-width="0.5" opacity="0.12"/>'
    +'<line x1="0" y1="186" x2="'+w+'" y2="186" stroke="#22c55e" stroke-width="0.5" opacity="0.12"/>'
    +'<line x1="93" y1="0" x2="93" y2="'+h+'" stroke="#22c55e" stroke-width="0.5" opacity="0.12"/>'
    +'<line x1="186" y1="0" x2="186" y2="'+h+'" stroke="#22c55e" stroke-width="0.5" opacity="0.12"/>'
    +body+'</svg>';
}

// ── PRIMITIVES ───────────────────────────────────────────────────────
function hd(cx,cy,r) {
  r=r||17;
  return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+(r*.85)+'" ry="'+r+'" fill="'+P.skin+'"/>'
    +'<ellipse cx="'+cx+'" cy="'+(cy-r*.32)+'" rx="'+(r*.82)+'" ry="'+(r*.58)+'" fill="'+P.hair+'" opacity="0.9"/>'
    +'<circle cx="'+(cx-r*.28)+'" cy="'+(cy+r*.1)+'" r="2.2" fill="'+P.hair+'" opacity="0.6"/>'
    +'<circle cx="'+(cx+r*.28)+'" cy="'+(cy+r*.1)+'" r="2.2" fill="'+P.hair+'" opacity="0.6"/>'
    +'<path d="M'+(cx-3)+' '+(cy+r*.44)+' Q'+cx+' '+(cy+r*.57)+' '+(cx+3)+' '+(cy+r*.44)+'" stroke="'+P.skind+'" stroke-width="1.5" fill="none"/>';
}

function seg(x1,y1,x2,y2,w,col) {
  var dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy)||1;
  w=w||9; col=col||P.skin;
  var nx=(-dy/len)*(w/2),ny=(dx/len)*(w/2);
  return '<polygon points="'+(x1+nx)+','+(y1+ny)+' '+(x2+nx)+','+(y2+ny)+' '+(x2-nx)+','+(y2-ny)+' '+(x1-nx)+','+(y1-ny)+'" fill="'+col+'"/>';
}

function floor(y, w, col) {
  w=w||280; col=col||P.act;
  return '<rect x="20" y="'+y+'" width="'+(w-40)+'" height="4" rx="2" fill="'+col+'" opacity="0.3"/>';
}

function lbl(t, s, c) {
  return '<text x="140" y="248" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="'+P.hi+'" text-anchor="middle">'+t+'</text>'
    +'<text x="140" y="262" font-family="system-ui,sans-serif" font-size="9" fill="'+(c||P.hi)+'" text-anchor="middle" opacity="0.8">'+s+'</text>';
}

function muscle_badge(x, y, col, label) {
  return '<rect x="'+(x-30)+'" y="'+(y-10)+'" width="60" height="20" rx="10" fill="'+col+'" opacity="0.18"/>'
    +'<text x="'+x+'" y="'+(y+5)+'" font-family="system-ui,sans-serif" font-size="8" font-weight="700" fill="'+col+'" text-anchor="middle">'+label+'</text>';
}

function arrow_up(x, y) {
  return '<line x1="'+x+'" y1="'+(y+20)+'" x2="'+x+'" y2="'+(y+4)+'" stroke="'+P.hi+'" stroke-width="2" stroke-dasharray="4,2" opacity="0.55"/>'
    +'<polygon points="'+(x-4)+','+(y+8)+' '+x+','+(y-1)+' '+(x+4)+','+(y+8)+'" fill="'+P.hi+'" opacity="0.55"/>';
}

function arrow_down(x, y) {
  return '<line x1="'+x+'" y1="'+(y-20)+'" x2="'+x+'" y2="'+(y-4)+'" stroke="'+P.warn+'" stroke-width="2" stroke-dasharray="4,2" opacity="0.5"/>'
    +'<polygon points="'+(x-4)+','+(y-8)+' '+x+','+(y+1)+' '+(x+4)+','+(y-8)+'" fill="'+P.warn+'" opacity="0.5"/>';
}

// Standing figure helper
function standing(opts) {
  opts=opts||{};
  var cx=opts.cx||140, gy=opts.gy||220;
  var b='';
  b+='<ellipse cx="'+(cx-10)+'" cy="'+(gy+2)+'" rx="14" ry="5" fill="'+P.shoe+'"/>';
  b+='<ellipse cx="'+(cx+10)+'" cy="'+(gy+2)+'" rx="14" ry="5" fill="'+P.shoe+'"/>';
  b+=seg(cx-10,gy,cx-12,gy-38,14,P.pants);
  b+=seg(cx+10,gy,cx+12,gy-38,14,P.pants);
  if(opts.torsoColor) {
    b+='<rect x="'+(cx-32)+'" y="'+(gy-112)+'" width="64" height="75" rx="10" fill="'+P.shirt+'"/>';
    b+='<rect x="'+(cx-29)+'" y="'+(gy-109)+'" width="58" height="30" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
    b+='<rect x="'+(cx-28)+'" y="'+(gy-109)+'" width="56" height="70" rx="8" fill="'+opts.torsoColor+'" opacity="'+(opts.intensity||0.28)+'"/>';
  } else {
    b+='<rect x="'+(cx-32)+'" y="'+(gy-112)+'" width="64" height="75" rx="10" fill="'+P.shirt+'"/>';
    b+='<rect x="'+(cx-29)+'" y="'+(gy-109)+'" width="58" height="30" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  }
  b+='<rect x="'+(cx-7)+'" y="'+(gy-122)+'" width="14" height="13" rx="4" fill="'+P.skin+'"/>';
  b+=hd(cx,gy-142,18);
  return b;
}

// ── ILLUSTRATIONS ────────────────────────────────────────────────────

function pushup(phase) {
  var id=uid(), up=(phase!=='end');
  var by=up?180:202, ay=up?158:178;
  var b=floor(215);
  b+='<ellipse cx="48" cy="217" rx="13" ry="5" fill="'+P.shoe+'"/>';
  b+=seg(44,215,128,by,14,P.pants);
  b+='<rect x="118" y="'+(by-10)+'" width="88" height="26" rx="8" fill="'+P.shirt+'"/>';
  b+='<rect x="120" y="'+(by-8)+'" width="84" height="14" rx="6" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="122" y="'+(by-7)+'" width="80" height="20" rx="5" fill="'+P.chest+'" opacity="'+(up?'0.22':'0.44')+'"/>';
  b+=seg(up?200:204,ay,up?216:218,215,11,P.skin);
  b+=seg(up?128:131,ay+5,up?112:108,215,11,P.skin);
  b+='<rect x="197" y="'+(by-18)+'" width="12" height="14" rx="4" fill="'+P.skin+'"/>';
  b+=hd(207,by-35,16);
  b+=up?arrow_up(80,by-45):arrow_down(80,by-25);
  b+=lbl(up?'POSITION HAUTE':'POSITION BASSE','PECTORAUX · TRICEPS · ÉPAULES',P.chest);
  return wrap(id,b);
}

function bench_press(phase) {
  var id=uid(), up=(phase==='end');
  var b='';
  b+='<rect x="85" y="195" width="110" height="14" rx="6" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+='<rect x="93" y="209" width="10" height="32" rx="3" fill="#111820"/>';
  b+='<rect x="177" y="209" width="10" height="32" rx="3" fill="#111820"/>';
  var bary=up?145:170;
  b+='<rect x="62" y="'+bary+'" width="156" height="9" rx="4" fill="'+P.pantsd+'"/>';
  b+='<circle cx="68" cy="'+(bary+4)+'" r="14" fill="#1a1a2e" stroke="'+P.chest+'" stroke-width="2"/><circle cx="68" cy="'+(bary+4)+'" r="8" fill="#111"/>';
  b+='<circle cx="212" cy="'+(bary+4)+'" r="14" fill="#1a1a2e" stroke="'+P.chest+'" stroke-width="2"/><circle cx="212" cy="'+(bary+4)+'" r="8" fill="#111"/>';
  b+=seg(108,196,up?78:72,bary+8,13,P.skin);
  b+=seg(172,196,up?202:208,bary+8,13,P.skin);
  b+='<rect x="105" y="170" width="70" height="28" rx="8" fill="'+P.shirt+'"/>';
  b+='<rect x="108" y="172" width="64" height="14" rx="6" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="108" y="172" width="64" height="26" rx="7" fill="'+P.chest+'" opacity="'+(up?'0.38':'0.18')+'"/>';
  if(up) { b+='<circle cx="108" cy="173" r="11" fill="'+P.shoulder+'" opacity="0.45"/>'; b+='<circle cx="172" cy="173" r="11" fill="'+P.shoulder+'" opacity="0.45"/>'; }
  b+='<rect x="133" y="158" width="14" height="13" rx="4" fill="'+P.skin+'"/>';
  b+=hd(140,140,17);
  b+=up?arrow_up(140,118):arrow_down(140,148);
  b+=lbl(up?'BRAS TENDUS':'BARRE EN BAS','PECTORAUX · ÉPAULES · TRICEPS',P.chest);
  return wrap(id,b);
}

function cable_fly(phase) {
  var id=uid(), closed=(phase==='end');
  var b='';
  b+='<rect x="16" y="60" width="14" height="180" rx="5" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5" opacity="0.8"/>';
  b+='<rect x="250" y="60" width="14" height="180" rx="5" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5" opacity="0.8"/>';
  b+='<circle cx="23" cy="145" r="7" fill="'+P.actd+'" opacity="0.7"/>';
  b+='<circle cx="257" cy="145" r="7" fill="'+P.actd+'" opacity="0.7"/>';
  var hx1=closed?108:68, hx2=closed?172:212;
  b+='<line x1="23" y1="145" x2="'+hx1+'" y2="168" stroke="'+P.actd+'" stroke-width="1.5" opacity="0.5" stroke-dasharray="4,2"/>';
  b+='<line x1="257" y1="145" x2="'+hx2+'" y2="168" stroke="'+P.actd+'" stroke-width="1.5" opacity="0.5" stroke-dasharray="4,2"/>';
  b+=seg(hx1,168,124,175,11,P.skin);
  b+=seg(hx2,168,156,175,11,P.skin);
  b+='<rect x="112" y="128" width="56" height="68" rx="10" fill="'+P.shirt+'"/>';
  b+='<rect x="115" y="130" width="50" height="26" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="114" y="130" width="52" height="64" rx="8" fill="'+P.chest+'" opacity="'+(closed?'0.42':'0.18')+'"/>';
  b+='<ellipse cx="'+hx1+'" cy="168" rx="8" ry="8" fill="'+P.skind+'"/>';
  b+='<ellipse cx="'+hx2+'" cy="168" rx="8" ry="8" fill="'+P.skind+'"/>';
  b+='<rect x="133" y="118" width="14" height="13" rx="4" fill="'+P.skin+'"/>';
  b+=hd(140,100,18);
  b+=lbl(closed?'FERMETURE':'OUVERTURE','PECTORAUX · GRAND PECTORAL',P.chest);
  return wrap(id,b);
}

function dip(phase) {
  var id=uid(), dn=(phase==='end');
  var hy=dn?135:108;
  var b='';
  b+='<rect x="70" y="'+(hy-25)+'" width="12" height="115" rx="5" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+='<rect x="198" y="'+(hy-25)+'" width="12" height="115" rx="5" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+='<rect x="55" y="'+(hy-30)+'" width="42" height="10" rx="4" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+='<rect x="183" y="'+(hy-30)+'" width="42" height="10" rx="4" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+='<circle cx="76" cy="'+(hy-25)+'" r="8" fill="'+P.skind+'"/>';
  b+='<circle cx="204" cy="'+(hy-25)+'" r="8" fill="'+P.skind+'"/>';
  b+=seg(76,hy-25,95,dn?hy+22:hy-5,13,P.skin);
  b+=seg(204,hy-25,185,dn?hy+22:hy-5,13,P.skin);
  if(dn){ b+='<ellipse cx="88" cy="'+(hy+8)+'" rx="9" ry="17" fill="'+P.arms+'" opacity="0.45" transform="rotate(20,88,'+(hy+8)+')"/>'; b+='<ellipse cx="192" cy="'+(hy+8)+'" rx="9" ry="17" fill="'+P.arms+'" opacity="0.45" transform="rotate(-20,192,'+(hy+8)+')"/>'; }
  b+='<rect x="100" y="'+(hy-10)+'" width="80" height="72" rx="10" fill="'+P.shirt+'"/>';
  b+='<rect x="103" y="'+(hy-8)+'" width="74" height="28" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="103" y="'+(hy-8)+'" width="74" height="58" rx="8" fill="'+P.chest+'" opacity="'+(dn?'0.3':'0.14')+'"/>';
  b+=seg(120,hy+62,112,hy+105,15,P.pants);
  b+=seg(160,hy+62,168,hy+105,15,P.pants);
  b+=seg(112,hy+105,108,hy+128,13,P.pantsd);
  b+=seg(168,hy+105,172,hy+128,13,P.pantsd);
  b+='<rect x="133" y="'+(hy-22)+'" width="14" height="13" rx="4" fill="'+P.skin+'"/>';
  b+=hd(140,hy-42,17);
  b+=lbl(dn?'POSITION BASSE':'BRAS TENDUS','PECTORAUX · TRICEPS · ÉPAULES',P.chest);
  return wrap(id,b);
}

function pullup(phase) {
  var id=uid(), up=(phase==='end');
  var hy=up?78:128;
  var b='';
  b+='<rect x="60" y="44" width="160" height="10" rx="5" fill="#1a2535" stroke="'+P.actd+'" stroke-width="2"/>';
  b+='<rect x="55" y="30" width="16" height="25" rx="3" fill="#111820" stroke="'+P.actd+'" stroke-width="1"/>';
  b+='<rect x="209" y="30" width="16" height="25" rx="3" fill="#111820" stroke="'+P.actd+'" stroke-width="1"/>';
  b+='<circle cx="105" cy="50" r="8" fill="'+P.skind+'"/><circle cx="175" cy="50" r="8" fill="'+P.skind+'"/>';
  b+=seg(105,50,108,hy+14,13,P.skin);
  b+=seg(175,50,172,hy+14,13,P.skin);
  if(up){ b+='<path d="M 95 56 Q 78 '+(hy)+' 88 '+(hy+38)+' L 108 '+(hy+14)+' Z" fill="'+P.back+'" opacity="0.28"/>'; b+='<path d="M 185 56 Q 202 '+(hy)+' 192 '+(hy+38)+' L 172 '+(hy+14)+' Z" fill="'+P.back+'" opacity="0.28"/>'; }
  b+='<rect x="107" y="'+(hy+11)+'" width="66" height="70" rx="10" fill="'+P.shirt+'"/>';
  b+='<rect x="110" y="'+(hy+13)+'" width="60" height="26" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="110" y="'+(hy+13)+'" width="60" height="65" rx="8" fill="'+P.back+'" opacity="'+(up?'0.38':'0.14')+'"/>';
  b+=seg(118,hy+80,112,hy+128,15,P.pants);
  b+=seg(162,hy+80,168,hy+128,15,P.pants);
  b+=seg(112,hy+128,108,hy+155,14,P.pantsd);
  b+=seg(168,hy+128,172,hy+155,14,P.pantsd);
  b+='<ellipse cx="108" cy="'+(hy+160)+'" rx="12" ry="5" fill="'+P.shoe+'"/>';
  b+='<ellipse cx="172" cy="'+(hy+160)+'" rx="12" ry="5" fill="'+P.shoe+'"/>';
  b+='<rect x="133" y="'+hy+'" width="14" height="12" rx="4" fill="'+P.skin+'"/>';
  b+=hd(140,up?hy-20:hy-18,18);
  if(up) b+='<line x1="70" y1="54" x2="210" y2="54" stroke="'+P.hi+'" stroke-width="1" stroke-dasharray="4,2" opacity="0.38"/>';
  b+=lbl(up?'POSITION HAUTE':'SUSPENDU','DOS · BICEPS · GRAND DORSAL',P.back);
  return wrap(id,b);
}

function lat_pulldown(phase) {
  var id=uid(), dn=(phase==='end');
  var b='';
  b+='<rect x="95" y="42" width="90" height="8" rx="3" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+='<rect x="88" y="48" width="104" height="6" rx="3" fill="'+P.pantsd+'"/>';
  b+='<circle cx="92" cy="51" r="7" fill="'+P.skind+'"/><circle cx="188" cy="51" r="7" fill="'+P.skind+'"/>';
  b+='<rect x="108" y="208" width="64" height="14" rx="5" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1"/>';
  b+='<rect x="100" y="222" width="80" height="8" rx="3" fill="#111820"/>';
  var ary=dn?138:108;
  b+=seg(92,51,108,ary,12,P.skin);
  b+=seg(188,51,172,ary,12,P.skin);
  b+='<rect x="105" y="'+(ary-10)+'" width="70" height="80" rx="10" fill="'+P.shirt+'"/>';
  b+='<rect x="108" y="'+(ary-8)+'" width="64" height="28" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="108" y="'+(ary-8)+'" width="64" height="75" rx="8" fill="'+P.back+'" opacity="'+(dn?'0.38':'0.16')+'"/>';
  if(dn){ b+='<ellipse cx="108" cy="'+(ary)+'" rx="13" ry="11" fill="'+P.shoulder+'" opacity="0.45"/>'; b+='<ellipse cx="172" cy="'+(ary)+'" rx="13" ry="11" fill="'+P.shoulder+'" opacity="0.45"/>'; }
  b+=seg(112,ary+65,100,210,14,P.pants);
  b+=seg(168,ary+65,180,210,14,P.pants);
  b+='<ellipse cx="98" cy="212" rx="14" ry="5" fill="'+P.shoe+'"/>';
  b+='<ellipse cx="182" cy="212" rx="14" ry="5" fill="'+P.shoe+'"/>';
  b+='<rect x="133" y="'+(ary-22)+'" width="14" height="13" rx="4" fill="'+P.skin+'"/>';
  b+=hd(140,ary-40,17);
  b+=dn?arrow_down(140,32):arrow_up(140,32);
  b+=lbl(dn?'BARRE EN BAS':'BRAS TENDUS','DOS · DORSAUX · BICEPS',P.back);
  return wrap(id,b);
}

function row_machine(phase) {
  var id=uid(), pull=(phase==='end');
  var hx=pull?155:185;
  var b='';
  b+='<rect x="62" y="195" width="155" height="14" rx="5" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+='<rect x="70" y="209" width="10" height="30" rx="3" fill="#111820"/>';
  b+='<rect x="200" y="209" width="10" height="30" rx="3" fill="#111820"/>';
  b+='<rect x="50" y="195" width="16" height="8" rx="3" fill="'+P.pantsd+'" opacity="0.8"/>';
  b+='<circle cx="58" cy="199" r="8" fill="'+P.skind+'"/>';
  b+=seg(98,182,hx,pull?162:196,12,P.skin);
  b+=seg(hx,pull?162:196,55,200,11,P.skind);
  b+='<rect x="96" y="170" width="110" height="28" rx="8" fill="'+P.shirt+'"/>';
  b+='<rect x="99" y="172" width="104" height="14" rx="6" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="99" y="172" width="104" height="26" rx="7" fill="'+P.back+'" opacity="'+(pull?'0.4':'0.16')+'"/>';
  b+=seg(190,195,200,232,12,P.skin);
  b+=seg(185,232,192,242,14,P.pants);
  b+='<rect x="193" y="158" width="12" height="13" rx="4" fill="'+P.skin+'"/>';
  b+=hd(202,141,17);
  b+=lbl(pull?'TIRADE':'EXTENSION','DOS · BICEPS · RHOMBOÏDES',P.back);
  return wrap(id,b,280,280);
}

function deadlift(phase) {
  var id=uid(), up=(phase!=='end');
  var hy=up?118:162;
  var b=floor(232);
  b+='<rect x="42" y="227" width="196" height="8" rx="4" fill="'+P.pantsd+'" opacity="0.9"/>';
  b+='<circle cx="52" cy="231" r="17" fill="#1a1a2e" stroke="'+P.act+'" stroke-width="2"/><circle cx="52" cy="231" r="11" fill="#111"/>';
  b+='<circle cx="228" cy="231" r="17" fill="#1a1a2e" stroke="'+P.act+'" stroke-width="2"/><circle cx="228" cy="231" r="11" fill="#111"/>';
  b+=seg(118,232,116,hy+62,16,P.pants);
  b+=seg(162,232,164,hy+62,16,P.pants);
  b+=seg(119,232,117,hy+62,11,up?P.back:P.legs);
  b+=seg(161,232,163,hy+62,11,up?P.back:P.legs);
  b+='<rect x="105" y="'+(hy+8)+'" width="70" height="58" rx="10" fill="'+P.shirt+'"/>';
  b+='<rect x="108" y="'+(hy+10)+'" width="64" height="26" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="108" y="'+(hy+10)+'" width="64" height="52" rx="8" fill="'+P.back+'" opacity="'+(up?'0.28':'0.18')+'"/>';
  b+=seg(112,hy+58,78,232,12,P.skin);
  b+=seg(168,hy+58,202,232,12,P.skin);
  b+='<rect x="133" y="'+hy+'" width="14" height="12" rx="4" fill="'+P.skin+'"/>';
  b+=hd(140,up?hy-20:hy-22,18);
  b+=up?arrow_up(185,hy-35):arrow_down(185,hy-15);
  b+=lbl(up?'POSITION HAUTE':'BAS DU MOUVEMENT','DOS · JAMBES · FESSIERS · CORE',P.back);
  return wrap(id,b);
}

function squat(phase) {
  var id=uid(), dn=(phase==='end');
  var hy=dn?160:115, ky=dn?200:172;
  var b=floor(222);
  b+='<ellipse cx="98" cy="224" rx="18" ry="6" fill="'+P.shoe+'"/>';
  b+='<ellipse cx="182" cy="224" rx="18" ry="6" fill="'+P.shoe+'"/>';
  b+=seg(96,222,100,ky,13,P.pants);
  b+=seg(184,222,180,ky,13,P.pants);
  b+=seg(100,ky,112,hy,17,P.pants);
  b+=seg(180,ky,168,hy,17,P.pants);
  b+=seg(102,ky,113,hy,12,P.legs);
  b+=seg(178,ky,167,hy,12,P.legs);
  if(dn) b+='<ellipse cx="140" cy="'+(hy+8)+'" rx="38" ry="14" fill="'+P.glute+'" opacity="0.28"/>';
  b+='<rect x="111" y="'+(hy-10)+'" width="58" height="72" rx="10" fill="'+P.shirt+'"/>';
  b+='<rect x="114" y="'+(hy-8)+'" width="52" height="28" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="115" y="'+(hy-7)+'" width="50" height="55" rx="8" fill="'+P.core+'" opacity="'+(dn?'0.28':'0.14')+'"/>';
  b+=seg(114,hy-2,90,hy+14,11,P.skin);
  b+=seg(166,hy-2,190,hy+14,11,P.skin);
  b+='<rect x="133" y="'+(hy-22)+'" width="14" height="13" rx="4" fill="'+P.skin+'"/>';
  b+=hd(140,hy-42,18);
  b+=dn?arrow_up(215,hy-25):arrow_down(215,hy+5);
  b+=lbl(dn?'BAS DU SQUAT':'DEBOUT','QUADRICEPS · FESSIERS · CORE',P.legs);
  return wrap(id,b);
}

function leg_press(phase) {
  var id=uid(), up=(phase==='end');
  var b='';
  b+='<rect x="18" y="215" width="245" height="14" rx="6" fill="#1a2535" stroke="'+P.actd+'" stroke-width="2"/>';
  b+='<rect x="18" y="229" width="10" height="40" rx="3" fill="#111820"/>';
  b+='<rect x="253" y="185" width="10" height="84" rx="3" fill="#111820"/>';
  var ky=up?145:190, hy=up?185:215;
  b+='<rect x="228" y="'+(ky-12)+'" width="30" height="'+(hy-ky+20)+'" rx="8" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+=seg(90,215,up?195:235,ky,17,P.pants);
  b+=seg(170,215,up?200:240,ky,17,P.pants);
  b+=seg(91,215,up?194:234,ky,12,P.legs);
  b+=seg(169,215,up?199:239,ky,12,P.legs);
  b+='<rect x="75" y="190" width="100" height="30" rx="8" fill="'+P.shirt+'"/>';
  b+='<rect x="78" y="192" width="94" height="15" rx="6" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="78" y="192" width="94" height="28" rx="7" fill="'+P.legs+'" opacity="'+(up?'0.3':'0.15')+'"/>';
  b+='<rect x="100" y="168" width="60" height="24" rx="8" fill="'+P.shirt+'"/>';
  b+=hd(130,150,17);
  b+=lbl(up?'JAMBES TENDUES':'JAMBES FLÉCHIES','QUADRICEPS · FESSIERS',P.legs);
  return wrap(id,b);
}

function lunge(phase) {
  var id=uid(), dn=(phase==='end');
  var fy=dn?210:195;
  var b=floor(252);
  b+='<ellipse cx="82" cy="254" rx="14" ry="5" fill="'+P.shoe+'"/>';
  b+='<ellipse cx="188" cy="254" rx="16" ry="6" fill="'+P.shoe+'"/>';
  b+=seg(82,252,93,dn?215:208,14,P.pants);
  b+=seg(93,dn?215:208,115,162,16,P.pants);
  b+=seg(188,252,184,fy,15,P.pants);
  b+=seg(184,fy,162,162,16,P.pants);
  if(dn) b+=seg(185,252,183,fy,11,P.legs);
  b+='<rect x="122" y="88" width="64" height="76" rx="10" fill="'+P.shirt+'"/>';
  b+='<rect x="125" y="91" width="58" height="28" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+=seg(124,112,104,152,11,P.skin);
  b+=seg(184,112,202,152,11,P.skin);
  b+='<rect x="145" y="78" width="13" height="12" rx="4" fill="'+P.skin+'"/>';
  b+=hd(152,60,17);
  if(dn) b+='<line x1="184" y1="'+fy+'" x2="184" y2="252" stroke="'+P.warn+'" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.5"/>';
  b+=lbl(dn?'FENTE BASSE':'DEBOUT','QUADRICEPS · FESSIERS · MOLLETS',P.legs);
  return wrap(id,b,280,280);
}

function hip_thrust(phase) {
  var id=uid(), up=(phase==='end');
  var b=floor(238);
  if(up){ b+='<rect x="70" y="153" width="160" height="8" rx="4" fill="'+P.pantsd+'"/>'; b+='<circle cx="75" cy="157" r="12" fill="#1a1a2e" stroke="'+P.glute+'" stroke-width="2"/>'; b+='<circle cx="225" cy="157" r="12" fill="#1a1a2e" stroke="'+P.glute+'" stroke-width="2"/>'; b+='<ellipse cx="140" cy="173" rx="42" ry="20" fill="'+P.glute+'" opacity="0.48"/>'; b+='<ellipse cx="140" cy="173" rx="30" ry="13" fill="'+P.glute+'" opacity="0.28"/>'; b+=seg(110,192,90,237,16,P.pants); b+=seg(170,192,190,237,16,P.pants); }
  else { b+='<ellipse cx="140" cy="218" rx="38" ry="18" fill="'+P.glute+'" opacity="0.28"/>'; b+=seg(112,224,90,237,16,P.pants); b+=seg(168,224,190,237,16,P.pants); }
  b+='<ellipse cx="86" cy="240" rx="16" ry="6" fill="'+P.shoe+'"/><ellipse cx="194" cy="240" rx="16" ry="6" fill="'+P.shoe+'"/>';
  b+='<rect x="65" y="162" width="150" height="18" rx="7" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+='<rect x="95" y="155" width="90" height="28" rx="8" fill="'+P.shirt+'"/>';
  b+='<rect x="98" y="157" width="84" height="14" rx="6" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+=seg(98,172,80,178,11,P.skin); b+=seg(182,172,200,178,11,P.skin);
  b+='<rect x="133" y="142" width="14" height="13" rx="4" fill="'+P.skin+'"/>';
  b+=hd(140,125,17);
  b+=up?arrow_up(55,155):arrow_down(55,180);
  b+=lbl(up?'HANCHES HAUTES':'POSITION BASSE','FESSIERS · ISCHIO-JAMBIERS',P.glute);
  return wrap(id,b);
}

function glute_bridge(phase) {
  var id=uid(), up=(phase==='end');
  var b=floor(232);
  b+=seg(90,230,86,200,16,P.pants); b+=seg(168,230,172,200,16,P.pants);
  b+='<ellipse cx="86" cy="232" rx="14" ry="5" fill="'+P.shoe+'"/><ellipse cx="172" cy="232" rx="14" ry="5" fill="'+P.shoe+'"/>';
  var hy=up?165:190;
  b+='<ellipse cx="140" cy="'+(hy+10)+'" rx="40" ry="'+(up?18:12)+'" fill="'+P.glute+'" opacity="'+(up?'0.5':'0.28')+'"/>';
  b+=seg(88,200,102,hy+20,15,P.pants); b+=seg(170,200,158,hy+20,15,P.pants);
  b+='<rect x="105" y="'+(hy-15)+'" width="70" height="30" rx="8" fill="'+P.shirt+'"/>';
  b+='<rect x="108" y="'+(hy-13)+'" width="64" height="14" rx="6" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+=seg(107,hy+5,85,hy+15,10,P.skin); b+=seg(173,hy+5,195,hy+15,10,P.skin);
  b+=hd(140,hy-35,17);
  b+=lbl(up?'HANCHES HAUTES':'DÉPART','FESSIERS · ISCHIO-JAMBIERS',P.glute);
  return wrap(id,b);
}

function leg_curl(phase) {
  var id=uid(), up=(phase==='end');
  var b='';
  b+='<rect x="40" y="190" width="200" height="14" rx="6" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+='<rect x="45" y="204" width="12" height="35" rx="3" fill="#111820"/>';
  b+='<rect x="222" y="204" width="12" height="35" rx="3" fill="#111820"/>';
  b+='<rect x="200" y="175" width="38" height="18" rx="6" fill="'+P.pantsd+'" opacity="0.7"/>';
  var ky=up?140:190;
  b+=seg(112,190,up?130:125,ky,15,P.pants);
  b+=seg(168,190,up?150:155,ky,15,P.pants);
  b+=seg(113,190,up?131:126,ky,11,P.legs);
  b+=seg(167,190,up?149:154,ky,11,P.legs);
  if(up){ b+='<ellipse cx="140" cy="'+(ky+5)+'" rx="20" ry="10" fill="'+P.legs+'" opacity="0.35"/>'; }
  b+='<rect x="102" y="170" width="76" height="22" rx="7" fill="'+P.shirt+'"/>';
  b+='<rect x="105" y="172" width="70" height="12" rx="5" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+=hd(140,152,17);
  b+=lbl(up?'CONTRACTION':'EXTENSION','ISCHIO-JAMBIERS · MOLLETS',P.legs);
  return wrap(id,b,280,260);
}

function leg_extension(phase) {
  var id=uid(), up=(phase==='end');
  var b='';
  b+='<rect x="40" y="190" width="200" height="14" rx="6" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+='<rect x="45" y="204" width="12" height="35" rx="3" fill="#111820"/>';
  b+='<rect x="222" y="204" width="12" height="35" rx="3" fill="#111820"/>';
  b+='<rect x="42" y="175" width="38" height="18" rx="6" fill="'+P.pantsd+'" opacity="0.7"/>';
  var ky=up?232:190;
  b+=seg(112,190,up?118:115,ky,15,P.pants);
  b+=seg(168,190,up?162:165,ky,15,P.pants);
  b+=seg(113,190,up?119:116,ky,11,P.legs);
  b+=seg(167,190,up?161:164,ky,11,P.legs);
  if(up){ b+='<ellipse cx="140" cy="'+(ky-12)+'" rx="22" ry="12" fill="'+P.legs+'" opacity="0.42"/>'; b+='<ellipse cx="115" cy="'+ky+'" rx="12" ry="6" fill="'+P.shoe+'"/>'; b+='<ellipse cx="165" cy="'+ky+'" rx="12" ry="6" fill="'+P.shoe+'"/>'; }
  b+='<rect x="102" y="170" width="76" height="22" rx="7" fill="'+P.shirt+'"/>';
  b+='<rect x="105" y="172" width="70" height="12" rx="5" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+=hd(140,152,17);
  b+=lbl(up?'JAMBES TENDUES':'POSITION FLÉCHIE','QUADRICEPS',P.legs);
  return wrap(id,b,280,260);
}

function calf_raise(phase) {
  var id=uid(), up=(phase==='end');
  var b=floor(238);
  b+='<ellipse cx="118" cy="'+(up?226:234)+'" rx="16" ry="'+(up?8:5)+'" fill="'+P.shoe+'"/>';
  b+='<ellipse cx="162" cy="'+(up?226:234)+'" rx="16" ry="'+(up?8:5)+'" fill="'+P.shoe+'"/>';
  b+=seg(116,up?224:232,114,210,15,P.pants);
  b+=seg(164,up?224:232,166,210,15,P.pants);
  b+=seg(114,210,118,180,15,P.pants);
  b+=seg(166,210,162,180,15,P.pants);
  b+='<ellipse cx="117" cy="'+(up?218:225)+'" rx="10" ry="'+(up?14:10)+'" fill="'+P.calf+'" opacity="'+(up?'0.55':'0.28')+'"/>';
  b+='<ellipse cx="163" cy="'+(up?218:225)+'" rx="10" ry="'+(up?14:10)+'" fill="'+P.calf+'" opacity="'+(up?'0.55':'0.28')+'"/>';
  b+='<rect x="110" y="108" width="60" height="74" rx="10" fill="'+P.shirt+'"/>';
  b+='<rect x="113" y="110" width="54" height="28" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+=seg(112,130,92,160,11,P.skin); b+=seg(168,130,188,160,11,P.skin);
  b+='<rect x="133" y="98" width="14" height="12" rx="4" fill="'+P.skin+'"/>';
  b+=hd(140,80,18);
  b+=up?arrow_up(200,208):arrow_down(200,228);
  b+=lbl(up?'SUR LA POINTE':'POSITION BASSE','MOLLETS · SOLÉAIRE',P.calf);
  return wrap(id,b);
}

function shoulder_press(phase) {
  var id=uid(), up=(phase==='end');
  var b='';
  b+='<rect x="108" y="210" width="64" height="14" rx="5" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1"/>';
  b+=seg(112,224,95,258,16,P.pants); b+=seg(168,224,185,258,16,P.pants);
  b+='<ellipse cx="90" cy="260" rx="15" ry="5" fill="'+P.shoe+'"/><ellipse cx="190" cy="260" rx="15" ry="5" fill="'+P.shoe+'"/>';
  b+='<rect x="105" y="128" width="70" height="84" rx="10" fill="'+P.shirt+'"/>';
  b+='<rect x="108" y="130" width="64" height="30" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  var bx=up?60:62, bx2=up?216:214, by=up?110:150;
  b+='<rect x="'+bx+'" y="'+by+'" width="'+(bx2-bx)+'" height="8" rx="4" fill="'+P.pantsd+'"/>';
  b+='<circle cx="'+bx+'" cy="'+(by+4)+'" r="12" fill="#1a1a2e" stroke="'+P.shoulder+'" stroke-width="2"/><circle cx="'+bx+'" cy="'+(by+4)+'" r="7" fill="#111"/>';
  b+='<circle cx="'+bx2+'" cy="'+(by+4)+'" r="12" fill="#1a1a2e" stroke="'+P.shoulder+'" stroke-width="2"/><circle cx="'+bx2+'" cy="'+(by+4)+'" r="7" fill="#111"/>';
  if(up){ b+=seg(108,155,73,118,13,P.skin); b+=seg(172,155,207,118,13,P.skin); b+='<circle cx="108" cy="150" r="13" fill="'+P.shoulder+'" opacity="0.48"/>'; b+='<circle cx="172" cy="150" r="13" fill="'+P.shoulder+'" opacity="0.48"/>'; b+=arrow_up(140,95); }
  else { b+=seg(108,155,76,154,13,P.skin); b+=seg(172,155,204,154,13,P.skin); }
  b+='<rect x="133" y="118" width="14" height="12" rx="4" fill="'+P.skin+'"/>';
  b+=hd(140,100,18);
  b+=lbl(up?'BRAS TENDUS':'POSITION BASSE','ÉPAULES · TRICEPS · TRAPÈZES',P.shoulder);
  return wrap(id,b,280,280);
}

function lateral_raise(phase) {
  var id=uid(), up=(phase==='end');
  var b=standing({torsoColor:P.shoulder, intensity:up?0.35:0.14});
  var ay=up?110:175;
  b+=seg(112,175,up?70:92,ay,11,P.skin);
  b+=seg(168,175,up?210:188,ay,11,P.skin);
  b+='<rect x="'+(up?54:86)+'" y="'+(ay-4)+'" width="18" height="7" rx="3" fill="'+P.pantsd+'"/>';
  b+='<circle cx="'+(up?56:88)+'" cy="'+(ay)+'" r="7" fill="#1a1a2e" stroke="'+P.shoulder+'" stroke-width="1.5"/>';
  b+='<rect x="'+(up?204:186)+'" y="'+(ay-4)+'" width="18" height="7" rx="3" fill="'+P.pantsd+'"/>';
  b+='<circle cx="'+(up?218:200)+'" cy="'+(ay)+'" r="7" fill="#1a1a2e" stroke="'+P.shoulder+'" stroke-width="1.5"/>';
  b+='<ellipse cx="112" cy="175" rx="13" ry="11" fill="'+P.shoulder+'" opacity="'+(up?0.55:0.2)+'"/>';
  b+='<ellipse cx="168" cy="175" rx="13" ry="11" fill="'+P.shoulder+'" opacity="'+(up?0.55:0.2)+'"/>';
  b+=lbl(up?'BRAS À L\'HORIZONTALE':'BRAS BAS','DELTOÏDES LATÉRAUX',P.shoulder);
  return wrap(id,b);
}

function front_raise(phase) {
  var id=uid(), up=(phase==='end');
  var ax=up?120:140, ay=up?95:175;
  var b=standing({torsoColor:P.shoulder, intensity:up?0.32:0.14});
  b+=seg(112,175,ax,ay,12,P.skin);
  b+='<rect x="'+(ax-9)+'" y="'+(ay-4)+'" width="18" height="7" rx="3" fill="'+P.pantsd+'"/>';
  b+='<circle cx="'+(ax-7)+'" cy="'+(ay)+'" r="7" fill="#1a1a2e" stroke="'+P.shoulder+'" stroke-width="1.5"/>';
  b+=seg(168,175,162,175,12,P.skin);
  b+='<rect x="155" y="171" width="18" height="7" rx="3" fill="'+P.pantsd+'"/>';
  if(up) b+='<ellipse cx="112" cy="175" rx="13" ry="11" fill="'+P.shoulder+'" opacity="0.52"/>';
  b+=up?arrow_up(115,70):arrow_down(115,165);
  b+=lbl(up?'BRAS LEVÉS':'REPOS','DELTOÏDES ANTÉRIEURS',P.shoulder);
  return wrap(id,b);
}

function shrug(phase) {
  var id=uid(), up=(phase==='end');
  var sy=up?155:170;
  var b=standing({});
  b+=seg(112,175,92,175,11,P.skin); b+=seg(168,175,188,175,11,P.skin);
  b+='<rect x="85" y="171" width="18" height="8" rx="3" fill="'+P.pantsd+'"/>'; b+='<circle cx="88" cy="175" r="9" fill="#1a1a2e" stroke="'+P.trap+'" stroke-width="1.5"/>';
  b+='<rect x="177" y="171" width="18" height="8" rx="3" fill="'+P.pantsd+'"/>'; b+='<circle cx="192" cy="175" r="9" fill="#1a1a2e" stroke="'+P.trap+'" stroke-width="1.5"/>';
  b+='<ellipse cx="140" cy="'+sy+'" rx="50" ry="'+(up?18:12)+'" fill="'+P.trap+'" opacity="'+(up?'0.45':'0.2')+'"/>';
  b+=lbl(up?'ÉPAULES EN HAUT':'POSITION BASSE','TRAPÈZES · ÉLÉVATEURS',P.trap);
  return wrap(id,b);
}

function curl(phase) {
  var id=uid(), up=(phase==='end');
  var b=standing({});
  if(up){ b+=seg(108,196,84,155,13,P.skin); b+=seg(172,196,196,155,13,P.skin); b+='<ellipse cx="93" cy="175" rx="9" ry="18" fill="'+P.arms+'" opacity="0.48" transform="rotate(-20,93,175)"/>'; b+='<ellipse cx="187" cy="175" rx="9" ry="18" fill="'+P.arms+'" opacity="0.48" transform="rotate(20,187,175)"/>'; b+='<rect x="68" y="142" width="38" height="8" rx="3" fill="'+P.pantsd+'"/>'; b+='<circle cx="71" cy="146" r="10" fill="#1a1a2e" stroke="'+P.arms+'" stroke-width="2"/>'; b+='<circle cx="103" cy="146" r="10" fill="#1a1a2e" stroke="'+P.arms+'" stroke-width="2"/>'; b+='<rect x="174" y="142" width="38" height="8" rx="3" fill="'+P.pantsd+'"/>'; b+='<circle cx="177" cy="146" r="10" fill="#1a1a2e" stroke="'+P.arms+'" stroke-width="2"/>'; b+='<circle cx="209" cy="146" r="10" fill="#1a1a2e" stroke="'+P.arms+'" stroke-width="2"/>'; }
  else { b+=seg(108,196,88,215,12,P.skin); b+=seg(172,196,192,215,12,P.skin); b+='<rect x="70" y="193" width="38" height="8" rx="3" fill="'+P.pantsd+'"/>'; b+='<circle cx="73" cy="197" r="10" fill="#1a1a2e" stroke="'+P.arms+'" stroke-width="2"/>'; b+='<circle cx="105" cy="197" r="10" fill="#1a1a2e" stroke="'+P.arms+'" stroke-width="2"/>'; b+='<rect x="172" y="193" width="38" height="8" rx="3" fill="'+P.pantsd+'"/>'; b+='<circle cx="175" cy="197" r="10" fill="#1a1a2e" stroke="'+P.arms+'" stroke-width="2"/>'; b+='<circle cx="207" cy="197" r="10" fill="#1a1a2e" stroke="'+P.arms+'" stroke-width="2"/>'; }
  b+='<rect x="133" y="118" width="14" height="12" rx="4" fill="'+P.skin+'"/>';
  b+=hd(140,100,18);
  b+=lbl(up?'CONTRACTION':'POSITION BASSE','BICEPS · AVANT-BRAS',P.arms);
  return wrap(id,b);
}

function tricep_pushdown(phase) {
  var id=uid(), dn=(phase==='end');
  var b='';
  b+='<rect x="126" y="38" width="28" height="8" rx="3" fill="'+P.pantsd+'"/>'; b+='<circle cx="140" cy="42" r="8" fill="'+P.actd+'" opacity="0.6"/>'; b+='<line x1="140" y1="50" x2="140" y2="'+(dn?182:150)+'" stroke="'+P.actd+'" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.45"/>';
  b+=standing({});
  var hx1=108, hx2=172, hy=160;
  b+=seg(hx1,175,dn?104:95,dn?182:145,12,P.skin);
  b+=seg(hx2,175,dn?176:185,dn?182:145,12,P.skin);
  b+='<circle cx="'+hx1+'" cy="175" r="8" fill="'+P.arms+'" opacity="'+(dn?'0.5':'0.2')+'/>'
  b+='<circle cx="'+hx2+'" cy="175" r="8" fill="'+P.arms+'" opacity="'+(dn?'0.5':'0.2')+'/>'
  b+=dn?arrow_down(180,172):arrow_up(180,142);
  b+=lbl(dn?'EXTENSION COMPLÈTE':'BRAS FLÉCHIS','TRICEPS · AVANT-BRAS',P.arms);
  return wrap(id,b);
}

function plank(phase) {
  var id=uid();
  var b=floor(192);
  b+='<ellipse cx="55" cy="194" rx="14" ry="5" fill="'+P.shoe+'"/>';
  b+=seg(48,192,122,176,14,P.pants);
  b+='<rect x="110" y="160" width="98" height="26" rx="8" fill="'+P.shirt+'"/>';
  b+='<rect x="112" y="162" width="94" height="14" rx="6" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="113" y="162" width="92" height="22" rx="6" fill="'+P.core+'" opacity="0.35"/>';
  b+=seg(110,175,88,192,12,P.skin); b+=seg(208,170,222,192,12,P.skin);
  b+='<circle cx="88" cy="192" r="7" fill="'+P.skind+'"/><circle cx="222" cy="192" r="7" fill="'+P.skind+'"/>';
  b+='<line x1="48" y1="174" x2="225" y2="170" stroke="'+P.hi+'" stroke-width="1" stroke-dasharray="5,3" opacity="0.38"/>';
  b+='<rect x="196" y="150" width="12" height="12" rx="4" fill="'+P.skin+'"/>'; b+=hd(204,134,16);
  b+='<circle cx="55" cy="122" r="22" fill="none" stroke="'+P.actd+'" stroke-width="2" opacity="0.5"/>';
  b+='<circle cx="55" cy="122" r="22" fill="none" stroke="'+P.hi+'" stroke-width="3" stroke-dasharray="'+(phase==='end'?'50,88':'88,50')+'" stroke-dashoffset="22" opacity="0.85"/>';
  b+='<text x="55" y="127" font-family="system-ui,sans-serif" font-size="9" font-weight="800" fill="'+P.hi+'" text-anchor="middle">HOLD</text>';
  b+=lbl('GAINAGE','ABDOMINAUX · OBLIQUES · CORE',P.core);
  return wrap(id,b);
}

function crunch(phase) {
  var id=uid(), up=(phase==='end');
  var b=floor(218);
  b+=seg(100,218,95,198,16,P.pants); b+=seg(180,218,185,198,16,P.pants);
  b+=seg(95,198,110,180,15,P.pants); b+=seg(185,198,170,180,15,P.pants);
  if(up){ b+='<rect x="100" y="138" width="80" height="48" rx="10" fill="'+P.shirt+'"/>'; b+='<rect x="103" y="140" width="74" height="22" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>'; b+='<rect x="104" y="140" width="72" height="44" rx="8" fill="'+P.core+'" opacity="0.48"/>'; b+=seg(100,155,82,137,11,P.skin); b+=seg(180,155,198,137,11,P.skin); b+='<rect x="133" y="127" width="14" height="13" rx="4" fill="'+P.skin+'"/>'; b+=hd(140,110,17); }
  else { b+='<rect x="95" y="168" width="90" height="52" rx="10" fill="'+P.shirt+'"/>'; b+='<rect x="98" y="170" width="84" height="22" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>'; b+='<rect x="100" y="170" width="80" height="46" rx="8" fill="'+P.core+'" opacity="0.2"/>'; b+=seg(95,182,78,165,11,P.skin); b+=seg(185,182,202,165,11,P.skin); b+='<rect x="133" y="145" width="14" height="12" rx="4" fill="'+P.skin+'"/>'; b+=hd(140,128,17); }
  b+=lbl(up?'CONTRACTION':'POSITION INITIALE','ABDOMINAUX · OBLIQUES',P.core);
  return wrap(id,b);
}

function ab_wheel(phase) {
  var id=uid(), up=(phase!=='end');
  var b=floor(222);
  var kx=up?130:80, bx=up?175:140;
  b+='<circle cx="140" cy="215" r="14" fill="#1a2535" stroke="'+P.actd+'" stroke-width="2"/>'; b+='<circle cx="140" cy="215" r="8" fill="#111820"/>'; b+='<rect x="128" y="211" width="24" height="8" rx="3" fill="'+P.pantsd+'"/>';
  b+=seg(115,216,kx,188,13,P.skin); b+=seg(165,216,up?150:160,188,13,P.skin);
  b+='<rect x="'+( bx-34)+'" y="'+(up?158:118)+'" width="68" height="'+(up?34:70)+'" rx="10" fill="'+P.shirt+'"/>';
  b+='<rect x="'+(bx-31)+'" y="'+(up?160:120)+'" width="62" height="18" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="'+(bx-30)+'" y="'+(up?160:120)+'" width="60" height="'+(up?28:64)+'" rx="7" fill="'+P.core+'" opacity="'+(up?'0.22':'0.42')+'"/>';
  b+='<rect x="'+(bx-7)+'" y="'+(up?148:108)+'" width="14" height="12" rx="4" fill="'+P.skin+'"/>';
  b+=hd(bx,up?130:90,17);
  b+=lbl(up?'DÉPART':'EXTENSION','ABDOMINAUX · CORE · ÉPAULES',P.core);
  return wrap(id,b);
}

function superman(phase) {
  var id=uid(), up=(phase==='end');
  var b='';
  b+='<rect x="30" y="'+(up?152:178)+'" width="220" height="8" rx="4" fill="#1a2535" stroke="'+P.actd+'" stroke-width="1" opacity="0.7"/>';
  b+=seg(108,up?152:178,88,up?148:175,14,P.pants); b+=seg(172,up?152:178,192,up?148:175,14,P.pants);
  b+='<rect x="105" y="'+(up?115:155)+'" width="70" height="'+(up?40:26)+'" rx="8" fill="'+P.shirt+'"/>';
  b+='<rect x="108" y="'+(up?117:157)+'" width="64" height="18" rx="6" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="108" y="'+(up?117:157)+'" width="64" height="'+(up?36:22)+'" rx="7" fill="'+P.back+'" opacity="'+(up?'0.45':'0.2')+'"/>';
  if(up){ b+=seg(108,130,72,110,12,P.skin); b+=seg(172,130,208,110,12,P.skin); }
  else { b+=seg(108,162,82,172,12,P.skin); b+=seg(172,162,198,172,12,P.skin); }
  b+='<rect x="133" y="'+(up?105:145)+'" width="14" height="12" rx="4" fill="'+P.skin+'"/>'; b+=hd(140,up?87:128,17);
  b+=up?arrow_up(200,88):arrow_down(200,140);
  b+=lbl(up?'ÉLÉVATION':'AU SOL','DOS · LOMBAIRES · FESSIERS',P.back);
  return wrap(id,b);
}

function run(phase) {
  var id=uid(), s=(phase!=='end');
  var b=floor(222);
  b+='<line x1="20" y1="202" x2="72" y2="202" stroke="'+P.cardio+'" stroke-width="2" opacity="0.2" stroke-dasharray="8,4"/>';
  b+='<line x1="20" y1="196" x2="58" y2="196" stroke="'+P.cardio+'" stroke-width="1.5" opacity="0.12" stroke-dasharray="6,5"/>';
  if(s){ b+=seg(158,222,142,190,15,P.pants); b+=seg(142,190,162,163,16,P.pants); b+=seg(122,222,137,192,14,P.pantsd); b+=seg(137,192,120,167,15,P.pants); b+=seg(159,222,143,190,11,P.cardio); b+=seg(123,222,138,192,11,P.cardio); b+='<rect x="124" y="98" width="60" height="68" rx="10" fill="'+P.shirt+'" transform="rotate(-8,154,132)"/>'; b+='<rect x="127" y="101" width="54" height="28" rx="8" fill="'+P.shirtd+'" opacity="0.4" transform="rotate(-8,154,115)"/>'; b+=seg(127,133,107,108,11,P.skin); b+=seg(181,133,200,113,11,P.skin); b+='<rect x="147" y="88" width="13" height="12" rx="4" fill="'+P.skin+'" transform="rotate(-8,153,94)"/>'; b+=hd(154,71,17); b+='<ellipse cx="160" cy="224" rx="16" ry="6" fill="'+P.shoe+'"/>'; b+='<ellipse cx="120" cy="224" rx="14" ry="6" fill="'+P.shoe+'"/>'; }
  else { b+=seg(165,222,148,188,15,P.pants); b+=seg(148,188,168,162,16,P.pants); b+=seg(112,222,128,192,14,P.pantsd); b+=seg(128,192,112,166,15,P.pants); b+=seg(166,222,149,188,11,P.cardio); b+=seg(113,222,129,192,11,P.cardio); b+='<rect x="124" y="98" width="60" height="68" rx="10" fill="'+P.shirt+'" transform="rotate(-6,154,132)"/>'; b+='<rect x="127" y="101" width="54" height="28" rx="8" fill="'+P.shirtd+'" opacity="0.4" transform="rotate(-6,154,115)"/>'; b+=seg(126,131,108,115,11,P.skin); b+=seg(182,131,198,112,11,P.skin); b+='<rect x="147" y="88" width="13" height="12" rx="4" fill="'+P.skin+'" transform="rotate(-6,153,94)"/>'; b+=hd(153,71,17); b+='<ellipse cx="168" cy="224" rx="16" ry="6" fill="'+P.shoe+'"/>'; b+='<ellipse cx="110" cy="224" rx="14" ry="6" fill="'+P.shoe+'"/>'; }
  b+='<circle cx="55" cy="105" r="26" fill="none" stroke="'+P.cardio+'" stroke-width="2.5" opacity="0.7"/>';
  b+='<text x="55" y="100" font-family="system-ui,sans-serif" font-size="8" font-weight="800" fill="'+P.cardio+'" text-anchor="middle">CARDIO</text>';
  b+='<text x="55" y="115" font-family="system-ui,sans-serif" font-size="14" fill="'+P.hi+'" text-anchor="middle">🔥</text>';
  b+=lbl('COURSE / CARDIO','ENDURANCE · JAMBES · CARDIO',P.cardio);
  return wrap(id,b);
}

function jump(phase) {
  var id=uid(), up=(phase==='end');
  var b=floor(232);
  b+='<ellipse cx="128" cy="'+(up?120:234)+'" rx="16" ry="6" fill="'+P.shoe+'"/>'; b+='<ellipse cx="152" cy="'+(up?122:234)+'" rx="16" ry="6" fill="'+P.shoe+'"/>';
  if(up){ b+=seg(125,118,118,90,14,P.pants); b+=seg(155,120,162,88,14,P.pants); b+=seg(118,90,128,62,15,P.pants); b+=seg(162,88,152,60,15,P.pants); b+='<rect x="112" y="32" width="56" height="32" rx="8" fill="'+P.shirt+'"/>'; b+=seg(112,45,88,68,11,P.skin); b+=seg(168,45,192,68,11,P.skin); b+='<rect x="133" y="22" width="14" height="12" rx="4" fill="'+P.skin+'"/>'; b+=hd(140,5,16); b+='<ellipse cx="140" cy="240" rx="25" ry="5" fill="'+P.cardio+'" opacity="0.3"/>'; }
  else { b+=seg(126,232,118,200,14,P.pants); b+=seg(154,232,162,200,14,P.pants); b+=seg(118,200,124,168,15,P.pants); b+=seg(162,200,156,168,15,P.pants); b+='<rect x="110" y="138" width="60" height="32" rx="8" fill="'+P.shirt+'"/>'; b+=seg(112,152,92,172,11,P.skin); b+=seg(168,152,188,172,11,P.skin); b+='<rect x="133" y="128" width="14" height="12" rx="4" fill="'+P.skin+'"/>'; b+=hd(140,110,17); }
  b+='<ellipse cx="140" cy="'+(up?115:228)+'" rx="30" ry="12" fill="'+P.cardio+'" opacity="'+(up?'0.18':'0.28')+'"/>';
  b+=up?arrow_up(205,88):arrow_down(205,208);
  b+=lbl(up?'ENVOL':'RÉCEPTION','JAMBES · CARDIO · EXPLOSIVITÉ',P.cardio);
  return wrap(id,b);
}

function kb_swing(phase) {
  var id=uid(), up=(phase==='end');
  var b=floor(232);
  var hy=up?105:165;
  b+=seg(112,232,up?118:100,210,15,P.pants); b+=seg(168,232,up?162:180,210,15,P.pants);
  b+=seg(up?118:100,210,up?115:125,hy+60,16,P.pants); b+=seg(up?162:180,210,up?165:155,hy+60,16,P.pants);
  b+='<rect x="105" y="'+hy+'" width="70" height="65" rx="10" fill="'+P.shirt+'"/>';
  b+='<rect x="108" y="'+(hy+2)+'" width="64" height="26" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="108" y="'+(hy+2)+'" width="64" height="60" rx="8" fill="'+P.glute+'" opacity="'+(up?'0.3':'0.42')+'"/>';
  b+=seg(up?108:108,hy+55,up?80:95,up?85:185,12,P.skin);
  b+=seg(up?172:172,hy+55,up?200:185,up?85:185,12,P.skin);
  var kbx=up?140:140, kby=up?72:190;
  b+='<rect x="'+(kbx-14)+'" y="'+(kby-12)+'" width="28" height="22" rx="5" fill="#1a1a2e" stroke="'+P.arms+'" stroke-width="2"/>'; b+='<rect x="'+(kbx-8)+'" y="'+(kby-22)+'" width="16" height="14" rx="5" fill="none" stroke="'+P.arms+'" stroke-width="2"/>';
  b+='<ellipse cx="'+kbx+'" cy="'+kby+'" rx="11" ry="9" fill="#111" stroke="'+P.arms+'" stroke-width="1.5"/>';
  b+='<rect x="133" y="'+(hy-14)+'" width="14" height="12" rx="4" fill="'+P.skin+'"/>'; b+=hd(140,up?hy-34:hy-32,17);
  b+=up?arrow_up(215,70):arrow_down(215,155);
  b+=lbl(up?'BALANCÉ HAUT':'POSITION BAS','FESSIERS · DOS · ÉPAULES · CORE',P.glute);
  return wrap(id,b);
}

function stretch(phase) {
  var id=uid();
  var b='';
  b+=floor(230);
  b+=seg(112,228,106,195,14,P.pants); b+=seg(168,228,174,195,14,P.pants);
  b+=seg(106,195,100,162,15,P.pants); b+=seg(174,195,180,162,15,P.pants);
  b+='<ellipse cx="108" cy="230" rx="14" ry="5" fill="'+P.shoe+'"/>'; b+='<ellipse cx="172" cy="230" rx="14" ry="5" fill="'+P.shoe+'"/>';
  b+='<rect x="105" y="110" width="70" height="54" rx="10" fill="'+P.shirt+'"/>';
  b+='<rect x="108" y="112" width="64" height="22" rx="8" fill="'+P.shirtd+'" opacity="0.4"/>';
  b+='<rect x="108" y="112" width="64" height="50" rx="8" fill="'+P.act+'" opacity="0.18"/>';
  b+=seg(112,132,88,108,11,P.skin); b+=seg(168,132,192,88,11,P.skin);
  b+='<ellipse cx="192" cy="85" rx="10" ry="8" fill="'+P.skind+'" opacity="0.7"/>';
  b+='<rect x="133" y="100" width="14" height="12" rx="4" fill="'+P.skin+'"/>'; b+=hd(140,82,18);
  b+='<circle cx="55" cy="120" r="24" fill="none" stroke="'+P.act+'" stroke-width="2.5" opacity="0.6"/>';
  b+='<text x="55" y="115" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="'+P.hi+'" text-anchor="middle">HOLD</text>';
  b+='<text x="55" y="130" font-family="system-ui,sans-serif" font-size="10" fill="'+P.act+'" text-anchor="middle">🧘</text>';
  b+=lbl('ÉTIREMENT','FLEXIBILITÉ · MOBILITÉ',P.act);
  return wrap(id,b);
}

function battle_ropes(phase) {
  var id=uid(), s=(phase!=='end');
  var b=floor(228);
  b+='<path d="M 20 215 Q 60 '+(s?190:205)+' 100 215 Q 140 '+(s?225:210)+' 180 215 Q 220 '+(s?200:220)+' 260 210" stroke="'+P.pantsd+'" stroke-width="6" fill="none" opacity="0.8"/>';
  b+='<path d="M 20 220 Q 60 '+(s?205:190)+' 100 220 Q 140 '+(s?210:225)+' 180 220 Q 220 '+(s?220:200)+' 260 215" stroke="'+P.pantsd+'" stroke-width="6" fill="none" opacity="0.8"/>';
  b+=standing({torsoColor:P.shoulder, intensity:0.3});
  b+=seg(112,165,80,185,11,P.skin); b+=seg(168,165,200,185,11,P.skin);
  b+='<circle cx="80" cy="186" r="7" fill="'+P.skind+'"/>'; b+='<circle cx="200" cy="186" r="7" fill="'+P.skind+'"/>';
  b+=lbl('BATTLE ROPES','CARDIO · ÉPAULES · BRAS',P.cardio);
  return wrap(id,b);
}

function farmer_walk(phase) {
  var id=uid();
  var b=floor(228);
  b+=standing({torsoColor:P.trap, intensity:0.28});
  b+=seg(112,175,95,220,11,P.skin); b+=seg(168,175,185,220,11,P.skin);
  b+='<rect x="78" y="215" width="20" height="28" rx="5" fill="#1a1a2e" stroke="'+P.trap+'" stroke-width="2"/>'; b+='<circle cx="88" cy="218" r="7" fill="#111" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+='<rect x="182" y="215" width="20" height="28" rx="5" fill="#1a1a2e" stroke="'+P.trap+'" stroke-width="2"/>'; b+='<circle cx="192" cy="218" r="7" fill="#111" stroke="'+P.actd+'" stroke-width="1.5"/>';
  b+=lbl('FARMER\'S WALK','TRAPÈZES · AVANT-BRAS · CORE',P.trap);
  return wrap(id,b);
}

function generic_muscle(muscle, phase) {
  var id=uid(), act=(phase==='end');
  var cols={'Pectoraux':P.chest,'Dos':P.back,'Quadriceps':P.legs,'Fessiers':P.glute,'Abdominaux':P.core,'Épaules':P.shoulder,'Biceps':P.arms,'Triceps':P.arms,'Cardio':P.cardio,'Ischio-jambiers':P.legs,'Mollets':P.calf,'Corps entier':P.hi,'Trapèzes':P.trap};
  var col=cols[muscle]||P.hi;
  var b=standing({torsoColor:col, intensity:act?0.42:0.18});
  b+=seg(112,165,90,190,11,P.skin); b+=seg(168,165,190,190,11,P.skin);
  b+='<circle cx="140" cy="155" r="'+(act?28:22)+'" fill="none" stroke="'+col+'" stroke-width="2" opacity="'+(act?'0.55':'0.28')+'"/>';
  b+='<circle cx="140" cy="155" r="'+(act?17:13)+'" fill="'+col+'" opacity="'+(act?'0.18':'0.08')+'"/>';
  b+=lbl(act?'CONTRACTION':'PRÊT',(muscle||'CORPS ENTIER').toUpperCase(),col);
  return wrap(id,b);
}

// ── IMAGE MAP — exercices avec vraies images ─────────────────────────
// Clé = nom exact de l'exercice, valeur = chemin du fichier image
var EXERCISE_IMAGES = {
  'Ab Wheel Knee Rollout':         'images/exercises/Ab_wheel_knee_rollout.webp',
  'Ab Wheel Rollout':              'images/exercises/Ab_wheel_rollout.webp',
  'Abduction machine (fessiers)':  'images/exercises/Abduction_machine__fessiers_.webp',
  'Adduction machine (intérieur)': 'images/exercises/Adduction_machine__intérieur_.webp',
  'Balancements jambe arrière':    'images/exercises/Balancements_jambe_arrière.webp',
  'Ball back extension':           'images/exercises/Ball_back_extension.webp',
  'Ball chest press':              'images/exercises/Ball_chest_press.webp',
  'Ball crunch':                   'images/exercises/Ball_crunch.webp',
  'Ball hamstring curl':           'images/exercises/Ball_Hamstring_curl.webp',
  'Ball leg raise':                'images/exercises/Ball_leg_raise.webp',
  'Ball pike':                     'images/exercises/Ball_Pike.webp',
  'Ball Russian twist':            'images/exercises/Ball_Russian_twist.webp',
  'Ball planche':                  'images/exercises/Ball_planche.webp',
  'Ball push-up':                  'images/exercises/Ball_push-up.webp',
  'Ball wall squat':               'images/exercises/Ball_wall_squat.webp',
  'Band Chest Press':              'images/exercises/Band_Chest_Press.webp',
  'Band Face Pull':                'images/exercises/Band_Face_Pull.webp',
  'Band Pull Apart':               'images/exercises/Band_Pull_Apart.webp',
  'Banded Deadlift':               'images/exercises/Banded_Deadlift.webp',
  'Banded Glute Bridge':           'images/exercises/Banded_Glute_Bridge.webp',
  'Banded Squats':                 'images/exercises/Banded_Squats.webp',
  'Barbell Row':                   'images/exercises/Barbell_Row.webp',
  'Battle ropes gym':              'images/exercises/Battle_ropes_gym.webp',
  'Bear crawl':                    'images/exercises/Bear_crawl.webp',
  'Bench Press':                   'images/exercises/Bench_Press.webp',
  'Bench Press Smith machine':     'images/exercises/Bench_Press_Smith_machine.webp',
  'Bench Step-up':                 'images/exercises/Bench_Step-up.webp',
  'Bent-over row prise large':     'images/exercises/Bent-over_row_prise_large.webp',
  'Bicep Curl machine':            'images/exercises/Biceps_curl_machine.webp',
  'Curl biceps machine':           'images/exercises/Biceps_curl_machine.webp',
  'Curl élastique':         'images/exercises/Biceps_curl_élastique.webp',
  'Bicycle crunch':                'images/exercises/Bicycle_crunch.webp',
  'Box Jump - Emphasis Mollets':   'images/exercises/Box_Jump_Emphasis_Mollets.webp',
  'Box jumps':                     'images/exercises/Box_jumps.webp',
  'Bras croisés poitrine':         'images/exercises/Bras_croisés_poitrine.webp',
  'Burpees':                       'images/exercises/Burpees.webp',
  'Burpees légers':                'images/exercises/Burpees_légers.webp',
  'Cable Crossover':               'images/exercises/Cable_Crossover.webp',
};

function hasExerciseImage(name) {
  return !!(name && EXERCISE_IMAGES[name]);
}

// ── LAZY LOADING avec IntersectionObserver ──────────────────────────
// Les images ne sont téléchargées que lorsqu'elles entrent dans la vue
// + placeholder pendant le chargement
var LAZY_OBSERVER = null;

function _initLazyObserver() {
  if (LAZY_OBSERVER || typeof IntersectionObserver === 'undefined') return;
  LAZY_OBSERVER = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var img = entry.target;
      var realSrc = img.dataset.lazySrc;
      if (!realSrc) return;
      // Charger la vraie image
      var loader = new Image();
      loader.onload = function() {
        img.src = realSrc;
        img.style.opacity = '1';
        img.removeAttribute('data-lazy-src');
      };
      loader.onerror = function() {
        img.style.opacity = '0.4';
        img.removeAttribute('data-lazy-src');
      };
      loader.src = realSrc;
      LAZY_OBSERVER.unobserve(img);
    });
  }, {
    rootMargin: '200px', // Précharger 200px avant que l'image entre dans la vue
    threshold: 0.01,
  });
}

// Placeholder SVG très léger (skeleton animé)
function _getPlaceholderSVG() {
  return 'data:image/svg+xml;charset=UTF-8,'
    + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
    + '<rect width="100" height="100" fill="#0d1220"/>'
    + '<rect x="20" y="35" width="60" height="2" fill="#1a2535"/>'
    + '<rect x="20" y="42" width="60" height="2" fill="#1a2535"/>'
    + '<rect x="20" y="49" width="60" height="2" fill="#1a2535"/>'
    + '<text x="50" y="68" font-family="sans-serif" font-size="9" fill="#22c55e" text-anchor="middle" opacity="0.5">◈</text>'
    + '</svg>');
}

// Crée un <img> en lazy loading
function _buildLazyImg(src, name, extraStyle) {
  // Lazy loading natif du navigateur — fiable et simple
  var baseStyle = 'width:100%;height:100%;object-fit:cover;display:block;background:#0d1220;' + (extraStyle || '');
  var safeName = (name || '').replace(/"/g, '&quot;');
  // Encoder l'URL pour les caractères spéciaux (é, è, à, etc.) — encode chaque segment de path
  var safeSrc = src.split('/').map(function(seg, i) {
    return i === 0 ? seg : encodeURIComponent(seg).replace(/'/g, '%27');
  }).join('/');
  // onerror : si l'image ne charge pas, on cache pour ne pas montrer de carré gris cassé
  return '<img src="' + safeSrc + '" alt="' + safeName + '" style="' + baseStyle + '" loading="lazy" decoding="async" onerror="this.style.display=\'none\';this.parentElement&&(this.parentElement.style.display=\'none\')"/>';
}

function toImgHTML(src, name) {
  return '<img src="'+src+'" alt="'+name+'" style="width:220px;height:220px;object-fit:cover;border-radius:12px;display:block;" loading="lazy"/>';
}

// ── MAIN DISPATCHER — couvre les 436 exercices ───────────────────────
function _legacyGetExerciseVisual(name, muscle, phase) {
  // ── Vrai image si disponible ──────────────────────────────────────
  if (name && EXERCISE_IMAGES[name]) {
    return toImgHTML(EXERCISE_IMAGES[name], name);
  }

  var n=(name||'').toLowerCase();
  phase=phase||'start';

  // ── PECTORAUX ─────────────────────────────────────────────────────
  if(/pompe|push.?up|push up/.test(n)) return pushup(phase);
  if(/développé.*(couché|incliné|décliné|barre|haltère|smith)|bench.?press|close.?grip.?bench|chest.?press|incline.*press|decline.*press|band.*chest|ball.*chest|presse.*(pecto|poitrine)/.test(n)) return bench_press(phase);
  if(/écarté|cable.*(fly|crossover|cross)|cable fly|pec.?deck|butterfly|fly.*câble|chest.*fly/.test(n)) return cable_fly(phase);
  if(/dip.*(pecto|tricep|banc)|parallel.?bar.?dip/.test(n)) return dip(phase);
  if(/pull.?over/.test(n)) return bench_press(phase);

  // ── DOS ───────────────────────────────────────────────────────────
  if(/traction|pull.?up|chin.?up|towel.*pull/.test(n)) return pullup(phase);
  if(/lat.?pulldown|tirage.*(haute|nuque|vertical|poulie|menton|face|basse|poitrine|unilatéral)|reverse.?grip.?pulldown|tirage.*(dos|large|serrée)|straight.?arm.?push/.test(n)) return lat_pulldown(phase);
  if(/rowing|row|tirage.*(horizontal|machine)|bent.?over|barbell.?row|t.?bar|renegade|seate.*row/.test(n)) return row_machine(phase);
  if(/soulevé.*(terre|barre)|deadlift|stiff|rack.?pull|rdl/.test(n)) return deadlift(phase);
  if(/hyperextension|back.?extension|ball.*back|superman/.test(n)) return superman(phase);
  if(/face.?pull|rear.?delt|oiseau/.test(n)) return lateral_raise(phase);
  if(/good.?morning/.test(n)) return deadlift(phase);

  // ── JAMBES / FESSIERS ─────────────────────────────────────────────
  if(/squat(?!.*machine.*)|goblet|front.?squat|hack.?squat(?!.*machine)|overhead.?squat|banded.?squat|ball.?wall.?squat|squat.*avant|squat.*barre|squat.*sumo|sissy.?squat(?!.*machine)|jump.?squat|pistol.?squat/.test(n)) return squat(phase);
  if(/squat.*(machine|smith)|leg.?press|presse.*(jambe)|hack.?squat.?machine|sissy.?squat.?machine/.test(n)) return leg_press(phase);
  if(/fente|lunge|step.?up|bench.?step/.test(n)) return lunge(phase);
  if(/hip.?thrust|banded.?glute.?bridge|single.?leg.?glute|glute.?bridge(?!.*(machine|abduction))|pont.*(fess|glute)|glute(?!.*machine|.*kickback|.*abduction)/.test(n)) return hip_thrust(phase);
  if(/glute.?bridge/.test(n)) return glute_bridge(phase);
  if(/hip.*abduction|abduction.*machine|glute.*machine.*abduction|lateral.?walk|monster.?walk|fire.?hydrant/.test(n)) return lateral_raise(phase);
  if(/kickback.*(fess|glute)|donkey.?kick|balancement.*jambe/.test(n)) return hip_thrust(phase);
  if(/leg.?curl|curl.*(machine|assis|couché|allongé)|hamstring.?curl|ball.*hamstring|swiss.*hamstring|nordic/.test(n)) return leg_curl(phase);
  if(/leg.?extension/.test(n)) return leg_extension(phase);
  if(/calf|mollet|calf.raise|seate.*calf|donkey.?calf|sauts.*mollet|jump.?rope.*calf|montée.*pointe|farmer.*toe/.test(n)) return calf_raise(phase);
  if(/hip.?adduction|adduction.*machine/.test(n)) return leg_curl(phase);
  if(/romanian/.test(n)) return deadlift(phase);
  if(/sumo.?deadlift/.test(n)) return deadlift(phase);

  // ── ÉPAULES ───────────────────────────────────────────────────────
  if(/développé.*(militaire|épaule|overhead|arnold)|overhead.?press|shoulder.*press|push.?press|presse.*(épaule)|élévation.*y|upright.?row|clean.?and.?press/.test(n)) return shoulder_press(phase);
  if(/élévation.*(latéral|lateral)|lateral.?raise|cable.*(lateral|latéral)|band.*(face|pull.?apart)/.test(n)) return lateral_raise(phase);
  if(/élévation.*(front|frontale)|front.?raise|cable.?front/.test(n)) return front_raise(phase);
  if(/shrug|haussement|trapèze.*machine|snatch.?grip.?shrug|incline.*shrug/.test(n)) return shrug(phase);

  // ── BRAS ──────────────────────────────────────────────────────────
  if(/curl|bicep|21s|zottman|preacher|concentré|marteau|hammer.?curl/.test(n)) return curl(phase);
  if(/extension.*(tricep|nuque|couché|overhead)|tricep|pushdown|kickback.*tricep|tricep.*machine|overhead.*tricep/.test(n)) return tricep_pushdown(phase);
  if(/cable.*tricep|push.?down|cable.*push/.test(n)) return tricep_pushdown(phase);
  if(/reverse.?curl|wrist.?curl|wrist.?roller|rice.?bucket|plate.?pinch/.test(n)) return curl(phase);

  // ── ABDOMINAUX / CORE ─────────────────────────────────────────────
  if(/planche|plank|gainage(?!.*latéral)|ball.*planche|trx.*(planche|plank|rollout|pike)|l.?sit/.test(n)) return plank(phase);
  if(/planche.?latérale|side.?plank/.test(n)) return plank(phase);
  if(/crunch|sit.?up|relevé.*(buste|tronc)|decline.?sit|dead.?bug|hollow/.test(n)) return crunch(phase);
  if(/ab.?wheel|rollout|dragon.?flag/.test(n)) return ab_wheel(phase);
  if(/leg.?raise|relevé.*jambe|parallel.*knee|knee.*raise|mountain.?climber|v.?up|bicycle/.test(n)) return crunch(phase);
  if(/russian.?twist|woodchop|pallof|rotation|torsion/.test(n)) return crunch(phase);
  if(/cable.?crunch/.test(n)) return crunch(phase);

  // ── CARDIO ────────────────────────────────────────────────────────
  if(/run|course|sprint|treadmill|tapis/.test(n)) return run(phase);
  if(/jump(?!.*rope|.*squat|.*lunge)|saut(?!.*mollet)|box.?jump|skater|burpee/.test(n)) return jump(phase);
  if(/jump.?rope|corde.?saut/.test(n)) return jump(phase);
  if(/high.?knee|mountain.?climb|jumping.?jack|jumping jacks|marche.*place|montées.*(genou|place)/.test(n)) return run(phase);
  if(/battle.?rope/.test(n)) return battle_ropes(phase);
  if(/elliptique|vélo|rowing.*machine|rameur|stairmaster|escalier/.test(n)) return run(phase);
  if(/inchworm|bear.?crawl|sprawl|man.?maker/.test(n)) return run(phase);

  // ── KETTELBELL ────────────────────────────────────────────────────
  if(/kb.*(swing|snatch|clean|windmill|high.pull|goblet)|kettlebell.*(swing|snatch|clean|windmill|high|goblet)|halo/.test(n)) return kb_swing(phase);
  if(/turkish.?get.?up|thruster|devil.?press|power.?clean/.test(n)) return kb_swing(phase);

  // ── ÉTIREMENTS ────────────────────────────────────────────────────
  if(/étirement|stretch|cobra|cat.?cow|chat.?dos|pigeon|posture.*enfant|torsion.*spinale|torsion.*assis|flexion.*extension.*bras|cercle|rotation|mouvement|respiration/.test(n)) return stretch(phase);

  // ── DIVERS ────────────────────────────────────────────────────────
  if(/farmer|atlas/.test(n)) return farmer_walk(phase);
  if(/trx/.test(n)) return pullup(phase);
  if(/band|élastique/.test(n)) { if(muscle==='Dos'||muscle==='Ischio-jambiers') return row_machine(phase); if(muscle==='Biceps') return curl(phase); return generic_muscle(muscle,phase); }
  if(/ball|swiss.?ball|medicine.?ball|mb /.test(n)) { if(muscle==='Abdominaux') return crunch(phase); if(muscle==='Pectoraux') return pushup(phase); if(muscle==='Dos') return row_machine(phase); return squat(phase); }
  if(/cable/.test(n)) { if(muscle==='Pectoraux') return cable_fly(phase); if(muscle==='Dos') return lat_pulldown(phase); if(muscle==='Biceps') return curl(phase); if(muscle==='Triceps') return tricep_pushdown(phase); if(muscle==='Épaules') return lateral_raise(phase); return generic_muscle(muscle,phase); }
  if(/machine/.test(n)) { if(muscle==='Quadriceps') return leg_extension(phase); if(muscle==='Ischio-jambiers') return leg_curl(phase); if(muscle==='Mollets') return calf_raise(phase); if(muscle==='Dos') return lat_pulldown(phase); if(muscle==='Pectoraux') return bench_press(phase); if(muscle==='Épaules') return shoulder_press(phase); return generic_muscle(muscle,phase); }
  if(/smith/.test(n)) { if(muscle==='Quadriceps') return squat(phase); if(muscle==='Pectoraux') return bench_press(phase); if(muscle==='Épaules') return shoulder_press(phase); return squat(phase); }

  // ── FALLBACK BY MUSCLE ────────────────────────────────────────────
  if(muscle==='Pectoraux') return bench_press(phase);
  if(muscle==='Dos') return row_machine(phase);
  if(muscle==='Quadriceps') return squat(phase);
  if(muscle==='Fessiers') return hip_thrust(phase);
  if(muscle==='Ischio-jambiers') return leg_curl(phase);
  if(muscle==='Mollets') return calf_raise(phase);
  if(muscle==='Abdominaux') return crunch(phase);
  if(muscle==='Biceps') return curl(phase);
  if(muscle==='Triceps') return tricep_pushdown(phase);
  if(muscle==='Épaules') return shoulder_press(phase);
  if(muscle==='Trapèzes') return shrug(phase);
  if(muscle==='Cardio') return run(phase);

  return generic_muscle(muscle, phase);
}

window._legacyGetExerciseVisual = _legacyGetExerciseVisual;
window.hasExerciseImage   = hasExerciseImage;
window.EXERCISE_IMAGES    = EXERCISE_IMAGES;
window.buildLazyImg       = _buildLazyImg;

})();

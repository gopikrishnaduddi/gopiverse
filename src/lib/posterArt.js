/* Procedural fallback art — used whenever a real image/trailer file is not in public/assets */
export function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export function hexA(hex,a){const n=parseInt(hex.slice(1),16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}
export function mixHex(a,b,t){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);const c=(s)=>Math.round(((A>>s)&255)*(1-t)+((B>>s)&255)*t);return'#'+((1<<24)|(c(16)<<16)|(c(8)<<8)|c(0)).toString(16).slice(1)}

export function figure(ctx,x,y,s,col,opt={}){ // silhouette: x centre, y = bottom
  ctx.save();ctx.fillStyle=col;ctx.beginPath();
  const hw=s*.30, sh=y-s*.62;
  ctx.moveTo(x-hw*1.15,y);ctx.lineTo(x-hw*1.05,sh+s*.12);
  ctx.quadraticCurveTo(x-hw*1.02,sh,x-hw*.55,sh-s*.04);
  ctx.lineTo(x-s*.06,sh-s*.07);ctx.lineTo(x-s*.055,sh-s*.12);
  ctx.lineTo(x+s*.055,sh-s*.12);ctx.lineTo(x+s*.06,sh-s*.07);
  ctx.lineTo(x+hw*.55,sh-s*.04);ctx.quadraticCurveTo(x+hw*1.02,sh,x+hw*1.05,sh+s*.12);
  ctx.lineTo(x+hw*1.15,y);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.ellipse(x,sh-s*.21,s*.095,s*.12,0,0,Math.PI*2);ctx.fill();
  if(opt.hair){ctx.beginPath();ctx.ellipse(x,sh-s*.25,s*.11,s*.1,0,Math.PI,0);ctx.fill()}
  if(opt.rim){ctx.strokeStyle=opt.rim;ctx.lineWidth=Math.max(1,s*.012);ctx.globalAlpha=.85;
    ctx.beginPath();ctx.ellipse(x,sh-s*.21,s*.095,s*.12,0,-1.9,-0.2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+hw*.55,sh-s*.04);ctx.quadraticCurveTo(x+hw*1.02,sh,x+hw*1.05,sh+s*.12);ctx.lineTo(x+hw*1.15,y);ctx.stroke();}
  ctx.restore();
}
export function glow(ctx,x,y,r,col,a=1){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,hexA(col,a));g.addColorStop(1,hexA(col,0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
export function vgrad(ctx,w,h,stops){const g=ctx.createLinearGradient(0,0,0,h);stops.forEach(([o,c])=>g.addColorStop(o,c));ctx.fillStyle=g;ctx.fillRect(0,0,w,h)}

// draw art (no text). t = seconds (for animation)
export function drawArt(ctx,m,w,h,t=0){
  const [c0,c1,c2,c3]=m.pal, R=rng(hashStr(m.id)), cx=w/2, B=Math.min(w,h), P=h>w; // portrait?
  const fy = P? h*.86 : h*1.04;           // figure baseline
  const fs = P? h*.62 : h*.74;            // figure size
  const stars=(n,a=1)=>{const r=rng(hashStr(m.id+'s'));for(let i=0;i<n;i++){const x=r()*w,y=r()*h*.8,s=r()*1.4+.3;ctx.fillStyle=`rgba(255,255,255,${(.3+.7*Math.abs(Math.sin(t*1.3+i)))*a*r()})`;ctx.fillRect(x,y,s,s)}};
  switch(m.motif){
  case 'meteor':{
    vgrad(ctx,w,h,[[0,c0],[.6,mixHex(c0,c1,.5)],[1,c1]]);stars(260);
    const pr=w*1.1, py=h*.82+pr;               // planet
    const pg=ctx.createRadialGradient(cx,py,pr*.8,cx,py,pr*1.04);pg.addColorStop(0,'#04060c');pg.addColorStop(.92,mixHex(c1,'#7fb2ff',.4));pg.addColorStop(.97,'#dbe9ff');pg.addColorStop(1,'rgba(150,190,255,0)');
    ctx.fillStyle=pg;ctx.beginPath();ctx.arc(cx,py,pr*1.04,0,7);ctx.fill();
    const k=(t*.08)%1, x1=w*(.80-k*.05), y1=h*(.10+k*.04), x2=w*.40, y2=h*.66;
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<5;i++){const g=ctx.createLinearGradient(x1,y1,x2,y2);g.addColorStop(0,'rgba(120,170,255,0)');g.addColorStop(.7,hexA('#9cc4ff',.25));g.addColorStop(1,hexA(c2,.9));ctx.strokeStyle=g;ctx.lineWidth=B*(.06-i*.011);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
    glow(ctx,x2,y2,B*.38,c2,.95);glow(ctx,x2,y2,B*.12,'#fff3c4',1);
    const r2=rng(7);for(let i=0;i<70;i++){const a=r2()*Math.PI*2,d=r2()*B*.3*(1+Math.sin(t+i)*.1);ctx.fillStyle=hexA(i%2?c2:'#ffd27a',.8*r2());ctx.fillRect(x2+Math.cos(a)*d,y2+Math.sin(a)*d*.6+B*.05,2,2)}
    ctx.restore();break}
  case 'sun':{
    vgrad(ctx,w,h,[[0,c1],[.55,mixHex(c1,c2,.35)],[1,c0]]);
    const sy=P?h*.38:h*.42, sr=B*.30;
    glow(ctx,cx,sy,sr*2.2,c2,.45);ctx.fillStyle=c2;ctx.beginPath();ctx.arc(cx,sy,sr,0,7);ctx.fill();
    ctx.fillStyle=mixHex(c1,c2,.25);for(let i=0;i<6;i++){const y=sy+sr*.15+i*sr*.15+((t*6)%(sr*.15));ctx.fillRect(cx-sr,y,sr*2,sr*.035+i*1.2)}
    // palm/ground
    ctx.fillStyle=c0;ctx.fillRect(0,P?h*.72:h*.8,w,h);
    for(let i=0;i<14;i++){const x=R()*w,hh=B*(.05+R()*.12);ctx.fillRect(x,(P?h*.72:h*.8)-hh,B*.02+R()*B*.05,hh)}
    figure(ctx,cx,fy,fs,'#05100f',{rim:c2});
    figure(ctx,cx-fs*.42,fy,fs*.66,hexA('#061414',.92));figure(ctx,cx+fs*.42,fy,fs*.66,hexA('#061414',.92));
    break}
  case 'smoke': case 'smoke2': case 'smoke3':{
    const gold=m.motif==='smoke3';vgrad(ctx,w,h,[[0,c0],[.5,mixHex(c0,c1,.5)],[1,c0]]);
    for(let i=0;i<40;i++){const x=R()*w+Math.sin(t*.3+i)*B*.04,y=R()*h,r=B*(.12+R()*.3);glow(ctx,x,y,r,gold?c2:c1,.18)}
    if(gold){glow(ctx,cx,h*.3,B*.7,c2,.35)}
    const fx=m.motif==='smoke2'?cx:cx-B*.08;
    figure(ctx,fx,fy,fs*1.05,'#060606',{rim:gold?c2:'#9a9a9a',hair:m.motif==='smoke2'});
    if(m.motif==='smoke2')figure(ctx,fx+fs*.38,fy,fs*.9,'#0b0b0b',{rim:'#7a7a7a',hair:1});
    // disintegration particles
    const r3=rng(11);ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<500;i++){const x=fx+fs*.1+r3()*w*.6+((t*20*r3())%(w*.3)),y=fy-fs*.9+r3()*fs*.9;ctx.fillStyle=hexA(gold?c2:'#d8d8d8',.25*r3());ctx.fillRect(x,y,1.6,1.6)}ctx.restore();
    if(m.motif==='smoke'){ctx.fillStyle=hexA(c2,.85);ctx.fillRect(0,h*.13,w*.42,B*.012)}
    break}
  case 'temple':{
    vgrad(ctx,w,h,[[0,c0],[.45,c1],[.75,c2],[1,c1]]);
    glow(ctx,cx,h*.55,B*.6,'#fff2b0',.55);
    ctx.strokeStyle=hexA(c3,.25);ctx.lineWidth=2;for(let i=1;i<5;i++){ctx.beginPath();ctx.arc(cx,h*.55,B*.12*i+Math.sin(t+i)*2,0,7);ctx.stroke()}
    ctx.fillStyle=hexA(c0,.95);const base=P?h*.80:h*.86,tw=B*.62;
    for(let i=0;i<7;i++){const ww=tw*(1-i*.12),hh=B*.07;ctx.fillRect(cx-ww/2,base-(i+1)*hh,ww,hh*.92)}
    ctx.beginPath();ctx.moveTo(cx-tw*.12,base-7*B*.07);ctx.quadraticCurveTo(cx,base-8.6*B*.07,cx+tw*.12,base-7*B*.07);ctx.fill();
    ctx.fillRect(0,base,w,h);
    for(let i=0;i<9;i++)figure(ctx,w*(.08+i*.105),h,B*(.22+R()*.08),hexA('#1a0602',.95));
    // bow
    ctx.strokeStyle=hexA(c2,.9);ctx.lineWidth=B*.012;ctx.beginPath();ctx.arc(cx,h*.38,B*.42,Math.PI*1.12,Math.PI*1.88);ctx.stroke();
    break}
  case 'fire': case 'fire2':{
    vgrad(ctx,w,h,[[0,c0],[.55,mixHex(c0,c1,.6)],[1,c1]]);
    glow(ctx,cx,h*.85,B*.9,c2,.55);
    for(let L=0;L<3;L++){ctx.fillStyle=hexA(L===2?'#ffe08a':L?c2:'#ff4a12',.55+L*.1);ctx.beginPath();ctx.moveTo(0,h);
      for(let x=0;x<=w;x+=w/40){const y=h*(.62+L*.08)-Math.abs(Math.sin(x*.02+L*2+t*3))*B*.18*(1-L*.25)-Math.sin(x*.05+t*5)*B*.02;ctx.lineTo(x,y)}ctx.lineTo(w,h);ctx.fill()}
    figure(ctx,cx,fy,fs,'#0a0302',{rim:'#ffcf6a',hair:m.motif==='fire'});
    if(m.motif==='fire2'){ctx.strokeStyle='#0a0302';ctx.lineWidth=B*.03;ctx.beginPath();ctx.moveTo(cx+fs*.3,fy-fs*.5);ctx.lineTo(cx+fs*.62,fy-fs*.95);ctx.stroke()}
    const r4=rng(5);ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<160;i++){const x=r4()*w,sp=20+r4()*60,y=(h-((t*sp+r4()*h)%h));ctx.fillStyle=hexA('#ffb347',r4());ctx.fillRect(x+Math.sin(t+i)*4,y,2,2)}ctx.restore();
    break}
  case 'shards':{
    vgrad(ctx,w,h,[[0,c0],[.6,c1],[1,c0]]);
    for(let i=0;i<34;i++){ctx.fillStyle=hexA(i%3?c1:c2,.08+R()*.25);ctx.beginPath();const x=R()*w,y=R()*h,s=B*(.1+R()*.35),a=R()*6+t*.05*(i%2?1:-1);ctx.moveTo(x+Math.cos(a)*s,y+Math.sin(a)*s);ctx.lineTo(x+Math.cos(a+2.2)*s*.6,y+Math.sin(a+2.2)*s*.6);ctx.lineTo(x+Math.cos(a+4)*s*.8,y+Math.sin(a+4)*s*.8);ctx.fill()}
    glow(ctx,cx,h*.45,B*.5,'#bfe0ff',.35);
    figure(ctx,cx-fs*.2,fy,fs,'#020a12',{rim:'#bfe0ff'});figure(ctx,cx+fs*.22,fy,fs*.96,'#03101b',{rim:'#bfe0ff'});
    break}
  case 'storm': case 'storm2':{
    const red=m.motif==='storm2';vgrad(ctx,w,h,[[0,c0],[.5,c1],[1,c0]]);
    for(let i=0;i<30;i++)glow(ctx,R()*w+Math.sin(t*.2+i)*10,R()*h*.6,B*(.15+R()*.25),red?'#2a0505':c2,.22);
    const fl=(Math.sin(t*7)>.93)?1:.35;ctx.strokeStyle=hexA(red?c2:'#fff1d6',fl);ctx.lineWidth=B*.008;ctx.beginPath();let lx=w*.72,ly=0;ctx.moveTo(lx,ly);const r5=rng(3);while(ly<h*.55){lx+=(r5()-.5)*B*.12;ly+=B*.05;ctx.lineTo(lx,ly)}ctx.stroke();
    if(red){ctx.fillStyle=hexA(c2,.9);ctx.beginPath();ctx.moveTo(cx-B*.25,h*.15);ctx.lineTo(cx+B*.25,h*.15);ctx.lineTo(cx,h*.15+B*.12);ctx.fill()}
    figure(ctx,cx,fy,fs,'#070403',{rim:red?c2:c2,hair:!red});
    break}
  case 'rings':{
    vgrad(ctx,w,h,[[0,c0],[.5,c1],[.72,mixHex(c1,'#f7d9a2',.5)],[1,c1]]);
    ctx.strokeStyle=hexA(c2,.6);for(let i=0;i<6;i++){ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(cx,h*.3,B*(.12+i*.07),B*(.04+i*.022),Math.sin(t*.3)*.1,0,7);ctx.stroke()}
    glow(ctx,cx,h*.3,B*.25,c2,.5);
    ctx.fillStyle=hexA('#120c05',.92);ctx.beginPath();ctx.moveTo(cx-B*.2,h*.18);ctx.lineTo(cx+B*.2,h*.18);ctx.lineTo(cx,h*.42);ctx.fill();
    ctx.fillStyle=hexA(c0,.95);ctx.beginPath();ctx.moveTo(0,h*.78);for(let x=0;x<=w;x+=10)ctx.lineTo(x,h*.76+Math.sin(x*.01+1)*B*.04);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
    figure(ctx,cx,fy,fs*.9,'#0d0904',{rim:c2});
    break}
  case 'moon':{
    vgrad(ctx,w,h,[[0,c0],[1,c1]]);stars(160);
    glow(ctx,cx,h*.3,B*.55,'#cfe0ff',.35);ctx.fillStyle='#eef4ff';ctx.beginPath();ctx.arc(cx,h*.3,B*.22,0,7);ctx.fill();
    ctx.fillStyle=hexA('#b9c8e6',.45);for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(cx+(R()-.5)*B*.3,h*.3+(R()-.5)*B*.3,B*.02+R()*B*.03,0,7);ctx.fill()}
    for(let i=0;i<10;i++){const x=R()*w,th=B*(.3+R()*.4);ctx.fillStyle='#03050c';ctx.beginPath();ctx.moveTo(x,h);ctx.lineTo(x-B*.07,h);ctx.lineTo(x-B*.03,h-th);ctx.fill()}
    for(let i=0;i<8;i++)glow(ctx,R()*w+Math.sin(t*.4+i)*20,h*.85,B*.25,'#8ea0c8',.2);
    figure(ctx,cx,fy,fs*.75,'#02040a',{hair:1,rim:'#cfe0ff'});
    break}
  case 'cave':{
    vgrad(ctx,w,h,[[0,'#000'],[1,c0]]);
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<7;i++){ctx.fillStyle=hexA(c2,.05);ctx.beginPath();ctx.moveTo(cx-B*.1+i*4,0);ctx.lineTo(cx+B*.1,0);ctx.lineTo(cx+B*(.35-i*.04),h);ctx.lineTo(cx-B*(.35-i*.04),h);ctx.fill()}
    ctx.restore();glow(ctx,cx,0,B*.4,c2,.8);
    ctx.fillStyle='#020604';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(cx-B*.12,0);ctx.bezierCurveTo(cx-B*.4,h*.3,cx-B*.5,h*.7,cx-B*.6,h);ctx.lineTo(0,h);ctx.fill();
    ctx.beginPath();ctx.moveTo(w,0);ctx.lineTo(cx+B*.12,0);ctx.bezierCurveTo(cx+B*.4,h*.3,cx+B*.45,h*.7,cx+B*.55,h);ctx.lineTo(w,h);ctx.fill();
    ctx.strokeStyle=hexA('#e8d6a8',.8);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx+Math.sin(t)*3,0);ctx.lineTo(cx+Math.sin(t)*6,h*.62);ctx.stroke();
    figure(ctx,cx+Math.sin(t)*6,h*.70,B*.12,'#000',{rim:c2});
    for(let i=0;i<5;i++)figure(ctx,w*(.2+i*.15),h*1.0,B*.3,hexA('#010302',.95));
    break}
  case 'mountain':{
    vgrad(ctx,w,h,[[0,mixHex(c0,'#9fb7c4',.4)],[.5,mixHex(c1,'#e7d3b8',.3)],[1,c0]]);
    for(let L=0;L<4;L++){ctx.fillStyle=mixHex('#e9eef2',c0,L*.28);ctx.beginPath();ctx.moveTo(0,h);const r6=rng(L+20);let y=h*(.35+L*.12);ctx.lineTo(0,y);for(let x=0;x<=w;x+=B*.08){y=h*(.32+L*.12)+(r6()-.5)*B*.18;ctx.lineTo(x,y)}ctx.lineTo(w,h);ctx.fill();glow(ctx,(t*20+L*200)%w,h*(.45+L*.1),B*.3,'#ffffff',.12)}
    figure(ctx,cx,fy,fs,'#0b0e10',{rim:'#ffe3c0'});
    ctx.fillStyle=hexA(c2,.95);ctx.beginPath();ctx.arc(cx-B*.25,h*.3,B*.07,0,7);ctx.fill();
    break}
  case 'rays':{
    ctx.fillStyle=c1;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.translate(cx,h*.45);ctx.rotate(t*.05);for(let i=0;i<24;i++){ctx.fillStyle=i%2?c2:mixHex(c1,c0,.3);ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,B*2,i*Math.PI/12,(i+1)*Math.PI/12);ctx.fill()}ctx.restore();
    glow(ctx,cx,h*.45,B*.45,'#fff3c4',.6);
    for(let i=0;i<8;i++)figure(ctx,w*(.06+i*.125),h*(P?.74:.86),B*(.24+R()*.1),hexA(c0,.85));
    figure(ctx,cx,fy,fs*1.02,'#170503',{rim:'#ffe08a'});
    ctx.strokeStyle='#d8261a';ctx.lineWidth=B*.03;ctx.beginPath();ctx.moveTo(cx-fs*.1,fy-fs*.62);ctx.bezierCurveTo(cx+fs*.4,fy-fs*.5,cx-fs*.2,fy-fs*.2,cx+fs*.35,fy);ctx.stroke();
    break}
  default: vgrad(ctx,w,h,[[0,c0],[1,c1]]);figure(ctx,cx,fy,fs,'#000',{rim:c2});
  }
  // grain + vignette
  const r7=rng((t*60|0)+3);ctx.fillStyle='rgba(255,255,255,.035)';for(let i=0;i<w*h/220;i++)ctx.fillRect(r7()*w,r7()*h,1,1);
  const vg=ctx.createRadialGradient(cx,h/2,B*.35,cx,h/2,Math.max(w,h)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);
}

export function fitText(ctx,txt,maxW,size,font){let s=size;ctx.font=`${s}px ${font}`;while(ctx.measureText(txt).width>maxW&&s>10){s-=2;ctx.font=`${s}px ${font}`}return s}
export function spaced(ctx,txt,x,y,sp){ // letter-spaced centred text
  const ws=[...txt].map(ch=>ctx.measureText(ch).width);const tot=ws.reduce((a,b)=>a+b,0)+sp*(txt.length-1);let px=x-tot/2;
  [...txt].forEach((ch,i)=>{ctx.fillText(ch,px+ws[i]/2,y);px+=ws[i]+sp});
}
const POSTER={}, BACKDROP={}, EVART={};
export function makePoster(m){
  if(POSTER[m.id])return POSTER[m.id];
  const w=400,h=600,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
  drawArt(ctx,m,w,h,1.2);
  const [c0,c1,c2,c3]=m.pal;ctx.textAlign='center';ctx.textBaseline='alphabetic';
  // bottom fade for title
  const g=ctx.createLinearGradient(0,h*.62,0,h);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.75)');ctx.fillStyle=g;ctx.fillRect(0,h*.6,w,h*.4);
  ctx.fillStyle=hexA(c3,.8);ctx.font='600 11px Manrope, sans-serif';spaced(ctx,m.tag,w/2,34,3);
  const title=m.title.toUpperCase();const ts=fitText(ctx,title,w-40,96,'Anton, Impact, sans-serif');
  ctx.save();ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=18;
  const tg=ctx.createLinearGradient(0,h-150,0,h-70);tg.addColorStop(0,c3);tg.addColorStop(1,mixHex(c3,c2,.45));ctx.fillStyle=tg;
  ctx.font=`${ts}px Anton, Impact, sans-serif`;spaced(ctx,title,w/2,h-78,2);ctx.restore();
  ctx.fillStyle='rgba(255,255,255,.55)';ctx.font='700 8.5px Manrope, sans-serif';
  spaced(ctx,('A FILM BY '+m.dir).toUpperCase(),w/2,h-56,1.5);
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.font='600 6.5px Manrope, sans-serif';
  spaced(ctx,('STARRING '+m.cast.join('  ·  ')).toUpperCase(),w/2,h-42,1);
  spaced(ctx,'MUSIC · CINEMATOGRAPHY · EDITING · PRODUCTION DESIGN · ACTION · VFX · SOUND',w/2,h-32,.6);
  ctx.fillStyle=hexA(c2,.95);ctx.font='800 10px Manrope, sans-serif';spaced(ctx,(m.release||'').toUpperCase(),w/2,h-15,3);
  return POSTER[m.id]=c.toDataURL('image/jpeg',.86);
}
export function makeBackdrop(m){
  if(BACKDROP[m.id])return BACKDROP[m.id];
  const b=document.createElement('canvas');b.width=960;b.height=540;drawArt(b.getContext('2d'),m,960,540,2);return BACKDROP[m.id]=b.toDataURL('image/jpeg',.82);
}
export function makeEventArt(ev,w=480,h=300){
  if(EVART[ev.id])return EVART[ev.id];
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');const[c0,c1]=ev.c;
  vgrad(ctx,w,h,[[0,c0],[1,mixHex(c0,c1,.35)]]);const R=rng(hashStr(ev.n));
  for(let i=0;i<9;i++)glow(ctx,R()*w,R()*h,120+R()*120,c1,.25);
  ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<6;i++){ctx.fillStyle=hexA(c1,.08);ctx.beginPath();const x=w*(.1+i*.16);ctx.moveTo(x,0);ctx.lineTo(x+20,0);ctx.lineTo(x+120*(i%2?1:-1),h);ctx.lineTo(x-60*(i%2?1:-1),h);ctx.fill()}ctx.restore();
  for(let i=0;i<14;i++)figure(ctx,R()*w,h+10,90+R()*40,hexA('#000000',.85));
  ctx.font='86px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ev.e,w/2,h*.42);
  return EVART[ev.id]=c.toDataURL('image/jpeg',.82);
}

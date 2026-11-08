// Events / plays / sports. Image for each: public/assets/events/<id>.jpg
export const EVENTS = {
 events:[
  {id:'sunburn-arena-ft-neon-tides',n:'Sunburn Arena ft. Neon Tides',v:'Palace Grounds',d:'Sat, 21 Nov',p:1499,c:['#1a0530','#ff2fb3'],e:'🎧',g:'Music · EDM'},
  {id:'a-r-rahman-live-wonderment-tour',n:'A. R. Rahman Live — Wonderment Tour',v:'YMCA Grounds',d:'Sat, 5 Dec',p:2500,c:['#04122a','#2fa8ff'],e:'🎼',g:'Concert'},
  {id:'indie-nights-folk-fuzz',n:'Indie Nights: Folk & Fuzz',v:'The Courtyard',d:'Fri, 13 Nov',p:699,c:['#0c1f12','#3fd27a'],e:'🎸',g:'Music · Indie'},
  {id:'stand-up-saturdays',n:'Stand-up Saturdays',v:'Laugh Factory Hall',d:'Every Sat',p:499,c:['#2a1404','#ffb020'],e:'🎤',g:'Comedy'},
  {id:'anime-comic-fest',n:'Anime & Comic Fest',v:'Trade Centre',d:'28–29 Nov',p:899,c:['#200528','#c35bff'],e:'🎌',g:'Expo'},
  {id:'food-truck-carnival',n:'Food Truck Carnival',v:'Island Grounds',d:'Sun, 15 Nov',p:199,c:['#2a0a04','#ff6a3d'],e:'🍜',g:'Food'},
 ],
 plays:[
  {id:'ponniyin-selvan-the-stage-epic',n:'Ponniyin Selvan — The Stage Epic',v:'Music Academy',d:'Sat, 14 Nov',p:999,c:['#2a1a04','#e2a93b'],e:'🎭',g:'Theatre · Tamil'},
  {id:'the-last-letter',n:'The Last Letter',v:'Alliance Française',d:'Fri, 20 Nov',p:450,c:['#0b0b18','#7c8cff'],e:'✉️',g:'Drama · English'},
  {id:'kathakali-kalyana-sougandhikam',n:'Kathakali: Kalyana Sougandhikam',v:'Kalakshetra',d:'Sun, 22 Nov',p:350,c:['#2a0606','#ff4848'],e:'🪭',g:'Classical'},
  {id:'improv-jam',n:'Improv Jam',v:'The Little Theatre',d:'Thu, 19 Nov',p:300,c:['#06201f','#26d6c4'],e:'🃏',g:'Comedy · Improv'},
 ],
 sports:[
  {id:'chennai-vs-bengaluru-super-clash',n:'Chennai vs Bengaluru — Super Clash',v:'Chepauk Stadium',d:'Sun, 29 Nov',p:1200,c:['#2a2104','#ffd23d'],e:'🏏',g:'Cricket'},
  {id:'indian-super-league-matchday-9',n:'Indian Super League: Matchday 9',v:'Nehru Stadium',d:'Sat, 14 Nov',p:399,c:['#04182a','#2a9dff'],e:'⚽',g:'Football'},
  {id:'pro-kabaddi-thalaivas-vs-bulls',n:'Pro Kabaddi: Thalaivas vs Bulls',v:'Indoor Arena',d:'Wed, 18 Nov',p:499,c:['#2a0812','#ff3d7f'],e:'🤼',g:'Kabaddi'},
  {id:'city-marathon-2026',n:'City Marathon 2026',v:'Marina Beach',d:'Sun, 6 Dec',p:899,c:['#05220f','#3ddc84'],e:'🏃',g:'Running'},
 ]
};
export const ALL_EVENTS = [...EVENTS.events, ...EVENTS.plays, ...EVENTS.sports];

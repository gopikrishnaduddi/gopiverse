// Edit this file to change movies. Images/trailers are picked up automatically from
// public/assets/posters/<id>.jpg, public/assets/backdrops/<id>.jpg and public/assets/trailers/<id>.mp4
// (see README.md). If a file is missing, generated poster art is used instead.

export const LANGS = ['Tamil','Telugu','Kannada','Malayalam','Hindi'];

// pal: [deep, mid, accent, text] colours used for the fallback art + hero glow.
// motif: style of the generated fallback poster.
export const MOVIES = [
 {id:'vikram',title:'Vikram',lang:'Tamil',langs:['Tamil','Telugu','Hindi','Kannada','Malayalam'],cert:'UA',genres:['Action','Thriller'],dur:'2h 54m',rating:9.2,votes:'312K',status:'now',release:'Re-release',
  cast:['Kamal Haasan','Vijay Sethupathi','Fahadh Faasil'],dir:'Lokesh Kanagaraj',pal:['#0b0b0d','#3a3a3e','#e8382f','#f2f2f2'],motif:'smoke',tag:'WORLDWIDE RELEASE ON JUNE 3',
  about:'A black-ops veteran is pulled back into a shadow war when a string of masked killings points to a drug empire that runs deeper than anyone imagined. Back on the big screen in IMAX and 4DX.'},
 {id:'leo',title:'Leo',lang:'Tamil',langs:['Tamil','Telugu','Hindi','Kannada'],cert:'UA',genres:['Action','Drama'],dur:'2h 44m',rating:8.4,votes:'226K',status:'now',release:'In cinemas',
  cast:['Vijay','Trisha','Sanjay Dutt','Arjun Sarja'],dir:'Lokesh Kanagaraj',pal:['#1a2b33','#8a6a48','#c8302a','#f3e9d8'],motif:'mountain',tag:'OCT 19 · RELEASING',
  about:'A quiet café owner in the hills is forced to defend his family when his past — and a name he swore he had buried — comes looking for him.'},
 {id:'coolie',title:'Coolie',lang:'Tamil',langs:['Tamil','Telugu','Hindi','Kannada','Malayalam'],cert:'A',genres:['Action','Thriller'],dur:'2h 50m',rating:8.6,votes:'184K',status:'now',release:'AUG 14',
  cast:['Rajinikanth','Nagarjuna','Shruti Haasan','Soubin Shahir'],dir:'Lokesh Kanagaraj',pal:['#3b0a07','#c2361f','#f6c14a','#fff4dc'],motif:'rays',tag:'RELEASING WORLDWIDE AUG 14',
  about:'At a sprawling port where gold moves in the dark, an old dock worker with a dangerous memory sets out to settle a score the whole harbour wants forgotten.'},
 {id:'varanasi',title:'Varanasi',lang:'Telugu',langs:['Telugu','Tamil','Hindi','Kannada','Malayalam'],cert:'UA',genres:['Adventure','Mythology'],dur:'3h 05m',rating:9.6,votes:'—',status:'prebook',release:'APRIL 2027',
  cast:['Mahesh Babu','Priyanka Chopra Jonas','Prithviraj Sukumaran'],dir:'S. S. Rajamouli',pal:['#030714','#163170','#ff8a3d','#cfe0ff'],motif:'meteor',sky:'#3a6fd8',tag:'APRIL · 2027',
  about:'A globe-trotting adventure that collides ancient myth with the end of the world — shot for IMAX and built for the biggest screen you can find. Pre-booking is open for the opening weekend.'},
 {id:'toxic',title:'Toxic',lang:'Kannada',langs:['Kannada','English','Hindi','Tamil','Telugu','Malayalam'],cert:'A',genres:['Gangster','Period'],dur:'2h 38m',rating:9.5,votes:'58K',status:'now',release:'In cinemas',
  cast:['Yash','Nayanthara','Kiara Advani'],dir:'Geetu Mohandas',pal:['#060606','#3d3d3d','#bdbdbd','#ffffff'],motif:'smoke2',tag:'A FAIRY TALE FOR GROWN-UPS',
  about:'A stylised period gangster saga set in a coastal city of casinos and cartels, told as a dark fairy tale for grown-ups.'},
 {id:'jailer2',title:'Jailer 2',lang:'Tamil',langs:['Tamil','Telugu','Hindi','Kannada'],cert:'UA16+',genres:['Action','Thriller'],dur:'2h 48m',rating:9.1,votes:'96K',status:'now',release:'15.10.26',
  cast:['Rajinikanth','Mohanlal','Ramya Krishnan','Shiva Rajkumar'],dir:'Nelson Dilipkumar',pal:['#0e3a3a','#2f7f86','#f08a24','#fff2e0'],motif:'sun',tag:'IN CINEMAS 15.10.26',
  about:'The retired jailer is back. When a new syndicate threatens the quiet life he fought for, Muthuvel Pandian returns with the same calm — and a much bigger plan.'},
 {id:'ramayana',title:'Ramayana',lang:'Hindi',langs:['Hindi','Tamil','Telugu','Kannada','Malayalam'],cert:'U',genres:['Mythology','Epic'],dur:'2h 55m',rating:9.4,votes:'—',status:'prebook',release:'DIWALI 2026',
  cast:['Ranbir Kapoor','Yash','Sai Pallavi','Sunny Deol'],dir:'Nitesh Tiwari',pal:['#2a0d05','#a2401a','#f5c04a','#fff1c9'],motif:'temple',tag:'PART ONE · DIWALI',
  about:'The oldest story ever told, re-imagined as a two-part epic with a scale Indian cinema has never attempted before.'},
 {id:'war2',title:'War 2',lang:'Hindi',langs:['Hindi','Tamil','Telugu'],cert:'UA',genres:['Spy','Action'],dur:'2h 53m',rating:7.2,votes:'121K',status:'now',release:'In cinemas',
  cast:['Hrithik Roshan','N. T. Rama Rao Jr.','Kiara Advani'],dir:'Ayan Mukerji',pal:['#04121f','#1d4e7a','#e6eef7','#ffffff'],motif:'shards',tag:'THE SPY UNIVERSE RETURNS',
  about:'Two elite agents on opposite sides of a mission that spans four continents. Only one walks away.'},
 {id:'animal',title:'Animal',lang:'Hindi',langs:['Hindi','Tamil','Telugu','Kannada','Malayalam'],cert:'A',genres:['Crime','Drama'],dur:'3h 21m',rating:7.9,votes:'402K',status:'now',release:'Re-release',
  cast:['Ranbir Kapoor','Anil Kapoor','Bobby Deol','Rashmika Mandanna'],dir:'Sandeep Reddy Vanga',pal:['#1b120b','#6b4b2e','#d9a35b','#f4e6cf'],motif:'storm',tag:'DIRECTOR\'S CUT',
  about:'A son\'s obsession with his father\'s love turns into a violent crusade that spares no one — least of all himself.'},
 {id:'kantara',title:'Kantara Chapter 1',short:'Kantara',lang:'Kannada',langs:['Kannada','Hindi','Tamil','Telugu','Malayalam'],cert:'UA',genres:['Mythology','Action'],dur:'2h 48m',rating:9.3,votes:'287K',status:'now',release:'In cinemas',
  cast:['Rishab Shetty','Rukmini Vasanth','Jayaram'],dir:'Rishab Shetty',pal:['#120603','#7a1d08','#ff9d2a','#ffe7c2'],motif:'fire',tag:'THE LEGEND BEGINS',
  about:'Centuries before the first story, a forest kingdom, a sacred spirit and a warrior who must choose between the throne and the land.'},
 {id:'pushpa2',title:'Pushpa 2',lang:'Telugu',langs:['Telugu','Tamil','Hindi','Kannada','Malayalam'],cert:'UA',genres:['Action','Drama'],dur:'3h 20m',rating:8.1,votes:'510K',status:'now',release:'The Rule',
  cast:['Allu Arjun','Rashmika Mandanna','Fahadh Faasil'],dir:'Sukumar',pal:['#1a0503','#8f1410','#ffcc33','#fff0d0'],motif:'fire2',tag:'THE RULE',
  about:'The red sandalwood smuggler who refused to bow now rules the trade — and every enemy he made along the way wants him gone.'},
 {id:'empuraan',title:'L2: Empuraan',short:'Empuraan',lang:'Malayalam',langs:['Malayalam','Tamil','Telugu','Kannada','Hindi'],cert:'UA16+',genres:['Action','Political'],dur:'2h 59m',rating:8.0,votes:'144K',status:'now',release:'In cinemas',
  cast:['Mohanlal','Prithviraj Sukumaran','Manju Warrier','Tovino Thomas'],dir:'Prithviraj Sukumaran',pal:['#0a0a0a','#4a0b0b','#e3302a','#f5f5f5'],motif:'storm2',tag:'LUCIFER · PART 2',
  about:'Stephen Nedumpally\'s other life — a global power broker known only as Khureshi Ab\'raam — collides with the politics of home.'},
 {id:'kalki',title:'Kalki 2898 AD',short:'Kalki',lang:'Telugu',langs:['Telugu','Tamil','Hindi','Kannada','Malayalam'],cert:'UA',genres:['Sci-Fi','Mythology'],dur:'3h 01m',rating:8.5,votes:'356K',status:'now',release:'In 3D',
  cast:['Prabhas','Amitabh Bachchan','Kamal Haasan','Deepika Padukone'],dir:'Nag Ashwin',pal:['#1a1206','#9c6b2c','#47e3ff','#fff5e1'],motif:'rings',tag:'THE FUTURE IS ANCIENT',
  about:'In a desert city ruled from an inverted pyramid, a bounty hunter is hired to find a woman who carries the future of the world.'},
 {id:'manjummel',title:'Manjummel Boys',short:'Manjummel',lang:'Malayalam',langs:['Malayalam','Tamil','Telugu'],cert:'UA',genres:['Survival','Thriller'],dur:'2h 15m',rating:9.0,votes:'198K',status:'now',release:'Based on true events',
  cast:['Soubin Shahir','Sreenath Bhasi','Balu Varghese'],dir:'Chidambaram',pal:['#03100b','#145a3d','#c8ffdf','#ffffff'],motif:'cave',tag:'BASED ON TRUE EVENTS',
  about:'A group of friends on a road trip to Kodaikanal wander into the Guna caves. One of them falls. The rest refuse to leave.'},
 {id:'stree2',title:'Stree 2',lang:'Hindi',langs:['Hindi','Tamil','Telugu'],cert:'UA',genres:['Horror','Comedy'],dur:'2h 29m',rating:8.7,votes:'267K',status:'now',release:'In cinemas',
  cast:['Shraddha Kapoor','Rajkummar Rao','Pankaj Tripathi','Abhishek Banerjee'],dir:'Amar Kaushik',pal:['#070b18','#25305e','#e7f0ff','#ffffff'],motif:'moon',tag:'SARKATE KA AATANK',
  about:'Chanderi has a new terror — and the town\'s favourite tailor and his friends are, once again, the only ones foolish enough to stand up to it.'},
 {id:'kgf2',title:'KGF Chapter 2',short:'KGF 2',lang:'Kannada',langs:['Kannada','Tamil','Telugu','Hindi','Malayalam'],cert:'UA',genres:['Action','Period'],dur:'2h 48m',rating:9.0,votes:'611K',status:'now',release:'Re-release',
  cast:['Yash','Sanjay Dutt','Raveena Tandon','Srinidhi Shetty'],dir:'Prashanth Neel',pal:['#120c04','#5b4214','#f2b33d','#fff1d2'],motif:'smoke3',tag:'VIOLENCE LIKES ME',
  about:'Rocky rules the gold fields of Narachi. But the empire he built in blood draws enemies from every direction — including the government itself.'},
];

export const BY_ID = Object.fromEntries(MOVIES.map(m => [m.id, m]));

// Screens in the home-page 3D ring, in order
export const FEATURED = ['vikram','leo','coolie','varanasi','toxic','jailer2','ramayana','kantara','kalki','war2','pushpa2','empuraan'];

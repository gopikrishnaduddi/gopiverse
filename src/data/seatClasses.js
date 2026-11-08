// Seat classes & prices in the 3D hall
export const SEAT_CLASSES = [
 {k:'royal',name:'Royal Recliner',sub:'Motorised recliners · F&B to seat',price:550,color:'#e9a628'},
 {k:'balcony',name:'Balcony',sub:'Elevated view · centre aligned',price:320,color:'#9b6bff'},
 {k:'prime',name:'Prime',sub:'Sweet spot for sound & picture',price:240,color:'#1fa463'},
 {k:'classic',name:'Classic',sub:'Front rows · big screen energy',price:160,color:'#4f7cff'},
];
export const CLS = Object.fromEntries(SEAT_CLASSES.map(c => [c.k, c]));

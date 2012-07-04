islandTypes = new Array();
islandTypes[0]={"maxCount":  30, "radius": 20, "rate": 1600 };
islandTypes[1]={"maxCount":  80, "radius": 28, "rate": 1200 };
islandTypes[2]={"maxCount": 140, "radius": 35, "rate":  800 };
islandTypes[3]={"maxCount": 300, "radius": 48, "rate":  500 };
exports.islands =[];
exports.planes = 0;
exports.islandTypes= islandTypes;

var intRand = exports.intRand = function(i){  return Math.floor(Math.random()*i);}

var regDist = exports.regDist = function(a,b,cmpDist){
   return Math.pow(Math.abs(a[0]-b[0]),2)+Math.pow(Math.abs(a[1]-b[1]),2)
         - cmpDist*cmpDist;
}  // if (x < y)    sameAs if (x - y < 0)

var dist = exports.dist = function(a,b){
   return Math.sqrt(Math.pow(Math.abs(a[0]-b[0]),2)+Math.pow(Math.abs(a[1]-b[1]),2));
}

var common = require('common');

var islands, planes, islandTypes; //These are read-only! how to force that?
                                  // yet get updates (no 1-time-copy);
var players = [];
var iDist = Array();

var levelAIPlayerCreate = exports.levelAIPlayerCreate = function(playerNum){
   // Called here when the level is deigned (once only)
   //select which  AI to use (when we have >1)
   players[playerNum] = new ai5(playerNum);
   return 5; // the only AI player type at the moment (1-4 for human2, net, etc)
   // (islands not done) This API sets statics only
}

var gameSetup = exports.gameSetup = function(srcIslands, srcPlanes,srcIslandTypes){
   islands = srcIslands;
   planes = srcPlanes;
   islandTypes = srcIslandTypes;
   // build intermediate data used by each player's AI as-well-as shared data;
   // TODO foreach player: build "closest, best" graphs etc
   for (i in islands){ 
      iDist[i] = Array();
      for (j in islands) 
         iDist[i][j] = common.dist(islands[i].pos,islands[j].pos);
   }
   for (p in players){
      players[p].setup();
   }
}

var update = exports.update = function(playerNum){
 return players[playerNum].update(); //returns array of [src,dest] tuples;
}

//////////////////AI implementations below here
function ai5 (playerNum){ //this fn cannot use "islands"
   if ( !(this instanceof arguments.callee) ) 
      throw new Error("Constructor called as a function");
   this.playerNum = playerNum; 
   this.a = 0;
   return this;
};
ai5.prototype.setup = function (){
   //calc island maps: if we own this one, how attractive does that make other islands to go get?
};
ai5.prototype.update = function (){
   myReadyIslands = [];
   readySum = 0;
   for (i in islands)
	if ( islands[i].owner == this.playerNum && 
		islands[i].count > 20*(islands[i].type+1)){
           myReadyIslands.push(i);
           readySum+=islands[i].count;
           }

   if (! myReadyIslands.length) return [];
   //ready to act. Attack? defend? Grow?
   returnArray = [];
   
   this.a = (this.a+1)%17; //every so often
   if (this.a==0){
     if (myReadyIslands.length < 4){ // Grow, to where?
         bestScore = 0;
         r = -1; //select an island at random
       for (i in islands.filter(function(i){return i.owner!=this.playerNum})){
           totalDist=0;
           da = myReadyIslands.map(function(h){return iDist[h][i];})
           for (y in da)
             totalDist+=da[y]; 
           score = (islands[i].type+1)*(islands[i].owner==0?2:1)*
		((readySum - islands[i].count-20)/6)/(totalDist/12);
           console.log(score);
           if (score > bestScore && score > 0){
              r = i; bestScore = score;
              }
           } 
     }else{
        console.log("going random");
        r = common.intRand(islands.length); //select an island at random
        //TODO this is really dumb. Lets attack here
     }
     if (r > -1)
       for (i in myReadyIslands)  //and send people there
          returnArray.push([myReadyIslands[i],r]);
   }
   return returnArray; //usually [[start,end],[start2,end2]]
};

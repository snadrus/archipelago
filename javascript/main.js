/*
 * @fileoverview
 * Sparkles with position and alpha are created by mouse movement.
 * The sparkles position is updated in a time-dependant way. A sparkle
 * is removed from the simulation once it leaves the screen.
 *
 * Additionally, by pressing the cursor UP key the existing sparkles will
 * move upwards (movement vecor inverted).
 *
 */
var gamejs = require('gamejs');
var draw = require('gamejs/draw');
var aiBase = require('islandAI');
var common = require('common');
islandTypes = new Array();  //TODO trash this & use the common one (shorter nm?)
islandTypes[0]={"maxCount":  30, "radius": 20, "rate": 1600 };
islandTypes[1]={"maxCount":  80, "radius": 28, "rate": 1200 };
islandTypes[2]={"maxCount": 140, "radius": 35, "rate":  800 };
islandTypes[3]={"maxCount": 300, "radius": 48, "rate":  500 };

playerColor = new Array("rgba(0,0,0,0)",
                        "rgba(0,0,255,0.8)",
                        "rgba(255,0,0,0.8)",
                        "rgba(127,0,127,0.8)");
function main() {
   var display = gamejs.display.setMode([600, 400]);
   gamejs.display.setCaption("Andy's Islands");
   var planeImage = gamejs.image.load('images/plane.png');

   var islands = []; var targets = [];
   var scenery = new gamejs.Surface(display.rect);
   var yFont = new gamejs.font.Font('12px monospace');
   var planes = new gamejs.sprite.Group();
   var cycle = 0;
   var players = [0];

   var Plane = function(xy, iDest, count, owner) { // call superconstructor
      Plane.superConstructor.apply(this, arguments);
      rAng= Math.atan2(islands[iDest].pos[1]-xy[1],islands[iDest].pos[0]-xy[0]);
      degAngle = rAng * 180 / 3.1415926535;
      this.image = gamejs.transform.rotate(planeImage, degAngle);// Begin Art
      f = yFont.render(count, "#ffff00"); 
      fsz = f.getSize();
      this.imgSz = this.image.getSize();
      draw.circle(this.image, playerColor[owner], this.image.rect.center, 10);
      this.image.blit(f,[this.imgSz[0]*0.5-(fsz[0]*0.5),this.imgSz[1]*0.5-(fsz[1]*0.5)]);
      this.rect = new gamejs.Rect([xy[0]-(this.imgSz[0]*0.5),
   				   xy[1]-(this.imgSz[1]*0.5)],
		 this.imgSz);
      this.owner = owner;  // Begin Variable saves
      this.count = count;
      this.iDest = iDest;
      this.iDestRad = islandTypes[islands[iDest].type].radius;
      this.dx = Math.cos(rAng)*30;  //experimental
      this.dy = Math.sin(rAng)*30;
      this.oldV = Infinity;
      return this;
   };
   // inherit (actually: set prototype)
   gamejs.utils.objects.extend(Plane, gamejs.sprite.Sprite);
   Plane.prototype.update = function(msDuration) {
      this.rect.moveIp(this.dx* (msDuration/1000), this.dy* (msDuration/1000));
      v = common.regDist(islands[this.iDest].pos, this.rect.center, this.iDestRad);
      if (v < 0 || v > this.oldV){      //we have arrived
         islands[this.iDest].count+= (this.count * 
	                       (islands[this.iDest].owner==this.owner?1:-1));
         if (islands[this.iDest].count == 0){
      	    islands[this.iDest].owner = 0;
   	    clearInterval(islands[this.iDest].interval);
         }else if (islands[this.iDest].count < 0){ 
   	    islands[this.iDest].count *= -1;
   	    islands[this.iDest].owner = this.owner;
   	    clearInterval(islands[this.iDest].interval);
   	    islands[this.iDest].interval = setInterval(function(i){islandGrow(i)},islandTypes[islands[this.iDest].type].rate,this.iDest);
         }
         this.kill();
        
      }
      this.oldV = v;
   };
   function drawPopulationCircle(display, owner, pos, count){
      draw.circle(display, playerColor[owner], pos, 10)
      fontSurf = yFont.render(count, "#ffff00");
      sz = fontSurf.getSize();
      display.blit(fontSurf,[pos[0]-(sz[0]/2),pos[1]-(sz[1]/2)]);
   }
   function islandGrow(i){  //start by timer
      if (islands[i].owner == 0){
         clearInterval(islands[i].interval); islands[i].interval = null;}
      else if (islandTypes[islands[i].type].maxCount > islands[i].count)  
         islands[i].count++;//update 
   }
   function dispatchPlane(src,dest){ // args: islands 
     planes.add(new Plane(islands[src].pos, dest, Math.floor(islands[src].count / 2), islands[src].owner));
     islands[src].count -= Math.floor(islands[src].count/2);
     targets.push({color: playerColor[islands[src].owner],island: dest, sz: 15});
   }
   function checkWinLose(){
      var anyPlayer = anyAI = 0;
      for (i in islands){
         if (islands[i].owner==1) anyPlayer=1; 
	 else if (islands[i].owner>1) anyAI=1;
         if (anyPlayer && anyAI) return;
      }
      if (planes.sprites().filter(
		function(p){return anyAI ?p.owner==1:p.owner>1;}).length==0)
        gameStop(anyPlayer); //anyPlayer-->ret0
   }
   function gameStop(cond){ //0==lose, 1==win, 2==pause
      for (i in islands)
        if (islands[i].interval) clearInterval(islands[i].interval);
      gamejs.time.deleteCallback(tick, 30);
      menuOptions = (2==cond?["Resume"]:[]).concat(["New Game", "Reset"]);
      buttons = new Array(); buttonRenders = new Array();
      wFont = new gamejs.font.Font('30px Georgia');
      for (b=0;b<menuOptions.length;b++){
         buttonRenders[b] = t = wFont.render(menuOptions[b],"#fff");
         buttons[b] = new gamejs.Rect([50,50*(b+2)],[t.rect.width, t.rect.height]);
      }
      gameStopInt = function(){
         display.fill('#151');
         text= cond==2?"Paused": "You "+ (cond==1?"Won!":"Lost");
         display.blit(wFont.render(text, "#ffffff"),[30,30]);
         for (b=0;b<menuOptions.length;b++)
            display.blit(buttonRenders[b],[50,50*(b+2)]);
         gamejs.event.get().forEach(function(event) {
            if (event.type === gamejs.event.MOUSE_UP) 
              for (b=0;b<buttons.length;b++){
                if (buttons[b].collidePoint(event.pos)){ //something clicked
                   gamejs.time.deleteCallback(gameStopInt,30);
                   if (buttons.length==3 && 0==b) startIntervals();// Resume btn
                   else if (buttons.length -1 == b) gameSetup(); // reset
                   else main(); //New Game
                }
             }
         });
      }
      gamejs.time.fpsCallback(gameStopInt,null,30);
   }
   function tick(msDuration) {
      gamejs.event.get().forEach(function(event) {// handle key / mouse events
         if (event.type === gamejs.event.KEY_UP) {
            if (event.key === gamejs.event.K_UP) {            };
         } else if (event.type === gamejs.event.MOUSE_MOTION) {
         } else if (event.type === gamejs.event.MOUSE_DOWN) {
            if (event.pos[1]>display.rect.height-16 && event.pos[0]<40)
               gameStop(2);
            oldSelection = selection;
            for (i=0;i<islands.length && 
	common.regDist(event.pos,islands[i].pos,islandTypes[islands[i].type].radius)>=0;i++){}
            if (i != islands.length){  // we actually clicked something
               selection = (i==oldSelection)?-1:i;
               if (selection > -1 && oldSelection > -1 && islands[oldSelection].owner==1){
                  dispatchPlane(oldSelection, selection);
                  selection = oldSelection = -1;
               }
            }
        }
      });

      cycle = (cycle+1)%10;
      if (9==cycle) checkWinLose();
      else if (cycle>1 && cycle <= numPlayers && players[cycle]>4) 
           aiBase.update(cycle).forEach(function(aiMove){
              console.log(aiMove);
              if (cycle == islands[aiMove[0]].owner) //no cheating (but can still chg data TODO)
                 dispatchPlane(aiMove[0],aiMove[1]);
            });
      
      planes.update(msDuration);
      display.blit(scenery);            //erase
      for (i=0;i<islands.length;i++)
          drawPopulationCircle(display, islands[i].owner, islands[i].pos, islands[i].count);  

      targets = targets.filter(function(t){
         radius = islandTypes[islands[t.island].type].radius + t.sz;
         pos = islands[t.island].pos;
         draw.circle(display, t.color, pos, radius, 3);
         draw.line(display, t.color, [pos[0]-radius,pos[1]],[pos[0]-radius+5,pos[1]],3);
         draw.line(display, t.color, [pos[0]+radius,pos[1]],[pos[0]+radius-5,pos[1]],3);
         draw.line(display, t.color, [pos[0],pos[1]-radius],[pos[0],pos[1]-radius+5],3);
         draw.line(display, t.color, [pos[0],pos[1]+radius],[pos[0],pos[1]+radius-5],3);
         t.sz -= 0.8;
         return t.sz > 3; //trash those 
      });     

      if (selection > -1)
         draw.circle(display,"rgba(255,255,0,0.8)",islands[selection].pos, islandTypes[islands[selection].type].radius + 6, 2);

      //TODO use gamejs sprites to test for collission
      planes. draw(display);
   };

   function buildIslands(){
	scenery.fill('#77f');
	islandCount = common.intRand(6)+10;
        function drawIsland(type, count, owner){
           islands.push({"type":type,"origOwner":owner,"origCount":count});
           cur = islands.length -1 ;
           r = islandTypes[islands[cur].type].radius;
           do{
           islands[cur].pos = [common.intRand(display.rect.width),common.intRand(display.rect.height)];
           guessAgain = 0;
              if (islands[cur].pos[0]-r < 4  || islands[cur].pos[1]-r < 4  ||
                islands[cur].pos[0]+r >= display.rect.width - 4 || 
                islands[cur].pos[1]+r >= display.rect.height - 4)
                 guessAgain=1;
              for(b=0;b<cur;b++)
                 if (common.regDist(islands[cur].pos,islands[b].pos,
			 r + islandTypes[islands[b].type].radius+4)<0)
                   guessAgain=1;
           }while(guessAgain==1);
           draw.circle(scenery,"#edc9af", islands[cur].pos, r, 3); 
           draw.circle(scenery,"#228b22", islands[cur].pos, r-2,0);
        }
	for (a=0;a<islandCount;a++){
           type = common.intRand(18); type = type==0?3:type<4?2:type<11?1:0;
           drawIsland(type, 8+Math.floor((common.intRand(5)+5)*0.6*(type+1)),0); // count
	}

        numPlayers = 2+ common.intRand(2);  
        players = []; 
        for (p=1;p<=numPlayers;p++){
           drawIsland(1,common.intRand(10)+40-(p==0?12:0),p);   // Type 2 islands for everyone
           if (p > 1) {  // AI              
              players[p]=aiBase.levelAIPlayerCreate(p);
           }else players[p]=1;
        }
        //TODO smear/blur here
        w = display.rect.width / 6;  ////Decorative lines
        h = display.rect.height / 6;
        for (a=1;a<6;a++){
           draw.line(scenery,"rgba(255,255,255,0.2)",[w*a,0],[w*a,display.rect.height]);
           draw.line(scenery,"rgba(255,255,255,0.2)",[0,h*a],[display.rect.width,h*a]);
        }
        wFont = new gamejs.font.Font('12px monospace');
        scenery.blit(wFont.render("Pause", "#000"),[5,h*6-16]);
	draw.rect(scenery,'#888888',display.rect, 5);
    }
   buildIslands(); // one-time for replays

  function gameSetup(){   //ran to replay the level, or setup
      for (i=0;i<islands.length;i++){
         islands[i].count = islands[i].origCount; 
         islands[i].owner = islands[i].origOwner;
      }
      selection = oldSelection =-1; //what our cursor has selected
      planes.empty(); // clear the planes in the air for resets
      aiBase.gameSetup(islands, planes, islandTypes);
      startIntervals();  // placed here for new level
   }
   gameSetup();

   function startIntervals(){  //called from reset
      gamejs.time.fpsCallback(tick, this, 30);
      for (i=0;i<islands.length;i++)
         if (islands[i].owner > 0)
            islands[i].interval = setInterval(function(i){islandGrow(i)},islandTypes[islands[i].type].rate,i);
   }
};

gamejs.preload(['images/plane.png']);
gamejs.ready(main);

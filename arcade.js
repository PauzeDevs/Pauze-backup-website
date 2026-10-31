/* PAUZE ARCADE: six standalone canvas games */
(()=>{
 const cv=document.querySelector("#dino-canvas"),stage=document.querySelector("#dino-stage"),overlay=document.querySelector("#dino-overlay"),picker=document.querySelector(".arcade-game-picker"),touch=document.querySelector("#arcade-touch-controls"),start=document.querySelector("#dino-start"),restart=document.querySelector("#dino-restart");
 const heading=document.querySelector("#arcade-game-title"),status=document.querySelector("#dino-state"),scoreEl=document.querySelector("#dino-score"),bestEl=document.querySelector("#dino-best"),modeEl=document.querySelector("#arcade-mode-label"),modeVal=document.querySelector("#arcade-mode-value"),help=document.querySelector("#arcade-instructions"),overTitle=document.querySelector("#dino-overlay-title"),overCopy=document.querySelector("#dino-overlay-copy");
 if(!cv||!stage||!overlay||!picker||!start)return;const c=cv.getContext("2d");if(!c){overTitle.textContent="GAME UNAVAILABLE";start.hidden=true;return;}
 const W=900,H=260,G=218,ink="#151a25",muted="#606b7c",purple="#315efb",green="#d4ff70",cactusColor="#26324a",pink="#315efb",yellow="#d4ff70",white="#ffffff",blue="#dbe4ff",bgc="#f4f6f3";
 const config={
 dino:["DINO RUN / ENDLESS MODE","Jump obstacles and beat your best score.","START RUN","SPACE / ↑ JUMP • ↓ DUCK • P PAUSE","SPEED",[["jump","JUMP ↑"],["duck","DUCK ↓"]]],
 snake:["SNAKE.EXE / SURVIVAL MODE","Eat the data. Grow the line. Avoid yourself and the walls.","START SNAKE","ARROWS / WASD MOVE • P PAUSE","PACE",[["up","UP ↑"],["left","← LEFT"],["down","DOWN ↓"],["right","RIGHT →"]]],
 space:["SPACE PROTOCOL / DEFENCE MODE","Shoot the incoming signals before they reach your ship.","DEPLOY SHIP","← / → MOVE • SPACE / X FIRE • P PAUSE","WAVE",[["left","← LEFT"],["fire","FIRE ✦"],["right","RIGHT →"]]],
 breakout:["BREAKPOINT / BRICK MODE","Keep the ball alive and break every block.","START BREAKOUT","← / → OR A / D MOVE PADDLE • P PAUSE","LEVEL",[["left","← LEFT"],["right","RIGHT →"]]],
 memory:["MEMORY LEAK / MATCH MODE","Find all eight pairs. Fewer turns means a cleaner system.","OPEN MEMORY","TAP / CLICK TWO CARDS TO FIND A MATCH","PAIRS",[]],
 pong:["PING.EXE / PLAYER VS CPU","Beat the CPU to five points. Keep the paddle ready.","START MATCH","↑ / ↓ OR W / S MOVE • FIRST TO 5 WINS","CPU",[["up","UP ↑"],["down","DOWN ↓"]]]
 };
 let game="dino",s=null,score=0,best=0,time=0,last=0,raf=0,running=false,paused=false,ended=false;
 const k={left:false,right:false,up:false,down:false,duck:false},rnd=(a,b)=>Math.random()*(b-a)+a,fmt=n=>String(Math.max(0,Math.floor(n))).padStart(5,"0"),storage=()=>"pauze-arcade-"+game+"-best-v1";
 const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const txt=(v,x,y,size,col=muted,align="left")=>{c.fillStyle=col;c.font="700 "+size+"px monospace";c.textAlign=align;c.fillText(v,x,y);};
 const background=col=>rect(0,0,W,H,col||bgc);
 const show=(tag,title,copy,button)=>{overlay.querySelector(".dino-overlay-label").textContent=tag;overTitle.textContent=title;overCopy.textContent=copy;start.textContent=button+" ↗";overlay.hidden=false;};
 const hide=()=>overlay.hidden=true,stat=v=>status.textContent=v,clearKeys=()=>Object.keys(k).forEach(a=>k[a]=false);
 const bestRead=()=>{try{return Math.max(0,Number(localStorage.getItem(storage()))||0);}catch{return 0;}};
 const stats=()=>{scoreEl.textContent=fmt(game==="pong"&&s?s.you:score);bestEl.textContent=fmt(best);
  modeVal.textContent=game==="dino"?(s?(s.speed/300).toFixed(1):"1.0")+"×":game==="snake"?(1+Math.floor(score/50))+"×":game==="space"?String(s?s.wave:1).padStart(2,"0"):game==="breakout"?String(s?s.level:1).padStart(2,"0"):game==="memory"?(s?s.pairs:0)+"/8":(s?s.cpu:0)+"/5";};
 const save=()=>{if(score>best){best=score;try{localStorage.setItem(storage(),String(score));}catch{}}};
 const finish=(title,copy,state)=>{running=false;paused=false;ended=true;save();stats();stat(state||"GAME OVER");show("SESSION ENDED",title,copy,"PLAY AGAIN");stage.focus({preventScroll:true});};
 const bricks=()=>{let a=[],cols=14,w=48,gap=8,left=(W-(cols*w+(cols-1)*gap))/2,rows=Math.min(3+s.level,6),colors=[pink,blue,yellow,green,"#edf1ff",purple];for(let r=0;r<rows;r++)for(let col=0;col<cols;col++)a.push({x:left+col*(w+gap),y:34+r*19,w,h:12,on:true,col:colors[r%colors.length]});return a;};
 const food=()=>{let p;do{p={x:Math.floor(rnd(0,s.cols)),y:Math.floor(rnd(0,s.rows))};}while(s.body.some(b=>b.x===p.x&&b.y===p.y));return p;};
 const reset=()=>{
  score=0;time=0;last=0;ended=false;paused=false;clearKeys();best=bestRead();
  if(game==="dino")s={x:95,y:G-38,w:34,h:38,vy:0,on:true,obs:[],spawn:.9,speed:300};
  if(game==="snake"){s={cell:20,cols:45,rows:13,body:[{x:12,y:6},{x:11,y:6},{x:10,y:6}],dir:{x:1,y:0},next:{x:1,y:0},tick:0,food:null};s.food=food();}
  if(game==="space")s={x:W/2,shots:[],foes:[],spawn:.5,cool:0,wave:1};
  if(game==="breakout"){s={paddle:W/2,ball:{x:W/2,y:205,vx:230,vy:-210,r:6},level:1,lives:3,bricks:[]};s.bricks=bricks();}
  if(game==="memory"){let vals=["⌘","⌁","⟡","⌬","⏣","⎔","⧉","◈"],cards=vals.concat(vals).map(v=>({v,open:false,done:false}));for(let i=cards.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}s={cards,a:-1,b:-1,lock:0,pairs:0,turns:0};}
  if(game==="pong")s={y:H/2,cpuY:H/2,x:W/2,ballY:H/2,vx:-220,vy:rnd(-110,110),you:0,cpu:0,ph:64};
  stats();draw();stat("READY?");
 };
 const jump=()=>{if(game==="dino"&&running&&!paused&&s.on){s.vy=-650;s.on=false;}};
 const fire=()=>{if(game==="space"&&running&&!paused&&s.cool<=0){s.shots.push({x:s.x,y:220});s.cool=.2;}};
 const flip=i=>{if(game!=="memory"||!running||paused||ended||time<s.lock)return;const card=s.cards[i];if(!card||card.done||card.open)return;card.open=true;if(s.a<0){s.a=i;return;}s.b=i;s.turns++;const a=s.cards[s.a],b=s.cards[s.b];if(a.v===b.v){a.done=b.done=true;s.pairs++;score+=10;s.a=s.b=-1;stats();if(s.pairs===8)finish("MEMORY CLEAN.","All eight pairs found in "+s.turns+" turns. No leaks detected.","SYSTEM CLEAR");}else s.lock=time+.7;};
 const update=dt=>{
  time+=dt;
  if(game==="dino"){
   s.speed=Math.min(650,300+time*7+score*.035);score+=dt*10;s.spawn-=dt;
   if(s.spawn<=0){if(score>80&&Math.random()<.35)s.obs.push({type:"bird",x:W+8,y:164,w:32,h:20});else{let h=rnd(28,50);s.obs.push({type:"cactus",x:W+8,h,w:18});}s.spawn=Math.max(.58,rnd(.95,1.8)-(s.speed-300)/650);}
   s.obs.forEach(o=>o.x-=s.speed*dt);s.obs=s.obs.filter(o=>o.x+o.w>0);
   if(!s.on){s.vy+=1750*dt;s.y+=s.vy*dt;if(s.y>=G-s.h){s.y=G-s.h;s.vy=0;s.on=true;}}
   s.duck=k.duck&&s.on;const px=s.x+5,py=s.y+(s.duck?13:0),pw=s.duck?34:26,ph=s.duck?23:34;if(s.obs.some(o=>px+pw>o.x&&px<o.x+o.w&&py+ph>(o.type==="bird"?o.y+2:G-o.h+3)&&py<(o.type==="bird"?o.y+o.h-2:G))){finish("OOPS. RUN OVER.","Score "+fmt(score)+". One more run?","RUN ENDED");return;}stats();
  }else if(game==="snake"){
   s.tick+=dt;if(s.tick>=Math.max(.065,.14-score*.0004)){s.tick=0;s.dir=s.next;const h={x:s.body[0].x+s.dir.x,y:s.body[0].y+s.dir.y};
    if(h.x<0||h.x>=s.cols||h.y<0||h.y>=s.rows||s.body.some((p,i)=>i<s.body.length-1&&p.x===h.x&&p.y===h.y)){finish("SYSTEM CRASH.","Score "+fmt(score)+". The line hit a wall or itself.","GAME OVER");return;}
    s.body.unshift(h);if(h.x===s.food.x&&h.y===s.food.y){score+=10;if(s.body.length>=s.cols*s.rows){finish("BOARD CLEARED.","You filled all "+(s.cols*s.rows)+" cells. Perfect run.","SYSTEM CLEAR");return;}s.food=food();stats();}else s.body.pop();
   }
  }else if(game==="space"){
   if(k.left)s.x-=350*dt;if(k.right)s.x+=350*dt;s.x=Math.max(22,Math.min(W-22,s.x));s.cool-=dt;s.spawn-=dt;
   if(s.spawn<=0){s.foes.push({x:rnd(25,W-25),y:-12,size:rnd(12,19),speed:rnd(65,102)});s.spawn=Math.max(.28,.78-Math.floor(score/100)*.025);}
   s.wave=1+Math.floor(score/100);s.shots.forEach(b=>b.y-=440*dt);s.shots=s.shots.filter(b=>b.y>0);
   for(let i=s.foes.length-1;i>=0;i--){let f=s.foes[i];f.y+=f.speed*dt;let hit=s.shots.findIndex(b=>Math.abs(b.x-f.x)<f.size+3&&Math.abs(b.y-f.y)<f.size+3);
    if(hit>=0){s.shots.splice(hit,1);s.foes.splice(i,1);score+=10;stats();continue;}
    if(f.y>H-7||(Math.abs(f.x-s.x)<f.size+15&&f.y>190)){finish("SIGNAL LOST.","Score "+fmt(score)+". The defence line was breached.","MISSION ENDED");return;}
   }
  }else if(game==="breakout"){
   if(k.left)s.paddle-=410*dt;if(k.right)s.paddle+=410*dt;s.paddle=Math.max(65,Math.min(W-65,s.paddle));const b=s.ball;b.x+=b.vx*dt;b.y+=b.vy*dt;
   if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx);}if(b.x>W-b.r){b.x=W-b.r;b.vx=-Math.abs(b.vx);}if(b.y<b.r+6){b.y=b.r+6;b.vy=Math.abs(b.vy);}
   if(b.vy>0&&b.y+b.r>=240&&b.y<=248&&Math.abs(b.x-s.paddle)<65){b.vy=-Math.abs(b.vy);b.vx=(b.x-s.paddle)*3.5;b.y=234;}
   for(const br of s.bricks){if(br.on&&b.x+b.r>br.x&&b.x-b.r<br.x+br.w&&b.y+b.r>br.y&&b.y-b.r<br.y+br.h){br.on=false;score+=10;b.vy*=-1;stats();break;}}
   if(b.y>H+8){s.lives--;if(s.lives<=0){finish("BALL DROPPED.","Score "+fmt(score)+". Keep the rally alive next time.","GAME OVER");return;}b.x=s.paddle;b.y=207;b.vx=rnd(-180,180);b.vy=-220;}
   if(s.bricks.every(br=>!br.on)){s.level++;s.bricks=bricks();b.vx*=1.08;b.vy*=1.08;}
  }else if(game==="memory"){
   if(s.b>=0&&time>=s.lock){s.cards[s.a].open=false;s.cards[s.b].open=false;s.a=s.b=-1;}
  }else if(game==="pong"){
   if(k.up)s.y-=360*dt;if(k.down)s.y+=360*dt;s.y=Math.max(36,Math.min(H-36,s.y));const d=s.ballY-s.cpuY;if(Math.abs(d)>4)s.cpuY+=Math.sign(d)*Math.min(Math.abs(d),210*dt);s.cpuY=Math.max(36,Math.min(H-36,s.cpuY));
   s.x+=s.vx*dt;s.ballY+=s.vy*dt;if(s.ballY<7||s.ballY>H-7)s.vy*=-1;
   if(s.vx<0&&s.x<46&&Math.abs(s.ballY-s.y)<s.ph/2+7){s.x=47;s.vx=Math.abs(s.vx)*1.04;s.vy+=(s.ballY-s.y)*2;}
   if(s.vx>0&&s.x>W-46&&Math.abs(s.ballY-s.cpuY)<s.ph/2+7){s.x=W-47;s.vx=-Math.abs(s.vx)*1.02;s.vy+=(s.ballY-s.cpuY)*1.5;}
   if(s.x>W+8||s.x<-8){if(s.x>W){s.you++;score=s.you;}else s.cpu++;stats();if(s.you>=5){finish("PING CONFIRMED.","You beat the CPU "+s.you+"–"+s.cpu+". Connection stable.","YOU WIN");return;}if(s.cpu>=5){finish("CONNECTION LOST.","The CPU won "+s.cpu+"–"+s.you+". Run it back.","CPU WINS");return;}s.x=W/2;s.ballY=H/2;s.vx=s.you>s.cpu?-230:230;s.vy=rnd(-130,130);}
  }
 };
 const draw=()=>{
  if(!s)return;
  if(game==="dino"){
   background();rect(764,25,34,34,yellow);rect(0,G,W,3,ink);for(let x=0;x<W;x+=44)rect(x-(time*s.speed%44),230,15,3,"#d4ff70");
   s.obs.forEach(o=>{if(o.type==="bird"){const flap=Math.floor(time*10)%2?0:5;rect(o.x+7,o.y+7,20,8,ink);rect(o.x+12,o.y+flap,12,5,purple);rect(o.x+2,o.y+7,9,5,ink);rect(o.x+25,o.y+7,6,4,ink);rect(o.x+28,o.y+8,4,3,yellow);}else{rect(o.x,G-o.h,8,o.h,cactusColor);rect(o.x+8,G-o.h+7,10,5,cactusColor);rect(o.x+10,G-o.h+15,7,o.h-15,cactusColor);}});
   if(s.duck){
    const y=s.y+5;
    // Squat version of the same goofy PAUZE hoodie mascot.
    rect(s.x+2,y+16,37,14,ink);rect(s.x+4,y+18,33,10,purple);
    rect(s.x+1,y+19,7,8,ink);rect(s.x+3,y+21,4,4,pink);
    rect(s.x+33,y+19,7,8,ink);rect(s.x+35,y+21,4,4,pink);
    rect(s.x+24,y+2,18,18,ink);rect(s.x+27,y+5,12,12,pink);
    rect(s.x+26,y+1,6,4,ink);rect(s.x+35,y+3,7,4,purple);
    rect(s.x+28,y+7,5,5,white);rect(s.x+35,y+8,4,5,white);
    rect(s.x+30,y+9,2,3,ink);rect(s.x+35,y+8,2,3,ink);
    rect(s.x+31,y+14,8,2,ink);rect(s.x+33,y+16,3,3,white);rect(s.x+38,y+15,3,4,pink);
    txt("PAUZE",s.x+19,y+25,5,yellow,"center");
    rect(s.x+5,y+28,10,4,ink);rect(s.x+19,y+28,10,4,ink);
   }else{
    // A goofy, cross-eyed gremlin in a branded PAUZE hoodie.
    rect(s.x+2,s.y+20,7,11,ink);rect(s.x+4,s.y+22,4,6,pink);
    rect(s.x+32,s.y+20,8,10,ink);rect(s.x+34,s.y+22,5,5,pink);
    rect(s.x+5,s.y+18,32,16,ink);rect(s.x+7,s.y+20,28,12,purple);
    rect(s.x+13,s.y+31,5,5,ink);rect(s.x+25,s.y+31,5,5,ink);
    rect(s.x+10,s.y+35,10,3,ink);rect(s.x+22,s.y+35,10,3,ink);
    rect(s.x+7,s.y+1,30,21,ink);rect(s.x+10,s.y+4,24,14,pink);
    rect(s.x+10,s.y-2,7,6,ink);rect(s.x+25,s.y-1,9,5,purple);
    rect(s.x+6,s.y+6,5,7,purple);
    rect(s.x+14,s.y+7,7,6,white);rect(s.x+25,s.y+6,7,7,white);
    rect(s.x+18,s.y+8,2,4,ink);rect(s.x+26,s.y+9,2,4,ink);
    rect(s.x+17,s.y+14,12,3,ink);rect(s.x+19,s.y+16,3,3,white);
    rect(s.x+24,s.y+16,3,3,white);rect(s.x+29,s.y+14,4,5,pink);
    txt("PAUZE",s.x+21,s.y+28,5,yellow,"center");
    rect(s.x+16,s.y+29,3,2,pink);rect(s.x+24,s.y+29,3,2,pink);
   }
   txt("PAUZE / RUNNER",W-18,24,12,muted,"right");
  }else if(game==="snake"){
   background(bgc);rect(0,0,W,H,"#edf1ff");for(let x=0;x<s.cols;x++)for(let y=0;y<s.rows;y++)rect(x*s.cell,y*s.cell,1,1,"#edf1ff");
   rect(s.food.x*s.cell+4,s.food.y*s.cell+4,12,12,pink);s.body.forEach((p,i)=>{rect(p.x*s.cell+1,p.y*s.cell+1,18,18,i?green:purple);if(!i){rect(p.x*s.cell+5,p.y*s.cell+5,3,3,white);rect(p.x*s.cell+12,p.y*s.cell+5,3,3,white);}});
  }else if(game==="space"){
   background(bgc);for(let i=0;i<55;i++)rect((i*167+31)%W,(i*47+19)%H,2,2,"#c7d2ed");s.shots.forEach(b=>rect(b.x-2,b.y-8,4,12,purple));
   s.foes.forEach(f=>{rect(f.x-f.size,f.y-f.size,f.size*2,f.size*2,pink);rect(f.x-7,f.y-2,14,5,ink);});rect(s.x-4,204,8,25,ink);rect(s.x-14,214,28,13,purple);rect(s.x-8,208,16,9,blue);txt("DEFENCE / WAVE "+s.wave,W-18,23,11,muted,"right");
  }else if(game==="breakout"){
   background(bgc);rect(16,12,W-32,H-24,"#f4f6f3");s.bricks.forEach(b=>{if(b.on){rect(b.x,b.y,b.w,b.h,b.col);rect(b.x,b.y,b.w,2,ink);}});
   rect(s.paddle-58,240,116,8,ink);rect(s.paddle-16,242,32,4,yellow);rect(s.ball.x-s.ball.r,s.ball.y-s.ball.r,s.ball.r*2,s.ball.r*2,purple);txt("LIVES / "+s.lives,W-22,H-12,10,muted,"right");
  }else if(game==="memory"){
   background();txt("MEMORY / MATCH THE PAIRS",W/2,18,10,muted,"center");const cw=125,ch=40,gx=14,gy=11,left=(W-(cw*4+gx*3))/2,top=29,icons=["⌘","⌁","⟡","⌬","⏣","⎔","⧉","◈"];
   s.cards.forEach((a,i)=>{const x=left+(i%4)*(cw+gx),y=top+Math.floor(i/4)*(ch+gy);rect(x+2,y+3,cw,ch,ink);rect(x,y,cw,ch,a.done?green:a.open?yellow:white);rect(x,y,cw,3,ink);txt(a.done||a.open?a.v:icons[i%8],x+cw/2,y+27,a.done||a.open?23:17,a.done||a.open?ink:"#d4ff70","center");});txt("TURNS / "+s.turns,W/2,H-8,10,muted,"center");
  }else if(game==="pong"){
   background(bgc);for(let y=12;y<H;y+=19)rect(W/2-2,y,4,10,"#c7d2ed");rect(20,s.y-s.ph/2,11,s.ph,purple);rect(W-31,s.cpuY-s.ph/2,11,s.ph,ink);rect(s.x-6,s.ballY-6,12,12,pink);txt(String(s.you),W/2-42,40,20,ink,"center");txt(String(s.cpu),W/2+42,40,20,ink,"center");txt("YOU",40,22,9,muted);txt("CPU",W-40,22,9,muted,"right");
  }
 };
 const loop=t=>{if(!running||paused)return;if(!last)last=t;const dt=Math.min(.032,(t-last)/1000||0);last=t;update(dt);draw();if(running&&!paused)raf=requestAnimationFrame(loop);};
 const startGame=()=>{cancelAnimationFrame(raf);reset();running=true;paused=false;ended=false;hide();stat("IN SESSION");stage.focus({preventScroll:true});raf=requestAnimationFrame(loop);};
 const resume=()=>{paused=false;running=true;last=0;hide();stat("IN SESSION");stage.focus({preventScroll:true});raf=requestAnimationFrame(loop);};
 const pause=()=>{if(!running||ended)return;paused=true;stat("PAUSED");show("PAUSED / TAKE A BREATHER","GAME PAUSED","Press P or tap resume when you are ready.","RESUME");};
 const choose=id=>{
  if(!config[id])return;cancelAnimationFrame(raf);running=false;paused=false;game=id;heading.textContent=config[id][0];modeEl.textContent=config[id][4];help.textContent=config[id][3];
  picker.querySelectorAll("[data-arcade-game]").forEach(b=>{const on=b.dataset.arcadeGame===id;b.classList.toggle("is-active",on);b.setAttribute("aria-pressed",String(on));});
  touch.replaceChildren();config[id][5].forEach(([action,caption])=>{const b=document.createElement("button");b.type="button";b.textContent=caption;b.addEventListener("pointerdown",e=>{
   e.preventDefault();if(!running||paused||ended)return;if(game==="dino"&&action==="jump"){jump();return;}if(game==="space"&&action==="fire"){fire();return;}
   if(game==="snake"){const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[action];if(d&&!(s.dir.x+d[0]===0&&s.dir.y+d[1]===0))s.next={x:d[0],y:d[1]};return;}if(["left","right","up","down","duck"].includes(action))k[action]=true;
  });["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>{if(["left","right","up","down","duck"].includes(action))k[action]=false;}));touch.append(b);});
  reset();const names={dino:"LET’S RUN.",snake:"GROW THE LINE.",space:"DEFEND THE SIGNAL.",breakout:"BREAK THE BLOCKS.",memory:"CLEAR YOUR CACHE.",pong:"PING THE CPU."};show("CHOOSE YOUR CHALLENGE",names[id],config[id][1],config[id][2]);draw();
 };
 const keydown=e=>{
  if(!["Space","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","KeyA","KeyD","KeyW","KeyS","KeyP","KeyX","Enter"].includes(e.code))return;
  if(e.target.closest&&e.target.closest("button,a,input,textarea,select"))return;
  if(["Space","ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.code))e.preventDefault();
  if(e.code==="KeyP"&&(running||paused)){paused?resume():pause();return;}
  if(!running&&!paused&&!ended&&(e.code==="Enter"||e.code==="Space")){startGame();return;}if(paused&&(e.code==="Enter"||e.code==="Space")){resume();return;}if(!running||paused||ended)return;
  if(game==="dino"){if(e.code==="Space"||e.code==="ArrowUp")jump();if(e.code==="ArrowDown")k.duck=true;}
  if(game==="snake"){const d={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]}[e.code];if(d&&!(s.dir.x+d[0]===0&&s.dir.y+d[1]===0))s.next={x:d[0],y:d[1]};}
  if(game==="space"){if(e.code==="ArrowLeft"||e.code==="KeyA")k.left=true;if(e.code==="ArrowRight"||e.code==="KeyD")k.right=true;if(e.code==="Space"||e.code==="KeyX")fire();}
  if(game==="breakout"){if(e.code==="ArrowLeft"||e.code==="KeyA")k.left=true;if(e.code==="ArrowRight"||e.code==="KeyD")k.right=true;}
  if(game==="pong"){if(e.code==="ArrowUp"||e.code==="KeyW")k.up=true;if(e.code==="ArrowDown"||e.code==="KeyS")k.down=true;}
 };
 const keyup=e=>{if(e.code==="ArrowLeft"||e.code==="KeyA")k.left=false;if(e.code==="ArrowRight"||e.code==="KeyD")k.right=false;if(e.code==="ArrowUp"||e.code==="KeyW")k.up=false;if(e.code==="ArrowDown"||e.code==="KeyS"){k.down=false;k.duck=false;}};
 const memoryClick=e=>{const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height,cw=125,ch=40,gx=14,gy=11,left=(W-(cw*4+gx*3))/2,top=29;for(let i=0;i<s.cards.length;i++){const cx=left+(i%4)*(cw+gx),cy=top+Math.floor(i/4)*(ch+gy);if(x>=cx&&x<=cx+cw&&y>=cy&&y<=cy+ch){flip(i);break;}}};
  picker.querySelectorAll("[data-arcade-game]").forEach(b=>b.addEventListener("click",()=>choose(b.dataset.arcadeGame)));
  start.addEventListener("click",()=>{if(paused)resume();else startGame();});restart.addEventListener("click",startGame);
  window.addEventListener("keydown",e=>{if(stage.contains(document.activeElement)||!(e.target.closest&&e.target.closest("button,a,input,textarea,select")))keydown(e);});window.addEventListener("keyup",keyup);
  stage.addEventListener("pointerdown",e=>{if(!cv.contains(e.target)||!running||paused||ended)return;if(game==="dino")jump();if(game==="space")fire();if(game==="memory")memoryClick(e);});
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&running&&!paused)pause();});window.addEventListener("blur",clearKeys);window.addEventListener("resize",draw);
  choose("dino");
})();

window.addEventListener('load', eventWindowLoaded, false);
function eventWindowLoaded() {
    canvasApp();
}

function canvasApp(){

    var theCanvas = document.getElementById("canvas");
    if (!theCanvas || !theCanvas.getContext) {
        return;
    }
    var context = theCanvas.getContext("2d");
    if (!context) {
        return;
    }

    theCanvas.width = 400;
    theCanvas.height = 650;

    //game states
    const GAME_STATE_MAIN = 0;
    const GAME_STATE_LOAD = 1
    const GAME_STATE_READY = 2;
    const GAME_STATE_PLAY = 3;
    const GAME_STATE_PAUSE = 4;
    const GAME_STATE_GAME_OVER = 5;

    var currentGameState = 0;
    var currentGameStateFunction = null;

    var gameOver=false;

    //global variable
    var timer = 60;
    var startTime = getTimestamp();
    var mouseX = 50;
    var mouseY = 50;
    const TOP_MARGIN = 50;

    //game environment
    var lvlOneHighscore=0;
    var lvlTwoHighscore=0;
    var inGameScore = 0;
    var level=1;

    //create game objects and arrays
    var bugTrigger;
    var bugs=[];
    var foods=[];
    var bugScore = 0;
    var bugSpeed = 0;


    function switchGameState(newState) {
        currentGameState=newState;
        switch (currentGameState) {

            case GAME_STATE_MAIN:
                currentGameStateFunction=gameStateMain;
                break;
            case GAME_STATE_LOAD:
                currentGameStateFunction=gameStateLoad;
                break;
            case GAME_STATE_PLAY:
                currentGameStateFunction=gameStatePlay;
                break;
            case GAME_STATE_PAUSE:
                currentGameStateFunction=gameStatePause;
                break;
            case GAME_STATE_GAME_OVER:
                currentGameStateFunction=gameStateGameOver;
                break;

        }

    }

    function gameStateMain() {
        console.log("MainState");
        //get userInput
        theCanvas.addEventListener("mousedown", onMouseDownMain, false);

        //Load Highscore
        lvlOneHighscore = localStorage['lvlOneHighscore'];
        if (lvlOneHighscore == undefined){
            localStorage['lvlOneHighscore'] = '0';
            lvlOneHighscore = localStorage['lvlOneHighscore'];
        }

        lvlTwoHighscore = localStorage['lvlTwoHighscore'];
        if (lvlTwoHighscore == undefined){
            localStorage['lvlTwoHighscore'] = '0';
            lvlTwoHighscore = localStorage['lvlTwoHighscore'];
        }

        renderMain();
    }

    function gameStateLoad() {

        //Load foods
        for (var i = 0; i < 5; i++){
            addFood();
            var overlap = false;
            for(var j=0; j < i; j++){
                overlap = overlapRect(foods[j],foods[i]);
                if (overlap){
                    foods[i].x = 10 + Math.floor(Math.random() * 380);
                    foods[i].y = Math.floor(TOP_MARGIN + 120 + (Math.random() * 430));
                }
            }
        }

        bugTrigger = setInterval(addBug, (Math.random() * 2000) + 1000);
        switchGameState(GAME_STATE_PLAY);

    }

    function gameStatePlay() {
        console.log("PlayState");
        theCanvas.addEventListener("mousedown", onMouseDownPlay, false);
        updatePlay();
        renderPlay();
    }

    function gameStatePause() {
        console.log("PauseState");
        theCanvas.addEventListener("mousedown", onMouseDownPause, false);
        renderPause();

    }

    function gameStateGameOver() {
        console.log("GameOverState");
        theCanvas.addEventListener("mousedown", onMouseDownGameOver, false);
        renderGameOver();
    }

    function onMouseDownMain(e) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        if (mouseX>=160 && mouseX<=260 && mouseY>=200 && mouseY<=230) {
            theCanvas.removeEventListener("mousedown", onMouseDownMain, false);
            level = 1;
        }

        if (mouseX>=160 && mouseX<=260 && mouseY>=250 && mouseY<=280) {
            theCanvas.removeEventListener("mousedown", onMouseDownMain, false);
            level = 2;
        }

        if (mouseX>=0 && mouseX<=400 && mouseY>=400 && mouseY<=470) {
            theCanvas.removeEventListener("mousedown", onMouseDownMain, false);
            switchGameState(GAME_STATE_LOAD);
        }
    }


    function onMouseDownPlay(e) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        theCanvas.removeEventListener("mousedown", onMouseDownPlay, false);

        //Pause
        if (mouseX>=170 && mouseX<=220 && mouseY>=0 && mouseY<=40) {
            clearInterval(bugTrigger);
            switchGameState(GAME_STATE_PAUSE);
        }

        for (var i=0; i < bugs.length; i++){
            var dist = calcDist(bugs[i].x,bugs[i].y, mouseX, mouseY);

            if (dist <= 30 && bugs[i].alpha == 1){
                inGameScore+=bugs[i].score;
                bugs[i].alpha = 0.75;

            }
        }

    }

    function onMouseDownPause(e) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;

        //Play
        if (mouseX>=170 && mouseX<=220 && mouseY>=0 && mouseY<=40) {
            theCanvas.removeEventListener("mousedown", onMouseDownPause, false);
            bugTrigger = setInterval(addBug, (Math.random() * 2000) + 1000);
            switchGameState(GAME_STATE_PLAY);
        }


    }

    function onMouseDownGameOver(e) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;

        //Replay
        if (mouseX>=0 && mouseX<=400 && mouseY>=400 && mouseY<=470) {
            theCanvas.removeEventListener("mousedown", onMouseDownGameOver, false);
            if (level == 2 && timer == 0) { //Completed level 2
                level = 1;  //back to level 1
            }
            reset();
            switchGameState(GAME_STATE_LOAD);
        }

        //Exit
        if (mouseX>=0 && mouseX<=400 && mouseY>=500 && mouseY<=570) {
            theCanvas.removeEventListener("mousedown", onMouseDownGameOver, false);
            reset();
            switchGameState(GAME_STATE_MAIN);
        }


    }

    function updatePlay() {
        updateBugs();
        updateTimer();
        checkCollisions();
    }

    function updateBugs() {

        for (var i=0; i < bugs.length; i++){
            if (bugs.length > 0 && bugs[i].alpha < 0.01) {
                bugs.splice(i,1);
            }

            if (bugs.length > 0 && bugs[i].alpha <= 0.75) {
                bugs[i].alpha -= 0.01;
            }

            else if (bugs.length > 0 && bugs[i].alpha == 1) {
                bugs[i].x += Math.cos(bugs[i].mov_angle) * bugs[i].speed * (interval/1000);
                bugs[i].y += Math.sin(bugs[i].mov_angle) * bugs[i].speed * (interval/1000);
                bugs[i].target = getNearestFood(bugs[i].x,bugs[i].y);
                bugs[i].rot_angle = Math.atan2(foods[bugs[i].target].x - bugs[i].x, foods[bugs[i].target].y - bugs[i].y);
                bugs[i].mov_angle = Math.atan2(foods[bugs[i].target].y - bugs[i].y, foods[bugs[i].target].x - bugs[i].x);
                var overlap = false;
                for (var j = 0; j < i; j++) {

                    if (i != j && bugs[j].alpha == 1)
                        overlap = overlapRect(bugs[j], bugs[i]);
                    if (overlap) {
                        bugs[j].x -= Math.cos(bugs[j].mov_angle) * bugs[j].speed * (interval/1000);
                        bugs[j].y -= Math.sin(bugs[j].mov_angle) * bugs[j].speed * (interval/1000);
                    }
                }
            }
        }
    }

    function updateTimer() {
        if (getTimestamp() - startTime >= 1000) {
            timer--;
            if (timer > 0) {
                startTime = getTimestamp();
            }
            else {
                clearInterval(bugTrigger);
                if (level == 1) {
                    if (parseInt(localStorage["lvlOneHighscore"]) < inGameScore){
                        localStorage["lvlOneHighscore"] = inGameScore.toString();
                    }
                    level = 2;
                    reset();
                    switchGameState(GAME_STATE_LOAD);
                } else {
                    if (parseInt(localStorage["lvlTwoHighscore"]) < inGameScore){
                        localStorage["lvlTwoHighscore"] = inGameScore.toString();
                    }
                    switchGameState(GAME_STATE_GAME_OVER);
                }
            }

        }
    }

    function checkCollisions(){
        var overlap = false;
        for (var i=0; i < bugs.length; i++) {
            if (foods[bugs[i].target] != undefined) {
                overlap = overlapRect(bugs[i], foods[bugs[i].target]);
            }

            if (overlap) {
                overlap = false;
                foods.splice(bugs[i].target, 1);
                if (foods.length == 0) {
                    theCanvas.removeEventListener("mousedown", onMouseDownPlay, false);
                    clearInterval(bugTrigger);
                    var tempString = (level == 1) ? "lvlOneHighscore" : "lvlTwoHighscore"
                    if (parseInt(localStorage[tempString]) < inGameScore){
                        localStorage[tempString] = inGameScore.toString();
                    }
                    switchGameState(GAME_STATE_GAME_OVER);
                }
            }

        }

    }

    function calcDist(x1,y1,x2,y2){
        return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
    }

    function getNearestFood(x,y){

        var nearest = 0;

        for (var i=0; i < foods.length; i++){
            if (calcDist(x,y,foods[nearest].x,foods[nearest].y)
                > calcDist(x,y,foods[i].x,foods[i].y)){
                nearest=i;
            }
        }
        return nearest;
    }

    function addBug() {

        clearInterval(bugTrigger); //Refresh trigger interval

        var newBug = {
            x: 5 + Math.floor(Math.random()*390),
            y: 50,
            width: 10,
            height: 40,
            speed: getBugSpeed(),
            score: getBugScore(),
            target: getNearestFood(this.x,this.y),
            rot_angle: 0,
            mov_angle: 0,
            alpha: 1,
        };

        bugs.push(newBug);
        bugTrigger = setInterval(addBug, (Math.random() * 2000) + 1000); //Create bugs every 1 - 3 seconds

    }

    function addFood() {

        var newFood = {
            x: 10 + Math.floor(Math.random() * 380),
            y: Math.floor(TOP_MARGIN + 120 + (Math.random() * 430)),
            width: 20,
            height: 20
        };

        foods.push(newFood);
    }

    function getBugSpeed() {
        var randNum = Math.floor(Math.random() * 9 + 1);

        if (level == 1){
            if (randNum <= 4) {
                bugSpeed = 60;
            }
            else if (randNum <= 7) {
                bugSpeed = 75;
            }
            else {
                bugSpeed = 150;
            }
        }

        if (level == 2){
            if (randNum <= 4) {
                bugSpeed = 80;
            }
            else if (randNum <= 7) {
                bugSpeed = 100;
            }
            else {
                bugSpeed = 200;
            }
        }

        return bugSpeed;
    }

    function getBugScore() {
        if (bugSpeed == 60 || bugSpeed == 80){
            bugScore = 1
        }
        if (bugSpeed == 75 || bugSpeed == 100){
            bugScore = 3
        }
        if (bugSpeed == 150 || bugSpeed == 200){
            bugScore = 5
        }

        return bugScore;
    }

    function overlapRect(obj1,obj2){
        var xOverlap = (obj1.x < obj2.x + 20) && (obj1.x + 20 > obj2.x);
        var yOverlap = (obj1.y < obj2.y + 40) && (obj1.y + 40 > obj2.y);
        return (xOverlap && yOverlap);
    }

    function getTimestamp() { return new Date().getTime(); };

    function reset() {
        bugs = [];
        foods = [];
        timer = 60;
        inGameScore = 0;
    }

    function renderMain() {
        renderBackground()

        //drawTitle
        var grd=context.createLinearGradient(40,40,40,150);
        grd.addColorStop(0, "#f55b5b"); // sets the first color
        grd.addColorStop(1, "#3112a3"); // sets the second color
        context.font = '40px Arial Black';
        context.textBaseline = 'top';
        context.fillStyle = grd;
        context.fillText ("Tap Tap Bug", 70, 60);

        //drawLevel
        context.fillStyle = '#000000';
        context.font = '30px Arial';
        context.fillText("Level 1", 160, 200);
        context.fillText("Level 2", 160, 250);

        //drawHighscore;
        context.font = '28px Arial';
        if (level == 1)
            context.fillText("Highscore: " + lvlOneHighscore, 110, 340);
        else
            context.fillText("Highscore: " + lvlTwoHighscore, 110, 340);

        //drawStartButton
        context.fillStyle = 'rgba( 255,0,0, 0.5 )';
        context.fillRect(0, 400, 400, 70);
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.moveTo(180,410);
        context.lineTo(230,435);
        context.lineTo(180,460);
        context.fill();
        context.closePath();

        //drawLevelCheckBox
        if (level == 1) {
            context.fillStyle = 'rgba( 255,0,0, 0.5 )'
            context.fillRect(130, 205, 20, 20);
        } else {
            context.fillStyle = 'rgba( 255,0,0, 0.5 )'
            context.fillRect(130, 255, 20, 20);
        }
    }

    function renderPlay() {
        renderBackground();
        renderBugs();
        renderFoods();
        renderInfoBar();
        //Draw pause button
        context.fillRect(180, 10, 10, 30);
        context.fillRect(200, 10, 10, 30);
    }

    function renderPause() {
        renderInfoBar();

        //Draw play button
        context.fillStyle = '#000000';
        context.beginPath();
        context.moveTo(180,10);
        context.lineTo(210,25);
        context.lineTo(180,40);
        context.fill();
        context.closePath();
    }

    function renderGameOver() {
        context.fillStyle = '#000000';
        renderBackground()
        renderInfoBar();
        context.font = '40px Arial';
        context.fillText("GAME OVER", 80, 200);

        context.font = '28px Arial';
        if (level == 1) {
            context.fillText("Highscore: " + localStorage["lvlOneHighscore"], 110, 300);
        } else {
            context.fillText("Highscore: " + localStorage["lvlTwoHighscore"], 110, 300);
        }

        //drawRestartButton
        context.fillStyle = 'rgba( 255,0,0, 0.5 )';
        context.fillRect(0, 400, 400, 70);
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.moveTo(180,410);
        context.lineTo(230,435);
        context.lineTo(180,460);
        context.fill();
        context.closePath();

        //drawExitButton
        context.fillStyle = 'rgba(0, 0,255, 0.4 )';
        context.fillRect(0, 500, 400, 70);
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.moveTo(180,510);
        context.lineTo(184,510);
        context.lineTo(204,530);
        context.lineTo(205,530);
        context.lineTo(225,510);
        context.lineTo(229,510);
        context.lineTo(229,514);
        context.lineTo(209,534);
        context.lineTo(210,535);
        context.lineTo(229,555);
        context.lineTo(229,559);
        context.lineTo(225,559);
        context.lineTo(205,539);
        context.lineTo(204,539);
        context.lineTo(184,559);
        context.lineTo(180,559);
        context.lineTo(180,555);
        context.lineTo(200,535);
        context.lineTo(200,534);
        context.lineTo(180,514);
        context.fill();
        context.closePath();

    }

    function renderBugs() {
        for (var i=0;i<bugs.length;i++){


            context.save();
            context.setTransform(1,0,0,1,0,0);

            context.translate(bugs[i].x, bugs[i].y);
            context.rotate(Math.PI - bugs[i].rot_angle);
            context.globalAlpha= bugs[i].alpha;


            var newBugX = -(bugs[i].width/2);
            var newBugY = -(bugs[i].height/2);

            if (bugs[i].speed == 60 || bugs[i].speed == 80){ //Draw orange bug
                context.strokeStyle = '#FF7F27';
                context.fillStyle = '#FF7F27';
            }

            else if (bugs[i].speed == 75 || bugs[i].speed == 100){ //Draw red bug
                context.strokeStyle = '#ff0000';
                context.fillStyle = '#ff0000';
            }
            else if (bugs[i].speed == 150 || bugs[i].speed == 200){ //Draw black bug
                context.strokeStyle = '#000000';
                context.fillStyle = '#000000';
            }

            //Antenna
            context.beginPath();
            context.moveTo(newBugX+2,newBugY);
            context.lineTo(newBugX+2,newBugY+2);
            context.lineTo(newBugX+3,newBugY+3);
            context.moveTo(newBugX+6,newBugY+3);
            context.lineTo(newBugX+7,newBugY+2);
            context.lineTo(newBugX+7,newBugY);
            context.stroke();
            context.closePath();

            //Head
            context.beginPath();
            context.moveTo(newBugX+3,newBugY+4);
            context.lineTo(newBugX+6,newBugY+4);
            context.lineTo(newBugX+6,newBugY+6);
            context.lineTo(newBugX+7,newBugY+7);
            context.lineTo(newBugX+7,newBugY+10);
            context.lineTo(newBugX+6,newBugY+11);
            context.lineTo(newBugX+6,newBugY+12);
            context.lineTo(newBugX+5,newBugY+13);
            context.lineTo(newBugX+4,newBugY+13);
            context.lineTo(newBugX+3,newBugY+12);
            context.lineTo(newBugX+3,newBugY+11);
            context.lineTo(newBugX+2,newBugY+10);
            context.lineTo(newBugX+2,newBugY+7);
            context.lineTo(newBugX+3,newBugY+6);
            context.lineTo(newBugX+3,newBugY+4);
            context.fill();
            context.closePath();

            //Body
            context.beginPath();
            context.moveTo(newBugX+4,newBugY+14);
            context.lineTo(newBugX+5,newBugY+14);
            context.lineTo(newBugX+6,newBugY+15);
            context.lineTo(newBugX+7,newBugY+15);
            context.lineTo(newBugX+7,newBugY+23);
            context.lineTo(newBugX+5,newBugY+25);
            context.lineTo(newBugX+4,newBugY+25);
            context.lineTo(newBugX+2,newBugY+23);
            context.lineTo(newBugX+2,newBugY+15);
            context.lineTo(newBugX+3,newBugY+15);
            context.fill();
            context.closePath();

            //Tail
            context.beginPath();
            context.moveTo(newBugX+4,newBugY+26);
            context.lineTo(newBugX+5,newBugY+26);
            context.lineTo(newBugX+7,newBugY+29);
            context.lineTo(newBugX+7,newBugY+35);
            context.lineTo(newBugX+5,newBugY+39);
            context.lineTo(newBugX+4,newBugY+39);
            context.lineTo(newBugX+2,newBugY+35);
            context.lineTo(newBugX+2,newBugY+29);
            context.fill();
            context.closePath();

            //Legs
            context.beginPath();
            context.moveTo(newBugX+1,newBugY+15);
            context.lineTo(newBugX+0,newBugY+8);

            context.moveTo(newBugX+8,newBugY+15);
            context.lineTo(newBugX+9,newBugY+8);

            context.moveTo(newBugX+1,newBugY+23);
            context.lineTo(newBugX+0,newBugY+18);

            context.moveTo(newBugX+8,newBugY+23);
            context.lineTo(newBugX+9,newBugY+18);

            context.moveTo(newBugX+1,newBugY+29);
            context.lineTo(newBugX,newBugY+35);

            context.moveTo(newBugX+8,newBugY+29);
            context.lineTo(newBugX+9,newBugY+35);
            context.stroke();
            context.closePath();

            context.restore();
        }
    }

    function renderFoods() {
        for (var i=0;i<foods.length;i++){

            context.save();
            context.setTransform(1,0,0,1,0,0);

            context.translate(foods[i].x, foods[i].y);

            var newFoodX = -(foods[i].width/2);
            var newFoodY = -(foods[i].height/2);

            context.fillStyle = '#B97A57';
            context.beginPath();
            context.moveTo(newFoodX+4,newFoodY+1);
            context.lineTo(newFoodX+15,newFoodY+1);
            context.lineTo(newFoodX+16,newFoodY+2);
            context.lineTo(newFoodX+17,newFoodY+2);
            context.lineTo(newFoodX+18,newFoodY+3);
            context.lineTo(newFoodX+19,newFoodY+4);
            context.lineTo(newFoodX+19,newFoodY+7);
            context.lineTo(newFoodX+1,newFoodY+7);
            context.lineTo(newFoodX+1,newFoodY+3);
            context.lineTo(newFoodX+2,newFoodY+3);
            context.lineTo(newFoodX+3,newFoodY+2);
            context.lineTo(newFoodX+5,newFoodY+2);
            context.fill();
            context.closePath();


            context.strokeStyle = '#00ff00';
            context.beginPath();
            context.moveTo(newFoodX,newFoodY+8);
            context.lineTo(newFoodX+20,newFoodY+8);
            context.lineTo(newFoodX+20,newFoodY+9);
            context.lineTo(newFoodX,newFoodY+9);
            context.stroke();
            context.closePath();

            context.fillStyle = '#880015';
            context.beginPath();
            context.moveTo(newFoodX,newFoodY+10);
            context.lineTo(newFoodX+19,newFoodY+10);
            context.lineTo(newFoodX+20,newFoodY+12);
            context.lineTo(newFoodX+19,newFoodY+13);
            context.lineTo(newFoodX+1,newFoodY+13);
            context.lineTo(newFoodX,newFoodY+12);
            context.fill();
            context.closePath();


            context.fillStyle = '#B97A57';
            context.beginPath();
            context.moveTo(newFoodX+1,newFoodY+13);
            context.lineTo(newFoodX+19,newFoodY+13);
            context.lineTo(newFoodX+19,newFoodY+15);
            context.lineTo(newFoodX+18,newFoodY+16);
            context.lineTo(newFoodX+17,newFoodY+17);
            context.lineTo(newFoodX+16,newFoodY+17);
            context.lineTo(newFoodX+15,newFoodY+18);
            context.lineTo(newFoodX+4,newFoodY+18);
            context.lineTo(newFoodX+3,newFoodY+17);
            context.lineTo(newFoodX+2,newFoodY+17);
            context.lineTo(newFoodX+1,newFoodY+16);
            context.lineTo(newFoodX+1,newFoodY+13);
            context.fill();
            context.closePath();

            context.restore();
        }


    }

    function renderBackground() {
        //draw background
        context.fillStyle = '#eeeeee';
        context.fillRect(0, 0, theCanvas.width, theCanvas.height);
    }

    function renderInfoBar() {
        //Draw info bar
        var grd=context.createLinearGradient(0,0,0,150);
        grd.addColorStop(0, "#f55b5b"); // sets the first color
        grd.addColorStop(1, "#3112a3"); // sets the second color
        context.fillStyle = grd;
        context.fillRect(0, 0, 400, 50);



        //Draw score
        context.fillStyle = '#000000';
        context.font="24px Arial";
        context.fillText("Score: "+inGameScore,280,10);

        //Draw level
        context.font="12px Arial";
        context.fillText("LV: "+level,20,8);

        //Draw timer
        context.font="20px Arial";
        context.fillText(timer,20,20);



    }

    //*** application start
    switchGameState(GAME_STATE_MAIN);

    var FRAME_RATE = 40;
    var interval = 1000/FRAME_RATE;

    gameLoop()

    function gameLoop() {
        currentGameStateFunction();
        window.setTimeout(gameLoop, interval);
    }

}

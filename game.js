// CONSTANTS
var FPS=30;

// Globals
var cRect = null;
var canvas = null;
var ctx = null;
var curBackground;
var Sounds = null;
var Backgrounds = null;
var Bubbles = null;
var SPEED = null;
var frameIntervalId = null;
var MIN_BUBBLE_RADIUS = null;
var MAX_BUBBLE_RADIUS = null;
var gameMode = null;

// FUNCTIONS

// Replace all sound names in the specified 'arr' with the corresponding
// Sound
function replaceSounds(arr) {
    for (var idx in arr) {
        if (Array.isArray(arr[idx])) {
            replaceSounds(arr[idx]);
        }
        else {
            arr[idx] = new Audio("sounds/" + arr[idx]);
        }
    }
}

function initResources(player) {
    Sounds = {
        pop: [ "pop1.wav", "pop2.wav" ],
        mistake: ["pawOhNo.mp3", "pawWhoops.mp3", "pawOhBoy.mp3",
                  "emiThatsNotIt.mp3", "krysBooHoo.mp3", "krysTryAgain.mp3",
                  "miaCry.mp3"],
        numbers: [
            [],
            ["one_1.mp3", "one_2.mp3"],
            ["two_1.mp3", "two_2.mp3"],
            ["three_1.mp3", "three_2.mp3"],
            ["four_1.mp3", "four_2.mp3"],
            ["five_1.mp3", "five_2.mp3"],
            ["six_1.mp3", "six_2.mp3"],
            ["seven_1.mp3", "seven_2.mp3"],
            ["eight_1.mp3", "eight_2.mp3"],
            ["nine_1.mp3", "nine_2.mp3"]
        ]
    };

    Backgrounds = ["brave", "busytown", "clifford", "zootopia",
                      "jake", "paw-patrol", "thomas",
                      "wonder-woman", "frozen", "hulk"];

    Bubbles = [ "bubble1.png", "bubble2.png" ];

    Sounds.yay = ["allHurray.wav", "pawWooHoo.wav"];
    if (player === "mia") {
        SPEED = 30;
        MIN_BUBBLE_RADIUS = 50;
        MAX_BUBBLE_RADIUS = 100;
        Sounds.yay = Sounds.yay.concat([
                "kimMia.wav", "krysMia.wav", "emiYayMia.wav"]);
    }
    else if (player === "emi") {
        SPEED = 30;
        MIN_BUBBLE_RADIUS = 150;
        MAX_BUBBLE_RADIUS = 200;
        Sounds.yay = Sounds.yay.concat([
            "emiDidIt.wav", "kimEmi.wav", "miaEmi.wav", "pawYayEmi.wav"]);
    }

    // Replace each sound name with an Audio object for it
    for (var key in Sounds) {
        replaceSounds(Sounds[key]);
    }

    // Replace each Background name with an object
    // {
    //   image: Image,
    //   music: Audio
    // }
    for (var key in Backgrounds) {
        var img = new Image();
        img.src = "backgrounds/" + Backgrounds[key] + ".jpg";
        Backgrounds[key] = {
            image: img,
            music: new Audio("music/" + Backgrounds[key] + ".mp3")
        };
    }

    // Replace each Bubbles name with an Image object
    for (var key in Bubbles) {
        var img = new Image();
        img.src = "images/" + Bubbles[key];
        Bubbles[key] = img;
    }
};

function arrayRandom(array, current) {
    var newVal = current;
    while (newVal === current) {
        var idx = Math.round((Math.random() * array.length) - .5);
        if (idx < 0) {
            idx = 0;
        }
        else if (idx >= array.length) {
            idx = array.length - 1;
        }
        newVal = array[idx];
    }
    return newVal;
};

function changeBackground() {
    if (curBackground) {
        curBackground.music.pause();
    }

    curBackground = arrayRandom(Backgrounds, curBackground);
    curBackground.music.currentTime = 0;
    curBackground.music.play();
}

// Play one of the specified 'sounds'
function playSound(sounds) {
    var sound = arrayRandom(sounds, -1);
    sound.currentTime = 0;
    sound.play();
}

// Advance the position of the specified 'circ' after the specified 'elapsed'
// time has passed.
function advanceCircle(circ, elapsed) {
    circ.x += circ.speedX * elapsed;
    circ.y += circ.speedY * elapsed;

    if (circ.x > cRect.width) {
        circ.x = 0;
    }

    if (circ.y >= cRect.height) {
        circ.y = 0;
    }

    if (circ.x < 0) {
        circ.x = cRect.width;
    }

    if (circ.y < 0) {
        circ.y = cRect.height;
    }
}

// Draw the specified 'circ'.
function drawCircle(circ) {

    // We want to make the bubble appear on all 4 edges if necessary, if
    // it's too close to the edge
    var xOffsets = [0];
    if (circ.x + circ.radius > cRect.width) {
        xOffsets.push(-cRect.width);
    }
    else if (circ.x - circ.radius < 0) {
        xOffsets.push(cRect.width);
    }

    var yOffsets = [0]
    if (circ.y + circ.radius > cRect.height) {
        yOffsets.push(-cRect.height);
    }
    else if (circ.y - circ.radius < 0) {
        yOffsets.push(cRect.height);
    }

    for (var xIdx = 0; xIdx < xOffsets.length; ++xIdx) {
        for (var yIdx = 0; yIdx < yOffsets.length; ++yIdx) {
            ctx.drawImage(circ.image,
                          circ.x - circ.radius + xOffsets[xIdx],
                          circ.y - circ.radius + yOffsets[yIdx],
                          2 *circ.radius,
                          2 *circ.radius);

            if (circ.number !== null) {
                // Draw the number
                ctx.font = circ.radius + "px Comic Sans MS";
                ctx.textAlign = "center";
                ctx.fillStyle = "red";
                ctx.fillText(circ.number,
                             circ.x + xOffsets[xIdx],
                             circ.y + yOffsets[yIdx] + 30);
            }
        }
    }
}

// Return 'true' if the specified 'circ' is hit by a click at the specified
// 'x' and 'y' coordinates.
function checkClick(circ, x, y) {
    var xOffsets = [0];
    if (circ.x + circ.radius > cRect.width) {
        xOffsets.push(-cRect.width);
    }
    else if (circ.x - circ.radius < 0) {
        xOffsets.push(cRect.width);
    }

    var yOffsets = [0]
    if (circ.y + circ.radius > cRect.height) {
        yOffsets.push(-cRect.height);
    }
    else if (circ.y - circ.radius < 0) {
        yOffsets.push(cRect.height);
    }

    for (var xIdx = 0; xIdx < xOffsets.length; ++xIdx) {
        for (var yIdx = 0; yIdx < yOffsets.length; ++yIdx) {
            var xDiff = circ.x - x + xOffsets[xIdx];
            var yDiff = circ.y - y + yOffsets[yIdx];
            var distance = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
            if (distance <= circ.radius) {
                return true;
            }
        }
    }

    return false;
}

// Definition of basic game, with bubbles flying around that just need to be
// clicked
function BasicGameMode() {
    var d_circles = [];
    var d_numCircles = 0;

    // Create a bubble at the specified 'x' and 'y' coordinates, or at random
    // coordinates if 'x' and 'y' aren't specified.  The bubble is both
    // appended to 'd_circles' and returned.
    function createBubble(x, y) {
        var ret =  {
            number: null,
            x: x || Math.random() * cRect.width,
            y: y || Math.random() * cRect.height,
            radius: Math.random() *
                   (MAX_BUBBLE_RADIUS - MIN_BUBBLE_RADIUS) + MIN_BUBBLE_RADIUS,
            speedX: SPEED * Math.random(),
            speedY: SPEED * Math.random(),
            image: arrayRandom(Bubbles, -1),
        };

        d_circles.push(ret);

        return ret;
    };

    // Handle the setup of a new game screen.  If the specified 'firstTime' is
    // 'true', this is the setup for the initial game screen.
    function handleNewScreen(firstTime) {
        d_numCircles++;
        for (var i = 0; i < d_numCircles; ++i) {
            this.createBubble();
        }

        changeBackground();

        if (!firstTime) {
            // Play a yay :)
            setTimeout(function() { playSound(Sounds.yay); }, 500);
        }
    };

    // Handle a click on the bubble at the specified 'idx' in 'd_circles'.
    // Return 'true' if the click was handled and the bubble was hit, or
    // 'false' if the bubble shouldn't be counted as hit.
    function checkBubbleHit(idx) {
        // Remove bubble.  If none are left, recreate, with one extra
        d_circles.splice(idx, 1);
        playSound(Sounds.pop);

        if (d_circles.length == 0) {
            this.handleNewScreen(false);
        }

        return true;
    };

    // Check for bubble hits at the specified 'x, y' coordinates.
    function checkHit(x, y) {
        for (var circIdx = d_circles.length - 1; circIdx >= 0; --circIdx) {
            var circ = d_circles[circIdx];
            if (checkClick(circ, x, y) &&
                this.checkBubbleHit(circIdx))
            {
                return;
            }
        }
    };

    // Draw the content
    function drawContent() {
        var elapsed = 1.0/FPS;
        for (var i = 0; i < d_circles.length; ++i) {
            var circ = d_circles[i];
            advanceCircle(circ, elapsed);
            drawCircle(circ);
        }
    }

    // Update our state/draw our frame.
    function draw() {
        // Draw background
        ctx.drawImage(curBackground.image, 0, 0, cRect.width, cRect.height);
        this.drawContent();
    }

    return {
        createBubble: createBubble,
        checkBubbleHit: checkBubbleHit,
        checkHit: checkHit,
        handleNewScreen: handleNewScreen,
        drawContent: drawContent,
        draw: draw,
        circles: d_circles,
    };
};

// Definition of number game, where a number is shown and thats the only
// bubble that can be clicked
function NumberGameMode() {
    var d_base = new BasicGameMode();
    var d_targetNumber = null;

    function setTargetNumber(num, firstBubble) {
        this.d_targetNumber = num;

        var timeout = firstBubble ? 1000 : 300;
        setTimeout(function() { playSound(Sounds.numbers[num]); }, timeout);
    };

    // Create a circle with a number in it
    function createBubble(x, y) {
        var ret = d_base.createBubble(x, y);
        ret.number = Math.floor(Math.random() * 9) + 1;

        if (!this.d_targetNumber) {
            setTargetNumber.call(this, ret.number, true);
        }

        return ret;
    }

    // Draw bubbles, along with text saying which number to hit
    function drawContent() {
        if (this.d_targetNumber) {

            // Draw the target number at the top of the screen
            ctx.fillStyle = "cyan";
            ctx.fillRect(canvas.width/5*4 - 100, 60, 200, 80);

            ctx.font = "60px Comic Sans MS";
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            ctx.fillText("Click " + this.d_targetNumber,
                         canvas.width/5 * 4,
                         120);
        }

        d_base.drawContent();

    };

    // We only allow the '0'th bubble to be hit
    function checkBubbleHit(idx) {
        if (d_base.circles[idx].number === this.d_targetNumber &&
            d_base.checkBubbleHit.call(this, idx))
        {
            // Pick a new target number
            for (var i in d_base.circles) {
                if (d_base.circles[i].number !== this.d_targetNumber) {
                    setTargetNumber.call(this,
                                         d_base.circles[i].number,
                                         false);
                    break;
                }
            }

            return true;
        }
        else {
            playSound(Sounds.mistake);
            return false;
        }
    };

    var ret = Object.assign({}, d_base);
    ret.createBubble = createBubble;
    ret.drawContent = drawContent;
    ret.checkBubbleHit = checkBubbleHit;

    return ret;
};

function handleMouseDown(event) {
    var x = event.clientX - cRect.left;
    var y = event.clientY - cRect.top;

    if (event.button ===  0) {
        gameMode.checkHit(x, y);
    }
    else if (event.button === 2) {
        gameMode.checkHit(x, y);
        //canvasRightClicked(x, y);
    }
}

function handleMouseMove(event) {
    var x = event.clientX - cRect.left;
    var y = event.clientY - cRect.top;

    //gameMode.checkHit(x, y);
}

function canvasRightClicked(x, y) {
    //gameMode.createBubble(x, y);
}

function runGame(player, type) {
    // Reset the game
    SPEED = 0;
    if (frameIntervalId) {
        clearInterval(frameIntervalId);
    }

    if (type == "numbers") {
        gameMode = new NumberGameMode();
    }
    else {
        gameMode = new BasicGameMode();
    }

    // Set up the canvas
    canvas = document.getElementById("myCanvas");
    canvas.width = screen.width;
    canvas.height = screen.height;
    canvas.addEventListener('mousedown', handleMouseDown, false);
    canvas.addEventListener('mousemove', handleMouseMove, false);
    cRect = canvas.getBoundingClientRect();
    ctx = canvas.getContext("2d");

    canvas.webkitRequestFullScreen();

    // Getting the bounding client rect immediately after requesting
    // full-screen doesn't seem to give the right value.
    setTimeout(function() { cRect = canvas.getBoundingClientRect(); }, 100);

    initResources(player);

    changeBackground();

    // Create initial circles
    gameMode.handleNewScreen(true);

    // Set up our draw function to be called FPS times/sec
    frameIntervalId = setInterval(function() { gameMode.draw(); }, 1000/FPS);
}

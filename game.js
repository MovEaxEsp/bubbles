// CONSTANTS
var FPS=30;

// Globals
var numCircles = null;
var circles = [];
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

// FUNCTIONS

function initResources(player) {
    Sounds = {
        pop: [ "pop1.wav", "pop2.wav" ],
    };

    Backgrounds = ["busytown", "clifford",
                      "jake", "paw-patrol", "thomas",
                      "wonder-woman", "frozen", "my-little-pony", "hulk"];

    Bubbles = [ "bubble1.png", "bubble2.png" ];

    if (player == "mia") {
        SPEED = 30;
        MIN_BUBBLE_RADIUS = 50;
        MAX_BUBBLE_RADIUS = 100;
        Sounds.yay = ["allHurray.wav", "kimMia.wav", "krysMia.wav",
                      "pawWooHoo.wav"]
    }
    else {
        SPEED = 0;
        MIN_BUBBLE_RADIUS = 150;
        MAX_BUBBLE_RADIUS = 200;
        Sounds.yay = ["allHurray.wav", "emiDidIt.wav", "kimEmi.wav",
                      "miaEmi.wav", "pawWooHoo.wav"]
    }

    // Replace each sound name with an Audio object for it
    for (var key in Sounds) {
        for (var idx in Sounds[key]) {
            Sounds[key][idx] = new Audio("sounds/" + Sounds[key][idx]);
        }
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

// Create a circle at the specified 'x' and 'y' coordinates, or at random
// coordinates if 'x' and 'y' aren't specified.
function createCircle(x, y) {
    var ret =  {
        x: x || Math.random() * cRect.width,
        y: y || Math.random() * cRect.height,
        radius: Math.random() * (MAX_BUBBLE_RADIUS - MIN_BUBBLE_RADIUS) +
                                                             MIN_BUBBLE_RADIUS,
        speedX: SPEED * Math.random(),
        speedY: SPEED * Math.random(),
        image: arrayRandom(Bubbles, -1),
    };

    return ret;
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
        }
    }
}

function handleMouseDown(event) {
    var x = event.clientX - cRect.left;
    var y = event.clientY - cRect.top;

    if (event.button ===  0) {
        bubbleHit(x, y);
    }
    else if (event.button === 2) {
        bubbleHit(x, y);
        //canvasRightClicked(x, y);
    }
}

function handleMouseMove(event) {
    var x = event.clientX - cRect.left;
    var y = event.clientY - cRect.top;

    //bubbleHit(x, y);
}

// Play one of the specified 'sounds'
function playSound(sounds) {
    var sound = arrayRandom(sounds, -1);
    sound.currentTime = 0;
    sound.play();
}

// Return 'true' if the specified 'circ' is hit by a click at the specified
// 'x' and 'y' coordinates.
function checkHit(circ, x, y) {
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

// Handle an attempt to hit a bubble at the specified 'x' and 'y' coordinates
function bubbleHit(x, y) {
    for (var circIdx in circles) {
        var circ = circles[circIdx];
        if (checkHit(circ, x, y)) {
            // Remove circles until none are left, then create them all again,
            // plus 1 extra
            circles.splice(circIdx, 1);
            playSound(Sounds.pop);
            break;
        }
    }

    if (circles.length === 0) {
        numCircles++;
        for (var i = 0; i < numCircles; ++i) {
            circles.push(createCircle());
        }

        changeBackground();

        // Play a yay :)
        setTimeout(function() { playSound(Sounds.yay); }, 500);
    }
}

function canvasRightClicked(x, y) {
    //circles.push(createCircle(x, y));
}

// Update our state/draw our frame.  Assume we're called 60 times/sec
function draw() {
    var elapsed = 1.0/FPS;

    // Draw background
    ctx.drawImage(curBackground.image, 0, 0, cRect.width, cRect.height);

    // Draw circles
    for (var i = 0; i < circles.length; ++i) {
        var circ = circles[i];
        advanceCircle(circ, elapsed);
        drawCircle(circ);
    }
}

function runGame(player) {
    // Reset the game
    circles = [];
    numCircles = 1;
    SPEED = 0;
    if (frameIntervalId) {
        clearInterval(frameIntervalId);
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

    // Create initial circles
    for (var i = 0; i < numCircles; ++i ) {
        circles.push(createCircle());
    }

    changeBackground();

    // Set up our draw function to be called FPS times/sec
    frameIntervalId = setInterval(draw, 1000/FPS);
}

/**
 * Starts the game, creating the menu wheel, launching the main menu,
 * and starting the event loop.
 */
function startGame(){
    canvas.textAlign = "center";

    var w = element.width / 2;
    var h = element.height - 75;  // Padding at bottom of screen.
    // See http://www.w3schools.com/tags/img_arc.gif for arc start and end points.

    var wOffset = 130;
    var hOffset = 30;
    wheel.push(new Entity.Choice(w-wOffset, h-hOffset, "tl"));
    wheel.push(new Entity.Choice(w+wOffset, h-hOffset, "tr"));
    wheel.push(new Entity.Choice(w-wOffset, h+hOffset, "bl"));
    wheel.push(new Entity.Choice(w+wOffset, h+hOffset, "br"));

    entities.circle = new Entity.Circle(w, h);
    entities.hp = new Entity.Text("HP: " + stats.hp, "red", 50, element.height - 10, 15);

    audio.wheelCharge = loadAudio("wheel-charge.mp3");
    audio.wheelEnd = loadAudio("wheel-end.mp3");
    audio.battle1 = loadAudio("battle1.mp3");
    audio.battle2 = loadAudio("battle2.mp3");

    function playB1(){
        playAudio(audio.battle1, undefined, false, playB2);
    }
    function playB2(){
        playAudio(audio.battle2, undefined, false, playB1);
    }
    playB1();
    loop = window.requestAnimFrame(update);
    Menu.Main();
}

function resetGame(){
    stats = {
        hp: 100,
        maxHp: 100
    };

    if (entities.hasOwnProperty("status")){
        delete entities.status;
    }
    if (entities.hasOwnProperty("enemy")){
        delete entities.enemy;
    }
    entities.hp.setText("HP: " + stats.hp);
    inventory = [
        new Item.Potion(3)
    ];
    Menu.Main();
}

/**
 * Clears all drawn objects from the screen.
 */
function clearScreen(){
    canvas.clearRect(0, 0, element.width, element.height);
}

/**
 * Presents a text status that can be tapped away.
 * Allows a callback function to be executed after the text message is disregarded.
 *
 * @param {string} text - Text of the status message.
 * @param {function} callback - Function to be executed after the status message is disregarded.
 */
function statusText(text, callback=undefined){
    entities.circle.setPointer(null);
    entities.status = new Entity.Text(text, "red", element.width / 2, 25, 25);
    wheelState = [];
    for (var i = 0; i < wheel.length; i++){
        var current = wheel[i];
        wheelState.push(current.disabled);
        current.setDisabled(true);
    }
    tap = {
        when: Date.now(),
        callback: function(){
            delete entities.status;
            tap = undefined;
            for (var i = 0; i < wheel.length; i++){
                wheel[i].setDisabled(wheelState[i]);
            }
            if (callback === undefined){
                return;
            }
            tapStart = undefined;
            callback();
        }
    }
}

function inventoryContains(id){
    for (var i = 0; i < inventory.length; i++){
        if (inventory[i].id === id){
            return true;
        }
    }
    return false;
}

function hasRune(letter){
    for (var i = 0; i < inventory.length; i++) {
        if (inventory[i].id === "rune" && inventory[i].letter === letter){
            return true;
        }
    }
    return false;
}

function fromInventory(id){
    for (var i = 0; i < inventory.length; i++){
        if (inventory[i].id === id){
            return inventory[i];
        }
    }
}

function startMorse(targetWord, callback){
    entities.circle.setPointer(null);
    for (var i = 0; i < wheel.length; i++){
        wheel[i].setDisabled(true);
    }
    morse.target = targetWord.toLowerCase().split("");
    morse.target = morse.target.map(function(letter){
        var keys = Object.keys(morse.dictionary);
        for (var i = 0; i < keys.length; i++){
            var current = morse.dictionary[keys[i]]
            if (current === letter){
                return keys[i];
            }
        }
    });
    morse.word = targetWord.toUpperCase().split("");
    morse.callback = callback;
    morse.buffer = "";
    morse.current = 0;
    morse.failed = 0;
    morse.receiving = true;
    tapStart = undefined;
    entities.status = new Entity.Text(morse.word[0], "red", element.width / 2, 25, 25);
    spawnGrowingText(morse.target[0][0], 75, 100, 1000);
}

function spawnGrowingText(text, startSize, endSize, time){
    var text = new Entity.Text(text, "rgba(0, 0, 0, 1)", element.width / 2, element.height / 5 * 3, startSize);
    var growthPerFrame = time / endSize / fps;
    text.update = function(){
        if (this.size < endSize){
            this.size += growthPerFrame
            canvas.drawText(this.text, this.x, this.y, this.color, this.size);
            this.last = Date.now();
            this.opacity = 1.0
            return;
        }
        if (Date.now() < this.last + 5000 || this.color < 0.1){
            this.opacity -= 0.025;
            this.color = "rgba(0, 0, 0, " + this.opacity + ")";
            canvas.drawText(this.text, this.x, this.y, this.color, this.size);
            return;
        }
        delete entities.currentMorseLetter;
    };
    entities.currentMorseLetter = text;
}

// I would be weary of doing things in 'processMorse()'
function processMorse(holdTime){
    function tryFinish(){
        if (morse.current >= morse.target.length){
            morse.target = undefined;
            morse.buffer = undefined;
            morse.receiving = false;
            if (entities.hasOwnProperty("currentMorseLetter")){
                delete entities.currentMorseLetter;
            }
            morse.callback(morse.failed);
            morse.callback = undefined;
            return true;
        }
        return false;
    }
    if (holdTime > 500){
        morse.buffer += "-";
    }
    else{
        morse.buffer += "."
    }
    // Current morse string equals the target morst string, good.
    if (morse.target[morse.current] === morse.buffer){
        morse.current += 1;
        morse.buffer = "";
        if (tryFinish()){
            return;
        }
        entities.status.setText(morse.word[morse.current]);
        spawnGrowingText(morse.target[morse.current][0], 75, 100, 1000);
        return;
    }
    // Current morse character does not equal target morse character at this point, bad.
    if (morse.buffer[morse.buffer.length - 1] !== morse.target[morse.current][morse.buffer.length - 1]){
        morse.failed += 1;
        morse.current += 1;
        morse.buffer = "";
        if (tryFinish()){
            return;
        }
        entities.status.setText(morse.word[morse.current]);
        spawnGrowingText(morse.target[morse.current][0], 75, 100, 1000);
        return;
    }
    entities.status.setText(morse.word[morse.current]);
    spawnGrowingText(morse.target[morse.current][morse.buffer.length], 75, 100, 1000);
}

function defineChoices(choices){
    entities.circle.setPointer(null);
    var choicesAmount = choices.length;
    for (var i = 0; i < wheel.length; i++) {
        if (i >= choicesAmount){
            wheel[i].disable();
            continue;
        }
        wheel[i].setup(choices[i][0], choices[i][1]);
    }
}

function callFuncs(target, func, check=true){
    if (!Array.isArray(target)){
        var keys = Object.keys(target);
        for (var i = 0; i < keys.length; i++){
            if (!check){
                target[keys[i]][func]();
                continue;
            }
            var current = target[keys[i]];
            if (current !== null && current !== undefined && current.hasOwnProperty(func)){
                current[func]();
            }
        }
    }
    for (var i = 0; i < target.length; i++){
        if (!check){
            target[i][func]();
            continue;
        }
        var current = target[i];
        if (current !== null && current !== undefined && current.hasOwnProperty(func)){
            current[func]();
        }
    }
}

function addMultiEventListener(on, events, callback){
    for (var i = 0; i < events.length; i++) {
        on.addEventListener(events[i], callback);
    }
}

function wrapText(text, x, y, maxWidth, lineHeight) {
    var words = text.split(" ");
    var line = "";

    for(var i = 0; i < words.length; i++){
        var testLine = line + words[i] + " ";
        var metrics = canvas.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && i > 0) {
            canvas.fillText(line, x, y);
            line = words[i] + " ";
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    canvas.fillText(line, x, y);
}

function randomBetween(min, max){
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function uuid4(){
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function loadAudio(filename){
    var currentAudio = document.createElement("audio");
    currentAudio.setAttribute("id", filename);
    currentAudio.setAttribute("src", filename);
    currentAudio.setAttribute("width", "1px");
    currentAudio.setAttribute("height", "1px");
    currentAudio.setAttribute("scrolling", "no");
    currentAudio.style.border = "0px";
    document.body.appendChild(currentAudio);
    return currentAudio;
}

function playAudio(currentAudio, inSeconds=undefined, override=false, callback=undefined){
    if (audio.playing.indexOf(currentAudio.getAttribute("id")) !== -1 && !override){
        return;
    }
    if (currentAudio.readyState !== 4){
        setTimeout(function(){playAudio(currentAudio, inSeconds, override, callback)}, 1000);
        return;
    }
    if (inSeconds === undefined){
        inSeconds = currentAudio.duration;
    }
    audio.playing.push(currentAudio.getAttribute("id"));
    var rate = inSeconds / currentAudio.duration;
    currentAudio.playbackRate = rate;
    currentAudio.play();
    setTimeout(function(){
        var index = audio.playing.indexOf(currentAudio.getAttribute("id"));
        audio.playing.splice(index, 1);
        if (callback !== undefined){
            callback();
        }
    }, inSeconds * 1000);
}

/**
 * Game loop function.
 * Renders all entities and checks held-time.
 */
function update(){
    setTimeout(function(){
        window.requestAnimFrame(update);
        clearScreen();
        callFuncs(entities, "update", false);
        callFuncs(wheel, "update", false);
        if (tapStart === undefined){
            entities.circle.setFill(0);
            return;
        }
        if (morse.receiving){
            entities.circle.setFill(parseInt((holdTime / 500) * 100));
        }
        holdTime = Date.now() - tapStart
        if (holdTime < 250 || currentChoice === undefined){
            return;
        }
        if (holdTime < 1250){
            entities.circle.setFill(parseInt((holdTime / 1250) * 100));
            return;
        }
        if (currentChoice !== undefined){
            entities.circle.setFill(0);
            currentChoice.getCallback()()
            currentChoice = undefined;
            return;
        }
    }, 1000 / fps);
}

/**
 * Container for all functions that show wheel menus.
 *
 */
var Menu = {
    // Say "Hello" to the "Pyramids of doom"!
    /**
     * Launches the main menu.
     */
    Main: function(){
        defineChoices([
            ["Enter Battle!", function(){
                entities.enemy = new Entity.Enemy("Tonberry", "tonberry.png", [16, 22], [5, 7]);
                statusText("A wild " + entities.enemy.name + " Appears!", Menu.Battle);
            }]
        ]);
    },
    Battle: function(){
        defineChoices([
            ["Attack", function(){
                Menu.Attack();
            }],
            ["Magic", function(){
                statusText("Abra ka dabra...words here to test word wrap I hope it's working <3", Menu.Battle);
            }],
            ["Runes", function(){
                statusText("Runecraft", Menu.Battle);
            }],
            ["Items", function(){
                statusText("You have a potion, but can't use it", Menu.Battle);
            }]
        ]);
    },
    Attack: function(){
        defineChoices([
            ["Light", function(){
                statusText("You attempt a light attack...", function(){
                    var damage = randomBetween(4, 6);
                    var alive = entities.enemy.doDamage(damage);
                    if (alive){
                        statusText("You did " + damage + " points of damage!", function(){
                            var damage = entities.enemy.getDamage();
                            stats.hp -= damage;
                            entities.hp.setText("HP: " + stats.hp)
                            if (stats.hp > 0){
                                statusText("You took " + damage + " points of damage!", Menu.Battle);
                                return;
                            }
                            statusText("You died after you took " + damage + " points of damage...", resetGame);
                        });
                        return;
                    }
                    var name = entities.enemy.name;
                    delete entities.enemy;
                    statusText("You defeated the " + name + "!", Menu.Main);
                });
            }],
            ["Heavy", function(){
                startMorse("TONBERRY", function(failedAmount){
                    var percentage = failedAmount / 8;
                    statusText("You missed " + (percentage * 100) + "%, " + failedAmount + " letters.", function(){
                        var avg = parseInt(15 - percentage)
                        var damage = randomBetween(avg - 1, avg + 1);
                        var alive = entities.enemy.doDamage(damage);
                        if (alive){
                            statusText("You did " + damage + " points of damage!", function(){
                                var damage = entities.enemy.getDamage();
                                stats.hp -= damage;
                                entities.hp.setText("HP: " + stats.hp)
                                if (stats.hp > 0){
                                    statusText("You took " + damage + " points of damage!", Menu.Battle);
                                    return;
                                }
                                statusText("You died after you took " + damage + " points of damage...", resetGame);
                            });
                            return;
                        }
                        var name = entities.enemy.name;
                        delete entities.enemy;
                        statusText("You defeated the " + name + "!", Menu.Main);
                    });
                });
            }],
            ["Defend", function(){
                statusText("You are on defence", function(){
                    var damage = entities.enemy.getDamage() / 2;
                    stats.hp -= damage;
                    entities.hp.setText("HP: " + stats.hp)
                    if (stats.hp > 0){
                        statusText("You took " + damage + " points of damage!", Menu.Battle);
                        return;
                    }
                    statusText("You died after you took " + damage + " points of damage...", resetGame);
                });
            }],
            ["Return", function(){
                Menu.Battle();
            }]
        ]);
    }
}

/**
 * Container for all on-screen entities.
 */
var Entity = {
    Enemy: function(name, image, hp, attack){
        this.uuid = uuid4();
        this.born = Date.now();
        this.name = name;
        this.image = new Image();
        this.image.src = image;
        this.hp = randomBetween(hp[0], hp[1]);
        this.attack = attack;
        this.update = function(){
            canvas.drawImage(this.image, (element.width - 400) / 2, (element.height - 300) / 4, 400, 300);
            canvas.drawText("HP: " + this.hp, (element.width) / 2, (element.height - 300) / 5, "black", 15);
        };
        this.doDamage = function(damage){
            this.hp -= damage;
            return this.hp > 0;
        };
        this.getDamage = function(damage){
            return randomBetween(attack[0], attack[1]);
        }
    },
    Choice: function(x, y, relativeLoc){
        this.uuid = uuid4();
        this.born = Date.now();
        this.x = x;
        if (relativeLoc.split()[1] === "r"){
            this.textX = this.x - 5
        }
        else{
            this.textX = this.x + 5
        }
        this.y = y;
        this.textY = this.y + 8
        this.text = "";
        this.relativeLoc = relativeLoc;
        this.disabled = false;
        this.callback = undefined;
        this.update = function(){
            if (this.disabled){
                return;
            }
            canvas.drawText(this.text, this.textX, this.textY, "black", 25, "Arial");
            var points = [];
            if (this.relativeLoc.split("")[1] === "r"){
                points = [[this.x-90, this.y], [this.x-80, this.y-18], [this.x+70, this.y-18], [this.x+70, this.y+18], [this.x-80, this.y+18]];
            }
            else if (this.relativeLoc.split("")[1] === "l"){
                points = [[this.x-80, this.y-18], [this.x+80, this.y-18], [this.x+90, this.y], [this.x+80, this.y+18], [this.x-80, this.y+18]];
            }
            canvas.lineWidth = 2;
            canvas.drawPolygon(points, undefined, "black");
        };
        this.setCallback = function(callback){
            this.callback = callback;
        };
        this.setText = function(text){
            this.text = text;
        };
        this.setDisabled = function(disabled){
            this.disabled = disabled;
        };
        this.disable = function(){
            this.disabled = true;
            this.text = "";
            this.callback = undefined;
        };
        this.getCallback = function(){
            if (this.disabled){
                return undefined;
            }
            return this.callback;
        };
        this.setup = function(text, callback){
            this.text = text;
            this.callback = callback;
            this.disabled = false;
        };
        this.highlight = function(){
            entities.circle.setPointer(this.relativeLoc);
        };
    },
    Circle: function(x, y){
        this.uuid = uuid4();
        this.born = Date.now();
        this.x = x;
        this.y = y;
        this.current = null;
        this.fill = 1;
        this.update = function(){
            canvas.beginPath();
            canvas.arc(this.x, this.y, 50, 0, 2 * Math.PI, false);
            canvas.lineWidth = 2;
            canvas.strokeStyle = "black";
            canvas.stroke();
            canvas.closePath();
            canvas.beginPath();
            canvas.arc(this.x, this.y, 40, 0, 2 * Math.PI, false);
            canvas.lineWidth = 2;
            canvas.strokeStyle = "black";
            canvas.stroke();
            canvas.closePath();
            if (this.fill !== 0){
                var start = 2.0 + this.fill * -0.02 + 0.5;
                var end = this.fill * 0.02 + 0.5;
                canvas.beginPath();
                canvas.fillStyle = "green";
                canvas.arc(this.x, this.y, 40, start * Math.PI, end * Math.PI);
                canvas.fill();
                canvas.closePath();
            }
            if (this.current === null){
                return;
            }
            var dict = {
                "bl": [0.79 * Math.PI, 0.92 * Math.PI],
                "br": [0.07 * Math.PI, 0.21 * Math.PI],
                "tl": [1.07 * Math.PI, 1.21 * Math.PI],
                "tr": [1.79 * Math.PI, 1.93 * Math.PI]
            }
            canvas.beginPath();
            canvas.arc(this.x, this.y, 45, dict[this.current][0], dict[this.current][1], false);
            canvas.lineWidth = 10;
            canvas.strokeStyle = "black";
            canvas.stroke();
            canvas.closePath();
        };
        this.setPointer = function(current){
            this.current = current;
        };
        this.setFill = function(percentage){
            this.fill = percentage / 2;
            if (this.fill > 50){
                this.fill = 50;
            }
        };
    },
    /**
     * Some general text.
     * @constructor
     * @param {string} text - Text of text.
     * @param {string} color - Color of text.
     * @param {int} x - X location of text.
     * @param {int} y - Y location of text.
     * @property {function} update - Redraw the text.
     * @property {function} setText - Set the text.
     * @property {function} setLoc - Set the X and Y location of the text.
     * @returns {object} Text object.
     */
    Text: function(text, color, x, y, size=12){
        this.uuid = uuid4();
        this.born = Date.now();
        this.text = text;
        this.color = color;
        this.x = x;
        this.y = y;
        this.size = size;
        this.update = function(){
            canvas.drawText(this.text, this.x, this.y, this.color, this.size);
        };
        this.setText = function(text){
            this.text = text;
        };
        this.setLoc = function(x, y){
            this.x = x;
            this.y = y;
        };
        this.setSize = function(size){
            this.size = size;
        };
    },
    /**
     * A plain square, used for debugging.
     * @constructor
     * @param {int} width - Width of square in pixels.
     * @param {int} height - Height of square in pixels.
     * @param {string} color - Color of square.
     * @param {int} x - X location of square.
     * @param {int} y - Y location of square.
     * @property {function} update - Redraw text.
     * @returns {object} Text object.
     */
    Square: function(width, height, color, x, y){
        this.uuid = uuid4();
        this.born = Date.now();
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.update = function(){
            canvas.fillStyle = color;
            canvas.fillRect(this.x, this.y, this.width, this.height);
        };
    }
}

/**
 * Container for all items.
 */
var Item = {
    /**
     * Potion that restores HP to player upon use.
     * @param {int} amount - Number of potions to return.
     * @property {function} use - Use a potion, return true if the item should be deleted.
     * @returns {object} Potion object.
     */
    Potion: function(amount){
        this.uuid = uuid4();
        this.born = Date.now();
        this.name = "Potion";
        this.id = "potion";
        this.desc = "Heal 25 Hit Points";
        this.amount = amount;
        this.use = function(){
            stats.hp += 25;
            if (stats.hp > stats.maxHp){
                stats.hp = stats.maxHp;
            }
            this.amount -= 1;
            if (amount <= 0){
                return true;
            }
        }
    },
    Rune: function(amount, letter){
        this.uuid = uuid4();
        this.born = Date.now();
        this.name = "Rune";
        this.id = "rune";
        this.letter = letter;
        this.desc = "A magic rune with the letter " + letter + " on it";
        this.amount = amount;
        this.use = function(){
            this.amount -= 1;
            if (amount <= 0){
                return true;
            }
        };
    }
}

var Spell = {
    Ice: function(){
        this.name = "Ice";
        this.runes = ["I", "C", "E"];
        this.canUse = function(){
            for (var i = 0; i < this.runes.length; i++) {
                if (!hasRune(this.runes[i])){
                    return false;
                }
            }
            return true;
        };
        this.use = function(){
            var alive = entities.enemy.doDamage(10);
            if (alive){
                Menu.Battle;
                return;
            }
            statusText(entities.enemy.name + " Defeated!", Menu.Main);
            entities.enemy = undefined;
        };
    }
}

// Initializing of game begins here.

var element = document.getElementById("canvas");
var canvas = element.getContext("2d");
canvas.drawText = function(text, x, y, color, fontSize, fontFamily){
    if (color === undefined){
        color = "black"
    };
    if (fontSize === undefined){
        fontSize = 10
    };
    if (fontFamily === undefined){
        fontFamily = "Ariel"
    };
    canvas.fillStyle = color;
    canvas.font = fontSize + "px " + fontFamily;
    wrapText(text, x, y, element.width, fontSize + 2);
}

canvas.drawPolygon = function(points, fillStyle, strokeStyle){
    if (points.length <= 0){
        return;
    }
    canvas.beginPath();
    canvas.moveTo(points[0][0], points[0][1]);
    for (var i = 0; i < points.length; i++){
        canvas.lineTo(points[i][0], points[i][1]);
    }
    canvas.closePath();
    if (strokeStyle !== undefined){
        canvas.strokeStyle = strokeStyle;
        canvas.stroke();
    }
    if (fillStyle !== undefined){
        canvas.fillStyle = fillStyle;
        canvas.fill();
    }
}

var fps = 30;

window.requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame    ||
           window.oRequestAnimationFrame      ||
           window.msRequestAnimationFrame     ||
           function(callback){
              window.setTimeout(callback, 1000 / fps);
           };
})();

var audio = {
    playing: []
};

var stats = {
    hp: 100,
    maxHp: 100
};

var inventory = [
    new Item.Potion(3)
];

var entities = {
};

var wheel = [];
var tap = undefined;
var currentChoice = undefined;
var tapStart = undefined;
var loop = undefined;
var morse = {
    receiving: false,
    buffer: undefined,
    target: undefined,
    current: undefined,
    failed: undefined,
    callback: undefined,
    dictionary: {
        ".-": "a",
        "-...": "b",
        "-.-.": "c",
        "-..": "d",
        ".": "e",
        "..-.": "f",
        "--.": "g",
        "....": "h",
        "..": "i",
        ".---": "j",
        "-.-": "k",
        ".-..": "l",
        "--": "m",
        "-.": "n",
        "---": "o",
        ".--.": "p",
        "--.-": "q",
        ".-.": "r",
        "...": "s",
        "-": "t",
        "..-": "u",
        "...-": "v",
        ".--": "w",
        "-..-": "x",
        "-.--": "y",
        "--..": "z"
    }
};

addMultiEventListener(document, ["mousedown", "keydown"], function(event){
    if (tapStart !== undefined){
        return;
    }
    tapStart = Date.now();
})

addMultiEventListener(document, ["mouseup", "keyup"], function(event){
    var holdTime = Date.now() - tapStart
    if (morse.receiving && holdTime){
        tapStart = undefined;
        processMorse(holdTime);
        return;
    }
    if (tap !== undefined && tapStart > tap.when){
        tapStart = undefined;
        tap.callback();
        return;
    }
    tapStart = undefined;
    if (holdTime < 250){
        if (currentChoice === undefined){
            currentChoice = wheel[0];
            currentChoice.highlight();
            return;
        }
        function nextChoice(currentUUID){
            for (var i = 0; i < wheel.length; i++){
                if (wheel[i].uuid !== currentChoice.uuid){
                    continue;
                }
                if (i === wheel.length - 1){
                    currentChoice = wheel[0];
                    currentChoice.highlight();
                    return true;
                    break;
                }
                currentChoice = wheel[i + 1];
                if (currentChoice.disabled){
                    return false;
                }
                currentChoice.highlight();
                return true;
                break;
            }
        }
        while (!nextChoice(currentChoice.uuid)){}
        // I'm sure this is bad, will fix another time.
    }
});

startGame();

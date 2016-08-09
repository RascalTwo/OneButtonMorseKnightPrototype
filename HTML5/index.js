/**
 * Starts the game, creating the menu wheel, launching the main menu,
 * and starting the event loop.
 */
function startGame(){
    canvas.textAlign = "center";

    var w = element.width / 2;
    var h = element.height - 100;  // Padding at bottom of screen.
    // See http://www.w3schools.com/tags/img_arc.gif for arc start and end points.
    Menu.Main();
    audio.wheelCharge = loadAudio("wheel-charge.mp3");
    audio.wheelEnd = loadAudio("wheel-end.mp3");
    audio.battle1 = loadAudio("battle1.mp3");
    audio.battle2 = loadAudio("battle2.mp3");
    loop = setInterval(update, 25);
    function playB1(){
        playAudio(audio.battle1, undefined, false, playB2);
    }
    function playB2(){
        playAudio(audio.battle2, undefined, false, playB1);
    }
    playB1();
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
    entities.status = new Entity.Text(text, "red", element.width / 2, 50);
    wheelState = [];
    for (var i = 0; i < wheel.length; i++){
        var current = wheel[i];
        wheelState.push(current.disabled);
        current.setDisabled(true);
    }
    tap = function(){
        delete entities.status;
        tap = undefined;
        for (var i = 0; i < wheel.length; i++){
            wheel[i].setDisabled(wheelState[i]);
        }
        if (callback === undefined){
            return;
        }
        callback();
    }
}

/**
 * Game loop function.
 * Renders all entities and checks held-time.
 */
function update(){
    clearScreen();
    canvas.fillRect(240-5, 500-5, 10, 10)
    var keys = Object.keys(entities);
    for (var i = 0; i < keys.length; i++){
        var current = entities[keys[i]]
        if (current !== undefined){
            current.update();
        }
    }
    for (var i = 0; i < wheel.length; i++){
        wheel[i].update();
    }
    if (tapStart === undefined){
        return;
    }
    holdTime = Date.now() - tapStart
    var enabled = [];
    for (var i = 0; i < wheel.length; i++){
        var current = wheel[i];
        if (current.disabled){
            return;
        }
        enabled.push(current);
    }
    var choices = enabled.length;
    if (choices === 0){
        return;
    }
    if (holdTime > (choices + 1) * 1000){
        currentCb = undefined;
        tapStart = Date.now();
        callFuncs(enabled, "shrink");
        return;
    }
    for (var i = 1; i <= choices; i++) {
        if (holdTime > i * 1000 && holdTime < i * 1000 + 750){
            var shrink = enabled.slice();
            shrink.splice(i - 1);
            callFuncs(shrink, "shrink");
            enabled[i - 1].grow();
            currentCb = enabled[i - 1 ].getCallback();
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

function fromInventory(id){
    for (var i = 0; i < inventory.length; i++){
        if (inventory[i].id === id){
            return inventory[i];
        }
    }
}

function defineChoices(startAngle, choices){
    wheel = [];
    var choiceLength = 2 / choices.length;
    var w = element.width / 2;
    var h = element.height - 100;
    for (var i = 0; i < choices.length; i++) {
        var current = choices[i];
        var choice;
        if (i === 0){
            choice = new Entity.Choice(startAngle, choiceLength, w, h);
        }
        else{
            choice = new Entity.Choice(startAngle + choiceLength * i, choiceLength, w, h);
        }
        choice.setup(current[0], current[1]);
        wheel.push(choice);
    }
}

function callFuncs(target, func){
    if (!Array.isArray(target)){
        var keys = Object.keys(target);
        for (var i = 0; i < keys.length; i++){
            var current = target[keys[i]];
            if (current !== null && current !== undefined && current.hasOwnProperty(func)){
                current[func]();
            }
        }
    }
    for (var i = 0; i < target.length; i++){
        var current = target[i];
        if (current !== null && current !== undefined && current.hasOwnProperty(func)){
            current[func]();
        }
    }
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
 * Container for all functions that show wheel menus.
 *
 */

var Menu = {
    /**
     * Launches the main menu.
     */
    Main: function(){
        defineChoices(0.25, [
            ["Down", function(){
                statusText("Noting to see down here.", Menu.Main);
            }],
            ["Left", function(){
                statusText("Nothing to see on the left.", Menu.Main);
            }],
            ["Battle", function(){
                var image = new Image();
                image.src = "tonberry.png"
                image.onload = function(){
                    entities.enemy = new Entity.Enemy("Tonberry", image, 100);
                    Menu.Battle();
                }
            }],
            ["Right", function(){
                statusText("Nothing to see over here", Menu.Main);
            }]
        ]);
        tap = undefined;
    },
    /**
     * Launches the battle menu.
     */
    Battle: function(){
        defineChoices(0.0, [
            ["Attack", function(){
                statusText("You perform a light attack.", function(){
                    var alive = entities.enemy.doDamage(5);
                    if (alive){
                        Menu.Battle;
                        return;
                    }
                    statusText(entities.enemy.name + " Defeated!", Menu.Main);
                    entities.enemy = undefined;
                });
            }],
            ["Magic", function(){
                statusText("Abra Ka Dabra...nothing happens.", Menu.Battle);
            }],
            ["Items", function(){
                statusText("You have a potion...but you can't use it.", Menu.Battle);
            }]
        ]);
    }
}

/**
 * Container for all on-screen entities.
 */
var Entity = {
    /**
     * The current on-screen enemy.
     * @constructor
     * @param {string} name - Name of the enemy.
     * @param {Image} image - Image object to represent the enemy.
     * @param {int} hp - Number of Hit Points the enemy has.
     * @property {function} update - Redraws the enemy sprite and HP.
     * @property {function} doDamage - Does damage to the enemy, returns if the enemy is still alive.
     * @returns {object} Enemy object.
     */
    Enemy: function(name, image, hp){
        this.name = name;
        this.image = image;
        this.hp = hp;
        this.update = function(){
            canvas.drawImage(this.image, (element.width - 400) / 2, (element.height - 300) / 4, 400, 300);

            canvas.fillText("HP: " + this.hp, (element.width) / 2, (element.height - 300) / 5);
        };
        this.doDamage = function(damage){
            this.hp -= damage;
            return this.hp > 0;
        };
    },
    /**
     * The Wheel-choice entities.
     * @constructor
     * @param {float} startAngle - Angle to start arc.
     * @param {int} x - X cordnate of this choice.
     * @param {int} y - Y cordnate of this choice.
     * @param {int} textX - The number of pixels to be offset along the X axis.
     * @param {int} textY - The number of pixels to be offset along the Y axis.
     * @property {function} update - Redraws the wheel choice and text.
     * @property {function} grow - Increases the apparent size of the text and choice.
     * @property {function} shrink - Restores the choice size to normal.
     * @property {function} setCallback - Sets the callback of the choice.
     * @property {function} setText - Set the text of this choice.
     * @property {function} setDisabled - Set weather this choice is disabled.
     * @property {function} getCallback - Return the choice callback if enabled, else return undefined.
     * @property {function} setup - Set the text, and callback, then re-enable the choice.
     * @returns {object} Choice object.
     */
    Choice: function(startAngle, angleLength, x, y){
        this.text = "";
        this.radius = 75
        this.x = x;
        this.y = y;
        this.sa = startAngle * Math.PI;
        this.ea = (startAngle + angleLength) * Math.PI
        this.callback = undefined;
        this.growOffset = 0;
        this.disabled = false;
        this.update = function(){
            if (this.disabled){
                return;
            }
            var sx = this.x + this.radius*Math.cos(this.sa);
            var sy = this.y + this.radius*Math.sin(this.sa);
            var ex = this.x + this.radius*Math.cos(this.ea);
            var ey = this.y + this.radius*Math.sin(this.ea);
            canvas.beginPath();
            canvas.arc(this.x, this.y, this.radius, this.sa, this.ea, false);
            canvas.lineWidth = 5;
            canvas.strokeStyle = "black";
            canvas.stroke();
            canvas.fillText(this.text, ((sx + ex) / 2), ((sy + ey) / 2));
            // Begin Debug
            canvas.fillStyle = "red";
            canvas.fillRect(sx - 3, sy - 3, 6, 6);
            canvas.fillStyle = "green";
            canvas.fillRect(ex - 5, ey - 5, 10, 10);
            canvas.fillStyle = "black";
            canvas.fillRect(((sx + ex) / 2) - 2,((sy + ey) / 2) - 2, 4, 4);
            // End Debug
        };
        this.grow = function(){
            this.radius = 100;
        };
        this.shrink = function(){
            this.radius = 75;
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
        }
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
    Text: function(text, color, x, y){
        this.text = text;
        this.color = color;
        this.x = x;
        this.y = y;
        this.update = function(){
            var oldFont = canvas.font;
            canvas.font = "20px Arial";
            canvas.fillStyle = this.color;
            canvas.fillText(this.text, this.x, this.y);
            canvas.font = oldFont;
        };
        this.setText = function(text){
            this.text = text;
        };
        this.setLoc = function(x, y){
            this.x = x;
            this.y = y;
        }
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

// Initializing of game begins here.

var element = document.getElementById("canvas");
var canvas = element.getContext("2d");
var audio = {
    playing: []
}

var stats = {
    hp: 100,
    maxHp: 100
};
var inventory = [
    new Item.Potion(3)
]

var entities = {

}
var wheel = [];
var tap = undefined;
var currentCb = undefined;
var tapStart = undefined;
var loop = undefined;

element.addEventListener("mousedown", function(event){
    tapStart = Date.now();
});

element.addEventListener("mouseup", function(event){
    var holdTime = Date.now() - tapStart
    tapStart = undefined;
    callFuncs(wheel, "shrink");
    if (currentCb !== undefined){
        currentCb();
        currentCb = undefined;
        return;
    }
    if (holdTime < 250){
        if (tap === undefined){
            var cb = wheel[0].getCallback()
            if (cb !== undefined){
                cb();
            }
        }
        else{
            tap();
        }
    }
    // Begin Debug
    if (entities.hasOwnProperty("text")){
        entities.text.setText(holdTime);
        entities.text.setLoc(event.layerX, event.layerY);
        return;
    }
    entities.text = new Entity.Text(event.layerX + " " + event.layerY, "black", event.layerX, event.layerY);
    // End Debug
});

startGame();

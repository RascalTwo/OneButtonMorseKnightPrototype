/**
 * Starts the game, creating the menu wheel, launching the main menu,
 * and starting the event loop.
 */
function startGame(){
    canvas.textAlign = "center";

    var w = element.width / 2;
    var h = element.height - 100;  // Padding at bottom of screen.
    wheel.up = new Entity.Choice(1.25, w, h, 0, -50);
    wheel.down = new Entity.Choice(0.25, w, h, 0, 50);
    wheel.left = new Entity.Choice(0.75, w, h, -50, 0);
    wheel.right = new Entity.Choice(1.75, w, h, 50, 0);
    // See http://www.w3schools.com/tags/img_arc.gif for arc start and end points.
    Menu.Main();
    loop = setInterval(update, 10);
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
    wheelState = [  // Makes it so the wheels to back to their state before the status text.
        wheel.up.disabled,
        wheel.down.disabled,
        wheel.left.disabled,
        wheel.right.disabled
    ]
    wheel.up.setDisabled(true);
    wheel.down.setDisabled(true);
    wheel.left.setDisabled(true);
    wheel.right.setDisabled(true);
    tap = function(){
        delete entities.status;
        tap = undefined;
        wheel.up.setDisabled(wheelState[0]);
        wheel.down.setDisabled(wheelState[1]);
        wheel.left.setDisabled(wheelState[2]);
        wheel.right.setDisabled(wheelState[3]);
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
    var keys = Object.keys(entities);
    for (var i = keys.length - 1; i >= 0; i--){
        var current = entities[keys[i]]
        if (current !== undefined){
            current.update();
        }
    }
    var keys = Object.keys(wheel);
    for (var i = keys.length - 1; i >= 0; i--){
        wheel[keys[i]].update();
    }
    if (tapStart === undefined){
        return;
    }
    holdTime = Date.now() - tapStart
    var enabled = [];
    if (!wheel.down.disabled){
        enabled.push(wheel.down);
    }
    if (!wheel.left.disabled){
        enabled.push(wheel.left);
    }
    if (!wheel.up.disabled){
        enabled.push(wheel.up);
    }
    if (!wheel.right.disabled){
        enabled.push(wheel.right);
    }
    // Got lazy, hence the reason for the code below.
    switch(enabled.length){
        case 0:
            return;

        case 1:
            if (holdTime > 1000 && holdTime < 1500){
                enabled[0].grow();
                currentCb = enabled[0].getCallback();
            }
            else if (holdTime > 2000){
                currentCb = undefined;
                tapStart = Date.now();
                enabled[0].shrink()
            }

        case 2:
            if (holdTime > 1000 && holdTime < 1500){
                enabled[0].grow();
                currentCb = enabled[0].getCallback();
            }
            else if (holdTime > 2000 && holdTime < 2500){
                enabled[1].grow();
                currentCb = enabled[1].getCallback();
                enabled[0].shrink()
            }
            else if (holdTime > 3000){
                currentCb = undefined;
                tapStart = Date.now();
                enabled[1].shrink()
                enabled[0].shrink()
            }

        case 3:
            if (holdTime > 1000 && holdTime < 1500){
                enabled[0].grow();
                currentCb = enabled[0].getCallback();
            }
            else if (holdTime > 2000 && holdTime < 2500){
                enabled[1].grow();
                currentCb = enabled[1].getCallback();
                enabled[0].shrink()
            }
            else if (holdTime > 3000 && holdTime < 3500){
                enabled[2].grow();
                currentCb = enabled[2].getCallback();
                enabled[1].shrink()
                enabled[0].shrink()
            }
            else if (holdTime > 4000){
                currentCb = undefined;
                tapStart = Date.now();
                enabled[2].shrink()
                enabled[1].shrink()
                enabled[0].shrink()
            }

        case 4:
            if (holdTime > 1000 && holdTime < 1500){
                enabled[0].grow();
                currentCb = enabled[0].getCallback();
            }
            else if (holdTime > 2000 && holdTime < 2500){
                enabled[1].grow();
                currentCb = enabled[1].getCallback();
                enabled[0].shrink()
            }
            else if (holdTime > 3000 && holdTime < 3500){
                enabled[2].grow();
                currentCb = enabled[2].getCallback();
                enabled[1].shrink()
                enabled[0].shrink()
            }
            else if (holdTime > 4000 && holdTime < 4500){
                enabled[3].grow();
                currentCb = enabled[3].getCallback();
                enabled[2].shrink()
                enabled[1].shrink()
                enabled[0].shrink()
            }
            else if (holdTime > 5000){
                currentCb = undefined;
                tapStart = Date.now();
                enabled[3].shrink()
                enabled[2].shrink()
                enabled[1].shrink()
                enabled[0].shrink()
            }
    }
}


/**
 * Damages the current enemy via taping, to be assigned to the 'tap' variable.
 */
function tapDamage(){  // Will be moved into the future-Tap action object.
    var alive = entities.enemy.doDamage(25);
    if (alive){
        return;
    }
    statusText(entities.enemy.name + " Defeated!", Menu.Main);
    entities.enemy = undefined;
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
        wheel.up.setup("Battle", function(){
            var image = new Image();
            image.src = "tonberry.png"
            image.onload = function(){
                entities.enemy = new Entity.Enemy("Tonberry", image, 100);
                Menu.Battle();
            }
        });

        wheel.down.setup("Down", function(){
            statusText("Nothing to see down here", Menu.Main);
        });

        wheel.left.setup("Left", function(){
            statusText("Nothing to see over here", Menu.Main);
        });

        wheel.right.setup("Right", function(){
            statusText("Nothing to see over here", Menu.Main);
        });
        tap = undefined;
    },
    /**
     * Launches the battle menu.
     */
    Battle: function(){
        wheel.up.disable();
        wheel.down.disable();
        wheel.left.setup("Magic", function(){
            statusText("Abra Ka Dabra...nothing happens.", Menu.Battle);
        });
        wheel.right.setup("Items", function(){
            statusText("You have a potion...but you can't use it.", Menu.Battle);
        });
        tap = tapDamage;
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
    Choice: function(startAngle, x, y, textX, textY){
        this.startAngle = startAngle;
        this.text = "";
        this.radius = 75
        this.x = x;
        this.y = y;
        this.textX = textX;
        this.textY = textY;
        this.callback = undefined;
        this.growOffset = 0;
        this.disabled = false;
        this.update = function(){
            if (this.disabled){
                return;
            }
            canvas.beginPath();
            canvas.arc(this.x, this.y, this.radius, this.startAngle * Math.PI, (this.startAngle + 0.5) * Math.PI, false);
            canvas.lineWidth = 5;
            canvas.strokeStyle = "black";
            canvas.stroke();
            canvas.closePath();
            if (this.textX === 0){
                canvas.fillText(this.text, this.x, this.y + this.textY + this.growOffset);
                return;
            }
            canvas.fillText(this.text, this.x + this.textX + this.growOffset, this.y);
        };
        this.grow = function(){
            this.radius = 100;
            if (this.textX === 0){
                if (this.textY > 0){
                    this.growOffset = 25
                    return;
                }
                this.growOffset = -25;
                return;
            }
            if (this.textX > 0){
                this.growOffset = 25
                return;
            }
            this.growOffset = -25;
            return;
        };
        this.shrink = function(){
            this.radius = 75;
            this.growOffset = 0;
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
    }
}

// Initializing of game begins here.

var element = document.getElementById("canvas");
var canvas = element.getContext("2d");

var stats = {
    hp: 100,
    maxHp: 100
};
var inventory = [
    new Item.Potion(3)
]

var entities = {

}
var wheel = {
    up: undefined,
    down: undefined,
    left: undefined,
    right: undefined
}
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
    wheel.up.shrink();
    wheel.down.shrink();
    wheel.left.shrink();
    wheel.right.shrink();
    if (currentCb !== undefined){
        currentCb();
        currentCb = undefined;
        return;
    }
    if (tap !== undefined && holdTime < 250){
        tap();
    }
    if (entities.hasOwnProperty("text")){
        entities.text.setText(holdTime);
        entities.text.setLoc(event.layerX, event.layerY);
        return;
    }
    entities.text = new Entity.Text(holdTime, "black", event.layerX, event.layerY);
});

startGame();

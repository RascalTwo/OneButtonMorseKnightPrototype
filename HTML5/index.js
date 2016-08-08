console.log("Hello world!");


var game = {
    element: document.getElementById("canvas"),
    canvas: document.getElementById("canvas").getContext("2d"),
    down: undefined,
    objects: {},
    wheel: {
        up: undefined,
        down: undefined,
        left: undefined,
        right: undefined
    },
    current: undefined,
    start: function(){
      var w = this.element.width / 2;
      var h = this.element.height - 100;
      this.wheel.up = new choice(1.25, "Top", w, h, 0, -50);
      this.wheel.down = new choice(0.25, "Down", w, h, 0, 50);
      this.wheel.left = new choice(0.75, "Left", w, h, -50, 0);
      this.wheel.right = new choice(1.75, "Right", w, h, 50, 0);
      this.canvas.textAlign = "center";
      this.loop = setInterval(update, 30);
    },
    clear: function(){
        this.canvas.clearRect(0, 0, this.element.width, this.element.height);
    }
}

game.element.addEventListener("mousedown", function(event){
    game.down = Date.now();
});

game.element.addEventListener("mouseup", function(event){
    holdTime = Date.now() - game.down
    game.down = undefined;
    game.wheel.up.shrink();
    game.wheel.down.shrink();
    game.wheel.left.shrink();
    game.wheel.right.shrink();
    if (game.current !== undefined){
        game.current();
    }
    if (game.objects.hasOwnProperty("text")){
        game.objects.text.setText(holdTime);
        game.objects.text.setLoc(event.layerX, event.layerY);
        return;
    }
    game.objects.text = new text(holdTime, "black", event.layerX, event.layerY);
});

function choice(startAngle, text, x, y, textX, textY){
    this.startAngle = startAngle;
    this.text = text;
    this.radius = 75
    this.x = x;
    this.y = y;
    this.textX = textX;
    this.textY = textY;
    this.callback = undefined;
    this.growOffset = 0;
    this.update = function(){
        game.canvas.beginPath();
        game.canvas.arc(this.x, this.y, this.radius, this.startAngle * Math.PI, (this.startAngle + 0.5) * Math.PI, false);
        game.canvas.lineWidth = 5;
        game.canvas.strokeStyle = "black";
        game.canvas.stroke();
        game.canvas.closePath();
        if (this.textX === 0){
            game.canvas.fillText(this.text, this.x, this.y + this.textY + this.growOffset);
            return;
        }
        game.canvas.fillText(this.text, this.x + this.textX + this.growOffset, this.y);

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
    }
}

function text(text, color, x, y){
    this.text = text;
    this.x = x;
    this.y = y;
    this.update = function(){
        game.canvas.fillStyle = this.color;
        game.canvas.fillText(this.text, this.x, this.y);
    };
    this.setText = function(text){
        this.text = text;
    };
    this.setLoc = function(x, y){
        this.x = x;
        this.y = y;
    }
}

function component(width, height, color, x, y){
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.update = function(){
        game.canvas.fillStyle = color;
        game.canvas.fillRect(this.x, this.y, this.width, this.height);
    };
}

function update(){
    game.clear();
    var keys = Object.keys(game.objects);
    for (var i = keys.length - 1; i >= 0; i--){
        game.objects[keys[i]].update();
    }
    var keys = Object.keys(game.wheel);
    for (var i = keys.length - 1; i >= 0; i--){
        game.wheel[keys[i]].update();
    }
    if (game.down !== undefined){
        holdTime = Date.now() - game.down
        if (holdTime > 1000 && holdTime < 1500){
            game.wheel.down.grow();
            game.current = game.weel.down.callback;
        }
        else if (holdTime > 2000 && holdTime < 2500){
            game.wheel.left.grow();
            game.current = game.weel.left.callback;
            game.wheel.down.shrink();
        }
        else if (holdTime > 3000 && holdTime < 3500){
            game.wheel.up.grow();
            game.current = game.weel.up.callback;
            game.wheel.down.shrink();
            game.wheel.left.shrink();
        }
        else if (holdTime > 4000 && holdTime < 4500){
            game.wheel.right.grow();
            game.current = game.weel.right.callback;
            game.wheel.down.shrink();
            game.wheel.left.shrink();
            game.wheel.up.shrink();
        }
        else if(holdTime > 5000){
            game.wheel.right.shrink();
            game.current = undefined;
            game.down = Date.now();
        }
    }
}

game.start()
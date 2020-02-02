/*******************************
*Name: main.js
*Purpose: js file that is linked to index.html.
*Created by: Kinnell Craigie
*Last modified: 12/12/17 19:12
*******************************/

$(document).ready(function(){
    var socket = io();
    //var shape;
    var reloadArray = [];
    var pelletArray = [];
    
    easeljsCanvas = document.getElementById('main');
    easeljsContext = easeljsCanvas.getContext('2d');
    
    stage = new createjs.Stage(easeljsCanvas);
    stage.snapPixelsEnabled = true;
    
    height = stage.canvas.height;
    width = stage.canvas.width;
    
    manifest = [{src: 'blinky.png', id: 'blinky'},
                {src: 'clyde.png', id:'clyde'},
                {src: 'inky.png', id: 'inky'},
                {src: 'maze.png', id: 'maze'},
                {src: 'pinky.png', id: 'pinky'},
                {src: 'bullet.png', id: 'bullet'},
                {src: 'pacdot.png', id: 'pacdot'},
                {src: 'pacman.png', id:'pacman'}];
    
    loader = new createjs.LoadQueue(false);
    loader.addEventListener('complete', handleComplete);
    loader.loadManifest(manifest, true, '../assets/sprites/');
    
    function handleComplete(){
        maze = new createjs.Shape();
        maze.graphics.beginBitmapFill(loader.getResult('maze')).drawRect(0,0, width,height);
        
        var spritesheetBlinky = new createjs.SpriteSheet({framerate: 60, 
                                                    'images': [loader.getResult('blinky')], 
                                                    'frames': {'regX': 0, 'height': 32, 'count': 8, 'regY': 0, 'width': 32}, 
                                                    'animations': {'right': [0,1, 'right', 0.05],
                                                                   'left': [2,3, 'left', 0.05],
                                                                   'up': [4,5, 'up', 0.05],
                                                                   'down': [6,7, 'down', 0.05]
                                                                  }
                                                   });
        
        var spritesheetClyde = new createjs.SpriteSheet({framerate: 60, 
                                                    'images': [loader.getResult('clyde')], 
                                                    'frames': {'regX': 0, 'height': 32, 'count': 8, 'regY': 0, 'width': 32}, 
                                                    'animations': {'right': [0,1, 'right', 0.05],
                                                                   'left': [2,3, 'left', 0.05],
                                                                   'up': [4,5, 'up', 0.05],
                                                                   'down': [6,7, 'down', 0.05]
                                                                  }
                                                   });
        
        var spritesheetInky = new createjs.SpriteSheet({framerate: 60, 
                                                    'images': [loader.getResult('inky')], 
                                                    'frames': {'regX': 0, 'height': 32, 'count': 8, 'regY': 0, 'width': 32}, 
                                                    'animations': {'right': [0,1, 'right', 0.05],
                                                                   'left': [2,3, 'left', 0.05],
                                                                   'up': [4,5, 'up', 0.05],
                                                                   'down': [6,7, 'down', 0.05]
                                                                  }
                                                   });
        
        var spritesheetPinky = new createjs.SpriteSheet({framerate: 60, 
                                                    'images': [loader.getResult('pinky')], 
                                                    'frames': {'regX': 0, 'height': 32, 'count': 8, 'regY': 0, 'width': 32}, 
                                                    'animations': {'right': [0,1, 'right', 0.05],
                                                                   'left': [2,3, 'left', 0.05],
                                                                   'up': [4,5, 'up', 0.05],
                                                                   'down': [6,7, 'down', 0.05]
                                                                  }
                                                   });
        
        var spritesheetBullet = new createjs.SpriteSheet({framerate: 60, 
                                                'images': [loader.getResult('bullet')], 
                                                'frames': {'regX': 0, 'height': 18, 'count': 16, 'regY': 9, 'width': 21}, 
                                                'animations': {'blinky': [3],
                                                               'clyde': [7],
                                                               'pinky': [11],
                                                               'inky': [15]
                                                            }
                                            });
        
        var spritesheetPacman = new createjs.SpriteSheet({framerate: 60, 
                                                    'images': [loader.getResult('pacman')], 
                                                    'frames': {'regX': 0, 'height': 32, 'count': 12, 'regY': 0, 'width': 32}, 
                                                    'animations': {'right': [0,2, 'right', 0.05],
                                                                   'left': [3,5, 'left', 0.05],
                                                                   'up': [6,8, 'up', 0.05],
                                                                   'down': [9,11, 'down', 0.05]
                                                                  }
                                                   });
            
        
        blinkySprite = new createjs.Sprite(spritesheetBlinky, 'right');
        clydeSprite = new createjs.Sprite(spritesheetClyde, 'right');
        inkySprite = new createjs.Sprite(spritesheetInky, 'right');
        pinkySprite = new createjs.Sprite(spritesheetPinky, 'right');
        blinkyBulletSprite = new createjs.Sprite(spritesheetBullet, 'blinky');
        inkyBulletSprite = new createjs.Sprite(spritesheetBullet, 'inky');
        pinkyBulletSprite = new createjs.Sprite(spritesheetBullet, 'pinky');
        clydeBulletSprite = new createjs.Sprite(spritesheetBullet, 'clyde');
        pacmanSprite = new createjs.Sprite(spritesheetPacman, 'right');
        
        stage.addChild(maze, blinkySprite, clydeSprite, inkySprite, pinkySprite, pacmanSprite);
        
        createjs.Ticker.setFPS(60);
        createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
        createjs.Ticker.addEventListener('tick', tick);
        
        ticker = createjs.Ticker;
        addPellet();
    }
    
    function movePlayerSprite(){
        socket.on('moveView', function(data){
            stage.x = -data.x + 100;
            stage.y = -data.y + 100;  

            if(data.char == 'blinky'){
                blinkySprite.x = data.x;
                blinkySprite.y = data.y;
                blinkySprite.gotoAndPlay(data.dir);
            }
            else if(data.char == 'pinky'){
                pinkySprite.x = data.x;
                pinkySprite.y = data.y;
                pinkySprite.gotoAndPlay(data.dir);
            }
            else if(data.char == 'inky'){
                inkySprite.x = data.x;
                inkySprite.y = data.y;
                inkySprite.gotoAndPlay(data.dir);
            }
            else if(data.char == 'clyde'){
                clydeSprite.x = data.x;
                clydeSprite.y = data.y;
                clydeSprite.gotoAndPlay(data.dir);
            }
        });
    }
    
    function moveOtherSprites(){
        socket.on('moveSprite', function(data){
            if(data.char == 'blinky'){
                blinkySprite.x = data.x;
                blinkySprite.y = data.y;
                blinkySprite.gotoAndPlay(data.dir);
            }
            else if(data.char == 'pinky'){
                pinkySprite.x = data.x;
                pinkySprite.y = data.y;
                pinkySprite.gotoAndPlay(data.dir);
            }
            else if(data.char == 'inky'){
                inkySprite.x = data.x;
                inkySprite.y = data.y;
                inkySprite.gotoAndPlay(data.dir);
            }
            else if(data.char == 'clyde'){
                clydeSprite.x = data.x;
                clydeSprite.y = data.y;
                clydeSprite.gotoAndPlay(data.dir);
            }
        });
    }
    
    function movePacmanSprite(){
        socket.on('pacmanSprite', function(data){
            pacmanSprite.x = data.x;
            pacmanSprite.y = data.y;
            pacmanSprite.gotoAndPlay(data.dir);
        });
    }
    
    function removePacmanSprite(){
        socket.on('deadPacman', function(data){
            stage.removeChild(pacmanSprite);
        });
    }

    
    function setBullet(){
        socket.on('setBullet', function(data){
            if(data.char == 'blinky'){
                blinkyBulletSprite.x = data.x;
                blinkyBulletSprite.y = data.y;
                
                if(data.dir == 'left'){
                    blinkyBulletSprite.rotation = 180;
                }
                else if(data.dir == 'right'){
                    blinkyBulletSprite.rotation = 0;
                }
                else if(data.dir == 'up'){
                    blinkyBulletSprite.rotation = 270;
                }
                else if(data.dir == 'down'){
                    blinkyBulletSprite.rotation = 90;
                }
                
                stage.addChild(blinkyBulletSprite);
            }
            else if(data.char == 'pinky'){
                pinkyBulletSprite.x = data.x;
                pinkyBulletSprite.y = data.y;
                
                if(data.dir == 'left'){
                    pinkyBulletSprite.rotation = 180;
                }
                else if(data.dir == 'right'){
                    pinkyBulletSprite.rotation = 0;
                }
                else if(data.dir == 'up'){
                    pinkyBulletSprite.rotation = 270;
                }
                else if(data.dir == 'down'){
                    pinkyBulletSprite.rotation = 90;
                }
                
                stage.addChild(pinkyBulletSprite);
            }
            else if(data.char == 'inky'){
                inkyBulletSprite.x = data.x;
                inkyBulletSprite.y = data.y;
                
                if(data.dir == 'left'){
                    inkyBulletSprite.rotation = 180;
                }
                else if(data.dir == 'right'){
                    inkyBulletSprite.rotation = 0;
                }
                else if(data.dir == 'up'){
                    inkyBulletSprite.rotation = 270;
                }
                else if(data.dir == 'down'){
                    inkyBulletSprite.rotation = 90;
                }
                
                stage.addChild(inkyBulletSprite);
            }
            else if(data.char == 'clyde'){
                clydeBulletSprite.x = data.x;
                clydeBulletSprite.y = data.y;
                
                if(data.dir == 'left'){
                    clydeBulletSprite.rotation = 180;
                }
                else if(data.dir == 'right'){
                    clydeBulletSprite.rotation = 0;
                }
                else if(data.dir == 'up'){
                    clydeBulletSprite.rotation = 270;
                }
                else if(data.dir == 'down'){
                    clydeBulletSprite.rotation = 90;
                }
                
                stage.addChild(clydeBulletSprite);
            }
        });
    }
    
    function setOtherBullet(){
        socket.on('setOtherBullet', function(data){
            if(data.char == 'blinky'){
                blinkyBulletSprite.x = data.x;
                blinkyBulletSprite.y = data.y;
                
                if(data.dir == 'left'){
                    blinkyBulletSprite.rotation = 180;
                }
                else if(data.dir == 'right'){
                    blinkyBulletSprite.rotation = 0;
                }
                else if(data.dir == 'up'){
                    blinkyBulletSprite.rotation = 270;
                }
                else if(data.dir == 'down'){
                    blinkyBulletSprite.rotation = 90;
                }
                
                stage.addChild(blinkyBulletSprite);
            }
            else if(data.char == 'pinky'){
                pinkyBulletSprite.x = data.x;
                pinkyBulletSprite.y = data.y;
                
                if(data.dir == 'left'){
                    pinkyBulletSprite.rotation = 180;
                }
                else if(data.dir == 'right'){
                    pinkyBulletSprite.rotation = 0;
                }
                else if(data.dir == 'up'){
                    pinkyBulletSprite.rotation = 270;
                }
                else if(data.dir == 'down'){
                    pinkyBulletSprite.rotation = 90;
                }
                
                stage.addChild(pinkyBulletSprite);
            }
            else if(data.char == 'inky'){
                inkyBulletSprite.x = data.x;
                inkyBulletSprite.y = data.y;
                
                if(data.dir == 'left'){
                    inkyBulletSprite.rotation = 180;
                }
                else if(data.dir == 'right'){
                    inkyBulletSprite.rotation = 0;
                }
                else if(data.dir == 'up'){
                    inkyBulletSprite.rotation = 270;
                }
                else if(data.dir == 'down'){
                    inkyBulletSprite.rotation = 90;
                }
                
                stage.addChild(inkyBulletSprite);
            }
            else if(data.char == 'clyde'){
                clydeBulletSprite.x = data.x;
                clydeBulletSprite.y = data.y;
                
                if(data.dir == 'left'){
                    clydeBulletSprite.rotation = 180;
                }
                else if(data.dir == 'right'){
                    clydeBulletSprite.rotation = 0;
                }
                else if(data.dir == 'up'){
                    clydeBulletSprite.rotation = 270;
                }
                else if(data.dir == 'down'){
                    clydeBulletSprite.rotation = 90;
                }
                
                stage.addChild(clydeBulletSprite);
            }
        });
    }
    
    function removeBullet(){
        socket.on('deleteBullet', function(data){
            if(data.char == 'blinky'){
                stage.removeChild(blinkyBulletSprite);
            }
            else if(data.char == 'pinky'){
                stage.removeChild(pinkyBulletSprite);
            }
            else if(data.char == 'inky'){
                stage.removeChild(inkyBulletSprite);
            }
            else if(data.char == 'clyde'){
                stage.removeChild(clydeBulletSprite);
            }
        });
        
    }
    
    /*function indicator(){
        socket.on('moveInd', function(data){
            shape.x = data.x - 300;
            shape.y = data.y - 300;
        });
        
    }
    
    socket.on('setUpInd', function(){
        var graphics = new createjs.Graphics().beginFill("#FF0").drawRect(0, 0, 100, 100);
        shape = new createjs.Shape(graphics);
        stage.addChild(shape);
    });*/
    
    socket.on('destroyReload', function(data){
        stage.removeChild(reloadArray[data]); 
    });
    
    socket.on('destroyPellet', function(data){
        stage.removeChild(pelletArray[data]); 
    });
    
    socket.on('destroySprite', function(data){
        if(data == 'blinky'){
            stage.removeChild(blinkySprite);
        }
        else if(data == 'pinky'){
            stage.removeChild(pinkySprite);
        }
        else if(data == 'inky'){
            stage.removeChild(inkySprite);
        }
        else if(data == 'clyde'){
            stage.removeChild(clydeSprite);
        }
    });
    
    function respawnSprite(){
        socket.on('respawnSprite', function(data){
            if(data == 'blinky'){
                stage.addChild(blinkySprite);
            }
            else if(data == 'pinky'){
                stage.addChild(pinkySprite);
            }
            else if(data == 'inky'){
                stage.addChild(inkySprite);
            }
            else if(data == 'clyde'){
                stage.addChild(clydeSprite);
            }
        });
    }
    
    socket.on('respawnReload', function(){
        reloadArray = [];
        
        //RELOAD POINTS
        for(var i = 0;i < 876; i = i + 875){
            var reloadSprite = new createjs.Shape();
            reloadSprite.graphics.beginFill('#0AAA00').drawCircle(0,0, 8,8);
            reloadSprite.x = 50 + i;
            reloadSprite.y = 50;
            stage.addChild(reloadSprite);
            reloadArray.push(reloadSprite);
        }
        for(var i = 0;i < 876; i = i + 875){
            var reloadSprite = new createjs.Shape();
            reloadSprite.graphics.beginFill('#0AAA00').drawCircle(0,0, 8,8);
            reloadSprite.x = 50 + i;
            reloadSprite.y = 930;
            stage.addChild(reloadSprite);
            reloadArray.push(reloadSprite);
        }
    });
    
    socket.on('ui', function(data){
        document.getElementById('ui').innerHTML = "<li>User: " + data.nick.p1 + " | Character: <span style ='color: #F0A'>" + data.char.p1 + "</span> | Bullets: " + data.bullets.p1 + " | Lifes: " + data.lifes.p1 + " | Score: " + data.score.p1 + "</li>" + 
        "<li>X: " +  data.x.p1 + " | Y: " + data.y.p1 + "</li>" +
         "<li>User: " + data.nick.p2 + " | Character: <span style ='color: #00FFF5'>" + data.char.p2 + "</span> | Bullets: " + data.bullets.p2 + " | Lifes: " + data.lifes.p2 + " | Score: " + data.score.p2 +  
        "<li>X: " +  data.x.p2 + " | Y: " + data.y.p2 + "</li>" +
       "<li>User: " + data.nick.p3 + " | Character: <span style ='color: #F00'>" + data.char.p3 + "</span> | Bullets: " + data.bullets.p3 + " | Lifes: " + data.lifes.p3 + " | Score: " + data.score.p3 +  
        "<li>X: " +  data.x.p3 + " | Y: " + data.y.p3 + "</li>" +
        "<li>User: " + data.nick.p4 + " | Character: <span style ='color: #FFB100'>" + data.char.p4 + "</span> | Bullets: " + data.bullets.p4 + " | Lifes: " + data.lifes.p4 + " | Score: " + data.score.p4 +  
        "<li>X: " +  data.x.p4 + " | Y: " + data.y.p4 + "</li>" +
        "<li>-------PACMAN STATS-----------</li>" +
        "<li>Health: " + data.health + " | Pellets Collected: " + data.collected + "/" + data.total + "</li>" + "<li> X: " + data.pacX + " | Y: " + data.pacY + "</li>";
    });
    
    function tick(e){
        stage.update(e);
        movePlayerSprite();
        moveOtherSprites();
        movePacmanSprite();
        setBullet();
        setOtherBullet();
        removeBullet();
        removePacmanSprite();
        respawnSprite();
        //indicator();
    }
    
    function addPellet(){
        //HORIZONTAL
        //TOP ROW
        for(var i = 0;i < 440; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50 + i;
            pelletSprite.y = 50 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 440; i = i + 40){ 
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 550 + i;
            pelletSprite.y = 50 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //SECOND ROW
        for(var i = 0;i < 440; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50 + i;
            pelletSprite.y = 170 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 440; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 550 + i;
            pelletSprite.y = 170 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //EIGHTH ROW
        for(var i = 0;i < 440; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 550 + i;
            pelletSprite.y = 650 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //ELEVENTH ROW
        for(var i = 0;i < 440; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 550 + i;
            pelletSprite.y = 930 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //THIRD ROW
        for(var i = 0;i < 220; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50 + i;
            pelletSprite.y = 290 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 220; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 750 + i;
            pelletSprite.y = 290 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //FIFTH ROW
        for(var i = 0;i < 220; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50 + i;
            pelletSprite.y = 450 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 220; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 750 + i;
            pelletSprite.y = 450 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }

        //TENTH ROW
        for(var i = 0;i < 220; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50 + i;
            pelletSprite.y = 850 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 220; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 750 + i;
            pelletSprite.y = 850 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }

        //THIRD ROW
        for(var i = 0;i < 160; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 330 + i;
            pelletSprite.y = 290 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 160; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 550 + i;
            pelletSprite.y = 290 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //TENTH ROW
        for(var i = 0;i < 160; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 330 + i;
            pelletSprite.y = 850 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 160; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 550 + i;
            pelletSprite.y = 850 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }

        //FOURTH ROW
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50 + i;
            pelletSprite.y = 370 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 870 + i;
            pelletSprite.y = 370 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
            
        //SEVENTH ROW
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50 + i;
            pelletSprite.y = 570 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 870 + i;
            pelletSprite.y = 570 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //NINTH ROW
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50 + i;
            pelletSprite.y = 730 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 870 + i;
            pelletSprite.y = 730 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }

        //EIGHTH ROW
        for(var i = 0;i < 480; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50 + i;
            pelletSprite.y = 650 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //ELEVENTH ROW
        for(var i = 0;i < 480; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50 + i;
            pelletSprite.y = 930 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }

        for(var i = 0;i < 240; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 250 + i;
            pelletSprite.y = 730 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 240; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 550 + i;
            pelletSprite.y = 730 ;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }

        //VERTICAL
        //TOP ROW
        for(var i = 0;i < 280; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50;
            pelletSprite.y = 50 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 280; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 950;
            pelletSprite.y = 50 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 900; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 250;
            pelletSprite.y = 50 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 900; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 750;
            pelletSprite.y = 50 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 140; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 450;
            pelletSprite.y = 50 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 140; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 550;
            pelletSprite.y = 50 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //SECOND ROW
        for(var i = 0;i < 140; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 330;
            pelletSprite.y = 170 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 140; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 670;
            pelletSprite.y = 170 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }

        //THIRD ROW
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 130;
            pelletSprite.y = 290 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 870;
            pelletSprite.y = 290 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //SEVENTH ROW
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 130;
            pelletSprite.y = 570 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 870;
            pelletSprite.y = 570 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //EIGHTH ROW
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50;
            pelletSprite.y = 650 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 450;
            pelletSprite.y = 650 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 550;
            pelletSprite.y = 650 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 950;
            pelletSprite.y = 650 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //TENTH ROW
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50;
            pelletSprite.y = 850 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 450;
            pelletSprite.y = 850 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 550;
            pelletSprite.y = 850 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 120; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 950;
            pelletSprite.y = 850 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }

        //FOURTH ROW
        for(var i = 0;i < 240; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 50;
            pelletSprite.y = 370 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 240; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 950;
            pelletSprite.y = 370 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }

        //NINTH ROW
        for(var i = 0;i < 160; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 130;
            pelletSprite.y = 730 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 160; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 330;
            pelletSprite.y = 730 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 160; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 670;
            pelletSprite.y = 730 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        for(var i = 0;i < 160; i = i + 40){
            var pelletSprite = new createjs.Shape();
            pelletSprite.graphics.beginBitmapFill(loader.getResult('pacdot')).drawCircle(0,0, 4,4);
            pelletSprite.x = 870;
            pelletSprite.y = 730 + i;
            stage.addChild(pelletSprite);
            pelletArray.push(pelletSprite);
        }
        
        //RELOAD POINTS
        for(var i = 0;i < 876; i = i + 875){
            var reloadSprite = new createjs.Shape();
            reloadSprite.graphics.beginFill('#0AAA00').drawCircle(0,0, 8,8);
            reloadSprite.x = 50 + i;
            reloadSprite.y = 50;
            stage.addChild(reloadSprite);
            reloadArray.push(reloadSprite);
        }
        for(var i = 0;i < 876; i = i + 875){
            var reloadSprite = new createjs.Shape();
            reloadSprite.graphics.beginFill('#0AAA00').drawCircle(0,0, 8,8);
            reloadSprite.x = 50 + i;
            reloadSprite.y = 930;
            stage.addChild(reloadSprite);
            reloadArray.push(reloadSprite);
        }
}
    
    $('#ok').click(function(){
        name = $('#name').val();
        
        socket.emit('setUpUser', name);
        $('#username').hide();
        
        socket.emit('waiting');
        $('#waiting').show();
    });
    
    socket.on('waiting', function(data){
        document.getElementById('waiting').innerHTML = "<h1>Waiting on " + data + " player(s)</h1>";
    });
    
    socket.on('start', function(){
        $('#waiting').hide();
        $('#viewport').show();
        $('#ui').show();
        
        $(document).keydown(function(e){
        if(e.which == 68){
           socket.emit('forward');
        }
        else if(e.which == 65){
            socket.emit('back');
        }
        else if(e.which == 87){
            socket.emit('up');
        }
        else if(e.which == 83){
            socket.emit('down');
        }
        else if(e.which == 70){
            socket.emit('fire');
            $('#shoot').get(0).play();
        }
    });
    });
    
    socket.on('fail', function(){
        document.getElementById('username').innerHTML = "<h1>Failed to start game(1 or more user didnt have a username)</h1>";
        document.getElementById('waiting').innerHTML = "<h1>Failed to start game(1 or more user didnt have a username)</h1>";
    });
    
    socket.on('lose', function(){
        alert('Pacman lives to fight another day, you lose');
        ('#viewport').hide;
        ('#ui').hide;
    });
    
    socket.on('win', function(data){
        alert('You got pacman, you win. ' + data + ' got the highest score');
        ('#viewport').hide;
        ('#ui').hide;
    });

});

/*******************************
*Name: index.js
*Purpose: js file that handles socket.io, node.js, box2d and game logic.
*Created by: Kinnell Craigie
*Last modified: 12/12/17 19:11
*******************************/

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Box2D = require('box2dweb-commonjs').Box2D

var world;
var scale = 30;
var width = 1000;
var height = 1000;

var d2r = Math.PI/180;
var r2d = 180/Math.PI;
var pi2 = Math.PI*2;
var interval, canvas;
var debug = true;

var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2MassData = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var listener = new Box2D.Dynamics.b2ContactListener;

var connections = [];
var needsDestroyed = [];
var pelletArray = [];
var reloadArray = [];

var totalCollected = 0;

app.use(express.static('public'));
app.use('/js', express.static(__dirname + 'public/js'));
app.use('/css', express.static(__dirname + 'public/css'));



function createObj(id, x, y, size, circle, dir){
    var width = size/2;
    var height = size/2;
    
   	var domObj = {id: id};
	var domPos = {left:x, top:y};
    
    var x = (domPos.left) + width;
    var y = (domPos.top) + height;
    
    if(id == 'bullet' + connections[0].id){
        var body = createBullet(x, y, dir);
        body.m_userData = {domObj:domObj, width: width, height: height, circle: circle, setup: true}; 
    }
    else if(id == 'bullet' + connections[1].id){
        var body = createBullet(x, y, dir);
        body.m_userData = {domObj:domObj, width: width, height: height, circle: circle, setup: true}; 
    }
    else if(id == 'bullet' + connections[2].id){
        var body = createBullet(x, y, dir);
        body.m_userData = {domObj:domObj, width: width, height: height, circle: circle, setup: true}; 
    }
    else if(id == 'bullet' + connections[3].id){
        var body = createBullet(x, y, dir);
        body.m_userData = {domObj:domObj, width: width, height: height, circle: circle, setup: true}; 
    }
    else if(id == 'pellet'){
        var body = createBox(x, y, width, height, true, circle);
        body.m_userData = {domObj:domObj, width: width, height: height, circle: circle, setup: true, collected: 0};
        pelletArray.push(body);
    }
    else if(id == 'reload'){
        var body = createBox(x, y, width, height, true, circle);
        body.m_userData = {domObj:domObj, width: width, height: height, circle: circle, setup: true, collected: 0};
        reloadArray.push(body);
    }
    else if(id == 'pacman'){
        var body = createBox(x, y, width, height, false, circle);
        body.m_userData = {domObj:domObj, health: 100, width: width, height: height, circle: circle, setup: true};
    } 
    else{
        var body = createBox(x, y, width, height, false, circle);
        body.m_userData = {domObj:domObj, width: width, height: height, circle: circle, setup: true}; 
    }
    
};

function createBox(x, y, width, height, static, circle){
    var body = new b2BodyDef;
    
    body.type = static ? b2Body.b2_staticBody : b2Body.b2_dynamicBody;
    body.position.x = x / scale;
    body.position.y = y / scale;
    body.fixedRotation = true;
    
    var fixDef = new b2FixtureDef;
    fixDef.density = 1.0;
    fixDef.restitution = 0;
    fixDef.friction = 0;
    
    if(circle == true){
        var circleShape = new b2CircleShape;
		circleShape.m_radius = width / scale;

		fixDef.shape = circleShape;
    }
    else{
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(width / scale, height / scale);
    }
    
    var obj = world.CreateBody(body).CreateFixture(fixDef);
    
     return obj;
};

function update(connections){
    world.Step(
        1 / 60
        , 10
        , 10
    );
    
    for(var i in needsDestroyed){
        world.DestroyBody(needsDestroyed[i]);
        needsDestroyed[i] = '';
    } 
    for(var i in reloadArray){
        if(reloadArray[i].m_userData.collected == 1){
           io.emit('destroyReload', i); 
        }
    } 
    for(var i in pelletArray){
        if(pelletArray[i].m_userData.collected == 1){
           io.emit('destroyPellet', i); 
        }
    } 
    
    for(var i in connections){
        if(connections[i].lifes == 'DEAD'){
           io.emit('lose'); 
        }
    } 
    
    for(var j = world.m_bodyList; j; j = j.m_next){
        for(var z = j.m_fixtureList; z; z = z.m_next){
            if(z.m_userData){
                if(z.m_userData.domObj.id == connections[0].id){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                    var char = 'pinky';
                    
                    if(z.m_body.GetLinearVelocity().x <= 5 && z.m_body.GetLinearVelocity().x > 0){
                        var dir = 'right';
                    }
                    else if(z.m_body.GetLinearVelocity().x >= -5 && z.m_body.GetLinearVelocity().x < 0){
                        var dir = 'left';
                    }
                    else if(z.m_body.GetLinearVelocity().y <= 5 && z.m_body.GetLinearVelocity().y > 0){
                        var dir = 'down';
                    }
                    else if(z.m_body.GetLinearVelocity().y >= -5 && z.m_body.GetLinearVelocity().y < 0){
                        var dir = 'up';
                    }
                    
                    
                    
                    if(x > 1000){
                        needsDestroyed.push(z.m_body)
                        move(connections[0].id, 30);
                        var x = z.m_body.m_xf.position.x * scale;
                        var y = z.m_body.m_xf.position.y * scale;
                    }
                    else if(x < 10){
                        needsDestroyed.push(z.m_body)
                        move(connections[0].id, 980);
                        var x = z.m_body.m_xf.position.x * scale;
                        var y = z.m_body.m_xf.position.y * scale;
                    }
                    
                    connections[0].x = x;
                    connections[0].y = y;
                    
                    connections[0].emit('moveView', {x: x, y: y, char: char, dir: dir});
                    connections[0].broadcast.emit('moveSprite', {x: x, y: y, char: char, dir: dir});
                }
                if(z.m_userData.domObj.id == connections[1].id){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                    var char = 'inky';
                    
                    if(z.m_body.GetLinearVelocity().x <= 5 && z.m_body.GetLinearVelocity().x > 0){
                        var dir = 'right';
                    }
                    else if(z.m_body.GetLinearVelocity().x >= -5 && z.m_body.GetLinearVelocity().x < 0){
                        var dir = 'left';
                    }
                    else if(z.m_body.GetLinearVelocity().y <= 5 && z.m_body.GetLinearVelocity().y > 0){
                        var dir = 'down';
                    }
                    else if(z.m_body.GetLinearVelocity().y >= -5 && z.m_body.GetLinearVelocity().y < 0){
                        var dir = 'up';
                    }
                    
                    if(x > 1000){
                        needsDestroyed.push(z.m_body)
                        move(connections[1].id, 30);
                        var x = z.m_body.m_xf.position.x * scale;
                        var y = z.m_body.m_xf.position.y * scale;
                    }
                    else if(x < 10){
                        needsDestroyed.push(z.m_body)
                        move(connections[1].id, 980);
                        var x = z.m_body.m_xf.position.x * scale;
                        var y = z.m_body.m_xf.position.y * scale;
                    }
                    
                    connections[1].x = x;
                    connections[1].y = y;
                    
                    connections[1].emit('moveView', {x: x, y: y, char: char, dir: dir});
                    connections[1].broadcast.emit('moveSprite', {x: x, y: y, char: char, dir: dir});
                }
                if(z.m_userData.domObj.id == connections[2].id){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                    var char = 'blinky' 
                    
                    if(z.m_body.GetLinearVelocity().x <= 5 && z.m_body.GetLinearVelocity().x > 0){
                        var dir = 'right';
                    }
                    else if(z.m_body.GetLinearVelocity().x >= -5 && z.m_body.GetLinearVelocity().x < 0){
                        var dir = 'left';
                    }
                    else if(z.m_body.GetLinearVelocity().y <= 5 && z.m_body.GetLinearVelocity().y > 0){
                        var dir = 'down';
                    }
                    else if(z.m_body.GetLinearVelocity().y >= -5 && z.m_body.GetLinearVelocity().y < 0){
                        var dir = 'up';
                    }
                    
                    if(x > 1000){
                        needsDestroyed.push(z.m_body)
                        move(connections[2].id, 30);
                        var x = z.m_body.m_xf.position.x * scale;
                        var y = z.m_body.m_xf.position.y * scale;
                    }
                    else if(x < 10){
                        needsDestroyed.push(z.m_body)
                        move(connections[2].id, 980);
                        var x = z.m_body.m_xf.position.x * scale;
                        var y = z.m_body.m_xf.position.y * scale;
                    }
                    
                    connections[2].x = x;
                    connections[2].y = y;
                    
                    connections[2].emit('moveView', {x: x, y: y, char: char, dir: dir});
                    connections[2].broadcast.emit('moveSprite', {x: x, y: y, char: char, dir: dir});
                }
                if(z.m_userData.domObj.id == connections[3].id){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                     var char = 'clyde';
                    
                    if(z.m_body.GetLinearVelocity().x <= 5 && z.m_body.GetLinearVelocity().x > 0){
                        var dir = 'right';
                    }
                    else if(z.m_body.GetLinearVelocity().x >= -5 && z.m_body.GetLinearVelocity().x < 0){
                        var dir = 'left';
                    }
                    else if(z.m_body.GetLinearVelocity().y <= 5 && z.m_body.GetLinearVelocity().y > 0){
                        var dir = 'down';
                    }
                    else if(z.m_body.GetLinearVelocity().y >= -5 && z.m_body.GetLinearVelocity().y < 0){
                        var dir = 'up';
                    }
                    
                    if(x > 1000){
                        needsDestroyed.push(z.m_body)
                        move(connections[3].id, 30);
                        var x = z.m_body.m_xf.position.x * scale;
                        var y = z.m_body.m_xf.position.y * scale;
                    }
                    else if(x < 10){
                        needsDestroyed.push(z.m_body)
                        move(connections[3].id, 980);
                        var x = z.m_body.m_xf.position.x * scale;
                        var y = z.m_body.m_xf.position.y * scale;
                    }
                    
                    connections[3].x = x;
                    connections[3].y = y;
                    
                    
                    connections[3].emit('moveView', {x: x, y: y, char: char, dir: dir});
                    connections[3].broadcast.emit('moveSprite', {x: x, y: y, char: char, dir: dir});
                }
                if(z.m_userData.domObj.id == 'pacman'){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                    var health = z.m_userData.health;
                    
                    if(z.m_body.GetLinearVelocity().x <= 5 && z.m_body.GetLinearVelocity().x > 0){
                        var dir = 'right';
                    }
                    else if(z.m_body.GetLinearVelocity().x >= -5 && z.m_body.GetLinearVelocity().x < 0){
                        var dir = 'left';
                    }
                    else if(z.m_body.GetLinearVelocity().y <= 5 && z.m_body.GetLinearVelocity().y > 0){
                        var dir = 'down';
                    }
                    else if(z.m_body.GetLinearVelocity().y >= -5 && z.m_body.GetLinearVelocity().y < 0){
                        var dir = 'up';
                    }
                    
                    if(x - connections[0].x > 300 || x - connections[0].x < -300 || y - connections[0].y > 300 || y - connections[0].y < -300){
                        if(connections[0].setup != 1){
                            connections[0].emit('setUpInd');
                        }
                        connections[0].emit('moveInd', {x: x, y: y});
                        
                    }
                    
                    var pacX = x;
                    var pacY = y;
                    
                    io.emit('pacmanSprite', {x: x, y: y, dir: dir});
                }
                if(z.m_userData.domObj.id == 'bullet' + connections[0].id){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                    var char = 'pinky';
                    
                    if(z.m_body.GetLinearVelocity().x <= 10 && z.m_body.GetLinearVelocity().x > 0){
                        var dir = 'right';
                    }
                    else if(z.m_body.GetLinearVelocity().x >= -10 && z.m_body.GetLinearVelocity().x < 0){
                        var dir = 'left';
                    }
                    else if(z.m_body.GetLinearVelocity().y <= 10 && z.m_body.GetLinearVelocity().y > 0){
                        var dir = 'down';
                    }
                    else if(z.m_body.GetLinearVelocity().y >= -10 && z.m_body.GetLinearVelocity().y < 0){
                        var dir = 'up';
                    }
                    
                    connections[0].emit('setBullet', {x: x, y: y, char: char, dir: dir});
                    connections[0].broadcast.emit('setOtherBullet', {x: x, y: y, char: char, dir: dir});
                }
                if(z.m_userData.domObj.id == 'bullet' + connections[1].id){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                    var char = 'inky';
                    
                    if(z.m_body.GetLinearVelocity().x <= 10 && z.m_body.GetLinearVelocity().x > 0){
                        var dir = 'right';
                    }
                    else if(z.m_body.GetLinearVelocity().x >= -10 && z.m_body.GetLinearVelocity().x < 0){
                        var dir = 'left';
                    }
                    else if(z.m_body.GetLinearVelocity().y <= 10 && z.m_body.GetLinearVelocity().y > 0){
                        var dir = 'down';
                    }
                    else if(z.m_body.GetLinearVelocity().y >= -10 && z.m_body.GetLinearVelocity().y < 0){
                        var dir = 'up';
                    }
                    
                    connections[1].emit('setBullet', {x: x, y: y, char: char, dir: dir});
                    connections[1].broadcast.emit('setOtherBullet', {x: x, y: y, char: char, dir: dir});
                }
                if(z.m_userData.domObj.id == 'bullet' + connections[2].id){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                    var char = 'blinky'; 
                    
                    if(z.m_body.GetLinearVelocity().x <= 10 && z.m_body.GetLinearVelocity().x > 0){
                        var dir = 'right';
                    }
                    else if(z.m_body.GetLinearVelocity().x >= -10 && z.m_body.GetLinearVelocity().x < 0){
                        var dir = 'left';
                    }
                    else if(z.m_body.GetLinearVelocity().y <= 10 && z.m_body.GetLinearVelocity().y > 0){
                        var dir = 'down';
                    }
                    else if(z.m_body.GetLinearVelocity().y >= -10 && z.m_body.GetLinearVelocity().y < 0){
                        var dir = 'up';
                    }
                    
                    connections[2].emit('setBullet', {x: x, y: y, char: char, dir: dir});
                    connections[2].broadcast.emit('setOtherBullet', {x: x, y: y, char: char, dir: dir});
                }
                if(z.m_userData.domObj.id == 'bullet' + connections[3].id){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                    var char = 'clyde';
                    
                    if(z.m_body.GetLinearVelocity().x <= 10 && z.m_body.GetLinearVelocity().x > 0){
                        var dir = 'right';
                    }
                    else if(z.m_body.GetLinearVelocity().x >= -10 && z.m_body.GetLinearVelocity().x < 0){
                        var dir = 'left';
                    }
                    else if(z.m_body.GetLinearVelocity().y <= 10 && z.m_body.GetLinearVelocity().y > 0){
                        var dir = 'down';
                    }
                    else if(z.m_body.GetLinearVelocity().y >= -10 && z.m_body.GetLinearVelocity().y < 0){
                        var dir = 'up';
                    }
                    
                    connections[3].emit('setBullet', {x: x, y: y, char: char, dir: dir});
                    connections[3].broadcast.emit('setOtherBullet', {x: x, y: y, char: char, dir: dir});
                    
                }
            }
        }
    }
    
    world.ClearForces();
        
    var nick = {p1: connections[0].user, p2: connections[1].user, p3: connections[2].user, p4: connections[3].user};
    var char = {p1: connections[0].char, p2: connections[1].char, p3: connections[2].char, p4: connections[3].char};
    var bullets = {p1: connections[0].bullets, p2: connections[1].bullets, p3: connections[2].bullets, p4: connections[3].bullets};
    var lifes = {p1: connections[0].lifes, p2: connections[1].lifes, p3: connections[2].lifes, p4: connections[3].lifes};
    var score = {p1: connections[0].score, p2: connections[1].score, p3: connections[2].score, p4: connections[3].score};
    var x = {p1: connections[0].x, p2: connections[1].x, p3: connections[2].x, p4: connections[3].x};
    var y = {p1: connections[0].y, p2: connections[1].y, p3: connections[2].y, p4: connections[3].y};
    
    
    io.emit('ui', {nick: nick, char: char, bullets: bullets, lifes: lifes, score: score, x: x, y: y, health: health, collected: totalCollected, total: pelletArray.length, pacX: pacX, pacY: pacY})
}

function init(connections){
    world = new b2World(new b2Vec2(0,0), false);
    createObj(connections[0].id,50, 100, 20, true, null);
    createObj(connections[1].id,850, 700, 20, true, null);
    createObj(connections[2].id,850, 100, 20, true, null);
    createObj(connections[3].id,50, 700, 20, true, null);
    createObj('pacman',500, 550, 20, true, null);
    
    createTopDownMap();
    addSensors();
    addPellets();
    ai(3,0);
    interval = setInterval(function(){
        update(connections);
    },1000/60);
    
    reload = setInterval(function(){
        for(var i in reloadArray){
            needsDestroyed.push(reloadArray[i]);
           io.emit('destroyReload', i); 
        }
        reloadArray = [];
        
        //RELOAD POINTS
        createObj('reload', 50, 50, 40, true, null);
        createObj('reload', 925, 50, 40, true, null);
        createObj('reload', 80, 930, 40, true, null);
        createObj('reload', 925, 930, 40, true, null);
        
        io.emit('respawnReload');
    }, 30000)
    
    for(var j = world.m_bodyList; j; j = j.m_next){
        for(var z = j.m_fixtureList; z; z = z.m_next){
            if(z.m_userData){
                if(z.m_userData.domObj.id == connections[0].id){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                    var char = 'pinky';
                    connections[0].char = char;
                    
                    connections[0].emit('moveView', {x: x, y: y, char: char});
                }
                else if(z.m_userData.domObj.id == connections[1].id){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                    var char = 'inky';
                    connections[1].char = char;
                    
                    connections[1].emit('moveView', {x: x, y: y, char: char});
                }
                else if(z.m_userData.domObj.id == connections[2].id){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                    var char = 'blinky' 
                    connections[2].char = char;
                    
                    connections[2].emit('moveView', {x: x, y: y, char: char});
                }
                else if(z.m_userData.domObj.id == connections[3].id){
                    var x = z.m_body.m_xf.position.x * scale;
                    var y = z.m_body.m_xf.position.y * scale;
                    var char = 'clyde';
                    connections[3].char = char;
                    
                    connections[3].emit('moveView', {x: x, y: y, char: char});
                }
            }
        }
    }   
    
    listener.PreSolve = function(contact){
		AA = contact.GetFixtureA().m_userData
		AB = contact.GetFixtureA().GetBody().GetUserData();
		BA = contact.GetFixtureB().m_userData
        BB = contact.GetFixtureB().GetBody().GetUserData();
        
        //console.log(AA, AB, BB, BA)

        //console.log(AA, BA.domObj.id);
        if(AA != null && BA != null){
            if (AA.domObj.id == connections[0].id && BA.domObj.id == 'pellet') {
                contact.SetEnabled(false);
		      }
            else if (AA.domObj.id == connections[1].id && BA.domObj.id == 'pellet') {
                contact.SetEnabled(false);
		      } 
            else if (AA.domObj.id == connections[2].id && BA.domObj.id == 'pellet') {
                contact.SetEnabled(false);
		      } 
            else if (AA.domObj.id == connections[3].id && BA.domObj.id == 'pellet') {
                contact.SetEnabled(false);
		      }
            else if (AA.domObj.id == connections[0].id && BA.domObj.id == 'reload') {
                connections[0].bullets = 20;
                BA.collected = 1;
                needsDestroyed.push(contact.GetFixtureB().GetBody());
		      } 
            else if (AA.domObj.id == connections[1].id && BA.domObj.id == 'reload') {
                connections[1].bullets = 20;
                BA.collected = 1;
                needsDestroyed.push(contact.GetFixtureB().GetBody());
		      } 
            else if (AA.domObj.id == connections[2].id && BA.domObj.id == 'reload') {
                connections[2].bullets = 20;
                BA.collected = 1;
                needsDestroyed.push(contact.GetFixtureB().GetBody());
		      } 
            else if (AA.domObj.id == connections[3].id && BA.domObj.id == 'reload') {
                connections[3].bullets = 20;
                BA.collected = 1;
                needsDestroyed.push(contact.GetFixtureB().GetBody());
		      }
            else if (AA.domObj.id == 'pacman' && BA.domObj.id == 'reload') {
                contact.SetEnabled(false);
		      } 
            else if (AA.domObj.id == 'pacman' && BA.domObj.id == 'pellet') {
                needsDestroyed.push(contact.GetFixtureB().GetBody())
                BA.collected = 1;
                totalCollected = totalCollected + 1;
                
                if(totalCollected == pelletArray.length){
                    socket.emit('lose')
                }
		      } 
            else if (AA.domObj.id == 'bullet' + connections[0].id && BA.domObj.id == connections[0].id || AA.domObj.id == 'bullet' + connections[1].id && BA.domObj.id == connections[0].id || AA.domObj.id == 'bullet' + connections[2].id && BA.domObj.id == connections[0].id || AA.domObj.id == 'bullet' + connections[3].id && BA.domObj.id == connections[0].id) {
                contact.SetEnabled(false);
		      } 
            else if (AA.domObj.id == 'bullet' + connections[0].id && BA.domObj.id == connections[1].id || AA.domObj.id == 'bullet' + connections[1].id && BA.domObj.id == connections[1].id || AA.domObj.id == 'bullet' + connections[2].id && BA.domObj.id == connections[1].id || AA.domObj.id == 'bullet' + connections[3].id && BA.domObj.id == connections[1].id) {
                contact.SetEnabled(false);
		      }
            else if (AA.domObj.id == 'bullet' + connections[0].id && BA.domObj.id == connections[2].id || AA.domObj.id == 'bullet' + connections[1].id && BA.domObj.id == connections[2].id || AA.domObj.id == 'bullet' + connections[2].id && BA.domObj.id == connections[2].id || AA.domObj.id == 'bullet' + connections[3].id && BA.domObj.id == connections[2].id) {
                contact.SetEnabled(false);
		      } 
            else if (AA.domObj.id == 'bullet' + connections[0].id && BA.domObj.id == connections[3].id || AA.domObj.id == 'bullet' + connections[1].id && BA.domObj.id == connections[3].id || AA.domObj.id == 'bullet' + connections[2].id && BA.domObj.id == connections[3].id || AA.domObj.id == 'bullet' + connections[3].id && BA.domObj.id == connections[3].id) {
                contact.SetEnabled(false);
		      }
            else if (AA.domObj.id == 'bullet' + connections[0].id && BA.domObj.id == 'pellet' || AA.domObj.id == 'bullet' + connections[1].id && BA.domObj.id == 'pellet' || AA.domObj.id == 'bullet' + connections[2].id && BA.domObj.id == 'pellet' || AA.domObj.id == 'bullet' + connections[3].id && BA.domObj.id == 'pellet') {
                contact.SetEnabled(false);
		      }
                        else if (AA.domObj.id == 'pacman' && BA.domObj.id == connections[0].id){
                needsDestroyed.push(contact.GetFixtureB().GetBody());
                io.emit('destroySprite', 'pinky');
                connections[0].lifes = connections[0].lifes - 1;
                
                if(connections[0].lifes == -1){
                    connections[0].lifes = 'DEAD';
                }
                else{
                    respawn = setTimeout(function(){
                        createObj(connections[0].id,50, 100, 20, true, null);
                        io.emit('respawnSprite', 'pinky');
                    }, 10000)    
                }
            }
            else if (AA.domObj.id == 'pacman' && BA.domObj.id == connections[1].id){
                needsDestroyed.push(contact.GetFixtureB().GetBody());
                io.emit('destroySprite', 'inky');
                connections[1].lifes = connections[1].lifes - 1;
                
                if(connections[1].lifes == -1){
                    connections[1].lifes = 'DEAD';
                }
                else{
                    respawn = setTimeout(function(){
                        createObj(connections[1].id,850, 700, 20, true, null);
                        io.emit('respawnSprite', 'inky');
                    }, 10000)    
                }
            }
            else if (AA.domObj.id == 'pacman' && BA.domObj.id == connections[2].id){
                needsDestroyed.push(contact.GetFixtureB().GetBody());
                io.emit('destroySprite', 'blinky');
                connections[2].lifes = connections[2].lifes - 1;
                
                if(connections[2].lifes == -1){
                    connections[2].lifes = 'DEAD';
                }
                else{
                    respawn = setTimeout(function(){
                        createObj(connections[2].id,850, 100, 20, true, null);
                        io.emit('respawnSprite', 'blinky');
                    }, 10000)    
                }
            }
            else if (AA.domObj.id == 'pacman' && BA.domObj.id == connections[3].id){
                needsDestroyed.push(contact.GetFixtureB().GetBody());
                io.emit('destroySprite', 'clyde');
                connections[3].lifes = connections[3].lifes - 1;
                
                if(connections[3].lifes == -1){
                    connections[3].lifes = 'DEAD';
                }
                else{
                    respawn= setTimeout(function(){
                        createObj(connections[3].id,50, 700, 20, true, null);
                        io.emit('respawnSprite', 'clyde');
                    }, 10000)    
                }
            }
            else if (AA.domObj.id == connections[0].id && BA.domObj.id == 'pacman'){
                needsDestroyed.push(contact.GetFixtureA().GetBody());
                io.emit('destroySprite', 'pinky');
                connections[0].lifes = connections[0].lifes - 1;
                
                if(connections[0].lifes == -1){
                    connections[0].lifes = 'DEAD';
                }
                else{
                    respawn = setTimeout(function(){
                        createObj(connections[0].id,50, 100, 20, true, null);
                        io.emit('respawnSprite', 'pinky');
                    }, 10000)    
                }
            }
            else if (AA.domObj.id == connections[1].id && BA.domObj.id == 'pacman'){
                needsDestroyed.push(contact.GetFixtureA().GetBody());
                io.emit('destroySprite', 'inky');
                connections[1].lifes = connections[1].lifes - 1;
                
                if(connections[1].lifes == -1){
                    connections[1].lifes = 'DEAD';
                }
                else{
                    respawn = setTimeout(function(){
                        createObj(connections[1].id,850, 700, 20, true, null);
                        io.emit('respawnSprite', 'inky');
                    }, 10000)    
                }
            }
            else if (AA.domObj.id == connections[2].id && BA.domObj.id == 'pacman'){
                needsDestroyed.push(contact.GetFixtureA().GetBody());
                io.emit('destroySprite', 'blinky');
                connections[2].lifes = connections[2].lifes - 1;
                
                if(connections[2].lifes == -1){
                    connections[2].lifes = 'DEAD';
                }
                else{
                    respawn = setTimeout(function(){
                        createObj(connections[2].id,850, 100, 20, true, null);
                        io.emit('respawnSprite', 'blinky');
                    }, 10000)    
                }
            }
            else if (AA.domObj.id == connections[3].id && BA.domObj.id == 'pacman'){
                needsDestroyed.push(contact.GetFixtureA().GetBody());
                io.emit('destroySprite', 'clyde');
                connections[3].lifes = connections[3].lifes - 1;
                
                if(connections[3].lifes == -1){
                    connections[3].lifes = 'DEAD';
                }
                else{
                    respawn= setTimeout(function(){
                        createObj(connections[3].id,50, 700, 20, true, null);
                        io.emit('respawnSprite', 'clyde');
                    }, 10000)    
                }
            }
            
        }
        if(AB != null && BA != null){
            if(AB.class == 'block' && BA.domObj.id == 'pacman') {
				contact.SetEnabled(false);
		    }
        }
        
    }
    
    listener.BeginContact = function(contact){
        AA = contact.GetFixtureA().m_userData;
        AB = contact.GetFixtureA().GetBody().GetUserData();
        BA = contact.GetFixtureB().m_userData;
		BB = contact.GetFixtureB().GetBody().GetUserData();
        //console.log(AA, BA);
        if( AA != null && BB != null){
            if (AA.domObj.id == 'bullet' + connections[0].id && BB.class == 'block'){
                needsDestroyed.push(contact.GetFixtureA().GetBody());
                connections[0].shot = 0;
                io.emit('deleteBullet', {char: 'pinky'});
            } 
            else if(AA.domObj.id == 'bullet' + connections[1].id && BB.class == 'block'){
                needsDestroyed.push(contact.GetFixtureA().GetBody());
                connections[1].shot = 0;
                io.emit('deleteBullet', {char: 'inky'});
            } 
            else if(AA.domObj.id == 'bullet' + connections[2].id && BB.class == 'block'){
                needsDestroyed.push(contact.GetFixtureA().GetBody());
                connections[2].shot = 0;
                io.emit('deleteBullet', {char: 'blinky'});
            }
            else if(AA.domObj.id == 'bullet' + connections[3].id && BB.class == 'block') {
				needsDestroyed.push(contact.GetFixtureA().GetBody());
                connections[3].shot = 0;
                io.emit('deleteBullet', {char: 'clyde'});
		    }
        }
        if(AA != null && BA != null){
            if (AA.domObj.id == 'bullet' + connections[0].id && BA.domObj.id == 'pacman'){
                needsDestroyed.push(contact.GetFixtureA().GetBody());
                connections[0].shot = 0;
                connections[0].score = connections[0].score + 100;
                
                BA.health = BA.health - 1;
                if(BA.health <= 0){
                    needsDestroyed.push(contact.GetFixtureB().GetBody());
                    io.emit('deadPacman');
                    
                    for(var i = 0;i < 3;i++){
                        if(connections[i].score > connections[i+1].score){
                            var top = connections[i].user;
                        }
                        else{
                            var top = connections[i+1].user;
                        }
                    }
                    
                    io.emit('win', top);
                }
                io.emit('deleteBullet', {char: 'pinky'});
            } 
            else if(AA.domObj.id == 'bullet' + connections[1].id && BA.domObj.id == 'pacman'){
                needsDestroyed.push(contact.GetFixtureA().GetBody());
                connections[1].shot = 0;
                connections[1].score = connections[1].score + 100;
                
                BA.health = BA.health - 1;
                if(BA.health <= 0){
                    needsDestroyed.push(contact.GetFixtureB().GetBody());
                    io.emit('deadPacman');
                    
                    for(var i = 0;i < 3;i++){
                        if(connections[i].score > connections[i+1].score){
                            var top = connections[i].user;
                        }
                        else{
                            var top = connections[i+1].user;
                        }
                    }
                    
                    io.emit('win', top);
                }
                io.emit('deleteBullet', {char: 'inky'});
            } 
            else if(AA.domObj.id == 'bullet' + connections[2].id && BA.domObj.id == 'pacman'){
                needsDestroyed.push(contact.GetFixtureA().GetBody());
                connections[2].shot = 0;
                connections[2].score = connections[2].score + 100;
                
                BA.health = BA.health - 1;
                if(BA.health <= 0){
                    needsDestroyed.push(contact.GetFixtureB().GetBody());
                    io.emit('deadPacman');
                    
                    for(var i = 0;i < 3;i++){
                        if(connections[i].score > connections[i+1].score){
                            var top = connections[i].user;
                        }
                        else{
                            var top = connections[i+1].user;
                        }
                    }
                    
                    io.emit('win', top);
                }
                io.emit('deleteBullet', {char: 'blinky'});
            }
            else if(AA.domObj.id == 'bullet' + connections[3].id && BA.domObj.id == 'pacman') {
				needsDestroyed.push(contact.GetFixtureA().GetBody());
                connections[3].shot = 0;
                connections[3].score = connections[3].score + 100;
                
                BA.health = BA.health - 1;
                if(BA.health == 0){
                    needsDestroyed.push(contact.GetFixtureB().GetBody());
                    io.emit('deadPacman');
                    
                    for(var i = 0;i < 3;i++){
                        if(connections[i].score > connections[i+1].score){
                            var top = connections[i].user;
                        }
                        else{
                            var top = connections[i+1].user;
                        }
                    }
                    
                    io.emit('win', top);
                }
                io.emit('deleteBullet', {char: 'clyde'});
		      }
            else if (AA.domObj.id == 'pacman' && BA.domObj.id == 'sensor'){
                var dirArray = [];
                
                if(BA.up == 1){
                    dirArray.push('up');
                }
                if(BA.down == 1){
                    dirArray.push('down');
                }
                if(BA.left == 1){
                    dirArray.push('left');
                }
                if(BA.right == 1){
                    dirArray.push('right');
                }
                
                pos = Math.floor(Math.random() * dirArray.length);
                
                if(dirArray[pos] == 'up'){
                    ai(0,-3);
                }
                else if(dirArray[pos] == 'down'){
                    ai(0,3);
                }
                else if(dirArray[pos] == 'left'){
                    ai(-3,0);
                }
                else if(dirArray[pos] == 'right'){
                    ai(3,0);
                }
            } 
            else if (AA.domObj.id == 'pacman' && BA.domObj.id == 'cornerSensor'){
                var dirArray = [];
                
                if(BA.up == 1){
                    dirArray.push('up');
                }
                if(BA.down == 1){
                    dirArray.push('down');
                }
                if(BA.left == 1){
                    dirArray.push('left');
                }
                if(BA.right == 1){
                    dirArray.push('right');
                }
                
                pos = Math.floor(Math.random() * dirArray.length);
                
                if(dirArray[pos] == 'up'){
                    ai(0,-3);
                }
                else if(dirArray[pos] == 'down'){
                    ai(0,3);
                }
                else if(dirArray[pos] == 'left'){
                    ai(-3,0);
                }
                else if(dirArray[pos] == 'right'){
                    ai(3,0);
                }
            } 
        }
    }


    world.SetContactListener(listener);
    
    update(connections);
}

//function creates bullet
function createBullet(x, y, dir){
    //console.log(x,y);
    
    
    var fixDef = new b2FixtureDef;
    
    fixDef.density = 1.0;
    fixDef.restitution = 0;
    fixDef.friction = 0.5;
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox((10 / scale) / 2, (1/scale) / 2);
            
    var body = new b2BodyDef;
    body.type = b2Body.b2_dynamicBody;
    body.position.x = x / scale;
    body.position.y = y / scale;
            
    
    bullet = world.CreateBody(body).CreateFixture(fixDef);
    bullet.GetBody().SetLinearVelocity(new b2Vec2(dir.x, dir.y), bullet.GetBody().GetWorldCenter());
    
    return bullet;
}

function createSensor(id, x, y, size, up, down, left, right){
    var fixDefSens = new b2FixtureDef;
    
    var domObj = {id: id};
    
    fixDefSens.isSensor = true
    
    var circleShape = new b2CircleShape;
    circleShape.m_radius = size / scale;

    fixDefSens.shape = circleShape;
    
    var body = new b2BodyDef;
    body.type = b2Body.b2_staticBody;
    body.position.x = x / scale;
    body.position.y = y / scale;
    
    sensor = world.CreateBody(body).CreateFixture(fixDefSens);
    sensor.m_userData = {domObj: domObj, up: up, down: down, left: left, right: right};
    
}

function createTopDownMap(){
        blockArray = [];
        
        var fixDef = new b2FixtureDef;
        fixDef.friction = 1.0;
        fixDef.density = 1.0;
        fixDef.restitution = 0;
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(width / scale, 37 /scale );
    
        var body = new b2BodyDef;
        body.type = b2Body.b2_staticBody;
        body.position.x = 25/ scale;
        body.position.y = 1000 / scale;

        var block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(6 / scale, 410 / scale);
    
        body.type = b2Body.b2_staticBody;
        body.position.x = 25 / scale;
        body.position.y = 0 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(6 / scale, 500 / scale);
    
        body.type = b2Body.b2_staticBody;
        body.position.x = 25 / scale;
        body.position.y = 1000 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(37 / scale, 410 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 980 / scale;
        body.position.y = 0 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(37 / scale, 500 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 980 / scale;
        body.position.y = 1000 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(80 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 0 / scale;
        body.position.y = 800 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(80 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 0 / scale;
        body.position.y = 610 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(80 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 25 / scale;
        body.position.y = 330 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 70 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 500 / scale;
        body.position.y = 20 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(80 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 980 / scale;
        body.position.y = 800 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(80 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 980 / scale;
        body.position.y = 610 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(80 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 970 / scale;
        body.position.y = 330 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(60 / scale, 34 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 150 / scale;
        body.position.y = 130 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(80 / scale, 34 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 340 / scale;
        body.position.y = 130 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(80 / scale, 34 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 650 / scale;
        body.position.y = 130 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());       
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(60 / scale, 34 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 850 / scale;
        body.position.y = 130 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(60 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 160 / scale;
        body.position.y = 230 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(60 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 844 / scale;
        body.position.y = 230 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(60 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 150 / scale;
        body.position.y = 890 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(60 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 844 / scale;
        body.position.y = 890 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(70 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 650 / scale;
        body.position.y = 700 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(70 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 350 / scale;
        body.position.y = 700 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(120 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 500 / scale;
        body.position.y = 610 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 120 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 710 / scale;
        body.position.y = 515 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 120 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 290 / scale;
        body.position.y = 515 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 70 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 290 / scale;
        body.position.y = 280 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(70 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 342 / scale;
        body.position.y = 330 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 70 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 710 / scale;
        body.position.y = 280 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(70 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 652 / scale;
        body.position.y = 330 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(60 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 150 / scale;
        body.position.y = 420 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 70 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 190 / scale;
        body.position.y = 370 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(60 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 847 / scale;
        body.position.y = 420 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 70 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 810 / scale;
        body.position.y = 370 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(60 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 850 / scale;
        body.position.y = 510 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 66 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 810 / scale;
        body.position.y = 555 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(60 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 150 / scale;
        body.position.y = 510 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 66 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 190 / scale;
        body.position.y = 555 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(60 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 140 / scale;
        body.position.y = 700 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 66 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 190 / scale;
        body.position.y = 750 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(60 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 850 / scale;
        body.position.y = 700 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 66 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 810 / scale;
        body.position.y = 750 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 70 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 290 / scale;
        body.position.y = 840 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(70 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 336 / scale;
        body.position.y = 890 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 70 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 710 / scale;
        body.position.y = 840 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(70 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 662 / scale;
        body.position.y = 890 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(130 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 500 / scale;
        body.position.y = 240 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 94 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 500 / scale;
        body.position.y = 246 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(130 / scale, 24 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 495 / scale;
        body.position.y = 800 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(24 / scale, 116 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 495 / scale;
        body.position.y = 800 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(120 / scale, 8 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 500 / scale;
        body.position.y = 520 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(8 / scale, 70 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 388 / scale;
        body.position.y = 450 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(8 / scale, 70 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 612 / scale;
        body.position.y = 450 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
        
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(120 / scale, 8 / scale);
        
        body.type = b2Body.b2_staticBody;
        body.position.x = 500 / scale;
        body.position.y = 407 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());

        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(width/ scale, 3 / scale);
    
        body.type = b2Body.b2_staticBody;
        body.position.x = 0 / scale;
        body.position.y = 30 / scale;
    
        block = world.CreateBody(body).CreateFixture(fixDef);
        block.GetBody().SetUserData({class: 'block'});
        
        blockArray.push(block.GetBody());
}

function addSensors(){
    //TOP ROW
    createSensor('cornerSensor',50, 50, 10, 0, 1, 0, 1);
    createSensor('sensor',250, 50, 10, 0, 1, 1, 1);
    createSensor('cornerSensor',450, 50, 10, 0, 1, 1, 0);
    createSensor('cornerSensor',550, 50, 10, 0, 1, 0, 1);
    createSensor('sensor',750, 50, 5, 0, 1, 1, 1);
    createSensor('cornerSensor',925, 50, 10, 0, 1, 1, 0);
    
    //SECOND ROW
    createSensor('sensor',450, 125, 10, 1, 1, 0, 1);
    createSensor('sensor',550, 125, 10, 1, 1, 1, 0);
    
    //THIRD ROW
    createSensor('sensor',50, 175, 10, 1, 1, 0, 1);
    createSensor('sensor',250, 175, 10, 1, 1, 1, 1);
    createSensor('sensor',350, 175, 10, 0, 1, 1, 1);
    createSensor('cornerSensor',450, 175, 10, 1, 0, 1, 0);
    createSensor('cornerSensor',550, 175, 10, 1, 0, 0, 1);
    createSensor('sensor',650, 175, 10, 0, 1, 1, 1);
    createSensor('sensor',750, 175, 10, 1, 1, 1, 1);
    createSensor('sensor',925, 175, 10, 1, 1, 1, 0);
    
    //FOURTH ROW
    createSensor('cornerSensor',50, 285, 10, 1, 0, 0, 1);
    createSensor('sensor',150, 285, 10, 0, 1, 1, 1);
    createSensor('sensor',250, 285, 10, 1, 1, 1, 0);
    createSensor('cornerSensor',350, 285, 10, 1, 0, 0, 1);
    createSensor('cornerSensor',450, 285, 10, 0, 1, 1, 0);
    createSensor('cornerSensor',550, 285, 10, 0, 1, 0, 1);
    createSensor('cornerSensor',650, 285, 10, 1, 0, 1, 0);
    createSensor('sensor',750, 285, 10, 1, 1, 0, 1);
    createSensor('sensor',850, 285, 10, 0, 1, 1, 1);
    createSensor('cornerSensor',925, 285, 10, 1, 0, 1, 0);
    
    //FIFTH ROW
    createSensor('cornerSensor',50, 375, 10, 0, 1, 0, 1);
    createSensor('cornerSensor',150, 375, 10, 1, 0, 1, 0);
    createSensor('sensor',250, 375, 10, 1, 1, 0, 1);
    createSensor('sensor',350, 375, 10, 0, 1, 1, 1);
    createSensor('sensor',450, 375, 10, 1, 0, 1, 1);
    createSensor('sensor',550, 375, 10, 1, 0, 1, 1);
    createSensor('sensor',650, 375, 10, 0, 1, 1, 1);
    createSensor('sensor',750, 375, 10, 1, 1, 1, 0);
    createSensor('cornerSensor',850, 375, 10, 1, 0, 0, 1);
    createSensor('cornerSensor',925, 375, 10, 0, 1, 1, 0);
    
    //SIXTH ROW
    createSensor('sensor',50, 475, 10, 1, 1, 0, 1);
    createSensor('sensor',250, 475, 10, 1, 1, 1, 0);
    createSensor('sensor',750, 475, 10, 1, 1, 0, 1);
    createSensor('sensor',925, 475, 10, 1, 1, 1, 0);
    
    //SEVENTH ROW
    createSensor('cornerSensor',50, 550, 10, 1, 0, 0, 1);
    createSensor('cornerSensor',150, 550, 10, 0, 1, 1, 0);
    createSensor('sensor',350, 550, 10, 1, 1, 0, 1);
    createSensor('sensor',650, 550, 10, 1, 1, 1, 0);
    createSensor('cornerSensor',850, 550, 10, 0, 1, 0, 1);
    createSensor('cornerSensor',925, 550, 10, 1, 0, 1, 0);
    
    //EIGHTH ROW
    createSensor('cornerSensor',50, 650, 10, 0, 1, 0, 1);
    createSensor('sensor',150, 650, 10, 1, 0, 1, 1);
    createSensor('sensor',250, 650, 10, 1, 1, 1, 1);
    createSensor('sensor',350, 650, 10, 1, 0, 1, 1);
    createSensor('sensor',450, 650, 10, 0, 1, 1, 1);
    createSensor('sensor',550, 650, 10, 0, 1, 1, 1);
    createSensor('sensor',650, 650, 10, 1, 0, 1, 1);
    createSensor('sensor',750, 650, 10, 1, 1, 1, 1);
    createSensor('sensor',850, 650, 10, 1, 0, 1, 1);
    createSensor('cornerSensor',925, 650, 10, 0, 1, 1, 0);
    
    //NINTH ROW
    createSensor('cornerSensor',50, 750, 10, 1, 0, 0, 1);
    createSensor('cornerSensor',150, 750, 10, 0, 1, 1, 0);
    createSensor('sensor',250, 750, 10, 1, 1, 0, 1);
    createSensor('sensor',350, 750, 10, 0, 1, 1, 1);
    createSensor('cornerSensor',450, 750, 10, 1, 0, 1, 0);
    createSensor('cornerSensor',550, 750, 10, 1, 0, 0, 1);
    createSensor('sensor',650, 750, 10, 0, 1, 1, 1);
    createSensor('sensor',750, 750, 10, 1, 1, 1, 0);
    createSensor('cornerSensor',850, 750, 10, 0, 1, 0, 1);
    createSensor('cornerSensor',925, 750, 10, 1, 0, 1, 0);
    
    //TENTH ROW
    createSensor('cornerSensor',50, 850, 10, 0, 1, 0, 1);
    createSensor('sensor',150, 850, 10, 1, 0, 1, 1);
    createSensor('sensor',250, 850, 10, 1, 1, 1, 0);
    createSensor('cornerSensor',350, 850, 10, 1, 0, 0, 1);
    createSensor('cornerSensor',450, 850, 10, 0, 1, 1, 0);
    createSensor('cornerSensor',550, 850, 10, 0, 1, 0, 1);
    createSensor('cornerSensor',650, 850, 10, 1, 0, 1, 0);
    createSensor('sensor',750, 850, 10, 1, 1, 0, 1);
    createSensor('sensor',850, 850, 10, 1, 0, 1, 1);
    createSensor('cornerSensor',925, 850, 10, 0, 1, 1, 0);
    
    //ELEVENTH ROW
    createSensor('cornerSensor',50, 950, 10, 1, 0, 0, 1);
    createSensor('sensor',250, 950, 10, 1, 0, 1, 1);
    createSensor('sensor',450, 950, 10, 1, 0, 1, 1);
    createSensor('sensor',550, 950, 10, 1, 0, 1, 1);
    createSensor('sensor',750, 950, 10, 1, 0, 1, 1);
    createSensor('cornerSensor',925, 950, 10, 1, 0, 1, 0);
}

function addPellets(){
    //HORIZONTAL
    for(var i = 0;i < 440; i = i + 40){
        //TOP ROW
        createObj('pellet', 50 + i, 50 , 40, true, null);
    }
    for(var i = 0;i < 440; i = i + 40){
        createObj('pellet', 550 + i, 50 , 40, true, null);
    }
    for(var i = 0;i < 440; i = i + 40){    
        //SECOND ROW
        createObj('pellet', 50 + i, 170 , 40, true, null);
    }
    for(var i = 0;i < 440; i = i + 40){
        createObj('pellet', 550 + i, 170 , 40, true, null);
    }
    for(var i = 0;i < 440; i = i + 40){
        //EIGHTH ROW
        createObj('pellet', 550 + i, 650 , 40, true, null);
    }
    for(var i = 0;i < 440; i = i + 40){
        //ELEVENTH ROW
        createObj('pellet', 550 + i, 930 , 40, true, null);
    }
    
    for(var i = 0;i < 220; i = i + 40){
        //THIRD ROW
        createObj('pellet', 50 + i, 290 , 40, true, null);
    }
    for(var i = 0;i < 220; i = i + 40){
        createObj('pellet', 750 + i, 290 , 40, true, null);
    }
    for(var i = 0;i < 220; i = i + 40){
        //FIFTH ROW
        createObj('pellet', 50 + i, 450 , 40, true, null);
    }
    for(var i = 0;i < 220; i = i + 40){
        createObj('pellet', 750 + i, 450 , 40, true, null);
    }
    for(var i = 0;i < 220; i = i + 40){
        //TENTH ROW
        createObj('pellet', 50 + i, 850 , 40, true, null);
    }
    for(var i = 0;i < 220; i = i + 40){
        createObj('pellet', 750 + i, 850 , 40, true, null);
    }
    
    for(var i = 0;i < 160; i = i + 40){
        //THIRD ROW
        createObj('pellet', 330 + i, 290 , 40, true, null);
    }
    for(var i = 0;i < 160; i = i + 40){
        createObj('pellet', 550 + i, 290 , 40, true, null);
    }
    for(var i = 0;i < 160; i = i + 40){
        //TENTH ROW
        createObj('pellet', 330 + i, 850 , 40, true, null);
    }
    for(var i = 0;i < 160; i = i + 40){
        createObj('pellet', 550 + i, 850 , 40, true, null);
    }
    
    for(var i = 0;i < 120; i = i + 40){
        //FOURTH ROW
        createObj('pellet', 50 + i, 370 , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        createObj('pellet', 870 + i, 370 , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        //SEVENTH ROW
        createObj('pellet', 50 + i, 570 , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        createObj('pellet', 870 + i, 570 , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        //NINTH ROW
        createObj('pellet', 50 + i, 730 , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        createObj('pellet', 870 + i, 730 , 40, true, null);
    }
    
    for(var i = 0;i < 480; i = i + 40){
        //EIGHTH ROW
        createObj('pellet', 50 + i, 650 , 40, true, null);
    }
    for(var i = 0;i < 480; i = i + 40){
        //ELEVENTH ROW
        createObj('pellet', 50 + i, 930 , 40, true, null);   
    }
    
    for(var i = 0;i < 240; i = i + 40){
        //NINTH ROW
        createObj('pellet', 250 + i, 730 , 40, true, null);
    }
    for(var i = 0;i < 240; i = i + 40){
        createObj('pellet', 550 + i, 730 , 40, true, null);   
    }
    
    //VERTICAL
    for(var i = 0;i < 280; i = i + 40){
        //TOP ROW
        createObj('pellet', 50, 50 + i , 40, true, null);
    }
    for(var i = 0;i < 280; i = i + 40){
        createObj('pellet', 950, 50 + i , 40, true, null);
    }
    
    for(var i = 0;i < 900; i = i + 40){
        //TOP ROW
        createObj('pellet', 250, 50 + i , 40, true, null);
    }
    for(var i = 0;i < 900; i = i + 40){
        createObj('pellet', 750, 50 + i , 40, true, null);
    } 
        
    for(var i = 0;i < 140; i = i + 40){
        //TOP ROW
        createObj('pellet', 450, 50 + i , 40, true, null);
    }
    for(var i = 0;i < 140; i = i + 40){
        createObj('pellet', 550, 50 + i , 40, true, null);
    }
    for(var i = 0;i < 140; i = i + 40){
        //SECOND ROW
        createObj('pellet', 330, 170 + i , 40, true, null);
    }
    for(var i = 0;i < 140; i = i + 40){
        createObj('pellet', 670, 170 + i , 40, true, null);
    } 
    
    for(var i = 0;i < 120; i = i + 40){
        //THIRD ROW
        createObj('pellet', 130, 290 + i , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        createObj('pellet', 870, 290 + i , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        //SEVENTH ROW
        createObj('pellet', 130, 570 + i , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        createObj('pellet', 870, 570 + i , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        //EIGHTH ROW
        createObj('pellet', 50, 650 + i , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        createObj('pellet', 450, 650 + i , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        createObj('pellet', 550, 650 + i , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        createObj('pellet', 950, 650 + i , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        //TENTH ROW
        createObj('pellet', 50, 850 + i , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        createObj('pellet', 450, 850 + i , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        createObj('pellet', 550, 850 + i , 40, true, null);
    }
    for(var i = 0;i < 120; i = i + 40){
        createObj('pellet', 950, 850 + i , 40, true, null);
    } 
    
    for(var i = 0;i < 240; i = i + 40){
        //FOURTH ROW
        createObj('pellet', 50, 370 + i , 40, true, null);
    }
    for(var i = 0;i < 240; i = i + 40){
        createObj('pellet', 950, 370 + i , 40, true, null);
    } 
    
    for(var i = 0;i < 160; i = i + 40){
        //NINTH ROW
        createObj('pellet', 130, 730 + i , 40, true, null);
    }
    for(var i = 0;i < 160; i = i + 40){
        createObj('pellet', 330, 730 + i , 40, true, null);
    }
    for(var i = 0;i < 160; i = i + 40){
        createObj('pellet', 670, 730 + i , 40, true, null);
    }
    for(var i = 0;i < 160; i = i + 40){
        createObj('pellet', 870, 730 + i , 40, true, null);
    } 
    
    //RELOAD POINTS
    createObj('reload', 50, 50, 40, true, null);
    createObj('reload', 925, 50, 40, true, null);
    createObj('reload', 80, 930, 40, true, null);
    createObj('reload', 925, 930, 40, true, null);
}

function ai(velX, velY){
    for(var j = world.m_bodyList; j; j = j.m_next){
        for(var z = j.m_fixtureList; z; z = z.m_next){
            if(z.m_userData){
                if(z.m_userData.domObj.id == 'pacman'){
                    z.m_body.SetLinearVelocity(new b2Vec2(velX,velY), z.m_body.GetWorldCenter());
                }
            }
        }
    }  
}

    //function for wrapping the world
function move(id, loc){  
    createObj(id, loc, 450, 40, true, null);
    
    for(var j = world.m_bodyList; j; j = j.m_next){
        for(var z = j.m_fixtureList; z; z = z.m_next){
            if(z.m_userData){
                if(z.m_userData.domObj.id == id){
                    //apply the impulse
                    if(loc == 30){
                        z.m_body.SetLinearVelocity(new b2Vec2(5,0), z.m_body.GetWorldCenter());
                    }
                    else if(loc == 980){
                        z.m_body.SetLinearVelocity(new b2Vec2(-5,0), z.m_body.GetWorldCenter());
                    }
                }
            }
        }
    }  
}


io.on('connection', function(socket){
    connections.push(socket);
    socket.bullets = 20;
    socket.lifes = 3;
    socket.shot = 0;
    socket.score = 0;

    
    socket.on('forward', function(){
        for(var j = world.m_bodyList; j; j = j.m_next){
        for(var z = j.m_fixtureList; z; z = z.m_next){
            if(z.m_userData){
                if(z.m_userData.domObj.id == this.id){
                    z.m_body.SetLinearVelocity(new b2Vec2(5,0), z.m_body.GetWorldCenter());
                }
                
            }
        }
        }   
    });
    
    socket.on('back', function(){
        for(var j = world.m_bodyList; j; j = j.m_next){
        for(var z = j.m_fixtureList; z; z = z.m_next){
            if(z.m_userData){
                if(z.m_userData.domObj.id == this.id){
                    z.m_body.SetLinearVelocity(new b2Vec2(-5,0), z.m_body.GetWorldCenter());

                }
                
            }
        }
        }
    });
    
    socket.on('up', function(){
        for(var j = world.m_bodyList; j; j = j.m_next){
        for(var z = j.m_fixtureList; z; z = z.m_next){
            if(z.m_userData){
                if(z.m_userData.domObj.id == this.id){
                    z.m_body.SetLinearVelocity(new b2Vec2(0,-5), z.m_body.GetWorldCenter());
                }
                
            }
        }
        }
    });
    
    socket.on('down', function(){
        for(var j = world.m_bodyList; j; j = j.m_next){
        for(var z = j.m_fixtureList; z; z = z.m_next){
            if(z.m_userData){
                if(z.m_userData.domObj.id == this.id){
                    z.m_body.SetLinearVelocity(new b2Vec2(0,5), z.m_body.GetWorldCenter());
                }
                
            }
        }
        }
    });
    
    socket.on('fire', function(){
        var dir = {x: 0, y: 0};
        if(this.bullets > 0 && this.shot == 0){
            socket.bullets = socket.bullets - 1;
            socket.shot = 1;
            for(var j = world.m_bodyList; j; j = j.m_next){
                for(var z = j.m_fixtureList; z; z = z.m_next){
                    if(z.m_userData){
                        if(z.m_userData.domObj.id == this.id){
                            if(z.m_body.GetLinearVelocity().x == 0 && z.m_body.GetLinearVelocity().y == 0){
                                dir.x = 10;
                                dir.y = 0;
                            }
                            else if(z.m_body.GetLinearVelocity().x <= 5 && z.m_body.GetLinearVelocity().x > 0){
                                dir.x = 10;
                                dir.y = 0;
                            }
                            else if(z.m_body.GetLinearVelocity().x >= -5 && z.m_body.GetLinearVelocity().x < 0){
                                dir.x = -10;
                                dir.y = 0;
                            }
                            else if(z.m_body.GetLinearVelocity().y <= 5 && z.m_body.GetLinearVelocity().y > 0){
                                dir.x = 0;
                                dir.y = 10;
                            }
                            else if(z.m_body.GetLinearVelocity().y >= -5 && z.m_body.GetLinearVelocity().y < 0){
                                dir.x = 0;
                                dir.y = -10;
                            }
                            createObj('bullet' + this.id,z.m_body.m_xf.position.x * scale, z.m_body.m_xf.position.y * scale, 10, false, dir)
                        }    
                    }
                }
            }
        }
    });
    
    socket.on('setUpUser', function(data){
       socket.user = data; 
    });
    
    socket.on('waiting', function(data){
        socket.emit('waiting', 4 - connections.length);
        waiting = setInterval(function(){
            socket.emit('waiting', 4 - connections.length);
        }, 5000)
    });
    
    socket.on('disconnect', function(){
        for(var i; i < connections.length; i++){
            if(connections[i].id == this.id){
                connections.splice(i, 1);
            }
        }

    });
    if(connections.length == 4){
        user = setTimeout(function(){
            if(connections[0].user != undefined && connections[1].user != undefined && connections[2].user != undefined && connections[3].user != undefined){
                io.emit('start');
                init(connections);   
            }
            else{
                io.emit('fail');
            }
        }, 10000);

    }
});




http.listen(8000, function(){
  console.log('listening on *:8000');
});
/*

   +-------------------------+
   | WhiteFish               |
   | By Chris Adams (C) 2015 |
   +-------------------------+

*/

var GAME = GAME || {};

var bfree = null;

Math.sgn = function(v)
{
    return v === 0 ? 0 : (v < 0 ? -1 : 1);
};

var SFX = {};

var flagCount = 0;
var fuel = 0;
var levelNo = 1;

GAME.Init = function ( )
{
    bfree = Box2D.destroy;

    GAME.W = 800;
    GAME.H = 800;

    var setBuffer = function ( )
    {
        if (GAME.bfrImg)
        {
            GAME.bfrImg.parent.removeChild(GAME.bfrImg);
            GAME.bfrImg.kill();
        }

        GAME.bfr = GAME.game.make.bitmapData(GAME.W, GAME.H);
        GAME.bfrImg = GAME.bfr.addToWorld(0, 0);
    };

    var game = GAME.game = new Phaser.Game(GAME.W, GAME.H, Phaser.AUTO, '', {
        preload: function () {

            //game.load.audio('background', ['sfx/background.mp3', 'sfx/background.ogg']);

        },
        create: function () {

            setBuffer();

            //SFX.background = game.add.audio('background');
            //SFX.background.volume = 0.1;
            //SFX.background.play();
        },
        update: GAME.Update
    });

    GAME.gravity = new Box2D.b2Vec2(0.0, 0.0);
    GAME.world = new Box2D.b2World(GAME.gravity);

    GAME.bd_ground = new Box2D.b2BodyDef();
    GAME.ground = GAME.world.CreateBody(GAME.bd_ground);

    var listener = new Box2D.JSContactListener();
    listener.BeginContact = function (contactPtr) {
        if (ship)
            ship.contact = true;
    }
    listener.EndContact = function() {};
    listener.PreSolve = function() {};
    listener.PostSolve = function() {};

    GAME.world.SetContactListener( listener );

    Math.seedrandom(666);

    initLevel(levelNo);
};

var initLevel = function (no)
{
    $('.message').remove();

    if (!no)
        no = levelNo;
    levelNo = no;
    flagCount = 0;
    fuel = 30;

    for (var i=0; i<planets.length; i++)
    {
        if (planets[i].fixture)
            GAME.ground.DestroyFixture(planets[i].fixture);
    }

    planets = [];

    switch (levelNo)
    {
        case 1:
            addPlanet(M_CLASS, 400, 400, 40, [-Math.PI/2]);
            initShip(400, 100, 6);
            fuel = 15;
            break;
        case 2:
            addPlanet(M_CLASS, 400, 400, 40, [Math.PI/2]);
            initShip(400, 100, 6);
            fuel = 15;
            break;
        case 3:
            addPlanet(M_CLASS, 300, 500, 20, [0]);
            addPlanet(M_CLASS, 500, 300, 40, [Math.PI/2]);
            initShip(400, 100, 6);
            fuel = 15;
            break;
        case 4:
            addPlanet(J_CLASS, 400, 400, 80, [0]);
            addPlanet(M_CLASS, 200, 200, 20, [0]);
            addPlanet(M_CLASS, 600, 200, 20, [-Math.PI]);
            initShip(400, 100, 6);
            fuel = 10;
            break;
        case 5:
            addPlanet(B_HOLE, 400, 400, 30);
            addPlanet(M_CLASS, 200, 600, 20, [0]);
            addPlanet(M_CLASS, 600, 600, 20, [-Math.PI]);
            initShip(400, 100, 6);
            fuel = 15;
            break;
        case 6:
            addPlanet(M_CLASS, 400, 400, 40, [0, Math.PI]);
            addPlanet(B_HOLE, 200, 400, 20);
            addPlanet(B_HOLE, 600, 400, 20);
            addPlanet(B_HOLE, 400, 200, 20);
            addPlanet(B_HOLE, 400, 600, 20);
            initShip(400, 500, 6);
            fuel = 10;
            break;
        case 7:
            addPlanet(M_CLASS, 400, 400, 40, [0]);
            addPlanet(M_CLASS, 600, 300, 20, [Math.PI/3]);
            addPlanet(J_CLASS, 200, 600, 85, [Math.PI/4]);
            addPlanet(B_HOLE, 600, 500, 20, [Math.PI]);
            initShip(400, 50, 6);
            fuel = 20;
            break;
    };   

    winTime = null;
    won = false;
    lost = false;
    initFuel = fuel;
};

var ROTMULT_FLIPH = 1;
var ROTMULT = function ( x, y, rx, ry, a, f )
{
    var ca = Math.cos(a), sa = Math.sin(a);
    return {
        'x': x+(rx * ca - ry * sa) * f,
        'y': y+(ry * ca + rx * sa) * f * ROTMULT_FLIPH
    };
};

// Returns the time elapsed in seconds since the game started
// Pauses if window loses context
var __ctime = 0.0;
var ctime = function ( )
{
    return __ctime;
};
var frameNumber = 0;

var ship = null;
var initShip = function (x, y, r)
{
    if (ship)
    {
        GAME.world.DestroyBody(ship.body);
        ship = null;
    }

    var bodyDef = new Box2D.b2BodyDef();
    bodyDef.set_position(new Box2D.b2Vec2(x, y));
    bodyDef.set_angle(Math.PI/2);
    bodyDef.set_type( Box2D.b2_dynamicBody );
    bodyDef.set_angularDamping(2.0);
    bodyDef.set_allowSleep(false);
    var body = GAME.world.CreateBody( bodyDef );

    var verts = [];
    verts.push( new Box2D.b2Vec2( -4/6*r,  4/6*r ) );
    verts.push( new Box2D.b2Vec2(  0,     -6/6*r ) );
    verts.push( new Box2D.b2Vec2(  4/6*r,  4/6*r ) );
    var shape = createPolygonShape( verts );

    var fixtureDef = new Box2D.b2FixtureDef();
    fixtureDef.set_density( 0.5 );
    fixtureDef.set_friction( 0.6 );
    fixtureDef.set_shape( shape );
    body.CreateFixture( fixtureDef );

    return ship = {
        body:      body,
        verts:     verts,
        shape:     shape,
        destroyed: false,
        r:         r
    };
};

// https://github.com/kripken/box2d.js/blob/master/helpers/embox2d-helpers.js
function createPolygonShape(vertices) {
    var shape = new Box2D.b2PolygonShape();            
    var buffer = Box2D.allocate(vertices.length * 8, 'float', Box2D.ALLOC_STACK);
    var offset = 0;
    for (var i=0;i<vertices.length;i++) {
        Box2D.setValue(buffer+(offset), vertices[i].get_x(), 'float'); // x
        Box2D.setValue(buffer+(offset+4), vertices[i].get_y(), 'float'); // y
        offset += 8;
    }            
    var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
    shape.Set(ptr_wrapped, vertices.length);
    return shape;
}

var updateRenderShip = function ( ctx, delta )
{
    if (!ship)
    {
        return;
    }

    ctx.fillStyle = '#808080';
    ctx.beginPath();
    var P = ship.body.GetWorldCenter();
    var A = ship.body.GetAngle();
    var X = P.get_x(), Y = P.get_y();
    var xy = ROTMULT(X, Y, ship.verts[0].get_x(), ship.verts[0].get_y(), A, 1); ctx.moveTo(xy.x, xy.y);
    var xy = ROTMULT(X, Y, ship.verts[1].get_x(), ship.verts[1].get_y(), A, 1); ctx.lineTo(xy.x, xy.y);
    var xy = ROTMULT(X, Y, ship.verts[2].get_x(), ship.verts[2].get_y(), A, 1); ctx.lineTo(xy.x, xy.y);
    ctx.closePath();
    ctx.fill();

    for (var i=0; i<planets.length; i++)
        for (var j=0; j<planets[i].flags.length; j++)
        {
            var FL = planets[i].flags[j];
            var d2 = (FL.x - X) * (FL.x - X) + (FL.y - Y) * (FL.y - Y);
            if (d2 < (FL.r+ship.r)*(FL.r+ship.r))
            {
                flagCount -= 1;
                planets[i].flags.splice(j, 1);
                j --;
                continue;
            }
        }

    var V = ship.body.GetLinearVelocity();

    var mouseX = GAME.game.input.x;
    var mouseY = GAME.game.input.y;
    var inp = GAME.game.input.activePointer;
    if (!inp)
        inp = GAME.game.input.mousePointer;
    var isDown = inp.isDown;

    var gf = gravForce(X, Y);
    var imp = new Box2D.b2Vec2(gf.x, gf.y);
    if (isDown && fuel > 0)
    {
        var F = 50;
        if (GAME.game.input.mouse.button & 2)
            F /= 2;

        fuel -= F/50 * delta;

        imp.set_x(imp.get_x() + Math.cos(A-Math.PI/2) * F);
        imp.set_y(imp.get_y() + Math.sin(A-Math.PI/2) * F);
        if (Math.random() < ((GAME.game.input.mouse.button & 2) ? 0.2 : 0.6))
        {
            dust.push({
                x: X + Math.random() * 2.5 - 1.25,
                y: Y + Math.random() * 2.5 - 1.25,
                xv: -imp.get_x() + V.get_x(),
                yv: -imp.get_y() + V.get_y(),
                t: 1.0,
                inv: true
            });
        }
    }
    if (fuel < 0) fuel = 0;
    ship.body.ApplyLinearImpulse(imp, P);
    bfree(imp);

    var dx = mouseX - X, dy = mouseY - Y;
    var angle = Math.atan2(dy, dx);
    A -= Math.PI / 2;
    var dx = Math.cos(angle - A), dy = Math.sin(angle - A);
    var angle = Math.atan2(dy, dx);
    if (angle >= Math.PI)
        angle -= Math.PI * 2;
    if (Math.abs(angle) > 1)
        angle /= Math.abs(angle);

    ship.body.ApplyAngularImpulse(angle/delta);

    var PL = null, PLd2 = null;
    for (var i=0; i<planets.length; i++)
    {
        var d2 = (planets[i].x - X) * (planets[i].x - X) + (planets[i].y - Y) * (planets[i].y - Y) - planets[i].r * planets[i].r;
        if (!PL || d2 < PLd2)
        {
            PL = planets[i];
            PLd2 = d2;
        }
    }

    if (ship.contact || PLd2 < 0)
    {
        var speed = ship.lspeed;

        var dx = PL.x - X, dy = PL.y - Y;
        var angle = Math.atan2(-dy, -dx) - A;
        angle = Math.atan2(Math.sin(angle), Math.cos(angle));
        if (angle >= Math.PI)
            angle -= Math.PI * 2;

        if (speed > 50 || PLd2 < 0 || Math.abs(angle) > Math.PI/4)
        {
            GAME.world.DestroyBody(ship.body);
            ship = null;
            for (var i=0; i<100; i++)
            {
                var exa = Math.random() * Math.PI * 2.0;
                var exr = Math.random() * 100;
                dust.push({
                    x: X + Math.random() * 2.5 - 1.25,
                    y: Y + Math.random() * 2.5 - 1.25,
                    xv: Math.cos(exa) * exr,
                    yv: Math.sin(exa) * exr,
                    t: 1.0,
                    inv: true
                });
            }
            return;
        }
    }
    
    ship.lspeed = Math.sqrt(V.get_x() * V.get_x() + V.get_y() * V.get_y());

    ship.contact = false;
};

var dust = [];
var updateRenderDust = function ( ctx, delta )
{
    var IT = 1;
    if (dust.length === 0)
    {
        IT = 100;
        delta = 1/60;
    }

    while (IT--)
    {
        while (dust.length < 100)
        {
            dust.push({
                x: Math.random() * 800,
                y: Math.random() * 800,
                xv: Math.random() * 40 - 20,
                yv: Math.random() * 40 - 20,
                t: 0.0,
            });
        }

        var D, gf;
        for (var len=dust.length, i=0; i<len; i++)
        {
            D = dust[i];
            if (D.x < -0.5 || D.y < -0.5 || D.x > 800.5 || D.y > 800.5 || planetCollide(D.x, D.y, 0.5))
            {
                len --;
                dust.splice(i, 1);
                i --;
                continue;
            }
            if (D.inv)
            {
                D.t -= delta;
                if (D.t < 0)
                {
                    len --;
                    dust.splice(i, 1);
                    i --;                    
                }
            }
            else
            {
                D.t += delta;
                if (D.t > 1) D.t = 1;
            }
            gf = gravForce(D.x, D.y);
            D.xv += gf.x * delta;
            D.yv += gf.y * delta;
            D.x += D.xv * delta;
            D.y += D.yv * delta;

            if (IT === 0)
            {
                if (D.inv)
                    ctx.fillStyle = 'rgba(255,255,0,' + D.t*0.8 + ')';
                else
                    ctx.fillStyle = 'rgba(255,255,255,' + D.t*0.4 + ')';
                ctx.fillRect(Math.round(D.x), Math.round(D.y), 1,1);
            }
        };
    }
};

var planets = [];

var M_CLASS = 1;
var J_CLASS = 2;
var B_HOLE  = 3;

var gravForce = function ( x, y )
{
    var ret = { x: 0, y: 0 };
    var PL;
    for (var len=planets.length, i=0; i<len; i++)
    {
        PL = planets[i];
        var dx = PL.x - x, dy = PL.y - y;
        var l2 = (dx*dx + dy*dy);
        var l1 = Math.sqrt(l2);
        l2 = 2.0 * PL.mass / l2;
        ret.x += l2 * (dx / l1);
        ret.y += l2 * (dy / l1);
    }
    return ret;
};

var planetCollide = function ( x, y, r )
{
    var ret = { x: 0, y: 0 };
    var PL;
    for (var len=planets.length, i=0; i<len; i++)
    {
        PL = planets[i];
        var dx = PL.x - x, dy = PL.y - y;
        if ((PL.r*PL.r-r*r) > (dx*dx + dy*dy))
            return PL;
    }
    return null;
};

var addPlanet = function ( type, x, y, r, flags )
{
    var obj = {
        type:  type,
        x:     x,
        y:     y,
        r:     r,
        shape: null,
        mass:  0.0,
        flags: flags ? flags : []
    };

    flagCount += obj.flags.length;

    for (var i=0; i<obj.flags.length; i++)
    {
        var FL = obj.flags[i] = {
            a: obj.flags[i],
            x: null,
            y: null,
            r: 5
        };
        FL.x = Math.cos(FL.a) * (obj.r + 5) + obj.x;
        FL.y = Math.sin(FL.a) * (obj.r + 5) + obj.y;
    }

    switch (type)
    {
        case M_CLASS:
            obj.mass = 25*r*r;
            break;
        case J_CLASS:
            obj.mass = 20*r*r;
            break;
        case B_HOLE:
            obj.mass = 250*r*r;
            break;
        default:
            break;
    }

    if (type === M_CLASS)
    {
        obj.shape = new Box2D.b2CircleShape();
        obj.shape.set_m_p(new Box2D.b2Vec2(x, y));
        obj.shape.set_m_radius(r);
        obj.fixture = GAME.ground.CreateFixture(obj.shape, 0.0);
    }

    planets.push(obj);

    return obj;    
};

var renderPlanets = function ( ctx, delta )
{
    for (var i=0; i<planets.length; i++)
    {
        var PL = planets[i];

        var clr;
        switch (PL.type)
        {
            case M_CLASS:
                clr = '#208050';
                break;
            case J_CLASS:
                clr = '#808010';
                break;
            case B_HOLE:
                clr = '#000000';
                break;
            default:
                clr = '#808080';
            break;
        }

        if (PL.flags)
        {
            for (var j=0; j<PL.flags.length; j++)
            {
                var FL = PL.flags[j];

                ctx.strokeStyle = '#A0A0A0';
                ctx.beginPath();
                ctx.moveTo(PL.x, PL.y);
                ctx.lineTo(PL.x + Math.cos(FL.a) * (PL.r + 10), PL.y + Math.sin(FL.a) * (PL.r + 10));
                ctx.closePath();
                ctx.stroke();

                ctx.strokeStyle = ctx.fillStyle = '#00A000';
                ctx.beginPath();
                ctx.moveTo(PL.x + Math.cos(FL.a) * (PL.r + 10), PL.y + Math.sin(FL.a) * (PL.r + 10));
                ctx.lineTo(PL.x + Math.cos(FL.a) * (PL.r + 7.5) + Math.cos(FL.a+Math.PI/2) * 5, PL.y + Math.sin(FL.a) * (PL.r + 7.5) + Math.sin(FL.a+Math.PI/2) * 5);
                ctx.lineTo(PL.x + Math.cos(FL.a) * (PL.r + 5), PL.y + Math.sin(FL.a) * (PL.r + 5));
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }

        ctx.fillStyle = clr;
        ctx.beginPath();
        ctx.arc(PL.x, PL.y, PL.r, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fill();

        if (PL.type === J_CLASS)
        {
            ctx.strokeStyle = 'rgba(80,80,0,0.5)';
            ctx.beginPath();
            ctx.arc(PL.x, PL.y, PL.r*1.5, 0, 2*Math.PI);
            ctx.closePath();
            ctx.stroke();
            ctx.strokeStyle = 'rgba(80,80,0,0.25)';
            ctx.beginPath();
            ctx.arc(PL.x, PL.y, PL.r*1.5-5, 0, 2*Math.PI);
            ctx.closePath();
            ctx.stroke();
            ctx.strokeStyle = 'rgba(80,80,0,0.75)';
            ctx.beginPath();
            ctx.arc(PL.x, PL.y, PL.r*1.5-10, 0, 2*Math.PI);
            ctx.closePath();
            ctx.stroke();
            ctx.strokeStyle = 'rgba(80,80,0,0.5)';
            ctx.beginPath();
            ctx.arc(PL.x, PL.y, PL.r*1.5-15, 0, 2*Math.PI);
            ctx.closePath();
            ctx.stroke();
        }
    }
}

GAME.Update = function ( )
{
    // Update timer
    var delta = 1.0/60.0;
    var newTime = GAME.game.time.now / 1000.0;
    if (GAME.lastFrameTime)
        delta = newTime - GAME.lastFrameTime;
    GAME.lastFrameTime = newTime;
    if (delta < 1/60) delta = 1/60;
    if (delta > 1/10) delta = 1/10;
    __ctime += delta;
    frameNumber += 1;

    document.title = 'MiniLander - ' + Math.floor(1/delta) + ' fps';

    var realDelta = delta;
    delta = 1/60;

    // Step world
    GAME.world.Step(delta, 16, 16);

    // Render
    GAME.render(delta, realDelta);
};

var lhud = "";

var winTime = null;
var won = false;
var lost = false;

GAME.render = function ( delta, realDelta )
{
    // Render
    var ctx = GAME.bfr.ctx;

    // Clear screen
    GAME.bfr.clear();
    ctx.fillStyle = '#001040';
    ctx.fillRect(0, 0, GAME.W, GAME.H);

    updateRenderDust(ctx, delta);
    updateRenderShip(ctx, delta);
    renderPlanets(ctx, delta);

    if (!ship && !won && !lost)
    {
        lost = true;
        $('<div class="message destroyed">Destroyed...<br><br><span class="button" id="reset2">Try again</span></div>').appendTo($(document.body));
        $('#reset2').click(function(){
            initLevel();
        });
    }

    if (!lost && flagCount <= 0 && !won)
    {
        if (!winTime)
            winTime = ctime() + 3;
        else if (winTime <= ctime())
        {
            won = true;
            $('<div class="message success">Success!<br>Fuel used: ' + (Math.floor((initFuel - fuel)*100) / 100) + 's<br><span class="button" id="next_level">Next level</span></div>').appendTo($(document.body));
            $('#next_level').click(function(){
                initLevel(levelNo+1);
            });
        }
    }

    var hud = '<span ' + (fuel < 5 ? 'class="low"' : '') + '>Fuel: <span>' + (Math.floor(fuel * 10) / 10) + 's</span></span><span ' + (flagCount < 2 ? 'class="close"' : '') + '>Flags left: <span>' + flagCount + '</span></span><span>Level: <span>' + levelNo + '</span></span><span class="button" id="reset">Reset</span>';

    if (hud !== lhud)
    {
        $('#hud').html(hud);
        $('#reset').click(function(){
            initLevel();
        });
        lhud = hud;
    }

    // Loop background sound
    //if (!SFX.background.isPlaying)
    //    SFX.background.play();
};
;(function () {

    var qs_player = /[\?&]player=([\w\-]+)/i.exec(window.location.search);
    var player = qs_player && qs_player[1];

    console.log('player:', player);

    var dirUp = document.querySelector('.direction--up');
    var dirDown = document.querySelector('.direction--down');
    var dirLeft = document.querySelector('.direction--left');
    var dirRight = document.querySelector('.direction--right');

    var state = {
        move: {x: 0, y: 0},
        aim: {x: 0, y: 0},
        player: player
    };

    var sendData = function (data) {
        // noop until we are connected to the WebSocket server.
        console.warn('Server offline; data ignored:', JSON.stringify(data));
    };

    // TODO: Do not hardcode WS URL.

    var sock = new SockJS('http://localhost:30043/socket');

    sock.sendMessage = function(name, data) {
        sock.send(JSON.stringify({
            n: name,
            d: data
        }));
    };

    sock.onopen = function() {
        console.log('WS open');

        sendData = function (name, data) {
            console.log('Data sent:', name, JSON.stringify(data));
            sock.sendMessage(name, data);
        };
    };

    sock.onconnect = function() {
        console.log('WS connected');
    };

    sock.onmessage = function(e) {
        console.log('WS message:', e.data);
        if (e.data.n === 'init') {
            sock.sendMessage('register.gamepad', player);
        }
    };

    sock.onclose = function() {
        console.log('WS close');
    };

    window.addEventListener('beforeunload', function () {
        console.log('Closed connection to WS server');
        sock.close();
    });

    function clerp(c, i) {
        return [c[0] * i | 0, c[1] * i | 0, c[2] * i | 0];
    }

    function Stick(el) {
        var ctx = el.getContext('2d');

        el.width = el.offsetWidth;
        el.height = el.offsetHeight;
        var n = 6;
        var dx = 0;
        var dy = 0;
        var cx = el.width / 2;
        var cy = el.height / 2;
        var size = Math.min(el.width, el.height) * .4;
        ctx.strokeStyle = '#0f0';
        ctx.translate(cx, cy);

        var color = [255, 160, 0];

        var finger;
        var self = this;

        window.addEventListener('resize', function (e) {
            el.width = el.offsetWidth;
            el.height = el.offsetHeight;
            cx = el.width / 2;
            cy = el.height / 2;
            s = Math.min(el.width, el.height) * 0.4;
            ctx.translate(cx, cy);
            draw();
        });

        el.addEventListener('touchstart', function(e) {
            finger = e.changedTouches[0].identifier;
        });
        el.addEventListener('touchmove', handle);
        el.addEventListener('touchleave', zero);
        el.addEventListener('touchend', zero);

        var active = false;

        function zero(e) {
            active = false;
            finger = null;
            terp();
        }

        function handle(e) {
            e.preventDefault();
            var x, y;
            if (e.targetTouches) {
                for (var i = 0; i < e.targetTouches.length; i++) {
                    if (e.targetTouches[i].identifier === finger) {
                        x = (e.targetTouches[0].pageX - el.offsetLeft);
                        y = e.targetTouches[0].pageY;
                        dx = cx - x;
                        dy = cy - y;
                        active = true;
                        draw();
                        break;
                    }
                }
            }
        }

        function terp() {
            if (!active) {
                if (dx * dx > 10 || dy * dy > 10 ) {
                    dx = (dx * .7) | 0;
                    dy = (dy * .7) | 0;
                    setTimeout(terp, 20);
                } else {
                    dx = 0;
                    dy = 0;
                }
                draw();
            }
        }

        function ellipse(cx, cy, rx, ry) {
            for (var i=0; i<=6; i++) {
                var a = i / 3 * 3.14159;
                var x = cx + Math.sin(a) * rx;
                var y = cy + Math.cos(a) * ry;
                if (i) {
                    ctx.lineTo(x, y);
                } else {
                    ctx.moveTo(x, y);
                }
            }
        }


        ctx.lineWidth = 2;

        function draw() {
            var h = Math.sqrt(dy*dy + dx*dx);
            var a = Math.atan2(dy,dx);

            var l = Math.min(h, size);

            ctx.clearRect(-cx, -cy, el.width, el.height);
            for (var i = 0; i <= n; i++) {
                var rad = (1.2-(i/n)) * size;
                var r2 = i / n * l;
                var x = -Math.cos(a) * r2;
                var y = -Math.sin(a) * r2;
                ctx.beginPath();
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(a);
                ctx.scale(Math.cos(Math.asin(l / (size * 1.1))), 1);
                ctx.rotate(-a);
                ellipse(0, 0, rad, rad);
                var c = clerp(color, (i+1)/(n+1));
                ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (i/n/2+.5) + ')';
                ctx.fill();
                ctx.restore();
            }

            var x = dx / size;
            var y = dy / size;

            x = l * Math.cos(a) / size;
            y = l * Math.sin(a) / size;

            if ('onchange' in self) {
                self.onchange(x, y);
            }
        }

        draw();
    }

    var moveStick = new Stick(document.querySelector('#pad1'));
    var aimStick = new Stick(document.querySelector('#pad2'));

    moveStick.onchange = function (x, y) {
        if (state.move.x !== x || state.move.y !== y) {
            state.move.x = x;
            state.move.y = y;
            sendUpdate();
        }
    };
    aimStick.onchange = function (x, y) {
        if (state.aim.x !== x || state.aim.y !== y) {
           state.aim.x = x;
           state.aim.y = y;
           sendUpdate();
       }
    };

    function sendUpdate() {
        sendData('gamepad', state);
    }

})();

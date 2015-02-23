;(function () {

    var qs_player = /[\?&]player=([\w\-]+)/i.exec(window.location.search);
    var player = qs_player && qs_player[1];

    console.log('player:', player);

    var dirUp = document.querySelector('.direction--up');
    var dirDown = document.querySelector('.direction--down');
    var dirLeft = document.querySelector('.direction--left');
    var dirRight = document.querySelector('.direction--right');

    var lastPos;

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

    var ctx = t.getContext('2d');
    t.width = window.innerWidth;
    t.height = window.innerHeight;
    var cx = t.width / 2;
    var cy = t.height / 2;
    var size = Math.min(t.width, t.height) * 0.4;
    ctx.strokeStyle = '#0f0';

    var color = [0, 128, 255];

    t.addEventListener('touchmove', handle);
    t.addEventListener('mousemove', handle);
    t.addEventListener('mouseout', zero);
    t.addEventListener('touchleave', zero);
    t.addEventListener('touchend', zero);

    var dx = 0;
    var dy = 0;
    var active = false;

    draw();

    function zero() {
        active = false;
        draw();
    }

    function handle(e) {
        e.preventDefault();
        active = true;
        dx = cx - e.pageX;
        dy = cy - e.pageY;
        draw();
    }

    function terp() {
        if (active) {
            return;
        }
        if (dx * dx > 10 || dy * dy > 10) {
            dx = (dx * 0.5) | 0;
            dy = (dy * 0.5) | 0;
        } else {
            dx = 0;
            dy = 0;
        }
        draw();
    }

    setInterval(terp, 20);

    function ellipse(cx, cy, rx, ry) {
        for (var i = 0; i <= 6; i++) {
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

    function clerp(c, i) {
        return [
            c[0] * i | 0,
            c[1] * i | 0,
            c[2] * i | 0
        ];
    }

    ctx.translate(cx, cy);
    ctx.lineWidth = 2;
    var n = 6;

    function draw() {
        var h = Math.sqrt(dy * dy + dx * dx);
        var a = Math.atan2(dy, dx);

        var l = Math.min(h, size);

        ctx.clearRect(-cx, -cy, t.width, t.height);
        for (var i = 0; i <= n; i++) {
            var rad = (1.2 - (i / n)) * size;
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
            var c = clerp(color, (i + 1) / (n + 1));
            ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (i / n / 2 + 0.5) + ')';
            ctx.fill();
            ctx.restore();
        }

        var x = dx / size;
        var y = dy / size;

        x = l * Math.cos(a) / size;
        y = l * Math.sin(a) / size;

        sendData('gamepad', {aim: {x: x, y: y}, player: player});
    }

})();

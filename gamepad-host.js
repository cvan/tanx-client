;(function () {

    var qs_player = /[\?&]player=([\w\-]+)/i.exec(window.location.search);
    var player = qs_player && qs_player[1];

    console.log('player:', player);

    var dirUp = document.querySelector('.direction--up');
    var dirDown = document.querySelector('.direction--down');
    var dirLeft = document.querySelector('.direction--left');
    var dirRight = document.querySelector('.direction--right');

    // TODO: Do not harcode WS URL.

    var sock = new SockJS('http://localhost:30043/socket');
    sock.onopen = function () {
        console.log('WS open');
    };
    sock.onmessage = function(e) {
        console.log('WS message:', e.data);
    };
    sock.onclose = function() {
        console.log('WS close');
    };

    window.addEventListener('beforeunload', function () {
        console.log('Closed connection to WS server');
        sock.close();
    });

    var sendGamepadMsg = function (data) {
        sock.send(JSON.stringify({n: 'gamepad', d: data}));
    };

    var ctx = t.getContext('2d');
    t.width = window.innerWidth;
    t.height = window.innerHeight;
    var cx = t.width/2;
    var cy = t.height/2;
    var s = Math.min(t.width, t.height) * 0.4;
    ctx.strokeStyle = '#0f0';

    t.addEventListener('touchmove', handle);
    t.addEventListener('mousemove', handle);

    function handle(e) {
        e.preventDefault();
        dx = cx - e.pageX;
        dy = cy - e.pageY;

        h = Math.sqrt(dy * dy + dx * dx);
        a = Math.atan2(dy,dx);
        draw();
    }

    setInterval(draw, 50);

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

    ctx.translate(cx, cy);
    ctx.lineWidth = 2;
    var n = 6;

    function draw() {
        var l = Math.min(h, s);

        ctx.clearRect(-cx, -cy, t.width, t.height);
        for (var i = 0; i <= n; i++) {
            var rad = (1.2 - (i / n)) * s;
            var r2 = i / n * l;
            var x = -Math.cos(a) * r2;
            var y = -Math.sin(a) * r2;
            ctx.beginPath();
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(a);
            ctx.scale(Math.cos(Math.asin(l / (s * 1.1))), 1);
            ctx.rotate(-a);
            ellipse(0, 0, rad, rad);
            ctx.fillStyle = 'rgb(0,' + (i / n * 255|0) + ',0)';
            ctx.fill();
            ctx.restore();

            sendGamepadMsg({
                player: player,
                type: 'direction',
                x: x,
                y: y
            });
        }
    }

})();

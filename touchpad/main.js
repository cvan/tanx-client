;(function () {

    if ('mozLockOrientation' in window.screen) {
        if (window.screen.mozLockOrientation('landscape')) {
            console.log('Locked orientation (moz): landscape-primary');
        } else {
            console.log('`screen.mozLockOrientation` could not work');
        }
    } else if ('lockOrientation' in window.screen) {
        if (window.screen.lockOrientation('landscape')) {
            console.log('Locked orientation: landscape-primary');
        } else {
            console.log('`screen.mozLockOrientation` could not work');
        }
    } else {
        console.log('No `screen.lockOrientation` found');
    }

    var vibrate = function (duration) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    };

    var qs_wsport = /[\?&]wsport=([\w\-]+)/i.exec(window.location.search);
    var socketPort = qs_wsport ? qs_wsport[1] : 80;

    var socketUrl = (window.location.protocol + '//' +
                     window.location.hostname + ':' + socketPort + '/socket');

    var qs_player = /[\?&]player=([\w\-]+)/i.exec(window.location.search);
    var player = qs_player && qs_player[1];

    var qs_throttle = /[\?&]throttle=([\w\-]+)/i.exec(window.location.search);
    var throttleNum = qs_throttle && qs_throttle[1];

    var dirUp = document.querySelector('.direction--up');
    var dirDown = document.querySelector('.direction--down');
    var dirLeft = document.querySelector('.direction--left');
    var dirRight = document.querySelector('.direction--right');
    var color = [255, 255, 255];

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

    var sock = new SockJS(socketUrl);

    function setupSocket() {
        sock.sendMessage = function(name, data) {
            sock.send(JSON.stringify({
                n: name,
                d: data
            }));
        };

        sock.onopen = function() {
            debug('WS open');

            sendData = function (name, data) {
                sock.sendMessage(name, data);
            };
        };

        sock.onconnect = function() {
            debug('WS connected');
        };

        sock.onmessage = function (e) {
            var data = JSON.parse(e.data);
            var handler;
            if (data.n === 'gamepad') {
                handler = listeners['gamepad.' + data.d.type];
                if (handler) {
                    handler(data.d.data);
                }
            } else {
                handler = listeners[data.n];
                if (handler) {
                    handler(data.d);
                }
            }
        };

        sock.onclose = function() {
            debug('WS close');
            setTimeout(function () {
                sock = new SockJS(socketUrl);
                setupSocket();
            }, 1000);
        };
    }

    setupSocket();

    var listeners = {};
    var on = function (type, handler) {
        listeners[type] = handler;
    };

    on('init', function (data) {
        sock.sendMessage('register.gamepad', player);
    });

    on('gamepad.found', gamepadFound);
    on('gamepad.color', gamepadColor);
    on('gamepad.hit', gamepadHit);
    on('gamepad.dead', gamepadDead);

    function gamepadFound() {
        debug('gamepad.found');
        setupPeerConnection(function (p) {
            peer = p;
            debug('WebRTC connected');
            peer.on('data', function (data) {
                var handler = listeners[data.type];
                if (handler) {
                    handler(data.data);
                }
            });
        });
    }

    function gamepadColor(data) {
        color = data.color;
        moveStick.redraw();
        aimStick.redraw();
    }

    function gamepadHit(data) {
        vibrate(10 * (50 - (data.hp * 5)));
    }

    function gamepadDead(data) {
        vibrate(1000);
    }

    function debug(msg) {
        // var el = document.getElementById('debug');
        // el.innerHTML = msg + '\n' + el.innerHTML;
    }

    window.onerror = function (x, y, z) {
        debug(x + ',' + y + ',' + z);
    };

    window.addEventListener('beforeunload', function () {
        sock.close();
        if (peer) {
            peer.destroy();
        }
    });

    function clerp(c, i) {
        return [c[0] * i | 0,
                c[1] * i | 0,
                c[2] * i | 0];
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
        var size = Math.min(el.width, el.height) * 0.4;
        ctx.strokeStyle = '#0f0';
        ctx.translate(cx, cy);

        var finger;
        var self = this;

        window.addEventListener('resize', function (e) {
            el.width = el.offsetWidth;
            el.height = el.offsetHeight;
            cx = el.width / 2;
            cy = el.height / 2;
            size = Math.min(el.width, el.height) * 0.4;
            ctx.translate(cx, cy);
            draw();
        });

        var fullscreenDone = false;

        el.addEventListener('touchstart', function(e) {
            if (!fullscreenDone) {
                setupScreen();
            }

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
                        x = e.targetTouches[0].pageX - el.offsetLeft;
                        y = e.targetTouches[0].pageY;
                        dx = cx - x;
                        dy = cy - y;
                        active = true;
                        draw(true);
                        break;
                    }
                }
            }
        }

        function terp() {
            if (active) {
                return;
            }
            if (dx * dx > 10 || dy * dy > 10) {
                dx = (dx * 0.7) | 0;
                dy = (dy * 0.7) | 0;
                setTimeout(terp, 20);
            } else {
                dx = 0;
                dy = 0;
            }
            draw();
        }

        function ellipse(cx, cy, rx, ry) {
            var n = 6;
            for (var i = 0; i <= n; i++) {
                var a = i / n * (3.14159 * 2);
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

        function draw(throttle) {
            var h = Math.sqrt(dy * dy + dx * dx);
            var a = Math.atan2(dy ,dx);

            var x, y;

            var l = Math.min(h, size);

            ctx.clearRect(-cx, -cy, el.width, el.height);
            for (var i = 0; i <= n; i++) {
                var rad = (1.2 - i / n) * size;
                var r2 = i / n * l;
                x = -Math.cos(a) * r2;
                y = -Math.sin(a) * r2;
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

            x = l * Math.cos(a) / size;
            y = l * Math.sin(a) / size;

            if ('onchange' in self) {
                self.onchange(x, y, throttle);
            }
        }

        this.redraw = draw;

        draw();
    }

    var moveStick = new Stick(document.querySelector('#pad1'));
    var aimStick = new Stick(document.querySelector('#pad2'));

    moveStick.onchange = function (x, y, throttle) {
        if (state.move.x !== x || state.move.y !== y) {
            state.move.x = x;
            state.move.y = y;
            sendUpdate(throttle);
        }
    };
    aimStick.onchange = function (x, y, throttle) {
        if (state.aim.x !== x || state.aim.y !== y) {
           state.aim.x = x;
           state.aim.y = y;
           sendUpdate(throttle);
       }
    };

    var peer;
    var lastSentUpdate = 0;
    var THROTTLE_RATE = parseInt(throttleNum, 10) || 20;
    var timeout;
    var n = 0;

    function throttledSendUpdate() {
        if (Date.now() - lastSentUpdate > THROTTLE_RATE) {
            debug(n++);
            sendUpdate();
            lastSentUpdate = Date.now();
        }
    }

    function sendUpdate(throttle) {
        if (throttle) {
            throttledSendUpdate();
            return;
        }

        if (peer) {
            peer.send({
                type: 'gamepad',
                data: state
            });
        } else {
            sendData('gamepad', state);
        }
    }

    function launchIntoFullscreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }

    function setupScreen() {
        launchIntoFullscreen(document.body);
        fullscreenDone = true;
    }

    function setupPeerConnection(cb) {

        var peer;

        var pc = window.RTCPeerConnection ||
                 window.mozRTCPeerConnection ||
                 window.webkitRTCPeerConnection;

        if (!pc) {
            debug('no pc!');
            return;
        }

        sendData('rtc.peer', {
            player: player
        });

        on('rtc.peer', function (data) {
            data = data || {};

            peer = new SimplePeer({
                initiator: !!data.initiator
            });

            peer.on('error', function (err) {
                console.error('Peer error:', err.stack || err.message || err);
            });

            peer.on('connect', function () {
                if (cb) {
                    cb(peer);
                }
            });

            peer.on('signal', function (data) {
                sendData('rtc.signal', data);
            });

            peer.on('close', function () {
                sendData('rtc.close', {
                    player: player
                });
                peer.destroy();
                peer = null;
            });
        });

        on('rtc.signal', function (data) {
            if (peer) {
                peer.signal(data);
            }
        });

        // todo: don't throw TypeErrors if no rtc.
        on('rtc.close', function () {
            if (peer) {
                peer.destroy();
                peer = null;
            }
        });

    }


})();

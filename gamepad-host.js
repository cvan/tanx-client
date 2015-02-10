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

    function _pd(func) {
        return function (e) {
            e.preventDefault();
            func.apply(this, arguments);
        };
    }

    var axisChoices = ['left', 'right'];
    var dirChoices = ['up', 'down', 'left', 'right'];
    var dirElements = {};

    axisChoices.forEach(function (axis) {
        dirElements[axis] = {};
        dirChoices.forEach(function (dir) {
            dirElements[axis][dir] = document.querySelector(
                '.direction__' + axis + '--' + dir);
            dirElements[axis][dir].addEventListener('click', _pd(function () {
                sendGamepadMsg({
                    player: player,
                    axis: axis,
                    direction: dir
                });
            }));
        });
    });

})();

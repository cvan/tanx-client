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
        sock.send(JSON.stringify({
            n: 'gamepad', d: data
        }));
    };

    dirUp.addEventListener('click', function (e) {
        e.preventDefault();
        sendGamepadMsg({player: player, direction: 'up'});
    });

    dirDown.addEventListener('click', function (e) {
        e.preventDefault();
        sendGamepadMsg({player: player, direction: 'down'});
    });

    dirLeft.addEventListener('click', function (e) {
        e.preventDefault();
        sendGamepadMsg({player: player, direction: 'left'});
    });

    dirRight.addEventListener('click', function (e) {
        e.preventDefault();
        sendGamepadMsg({player: player, direction: 'right'});
    });

})();

pc.script.create('gamepad', function (context) {
    // Get query-string parameters (à la `URLSearchParams`).
    var uri = new pc.URI(window.location.href);
    var query = uri.getQuery();
    var player = query.player;

    // Creates a new Gamepad instance.
    var Gamepad = function (entity) {
        this.entity = entity;
        this.move = {x: 0, y: 0};
        this.aim = {x: 0, y: 0};
        this.active = false;
        this.peer = null;
    };

    Gamepad.prototype = {
        initialize: function () {
            this.client = context.root.getChildren()[0].script.client;
            this.link = context.root.findByName('camera').script.link;
            this.teams = context.root.getChildren()[0].script.teams;

            var self = this;

            function updateControls(data) {
                self.active = true;
                if (self.link && self.link.mouse) {
                    self.link.mouse.move = false;
                }
                self.move = data.move;
                self.aim = data.aim;
            }

            this.client.socket.on('tank.new', function (data) {
                this.color = this.teams.colors[data.team];
                this.client.socket.send('gamepad.color', {
                    player: player,
                    color: this.color
                });
            }.bind(this));

            this.client.socket.on('gamepad', function (data) {
                if (player === data.player) {
                    console.log('Received WebSocket gamepad message');
                    updateControls(data);
                }
            }.bind(this));

            this.client.socket.on('connect', function () {
                this.setupPeerConnection(function (peer) {
                    peer.send({
                        type: 'gamepad.color',
                        data: self.color
                    });
                    peer.on('data', function (data) {
                        console.log('Received WebRTC gamepad message');
                        if (data.type === 'gamepad') {
                            updateControls(data.data);
                        }
                    });
                });
            }.bind(this));
        },

        setupPeerConnection: function (cb) {
            console.log('setting up peer connection');
            var peer;
            var socket = this.client.socket;

            socket.send('rtc.peer', {
                player: player
            });

            socket.on('rtc.peer', function (data) {
                console.log('peer found');

                data = data || {};

                peer = new SimplePeer({
                    initiator: !!data.initiator,
                });
                this.peer = peer;

                peer.on('error', function (err) {
                    console.error('peer error', err.stack || err.message || err);
                });

                peer.on('connect', function () {
                    console.log('peer connected!');
                    cb(peer);
                });

                peer.on('signal', function (data) {
                    console.log('signal received', data);
                    socket.send('rtc.signal', data);
                });

                peer.on('close', function () {
                    socket.send('rtc.close', {
                        player: player
                    });
                    peer = null;
                });

            }.bind(this));

            socket.on('rtc.signal', function (data) {
                peer.signal(data);
            });
        },

        update: function (dt) {
            if (!this.client.connected || !this.active || !this.link.link) {
                return;
            }

            // Moving.
            var angle = Math.atan2(-this.move.y, this.move.x);
            angle -= Math.PI / 4;

            var length = Math.sqrt(this.move.x * this.move.x + this.move.y * this.move.y);
            var x = length * Math.sin(angle);
            var y = length * Math.cos(angle);
            this.client.socket.send('move', [x, y]);

            // Aiming.
            this.link.mPos = [
                this.aim.x / 2 * -(context.graphicsDevice.width / 2),
                this.aim.y / 2 * -(context.graphicsDevice.height / 2)
            ];

            angle = -Math.atan2(this.aim.y, this.aim.x) * (180 / 3.14159);
            angle = ((angle - 45 + 180 + 360) % 360) - 180;

            // Thresholding.
            length = Math.sqrt(this.aim.x * this.aim.x + this.aim.y * this.aim.y);
            if (length > 0.25) {
                this.link.angle = angle;
                this.link.link.targeting(angle);
                this.client.shoot(true);
            } else {
                this.client.shoot(false);
            }
        }
    };

    return Gamepad;
});

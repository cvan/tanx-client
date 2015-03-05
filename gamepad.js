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
        this.lastMove = [0, 0];
        this.active = false;
        this.peer = null;
    };

    Gamepad.prototype = {
        initialize: function () {
            if (!player) {
                return;
            }

            this.client = context.root.getChildren()[0].script.client;
            this.link = context.root.findByName('camera').script.link;
            this.tanks = context.root.findByName('tanks');
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


            this.client.socket.on('connect', function () {
                this.client.socket.send('register.gamepad', player);
            }.bind(this));

            // If the gamepad is connected after game is already started.
            this.client.socket.on('gamepad.found', function (data) {
                self.setupPeerConnection(function (peer) {
                    self.send('color', {
                        color: self.color
                    });
                    peer.on('data', function (data) {
                        if (data.type === 'gamepad') {
                            updateControls(data.data);
                        }
                    });
                });

                self.send('color', {
                    color: self.color
                });
            });

            this.client.socket.on('tank.team', function (data) {
                this.color = this.teams.colors[data];

                self.send('color', {
                    color: self.color
                });
            }.bind(this));

            var lastHp = 0;
            var dead = false;
            this.client.socket.on('update', function (data) {
                if (data.tanks) {
                    data.tanks.forEach(function (tank) {
                        var localTank = self.tanks.findByName('tank_' + tank.id);
                        if (! localTank) return;
                        localTank = localTank.script.tank;

                        if (localTank.own) {
                            if (lastHp > tank.hp) {
                                self.send('hit', {
                                    hp: tank.hp
                                });
                            }
                            lastHp = tank.hp;

                            if (!dead && localTank.dead) {
                                self.send('dead');
                            }
                            dead = localTank.dead;
                        }
                    });
                }
            });

            this.client.socket.on('gamepad', function (data) {
                if (player === data.player) {
                    updateControls(data);
                }
            }.bind(this));
        },

        send: function (type, data) {
            var msg = {
                type: type,
                data: data
            };
            if (this.peer) {
                this.peer.send(msg);
            } else {
                this.client.socket.send('gamepad', msg);
            }
        },

        setupPeerConnection: function (cb) {
            var peer;
            var socket = this.client.socket;

            socket.off('rtc.peer');
            socket.off('rtc.close');
            socket.off('rtc.signal');

            socket.send('rtc.peer', {
                player: player
            });

            socket.on('rtc.peer', function (data) {
                data = data || {};

                if (this.peer) {
                    this.peer.destroy();
                    this.peer = null;
                }

                peer = new SimplePeer({
                    initiator: !!data.initiator,
                });

                peer.on('error', function (err) {
                    console.error('peer error', err.stack || err.message || err);
                });

                peer.on('connect', function () {
                    this.peer = peer;
                    cb(peer);
                });

                peer.on('signal', function (data) {
                    socket.send('rtc.signal', data);
                });

                peer.on('close', function () {
                    socket.send('rtc.close', {
                        player: player
                    });
                    peer.destroy();
                    this.peer = peer = null;
                });

            }.bind(this));

            socket.on('rtc.close', function () {
                peer.destroy();
                peer = null;
            });

            socket.on('rtc.signal', function (data) {
                peer.signal(data);
            });
        },

        update: function (dt) {
            if (!player || !this.client.connected || !this.active || !this.link.link) {
                return;
            }

            // Moving.
            var angle = Math.atan2(-this.move.y, this.move.x);
            angle -= Math.PI / 4;

            var length = Math.sqrt(this.move.x * this.move.x + this.move.y * this.move.y);
            var x = length * Math.sin(angle);
            var y = length * Math.cos(angle);
            if (x !== this.lastMove[0] || y !== this.lastMove[1]) {
                this.client.socket.send('move', [x, y]);
                this.lastMove = [x, y];
            }

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

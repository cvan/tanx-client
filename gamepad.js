pc.script.create('gamepad', function (context) {
    var qs_player = /[\?&]player=([\w\-]+)/i.exec(window.location.search);
    player = qs_player && qs_player[1];

    // Creates a new Gamepad instance.
    var Gamepad = function (entity) {
        this.entity = entity;
        this.move = {x: 0, y: 0};
        this.aim = {x: 0, y: 0};
        this.active = false;
    };

    Gamepad.prototype = {
        initialize: function () {
            this.client = context.root.getChildren()[0].script.client;
            this.link = context.root.findByName('camera').script.link;
            this.teams = context.root.getChildren()[0].script.teams;

            this.client.socket.on('tank.new', function (data) {
                this.client.socket.send('gamepad.color', {
                    player: player,
                    color: this.teams.colors[data.team]
                });
            }.bind(this));

            this.client.socket.on('gamepad', function (data) {
                if (player === data.player) {
                    this.active = true;
                    this.link.mouse.move = false;

                    this.move = data.move;
                    this.aim = data.aim;
                }
            }.bind(this));
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

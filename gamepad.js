pc.script.create('gamepad', function (context) {
    var qs_player = /[\?&]player=([\w\-]+)/i.exec(window.location.search);
    player = qs_player && qs_player[1];

    // Creates a new Gamepad instance.
    var Gamepad = function (entity) {
        this.entity = entity;
        this.aim = {x: 0, y: 0};
    };

    Gamepad.prototype = {
        initialize: function () {
            this.client = context.root.getChildren()[0].script.client;
            this.link = context.root.findByName('camera').script.link;

            this.client.socket.on('gamepad', function(data) {
                if (player === data.player) {
                    this.aim = data.aim;
                }
            }.bind(this));
        },

        update: function (dt) {
            if (!this.client.connected) {
                return;
            }

            if (this.link.link) {
                this.link.mPos = [
                    this.aim.x / 2 * -(context.graphicsDevice.width / 2),
                    this.aim.y / 2 * -(context.graphicsDevice.height / 2)
                ];

                var angle = -Math.atan2(this.aim.y, this.aim.x) * (180 / 3.14159);
                angle = ((angle - 45 + 180 + 360) % 360) - 180;

                this.link.angle = angle;
                this.link.link.targeting(angle);
                this.client.shoot(true);
            }

        }
    };

    return Gamepad;
});

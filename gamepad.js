pc.script.create('gamepad', function (context) {
    var qs_player = /[\?&]player=([\w\-]+)/i.exec(window.location.search);
    player = qs_player && qs_player[1];

    // Creates a new Gamepad instance.
    var Gamepad = function (entity) {
        this.entity = entity;
        this.angle = 0;
    };

    Gamepad.prototype = {
        initialize: function () {
            this.client = context.root.getChildren()[0].script.client;
            this.link = context.root.findByName('camera').script.link;

            this.client.socket.on('gamepad', function(data) {
                if (player === data.player) {
                    this.angle = data.angle;
                }
            }.bind(this));
        },

        update: function (dt) {
            if (!this.client.connected) {
                return;
            }

            if (this.link.link) {
                this.link.mPos = [
                    100 * Math.sin(this.angle * 3.14159 / 180),
                    100 * Math.cos(this.angle * 3.14159 / 180)
                ];

                this.link.angle = this.angle;
                this.link.link.targeting(this.link.angle);
                this.client.shoot(true);
            }

        }
    };

    return Gamepad;
});

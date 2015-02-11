pc.script.create('pc_net.ws', function (context) {
    // Creates a new Pc_net.ws instance
    var Pc_net.ws = function (entity) {
        this.entity = entity;
    };

    Pc_net.ws.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
        },

        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
        }
    };

    return Pc_net.ws;
});
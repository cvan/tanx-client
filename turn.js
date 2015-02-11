pc.script.create('turn', function (context) {
    // Creates a new Turn instance
    var Turn = function (entity) {
        this.entity = entity;
    };

    Turn.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
        },

        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
            this.entity.rotate(0, 15 * dt, 0);
        }
    };

    return Turn;
});
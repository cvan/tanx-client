pc.script.create('ui_gateway', function (app) {
    var Ui_gateway = function (entity) {
        this.entity = entity;
    };

    Ui_gateway.prototype = {
        initialize: function () {
            this.overlay = app.root.getChildren()[0].script.overlay;
        },

        update: function (dt) {
            // this.overlay.cinematic(true);
            // this.overlay.overlay(.2);
        }
    };

    return Ui_gateway;
});
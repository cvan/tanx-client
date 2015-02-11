pc.script.create('level', function (context) {
    var Level = function (entity) {
        this.entity = entity;
    };

    Level.prototype = {
        initialize: function () {
            this.block = context.root.findByName('block');
            this.block.enabled = false;
            
            for(var x = 0; x < 17; x++) {
                for (var y = 0; y < 17; y++) {
                    var block = this.block.clone();
                    block.setPosition((x - 8) * 4, -2 + Math.round(Math.random()) * .1, (y - 8) * 4);
                    block.enabled = true;
                    this.entity.addChild(block);
                }
            }
        }
    };

    return Level;
});
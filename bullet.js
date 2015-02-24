var tmpVec = new pc.Vec3();

pc.script.create('bullet', function (context) {
    var Bullet = function (entity) {
        this.entity = entity;
        this.speed = 1;
    };

    Bullet.prototype = {
        initialize: function () {
            this.fires = context.root.getChildren()[0].script.fires;
            // this.entity.audiosource.pitch = Math.random() * 0.2 + 0.7;
            this.shadow = this.entity.findByName('shadow');
            
            var self = this;
            this.entity.on('culled', function(state) {
                self.hidden(state);
            });
        },

        update: function (dt) {
            var pos = this.entity.getPosition();
            tmpVec.copy(this.entity.targetPosition).sub(pos).normalize().scale(this.entity.speed * dt);
            this.entity.setPosition(tmpVec.add(pos));
            
            pos = this.entity.getPosition();
            
            if (tmpVec.copy(this.entity.targetPosition).sub(pos).length() < this.entity.speed * dt * 1.5 ||
                pos.x < 0 ||
                pos.z < 0 ||
                pos.x > 48 ||
                pos.z > 48) {
                    
                if (! this._hidden) {
                    var i = Math.floor(Math.random() * 2 + 1);
                    while(i--) {
                        context.root.getChildren()[0].script.fires.new({
                            x: pos.x + (Math.random() - 0.5) * 2,
                            z: pos.z + (Math.random() - 0.5) * 2,
                            size: Math.random() * 1 + 1,
                            life: Math.floor(Math.random() * 50 + 200)
                        });
                    }
                }
                
                this.entity.fire('finish');
                this.entity.enabled = false;
            }
        },
        
        hidden: function(state) {
            if (this._hidden === state)
                return;
                
            this._hidden = state;
            
            this.shadow.enabled = ! this._hidden;
            this.entity.model.enabled = ! this._hidden;
        }
    };

    return Bullet;
});
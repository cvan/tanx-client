var tmpVec = new pc.Vec3();

pc.script.create('link', function (context) {
    var Link = function (entity) {
        this.entity = entity;
        this.entity.link = this.link.bind(this);
        this.link = null;
        this.vec = new pc.Vec2();
        this.angle = 0;
        this.lastAngle = 0;
        this.lastSend = 0;
        this.mPos = [ 0, 0 ];
    };

    Link.prototype = {
        initialize: function () {
            context.mouse.on(pc.input.EVENT_MOUSEMOVE, this.onMouseMove, this);
            this.client = context.root.getChildren()[0].script.client;
        },

        update: function (dt) {
            if (this.link) {
                var target = this.link;
                
                // choose focus target
                if (this.link.script.tank.dead) {
                    if (this.link.script.tank.killer && ! this.link.script.tank.killer.script.tank.dead) {
                        // focus on killer
                        target = this.link.script.tank.killer;
                    } else {
                        target = null;
                    }
                }
                
                if (target) {
                    // rotate vector
                    var rot = this.mPos.slice(0);
                    var t =  rot[0] * Math.sin(Math.PI * 0.75) - rot[1] * Math.cos(Math.PI * 0.75);
                    rot[1] = rot[1] * Math.sin(Math.PI * 0.75) + rot[0] * Math.cos(Math.PI * 0.75);
                    rot[0] = t;
                    
                    tmpVec.set(
                        target.getPosition().x + 9 + (rot[0] / (context.graphicsDevice.width / 2) * 4),
                        14,
                        target.getPosition().z + 9 + (rot[1] / (context.graphicsDevice.height / 2) * 4)
                    );
                    this.entity.setPosition(tmpVec.lerp(this.entity.getPosition(), tmpVec, 0.1));
                }
            }
            
            if (Date.now() - this.lastSend > 100 && this.angle !== this.lastAngle) {
                this.lastSend = Date.now();
                this.lastAngle = this.angle;
                
                this.client.socket.send('target', this.angle);
            }
        },
        
        onMouseMove: function(evt) {
            if (this.link) {
                // camera offset
                this.mPos[0] = evt.x - context.graphicsDevice.width / 2;
                this.mPos[1] = evt.y - context.graphicsDevice.height / 2;
                
                // targeting
                if (! this.link.script.tank.dead) {
                    var self = this;
                    var from = this.entity.getPosition();
                    var to = this.entity.camera.screenToWorld(evt.x, evt.y, this.entity.camera.farClip);
    
                    // raycast
                    context.systems.rigidbody.raycastFirst(from, to, function(result) {
                        // relative pont
                        result.point.sub(self.link.getPosition()).normalize();
                        // angle
                        self.angle = Math.floor(Math.atan2(result.point.x, result.point.z) / (Math.PI / 180));
                        // target
                        self.link.targeting(self.angle);
                    });
                }
            }
        },
        
        link: function(tank) {
            this.link = tank;
        }
    };

    return Link;
});
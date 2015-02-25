pc.script.create('client', function (context) {

    var Client = function (entity) {
        this.entity = entity;
        this.id = null;
        this.movement = [ 0, 0 ];
        context.keyboard = new pc.input.Keyboard(document.body);
        
        document.body.style.cursor = 'none';
    };

    Client.prototype = {
        initialize: function () {
            this.tanks = context.root.getChildren()[0].script.tanks;
            this.bullets = context.root.getChildren()[0].script.bullets;
            this.pickables = context.root.getChildren()[0].script.pickables;
            this.teams = context.root.getChildren()[0].script.teams;
            this.minimap = context.root.getChildren()[0].script.minimap;
            
            var self = this;

            // Get query-string parameters (à la `URLSearchParams`).
            var uri = new pc.URI(window.location.href);
            var query = uri.getQuery();

            var socketUrl = 'http://tanx.playcanvas.com/socket';
            if ('ws_url' in query) {
                socketUrl = query.ws_url;
            } else if (window.location.hostname === 'localhost') {
                socketUrl = 'http://localhost:30043/socket';
            }

            var socket = this.socket = new Socket({ url: socketUrl });
            
            this.connected = false;
            
            socket.on('open', function() {
                console.log('WS open');
            });

            socket.on('connect', function() {
                console.log('WS connected');

                var qs_player = /[\?&]player=([\w\-]+)/i.exec(window.location.search);
                var player = qs_player && qs_player[1];
                console.log('player:', player);

                socket.send('register.game', player);
            });

            socket.on('error', function(err) {
                console.log(err);
            });
            
            socket.on('init', function(data) {
                self.id = data.id;
                self.connected = true;
                
                self.minimap.state(true);
            });
            
            socket.on('tank.new', function(data) {
                self.tanks.new(data);
            });
            
            socket.on('tank.delete', function(data) {
                self.tanks.delete(data);
            });
            
            socket.on('update', function(data) {
                // bullets add
                if (data.bullets) {
                    for(var i = 0; i < data.bullets.length; i++)
                        self.bullets.new(data.bullets[i]);
                }
                
                // bullets delete
                if (data.bulletsDelete) {
                    for(var i = 0; i < data.bulletsDelete.length; i++)
                        self.bullets.delete(data.bulletsDelete[i]);
                }
                
                // pickables add
                if (data.pickable) {
                    for(var i = 0; i < data.pickable.length; i++)
                        self.pickables.new(data.pickable[i]);
                }
                
                // pickable delete
                if (data.pickableDelete) {
                    for(var i = 0; i < data.pickableDelete.length; i++)
                        self.pickables.delete(data.pickableDelete[i]);
                }
                
                // tanks update
                if (data.tanks)
                    self.tanks.updateData(data.tanks);

                // tanks respawn
                if (data.tanksRespawn) {
                    for(var i = 0; i < data.tanksRespawn.length; i++)
                        self.tanks.respawn(data.tanksRespawn[i]);
                }
                
                // teams score
                if (data.teams) {
                    for(var i = 0; i < data.teams.length; i++) {
                        self.teams.teamScore(i, data.teams[i]);
                    }
                }
                
                // winner
                if (data.winner) {
                    self.shoot(false);
                    self.teams.teamWin(data.winner);
                }
            });

            context.mouse.on('mousedown', this.onMouseDown, this);
            context.mouse.on('mouseup', this.onMouseUp, this);
            
            this.mouseState = false;
        },

        update: function (dt) {
            if (! this.connected)
                return;
                
            // collect keyboard input
            var movement = [
                context.keyboard.isPressed(pc.input.KEY_D) - context.keyboard.isPressed(pc.input.KEY_A),
                context.keyboard.isPressed(pc.input.KEY_S) - context.keyboard.isPressed(pc.input.KEY_W)
            ];
            
            movement[0] += context.keyboard.isPressed(pc.input.KEY_RIGHT) - context.keyboard.isPressed(pc.input.KEY_LEFT);
            movement[1] += context.keyboard.isPressed(pc.input.KEY_DOWN) - context.keyboard.isPressed(pc.input.KEY_UP);
            
            // gamepad controls
            // AUTHOR: Potch
            
            // gamepad movement axes
            movement[0] += context.gamepads.getAxis(pc.PAD_1, pc.PAD_L_STICK_X);
            movement[1] += context.gamepads.getAxis(pc.PAD_1, pc.PAD_L_STICK_Y);
            
            // gamepad firing axes
            var gpx = context.gamepads.getAxis(pc.PAD_1, pc.PAD_R_STICK_X);
            var gpy = context.gamepads.getAxis(pc.PAD_1, pc.PAD_R_STICK_Y);
            
            // gamepad shooting
            if (gpx * gpx + gpy * gpy > .25) {
                this.shoot(true);
                this.gpShot = true;
            } else {
                if (this.gpShot) {
                    this.shoot(false);
                    this.gpShot = false;
                }
            }
            
            // rotate vector
            var t =       movement[0] * Math.sin(Math.PI * 0.75) - movement[1] * Math.cos(Math.PI * 0.75);
            movement[1] = movement[1] * Math.sin(Math.PI * 0.75) + movement[0] * Math.cos(Math.PI * 0.75);
            movement[0] = t;
            
            // check if it is changed
            if (movement[0] !== this.movement[0] || movement[1] != this.movement[1]) {
                this.movement = movement;
                this.socket.send('move', this.movement);
            }
        },
        
        onMouseDown: function() {
            this.shoot(true);
        },
        
        onMouseUp: function() {
            this.shoot(false);
        },
        
        shoot: function(state) {
            if (! this.connected)
                return;
                
            if (this.shootingState !== state) {
                this.shootingState = state;
                
                this.socket.send('shoot', this.shootingState);
            }
        }
    };

    return Client;
});
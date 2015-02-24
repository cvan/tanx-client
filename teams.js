pc.script.create('teams', function (context) {
    var Teams = function (entity) {
    };

    Teams.prototype = {
        initialize: function () {
            this.overlay = context.root.getChildren()[0].script.overlay;
            this.minimap = context.root.getChildren()[0].script.minimap;
            
            this.colors = [
                [ 68, 169, 241 ], // blue
                [ 251, 34, 47 ], // red
                [ 123, 198, 75 ], // green
                [ 251, 145, 48 ] // yellow
            ];
            this.names = [
                'blue',
                'red',
                'green',
                'yellow'
            ];
            this.scores = [ 0, 0, 0, 0 ];
            
            var spawns = context.root.findByName('spawns').getChildren();
            for(var i = 0; i < spawns.length; i++) {
                var color = this.colors[this.names.indexOf(spawns[i].name)];
                spawns[i].getChildren()[0].model.material.emissive.set(color[0] / 255, color[1] / 255, color[2] / 255, 1);
                spawns[i].getChildren()[0].model.material.update();
            }
        },
        
        tankAdd: function(tank, team) {
            var color = this.colors[team];
            tank.team = team;
            tank.matBase.emissive.set(color[0] / 255, color[1] / 255, color[2] / 255, 1);
            tank.matBase.update();
            tank.matTracks.emissive.set(color[0] / 255, color[1] / 255, color[2] / 255, 1);
            tank.matTracks.update();
            tank.matGlow.diffuse.set(color[0] / 255, color[1] / 255, color[2] / 255, 1);
            tank.matGlow.update();
        },
        
        teamScore: function(team, score) {
            this.scores[team] = score;
        },
        
        teamWin: function(data) {
            this.overlay.overlay(true);
            this.overlay.cinematic(true);
            this.minimap.state(false);
            // winner message
            this.overlay.winner(this.names[data.team]);
            this.overlay.timer(5);
            
            var self = this;
            setTimeout(function() {
                self.overlay.overlay(false);
                self.overlay.winner(false);
                self.overlay.cinematic(false);
                self.minimap.state(true);
            }, 5000);
        }
    };

    return Teams;
});
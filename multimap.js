pc.script.create('multimap', function (context) {

    var uri = new pc.URI(window.location.href);
    var query = uri.getQuery();
    var multi = !!query.multi;
    var chosen = false;

    var MultiMap = function (entity) {
        this.entity = entity;
    };

    window.addEventListener('message', function (e) {
        if (e.data === 'map.chosen') {
            chosen = true;
        }
    });

    MultiMap.prototype = {
        initialize: function () {
            if (!multi) {
                return;
            }
            this.minimap = context.root.getChildren()[0].script.minimap;
            this.bullets = context.root.findByName('bullets');
            this.tanks = context.root.findByName('tanks');
            this.pickables = context.root.findByName('pickables');
            this.teams = context.root.getChildren()[0].script.teams;

            this.level = this.minimap.level;
            if (window.top !== window) {
                window.top.postMessage({
                    type: 'level',
                    data: this.level
                }, '*');
            }
        },
        render: function () {
            if (!chosen || !multi) {
                return;
            }

            var state = {
                bullets: [],
                tanks: [],
                items: [],
                teams: []
            };

            var bullets = this.bullets.getChildren();
            bullets.forEach(function (b) {
                var pos = b.getPosition();
                if (b.active) {
                    state.bullets.push([pos.x, pos.z, b.oldX, b.oldZ]);
                }
                b.oldX = pos.x;
                b.oldZ = pos.z;
            });

            var pickables = this.pickables.getChildren();
            pickables.forEach(function (p) {
                var pos = p.getPosition();
                state.items.push([pos.x, pos.z, p.type]);
            });

            var tanks = this.tanks.getChildren();
            tanks.forEach(function (t) {
                if (t.script.tank.dead || !t.script.tank.flashState) {
                    return;
                }
                var pos = t.getPosition();
                var clr = t.script.tank.matBase.emissive;
                state.tanks.push([pos.x, pos.z, -Math.atan2(t.forward.x, t.forward.z), '#' + ('00' + Math.floor(clr.r * 255).toString(16)).slice(-2) + ('00' + Math.floor(clr.g * 255).toString(16)).slice(-2) + ('00' + Math.floor(clr.b * 255).toString(16)).slice(-2)]);
            });

            for (var i = 0; i < 4; i++) {
                state.teams.push([this.teams.colors[i], this.teams.scores[i]]);
            }

            // this.bullets.forEach(function (bullet) {
            //     console.log(bullet);
            // });
            window.top.postMessage({
                type: 'state',
                data: state
            }, '*');
        }
    };

    return MultiMap;
});

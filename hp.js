pc.script.create('hp', function (context) {
    var Hp = function (entity) {
        var div = document.createElement('div');
        div.style.id = 'hpBar';
        div.style.position = 'absolute';
        div.style.top = '16px';
        div.style.left = '50%';
        div.style.width = '30%';
        div.style.height = '6px';
        div.style.marginLeft = '-15%';
        div.style.backgroundColor = 'rgba(164, 164, 164, .7)';
        document.body.appendChild(div);
        
        var hp = this.hp = document.createElement('div');
        hp.style.height = '6px';
        hp.style.backgroundColor = '#2ecc71';
        hp.style.width = '100%';
        hp.style.webkitTransition = 'width 200ms';
        hp.style.mozTransition = 'width 200ms';
        hp.style.msTransition = 'width 200ms';
        hp.style.transition = 'width 200ms';
        div.appendChild(hp);
        
        var killer = this.killer = document.createElement('div');
        killer.style.textAlign = 'center';
        killer.style.position = 'absolute';
        killer.style.width = '320px';
        killer.style.bottom = '64px';
        killer.style.left = '50%';
        killer.style.fontSize = '36px';
        killer.style.lineHeight = '42px';
        killer.style.marginLeft = '-160px';
        killer.style.zIndex = 1;
        killer.style.display = 'none';
        killer.style.color = '#2ecc71';
        killer.textContent = 'Killed by hello_world';
        document.body.appendChild(killer);

        this.points = 0;
    };

    Hp.prototype = {
        set: function(hp) {
            if (this.points !== hp) {
                this.points = hp;
                this.hp.style.width = Math.floor((hp / 10) * 100) + '%';
            }
        },
        
        killedBy: function(name) {
            if (name) {
                this.killer.style.display = 'block';
                this.killer.textContent = 'Killed by ' + name;
            } else {
                this.killer.style.display = 'none';
            }
        }
    };

    return Hp;
});
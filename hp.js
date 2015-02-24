pc.script.create('hp', function (context) {
    var Hp = function (entity) {
        var css = [
            "#hpBar {",
            "   position: absolute;",
            "   top: 16px;",
            "   left: 35%;",
            "   width: 30%;",
            "   height: 6px;",
            "   background-color: rgba(164, 164, 164, .7);",
            "}",
            "#hpBar > .bar {",
            "   width: 100%;",
            "   height: 6px;",
            "   background-color: #2ecc71;",
            "   -webkit-transition: 200ms;",
            "   -moz-transition: 200ms;",
            "   -ms-transition: 200ms;",
            "   transition: 200ms;",
            "}",
            "#score {",
            "   position: absolute;",
            "   top: 22px;",
            "   left: calc(50% - 16px);",
            "   width: 32px;",
            "   height: 32px;",
            "   line-height: 32px;",
            "   background-color: rgb(33, 34, 36);",
            "   text-align: center;",
            "   font-size: 24px;",
            "   color: #fff;",
            "}",
        ].join('\n');
        
        var style = document.createElement('style');
        style.innerHTML = css;
        document.querySelector('head').appendChild(style);
        
        
        var div = document.createElement('div');
        div.id = 'hpBar';
        document.body.appendChild(div);
        
        var hp = this.hp = document.createElement('div');
        hp.classList.add('bar');
        div.appendChild(hp);
        
        var score = this.score = document.createElement('div');
        score.id = 'score';
        score.textContent = '0';
        document.body.appendChild(score);
        
        this.points = 0;
    };

    Hp.prototype = {
        set: function(hp) {
            if (this.points !== hp) {
                this.points = hp;
                this.hp.style.width = Math.floor((hp / 10) * 100) + '%';
            }
        },
        
        setScore: function(score) {
            this.score.textContent = score;
        }
    };

    return Hp;
});
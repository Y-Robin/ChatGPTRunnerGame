var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false // Enable debug mode.
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var player;
var ground;
var obstacles;
var cursors;
var gameOver = false;
var restartButton;
var obstaclesTime = 0;
var score = 0;
var highScore = 0;
var scoreText;
var highScoreText;
var infoText;
var gameOverText;
var jumpCount = 0;
var shiftKey;


function preload () {
    // No need to load any images.
}

function create () {

    // Ground
    var groundGraphics = this.add.rectangle(400, 570, 800, 60, 0x228B22);
    ground = this.physics.add.existing(groundGraphics, true);

    // Player
    var playerGraphics = this.add.rectangle(100, 500, 50, 50, 0xFF4500);
    player = this.physics.add.existing(playerGraphics);
    player.body.setCollideWorldBounds(true);
    player.body.setGravityY(300);

    obstacles = this.physics.add.group();

    this.physics.add.collider(player, ground);
    this.physics.add.collider(player, obstacles, hitObstacle, null, this);
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '20px', fill: '#fff', fontFamily: 'Arial' });
    highScoreText = this.add.text(600, 16, 'High Score: 0', { fontSize: '20px', fill: '#fff', fontFamily: 'Arial' });
    infoText = this.add.text(400, 560, 'Tap/SPACE to jump, hold SHIFT for long jump', { fontSize: '18px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5);
    gameOverText = this.add.text(400, 250, '', { fontSize: '32px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5);


    cursors = this.input.keyboard.createCursorKeys();
    shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    var scene = this;
    this.input.on('pointerdown', function () {
        jump.call(scene);
    });
}

function jump() {
    if (jumpCount < 2 && !gameOver) {
        var velocity = shiftKey.isDown ? -700 : -500;
        player.body.setVelocityY(velocity);
        jumpCount++;
    }
}
function update () {

    if (!gameOver) {
        if (Phaser.Math.Between(0, 100) < 1 && obstaclesTime < 0) {
            var heights = [535, 450, 380];
            var y = Phaser.Utils.Array.GetRandom(heights);
            var obstacle = obstacles.create(800, y, 50, 50, 0x8B4513);
            obstacle.body.setAllowGravity(false);
            obstacle.setVelocityX(-200);
            obstaclesTime = 50;
        }else{
            obstaclesTime = obstaclesTime -1;
        }

         score += 1;
         if (score > highScore) {
             highScore = score;
         }
         scoreText.setText('Score: ' + score);
         highScoreText.setText('High Score: ' + highScore);

        obstacles.getChildren().forEach(function(obstacle) {
            if (obstacle.x < -obstacle.width) {
                obstacles.remove(obstacle, true, true);
            }
        });

        if (cursors.space && Phaser.Input.Keyboard.JustDown(cursors.space)) {
            jump.call(this);
        }

        if (player.body.touching.down || player.body.blocked.down) {
            jumpCount = 0;
        }
    }
}

function hitObstacle (player, obstacle) {
    this.physics.pause();
    player.fillColor = 0x0000ff;
    gameOver = true;

    score = 0;
    gameOverText.setText('Game Over');
    restartButton = this.add.text(400, 300, 'Restart', { fontSize: '32px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5);
    restartButton.setInteractive();
    restartButton.setDepth(1);
    restartButton.on('pointerdown', () => {
        gameOver = false;
        gameOverText.setText('');
        this.scene.restart();
    });
}

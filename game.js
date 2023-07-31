var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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


function preload () {
    // No need to load any images.
}

function create () {

    // Ground
    var groundGraphics = this.add.rectangle(400, 570, 800, 60, 0x0000ff);
    ground = this.physics.add.existing(groundGraphics, true);

    // Player
    var playerGraphics = this.add.rectangle(100, 500, 50, 50, 0xff0000);
    player = this.physics.add.existing(playerGraphics);
    player.body.setCollideWorldBounds(true);
    player.body.setGravityY(300);

    obstacles = this.physics.add.group();

    this.physics.add.collider(player, ground);
    this.physics.add.collider(player, obstacles, hitObstacle, null, this);
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '16px', fill: '#fff' });
    highScoreText = this.add.text(600, 16, 'High Score: 0', { fontSize: '16px', fill: '#fff' });


    cursors = this.input.keyboard.createCursorKeys();
}
function update () {

    if (!gameOver) {
        if (Phaser.Math.Between(0, 100) < 1 && obstaclesTime < 0) {
            var obstacle = obstacles.create(800, 535, 50, 50, 0x00ff00);
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

        if (cursors.space.isDown && player.body.touching.down) {
            player.body.setVelocityY(-500);
        }
    }
}

function hitObstacle (player, obstacle) {
    this.physics.pause();
    player.fillColor = 0x0000ff;
    gameOver = true;
    
    score = 0;

    restartButton = this.add.text(400, 300, 'Restart', { fontSize: '32px', fill: '#fff' });
    restartButton.setInteractive();
    restartButton.setDepth(1);
    restartButton.on('pointerdown', () => {
        console.log('Restart button clicked');
        gameOver = false;
        this.scene.restart();
    });
}

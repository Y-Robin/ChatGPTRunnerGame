var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false    // <--- DEBUG ON
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
var coins;
var coinTime = 0;
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

var grass; // NEU: für das mitlaufende Gras

function preload () {
    this.load.image('player1', 'image1.png?v=1.0');
    this.load.image('player2', 'image2.png?v=1.0');
    this.load.image('player3', 'image3.png?v=1.0');
    this.load.image('ground', 'ground.png');
    this.load.image('wall', 'wall.png');   // <-- Hindernis
    this.load.image('coin', 'coin.png');   // <-- Coin
}

function create () {
    // --- MITLAUFENDES GRAS als TileSprite ---
    // 800 breit (Spielfeld), 100 hoch (je nach Grasbereich anpassen)
    grass = this.add.tileSprite(400, 1000, 800, 1800, 'ground').setOrigin(0.5, 1);
	grass.setScale(1, 0.27); 
    // Zeige nur den mittigen Grasbereich aus deiner Textur:
    // 1024/2 = 512, Gras beginnt bei y=512-50, 100px hoch
    //grass.setCrop(0, 300, 1500, 500);
    // Werte ggf. anpassen, falls das Gras bei dir anders sitzt!

    // Unsichtbarer Boden zum Kollidieren
    const groundCollider = this.add.rectangle(400, 570, 800, 60, 0x000000, 0);
    this.physics.add.existing(groundCollider, true);
    ground = groundCollider;

    // Player
    player = this.physics.add.sprite(100, 520, 'player1');
    player.setOrigin(1, 1);
    player.setDisplaySize(80, 80);
    player.body.setSize(800, 900);
    player.body.setOffset(100, 0);
    player.body.setCollideWorldBounds(true);
    player.body.setGravityY(300);

    this.anims.create({
        key: 'run',
        frames: [
            { key: 'player1' },
            { key: 'player2' },
            { key: 'player3' }
        ],
        frameRate: 10,
        repeat: -1
    });
    player.anims.play('run');

    obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
    coins = this.physics.add.group({ allowGravity: false, immovable: true });

    this.physics.add.overlap(player, coins, collectCoin, null, this);
    this.physics.add.collider(player, ground);
    this.physics.add.collider(player, obstacles, hitObstacle, null, this);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '20px', fill: '#fff', fontFamily: 'Arial' });
    highScore = parseInt(localStorage.getItem('highScore')) || 0;
    highScoreText = this.add.text(600, 16, 'High Score: ' + highScore, { fontSize: '20px', fill: '#fff', fontFamily: 'Arial' });
    infoText = this.add.text(400, 560, 'Hold SPACE or Click to jump', { fontSize: '18px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5);
    gameOverText = this.add.text(400, 250, '', { fontSize: '32px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5);

    cursors = this.input.keyboard.createCursorKeys();
    this.input.mouse.disableContextMenu();
    this.input.on('pointerdown', startJump, this);
    this.input.on('pointerup', endJump, this);
    this.input.keyboard.on('keydown-SPACE', startJump, this);
    this.input.keyboard.on('keyup-SPACE', endJump, this);
}

function update () {
    if (!gameOver) {
        // --- GRAS LAUFEN LASSEN ---
        let speed = 2.65;
        grass.tilePositionX += speed;

        // Hindernisse spawnen und als "manuell bewegt" markieren
		if (Phaser.Math.Between(0, 100) < 1 && obstaclesTime < 0) {
			var heights = [535, 485, 435];
			var h = Phaser.Utils.Array.GetRandom(heights);
			// NEU: Bild verwenden!
			var obstacleImg = this.add.image(800, h, 'wall');
			obstacleImg.setOrigin(0.5, 0.5);
			obstacleImg.setDisplaySize(50, 50); // Anpassen wie vorher das Rectangle!
			this.physics.add.existing(obstacleImg); // Falls noch für Collider benötigt
			obstacleImg.body.setAllowGravity(false);
			obstacleImg.body.setImmovable(true);
			obstacleImg.isManualMove = true;
			obstacles.add(obstacleImg);
			obstaclesTime = 50;
		} else {
			obstaclesTime--;
		}

		if (Phaser.Math.Between(0, 100) < 1 && coinTime < 0) {
			var cHeights = [520, 470, 420];
			var ch = Phaser.Utils.Array.GetRandom(cHeights);
			// NEU: Bild verwenden!
			var coinImg = this.add.image(800, ch, 'coin');
			coinImg.setOrigin(0.5, 0.5);
			coinImg.setDisplaySize(30, 30); // Anpassen wie vorher der Kreis!
			this.physics.add.existing(coinImg);
			coinImg.body.setAllowGravity(false);
			coinImg.body.setImmovable(true);
			coinImg.isManualMove = true;
			coins.add(coinImg);
			coinTime = 70;
		} else {
			coinTime--;
		}
        // Score
        score += 1;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
        scoreText.setText('Score: ' + score);
        highScoreText.setText('High Score: ' + highScore);

        // Hindernisse und Coins manuell verschieben (nicht mit Velocity!)
        obstacles.getChildren().forEach(function(obstacle) {
            if (obstacle.isManualMove) {
                obstacle.x -= speed;
                if (obstacle.x < -obstacle.width) {
                    obstacle.destroy();
                }
            }
        });

        coins.getChildren().forEach(function(coin) {
            if (coin.isManualMove) {
                coin.x -= speed;
                if (coin.x < -30) {
                    coin.destroy();
                }
            }
        });

        if (player.body.blocked.down || player.body.touching.down) {
            jumpCount = 0;
        }
    }
}


function startJump () {
    if (jumpCount < 2) {
        player.body.setVelocityY(-700);
        jumpCount++;
    }
}

function endJump () {
    if (player.body.velocity.y < -200) {
        player.body.setVelocityY(-200);
    }
}

function hitObstacle (player, obstacle) {
    this.physics.pause();
    player.setTint(0x0000ff);
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

function collectCoin (player, coin) {
    coin.destroy();
    score += 1000;
}
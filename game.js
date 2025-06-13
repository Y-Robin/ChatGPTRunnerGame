var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
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
var grass;

// Slide-Variablen
var isSliding = false;
var slideTime = 0;
var SLIDE_DURATION = 800; // ms
var slideYOffset = 0; // <-- Für Sprite-Position beim Slide

function preload () {
    this.load.image('player1', 'image1.png?v=1.0');
    this.load.image('player2', 'image2.png?v=1.0');
    this.load.image('player3', 'image3.png?v=1.0');
    this.load.image('ground', 'ground.png');
    this.load.image('wall', 'wall.png');
    this.load.image('coin', 'coin.png');
    this.load.image('slide', 'slide.png'); // Slide-Sprite
}

function create () {
    grass = this.add.tileSprite(400, 1000, 800, 1800, 'ground').setOrigin(0.5, 1);
    grass.setScale(1, 0.27);

    // Unsichtbarer Boden
    const groundCollider = this.add.rectangle(400, 570, 800, 60, 0x000000, 0);
    this.physics.add.existing(groundCollider, true);
    ground = groundCollider;

    // Player
    player = this.physics.add.sprite(100, 520, 'player1');
    player.setOrigin(1, 1);
    player.setDisplaySize(80, 80);
    player.body.setSize(800, 900); // Breite, Höhe
    player.body.setOffset(100, 0); // Offset X, Y
    player.body.setCollideWorldBounds(true);
    player.body.setGravityY(300);

    this.anims.create({
        key: 'run',
        frames: [
            { key: 'player1' },
            { key: 'player2' },
            { key: 'player3' },
            { key: 'player2' }
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
    this.input.keyboard.on('keydown-DOWN', startSlide, this);
}

function update () {
    // Slide-Ende checken
    if (isSliding) {
        slideTime -= this.game.loop.delta;
        if (slideTime <= 0) {
            isSliding = false;

            // Sprite Y wieder runter
            player.y += 0;

            player.setTexture('player1');
            player.setDisplaySize(80, 80);
            player.body.setSize(800, 900);
            player.body.setOffset(100, 0);
            player.anims.play('run');
        }
    }

    if (!gameOver) {
        let speed = 2.65;
        grass.tilePositionX += speed;

        if (Phaser.Math.Between(0, 100) < 1 && obstaclesTime < 0) {
            var heights = [520, 460, 435];
            var h = Phaser.Utils.Array.GetRandom(heights);
            var obstacleImg = this.add.image(800, h, 'wall');
            obstacleImg.setOrigin(0.5, 0.5);
            obstacleImg.setDisplaySize(50, 50);
            this.physics.add.existing(obstacleImg);
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
            var coinImg = this.add.image(800, ch, 'coin');
            coinImg.setOrigin(0.5, 0.5);
            coinImg.setDisplaySize(30, 30);
            this.physics.add.existing(coinImg);
            coinImg.body.setAllowGravity(false);
            coinImg.body.setImmovable(true);
            coinImg.isManualMove = true;
            coins.add(coinImg);
            coinTime = 70;
        } else {
            coinTime--;
        }

        score += 1;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
        scoreText.setText('Score: ' + score);
        highScoreText.setText('High Score: ' + highScore);

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

// Slide-Start
function startSlide () {
    if (!isSliding && (player.body.blocked.down || player.body.touching.down)) {
        isSliding = true;
        slideTime = SLIDE_DURATION;

        // *** Unterschied der Display-Größen ***
        slideYOffset = 80 - 70; // alteHöhe - neueHöhe

        // *** Sprite Y nach oben setzen, damit untere Kante gleich bleibt ***
        player.y -= slideYOffset;

        player.setTexture('slide');
        player.setDisplaySize(80, 50);

        // *** Hitbox fürs Sliden ***
        player.body.setSize(800, 450);        // Breite, Höhe
        player.body.setOffset(100, 450);      // X, Y
        player.anims.stop();
    }
}

function startJump () {
    if (jumpCount < 2) {
        player.body.setVelocityY(-700);
        jumpCount++;
        // Beim Springen Slide ggf. abbrechen
        if (isSliding) {
            isSliding = false;
            // *** Sprite Y wieder runtersetzen ***
            player.y += slideYOffset;
            player.setTexture('player1');
            player.setDisplaySize(80, 80);
            player.body.setSize(800, 900);
            player.body.setOffset(100, 0);
            player.anims.play('run');
        }
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

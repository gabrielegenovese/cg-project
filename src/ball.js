const cosf = Math.cos(Math.PI / 180.0);
const sinf = Math.sin(Math.PI / 180.0);

class Ball {
  constructor(canvas, removeObject) {
    this.canvas = canvas;
    this.position = { x: 0, y: 0, z: 1 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.speed = { x: 0, y: 0, z: 0 };
    this.jumping = 0;

    // The friction value is a value in the range [0,1]. The friction controls the percentage of speed preserved
    // Smaller value results in bigger friction, larger value results in smaller friction
    this.frictionX = 0.7;
    this.frictionY = 0.7;
    this.maxSpeed = 0.5;
    this.maxAcceleration = 0.1;
    // Number of cards gathered and list of objects positions
    this.coinsGathered = 0;
    this.objList = [];

    // Dict to track which key is being pressed
    this.keyPressed = { w: false, a: false, s: false, d: false, space: false, shift: false };
    // Function binded whit the SceneHandler environment to delete the object from the scene
    this.removeObject = removeObject;

    this.initControllBtn();

    this.start_timer = 0;
    this.timer = 0;
    this.win = false;
  }

  setObjList(objList) {
    this.objList = objList;
  }

  getWin() {
    return this.win;
  }

  initControllBtn() {
    var start = "mousedown touchstart";
    var end = "mouseup touchend";
    const checkTimer = () => {
      if (this.start_timer == 0) this.start_timer = Date.now();
    };
    const goForward = function (event) {
      event.preventDefault();
      this.keyPressed.w = true;
    }.bind(this);
    const stopForward = function (event) {
      event.preventDefault();
      checkTimer();
      this.keyPressed.w = false;
    }.bind(this);
    const goBackward = function (event) {
      event.preventDefault();
      this.keyPressed.s = true;
    }.bind(this);
    const stopBackward = function (event) {
      event.preventDefault();
      checkTimer();
      this.keyPressed.s = false;
    }.bind(this);
    const goRight = function (event) {
      event.preventDefault();
      this.keyPressed.d = true;
    }.bind(this);
    const stopRight = function (event) {
      event.preventDefault();
      checkTimer();
      this.keyPressed.d = false;
    }.bind(this);
    const goLeft = function (event) {
      event.preventDefault();
      this.keyPressed.a = true;
    }.bind(this);
    const stopLeft = function (event) {
      event.preventDefault();
      checkTimer();
      this.keyPressed.a = false;
    }.bind(this);
    const goJump = function (event) {
      event.preventDefault();
      this.keyPressed.space = true;
    }.bind(this);
    const stopJump = function (event) {
      event.preventDefault();
      checkTimer();
      this.keyPressed.space = false;
    }.bind(this);

    var funList = [
      goForward,
      stopForward,
      goBackward,
      stopBackward,
      goRight,
      stopRight,
      goLeft,
      stopLeft,
      goJump,
      stopJump,
    ];

    start.split(" ").forEach((e) => {
      document.getElementById("w-btn").addEventListener(e, goForward);
    });
    end.split(" ").forEach((e) => {
      document.getElementById("w-btn").addEventListener(e, stopForward);
    });

    start.split(" ").forEach((e) => {
      document.getElementById("s-btn").addEventListener(e, goBackward);
    });
    end.split(" ").forEach((e) => {
      document.getElementById("s-btn").addEventListener(e, stopBackward);
    });

    start.split(" ").forEach((e) => {
      document.getElementById("d-btn").addEventListener(e, goRight);
    });
    end.split(" ").forEach((e) => {
      document.getElementById("d-btn").addEventListener(e, stopRight);
    });

    start.split(" ").forEach((e) => {
      document.getElementById("a-btn").addEventListener(e, goLeft);
    });
    end.split(" ").forEach((e) => {
      document.getElementById("a-btn").addEventListener(e, stopLeft);
    });

    start.split(" ").forEach((e) => {
      document.getElementById("space-btn").addEventListener(e, goJump);
    });
    end.split(" ").forEach((e) => {
      document.getElementById("space-btn").addEventListener(e, stopJump);
    });
  }

  getPosition() {
    return this.position;
  }
  getXPosition() {
    return this.position.x;
  }
  getYPosition() {
    return this.position.y;
  }
  getZPosition() {
    return this.position.z;
  }

  getXRotation() {
    return this.rotation.x;
  }
  getYRotation() {
    return this.rotation.y;
  }
  getZRotation() {
    return this.rotation.z;
  }

  // Do a physics step, independent from the rendering.
  // We can Read but never Write the structure controlled by moveBall()
  moveBall(camera) {
    if (this.start_timer != 0 && this.start_timer != -1) {
      const now = Date.now();
      const seconds = (now - this.start_timer) / 1000;
      this.timer = Math.round(seconds);
      document.getElementById("timer").innerHTML = this.timer;
    }
    // Speed in ball space
    var ballSpeed = { x: 0, y: 0, z: 0 };
    // From speed world frame to speed ball frame
    ballSpeed.x = +cosf * this.speed.x - sinf * this.speed.y;
    ballSpeed.y = +sinf * this.speed.x + cosf * this.speed.y;

    // Key movement
    if (this.keyPressed.w) {
      if (ballSpeed.x + this.maxAcceleration <= this.maxSpeed) ballSpeed.x += this.maxAcceleration;
      this.rotation.x = 0; // Reset rotation
    }
    if (this.keyPressed.s) {
      if (ballSpeed.x - this.maxAcceleration >= -this.maxSpeed) ballSpeed.x -= this.maxAcceleration;
      this.rotation.x = 0;
    }
    if (this.keyPressed.a) {
      if (ballSpeed.y + this.maxAcceleration <= this.maxSpeed) ballSpeed.y += this.maxAcceleration;
    }
    if (this.keyPressed.d) {
      if (ballSpeed.y - this.maxAcceleration >= -this.maxSpeed) ballSpeed.y -= this.maxAcceleration;
    }

    // Jumping logic
    if (this.isJumping()) {
      if (this.jumping % 2 == 0) ballSpeed.z += 1; // smooth jump
      this.jumping--; // decrese jumping ticks
    } else {
      if (this.keyPressed.space && this.canBallJump()) {
        ballSpeed.z += 1;
        this.jumping = 8;
      } else if (!this.isOnCube()) {
        // apply gravity
        ballSpeed.z -= 1;
      }
    }

    // Friction handling
    ballSpeed.x *= this.frictionX;
    ballSpeed.y *= this.frictionY;

    // Back to speed coordinate world
    this.speed.x = +cosf * ballSpeed.x + sinf * ballSpeed.y;
    this.speed.y = -sinf * ballSpeed.x + cosf * ballSpeed.y;
    this.speed.z = ballSpeed.z;

    this.collisionCheckerUpdate(camera, this.speed.x, this.speed.y, this.speed.z);

    // Rotation handling
    if (this.speed.x != 0) this.rotation.y += this.speed.x;
    else this.rotation.y = 0;

    if (this.speed.y != 0) this.rotation.x += -this.speed.y;
    else this.rotation.x = 0;
  }

  isJumping() {
    return this.jumping != 0;
  }

  canBallJump() {
    return this.position.z < 1.1 || this.isOnCube();
  }

  collisionCheckerUpdate(camera, speedX, speedY, speedZ) {
    // Check not exceeding borders
    this.checkBordersCollition(camera, speedX, speedY, speedZ);

    // Manage collition with objects
    for (const obj of this.objList) {
      const name = obj.getName();
      const pos = obj.getPosition();
      if (name == "cube") this.checkCubeCollition(camera, pos, speedX, speedY, speedZ);
      if (name.startsWith("coin")) this.checkCoinsCollition(obj);
    }
  }

  checkBordersCollition(camera, speedX, speedY, speedZ) {
    if (this.position.x + speedX < LIMITX.upper && this.position.x + speedX > LIMITX.lower) {
      camera.moveTargetByBall("x", speedX);
      this.position.x += speedX;
    }
    if (this.position.y + speedY < LIMITY.upper && this.position.y + speedY > LIMITX.lower) {
      camera.moveTargetByBall("y", speedY);
      this.position.y += speedY;
    }
    if (this.position.z + speedZ < LIMITZ.upper && this.position.z + speedZ > LIMITZ.lower) {
      camera.moveTargetByBall("z", speedZ);
      this.position.z += speedZ;
    }
  }

  checkCoinsCollition(obj) {
    const name = obj.getName();
    const coinPos = obj.getPosition();
    if (areTwoObjsNear(this.position, coinPos)) {
      playCoinSound();
      this.removeObject(name);
      this.coinsGathered += 1;
      document.getElementById("coins-counter").innerHTML = this.coinsGathered;
      if (this.coinsGathered == 3) {
        this.start_timer = -1;
        document.getElementById("final-timer").innerHTML = this.timer;
        final_modal.showModal();
      }
      // remove coinPos from objList
      this.objList.splice(this.objList.indexOf(obj), 1);
    }
  }

  checkCubeCollition(camera, cubePos, speedX, speedY, speedZ) {
    const ballPos = this.position;
    if (areTwoObjsNear(ballPos, cubePos)) {
      if (ballPos.z <= cubePos.z && ballPos.z >= cubePos.z + 1) {
        this.position.z = -speedZ;
        camera.moveTargetByBall("z", -speedZ);
      } else {
        if (ballPos.x <= cubePos.x + APPROX && ballPos.x >= cubePos.x - APPROX) {
          this.position.x -= speedX;
          camera.moveTargetByBall("x", -speedX);
        }
        if (ballPos.y <= cubePos.y + APPROX && ballPos.y >= cubePos.y - APPROX) {
          this.position.y -= speedY;
          camera.moveTargetByBall("y", -speedY);
        }
      }
    }
  }

  isOnCube() {
    let can = false;

    for (const obj of this.objList) {
      const name = obj.getName();
      if (name == "cube") {
        const cubePos = obj.getPosition();

        function isBallOnTopCube(pos1, pos2) {
          return (
            pos1.x <= pos2.x + APPROX &&
            pos1.x >= pos2.x - APPROX &&
            pos1.y <= pos2.y + APPROX &&
            pos1.y >= pos2.y - APPROX &&
            pos1.z <= pos2.z + 1.3 &&
            pos1.z >= pos2.z + 0.1
          );
        }

        function isBallUnderCube(pos1, pos2) {
          return (
            pos1.x <= pos2.x + APPROX &&
            pos1.x >= pos2.x - APPROX &&
            pos1.y <= pos2.y + APPROX &&
            pos1.y >= pos2.y - APPROX &&
            pos1.z <= pos2.z + 0.5 &&
            pos1.z >= pos2.z - 0.5
          );
        }

        if (isBallUnderCube(this.position, cubePos)) return false;

        can = can || isBallOnTopCube(this.position, cubePos);
      }
    }

    return can;
  }

  static setBallControls(ball) {
    window.addEventListener("keydown", (event) => {
      event.preventDefault();
      switch (event.key) {
        case "w":
          ball.keyPressed.w = true;
          break;

        case "s":
          ball.keyPressed.s = true;
          break;

        case "a":
          ball.keyPressed.a = true;
          break;

        case "d":
          ball.keyPressed.d = true;
          break;

        case " ":
          ball.keyPressed.space = true;
          break;
      }
    });

    window.addEventListener("keyup", (event) => {
      event.preventDefault();
      if (ball.start_timer == 0) {
        ball.start_timer = Date.now();
      }
      switch (event.key) {
        case "w":
          ball.keyPressed.w = false;
          break;

        case "s":
          ball.keyPressed.s = false;
          break;

        case "a":
          ball.keyPressed.a = false;
          break;

        case "d":
          ball.keyPressed.d = false;
          break;

        case " ":
          ball.keyPressed.space = false;
          break;
      }
    });
  }
}

function areTwoObjsNear(pos1, pos2) {
  return (
    pos1.x <= pos2.x + APPROX &&
    pos1.x >= pos2.x - APPROX &&
    pos1.y <= pos2.y + APPROX &&
    pos1.y >= pos2.y - APPROX &&
    pos1.z <= pos2.z + 0.5 &&
    pos1.z >= pos2.z - 0.5
  );
}

function playCoinSound() {
  // check if sound is muted
  if (!document.querySelector("#soundCheckbox").checked) {
    var audio = new Audio("../objs/coin/coin.wav");
    audio.volume = 0.2;
    audio.play();
  }
}

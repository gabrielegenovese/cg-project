const cosf = Math.cos(Math.PI / 180.0);
const sinf = Math.sin(Math.PI / 180.0);

class Ball {
  constructor(canvas, coinsPositionList, cubesPos, removeObject) {
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
    this.coinsPositionList = coinsPositionList;
    this.cubesPos = cubesPos;

    // Dict to track which key is being pressed
    this.keyPressed = { w: false, a: false, s: false, d: false, space: false, shift: false };
    // Function binded whit the SceneHandler environment to delete the object from the scene
    this.removeObject = removeObject;
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
      } else if (!isOnCube(this.position, this.cubesPos)) {
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
    return this.position.z < 1.1 || isOnCube(this.position, this.cubesPos);
  }

  async collisionCheckerUpdate(camera, speedX, speedY, speedZ) {
    // Check not exceeding borders
    this.checkBordersCollition(camera, speedX, speedY, speedZ);

    // Manage collition with cubes
    for (const cubePos of this.cubesPos) {
      this.checkCubeCollition(camera, cubePos, speedX, speedY, speedZ);
    }

    // coins gathering
    for (const coinPos of this.coinsPositionList) {
      this.checkCoinsCollition(coinPos);
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
    } else if (speedZ < 0 && this.position.z + speedZ > 0) {
      this.position.z = 0.1;
    }
  }

  checkCoinsCollition(coinPos) {
    if (
      coinPos.name.startsWith("goldenCoin") &&
      coinPos.visibility == true &&
      areTwoObjsNear(this.position, coinPos)
    ) {
      // check if sound is muted
      if (!document.querySelector("#soundCheckbox").checked) {
        var audio = new Audio("../objs/coin/coin.wav");
        audio.play();
      }
      this.removeObject(coinPos.name);
      this.coinsGathered += 1;
      // remove coinPos from coinsPositionList
      this.coinsPositionList.indexOf(coinPos);
      this.coinsPositionList.splice(this.coinsPositionList.indexOf(coinPos), 1);
    }
  }

  checkCubeCollition(camera, pos2, speedX, speedY, speedZ) {
    if (areTwoObjsNear(this.position, pos2)) {
      const pos1 = this.position;

      if (pos1.z <= pos2.z && pos1.z >= pos2.z + 1) {
        this.position.z -= speedZ;
        camera.moveTargetByBall("z", -speedZ);
      } else {
        if (pos1.x <= pos2.x + APPROX && pos1.x >= pos2.x - APPROX) {
          this.position.x -= speedX;
          camera.moveTargetByBall("x", -speedX);
        }

        if (pos1.y <= pos2.y + APPROX && pos1.y >= pos2.y - APPROX) {
          this.position.y -= speedY;
          camera.moveTargetByBall("y", -speedY);
        }
      }
    }
  }

  static setBallControls(ball) {
    window.addEventListener("keydown", function (event) {
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

    window.addEventListener("keyup", function (event) {
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


function isOnCube(position, cubesPositionList) {
  let can = false;

  for (const cubePos of cubesPositionList) {
    function isBallOnTopCube(pos1, pos2) {
      return (
        pos1.x <= pos2.x + APPROX &&
        pos1.x >= pos2.x - APPROX &&
        pos1.y <= pos2.y + APPROX &&
        pos1.y >= pos2.y - APPROX &&
        pos1.z <= pos2.z + 1.1
      );
    }

    // wip
    function isBallUnderCube(pos1, pos2) {
      return (
        pos1.x <= pos2.x + APPROX &&
        pos1.x >= pos2.x - APPROX &&
        pos1.y <= pos2.y + APPROX &&
        pos1.y >= pos2.y - APPROX &&
        pos1.z <= pos2.z + 0.5 &&
        pos1.z >= pos2.z - 5
      );
    }

    if (isBallUnderCube(position, cubePos)) return false;

    can = can || isBallOnTopCube(position, cubePos);
  }

  return can;
}

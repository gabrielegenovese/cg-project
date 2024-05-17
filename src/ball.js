import { APPROX } from "../../src/const.js";

const cosf = Math.cos(Math.PI / 180.0);
const sinf = Math.sin(Math.PI / 180.0);

export class Ball {
  constructor(canvas, coinsPositionList, removeObject) {
    this.canvas = canvas;
    this.position = { x: 0, y: 0, z: 10 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.speed = { x: 0, y: 0, z: 0 };
    this.jumping = 0;

    // The friction value is a value in the range [0,1]. The friction controls the percentage of speed preserved
    // Smaller value results in bigger friction, larger value results in smaller friction
    this.frictionX = 0.7;
    this.frictionY = 0.7;
    this.maxSpeed = 0.5;
    this.maxAcceleration = 0.4;
    // Number of cards gathered and list of objects positions
    this.coinsGathered = 0;
    this.coinsPositionList = coinsPositionList;

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
  moveBall() {
    // Speed in ball space
    var ballSpeed = { x: 0, y: 0, z: 0 };
    // From speed world frame to speed ball frame
    ballSpeed.x = +cosf * this.speed.x - sinf * this.speed.y;
    ballSpeed.y = +sinf * this.speed.x + cosf * this.speed.y;

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
    if (this.keyPressed.space && this.jumping == 0) {
      ballSpeed.z += 1;
      this.jumping = 4;
    } else if (this.jumping > 0) {
      ballSpeed.z += 1;
      this.jumping--;
    } else if (this.jumping == 0) {
      ballSpeed.z -= 1; // apply gravity
    }

    // Friction handling
    ballSpeed.x *= this.frictionX;
    ballSpeed.y *= this.frictionY;

    // Back to speed coordinate world
    this.speed.x = +cosf * ballSpeed.x + sinf * ballSpeed.y;
    this.speed.y = -sinf * ballSpeed.x + cosf * ballSpeed.y;
    this.speed.z = ballSpeed.z;

    this.collisionCheckerUpdate(this.speed.x, this.speed.y, this.speed.z);

    // Rotation handling
    if (this.speed.x != 0) this.rotation.y += this.speed.x;
    else this.rotation.y = 0;

    if (this.speed.y != 0) this.rotation.x += -this.speed.y;
    else this.rotation.x = 0;
  }

  async collisionCheckerUpdate(speedX, speedY, speedZ) {
    // Check not exceeding borders
    if (this.position.x + speedX < 19 && this.position.x + speedX > -19.5)
      this.position.x += speedX;
    if (this.position.y + speedY < 9.5 && this.position.y + speedY > -9.5)
      this.position.y += speedY;
    if (this.position.z + speedZ < 20 && this.position.z + speedZ > 0) {
      this.position.z += speedZ;
    } else if (speedZ < 0 && this.position.z + speedZ > 0) {
      this.position.z = 0.1;
    }
    // Cards Gathering
    for (const element of this.coinsPositionList) {
      if (
        element.name.startsWith("yellowCard") &&
        element.visibility == true &&
        areTwoObjsNear(this.position, element)
      ) {
        this.removeObject(element.name);
        this.coinsGathered += 1;
        // remove element from coinsPositionList
        this.coinsPositionList.indexOf(element);
        this.coinsPositionList.splice(this.coinsPositionList.indexOf(element), 1);
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
    pos1.z >= pos2.z + APPROX &&
    pos1.z >= pos2.z - APPROX
  );
}

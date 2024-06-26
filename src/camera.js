class Camera {
  constructor(canvas) {
    this.target = { x: 0, y: 0, z: 0 };
    this.position = { x: 0, y: 0, z: 0 }; // This will be overwritten by moveCamera() after a drag movement, to set start position use angle xy and xz
    this.up = { x: 0, y: 0, z: 1 }; // Z axis will be up
    this.fovRad = 70;
    this.near = 1;
    this.far = 2000;
    this.radius = 50;
    this.aspect = canvas.clientWidth / canvas.clientHeight;
    //Booleans to keep track the camera type
    this.cameraOnBall = false;
    this.rearCamera = false;
    this.upCamera = false;
    //Default angle for the camera
    this.defaultAngle = {
      xy: degToRad(190),
      xz: degToRad(30),
    };
    this.movement = {
      delta: {
        x: 0,
        y: 0,
      },
      pos: {
        x: 0,
        y: 0,
      },
      old: {
        x: 0,
        y: 0,
      },
      angle: {
        xy: this.defaultAngle.xy,
        xz: this.defaultAngle.xz,
      },
      dragging: false,
      updateCamera: true,
    };

    document.getElementById("fovVal").innerHTML = 70;
    //Set the listeners for the camera
    document.getElementById("zoomCamera").addEventListener(
      "input",
      function (event) {
        document.getElementById("fovVal").innerHTML = event.target.value;
        this.setFov(event.target.value);
      }.bind(this)
    );

    document.getElementById("defaultFovButton").onclick = function () {
      document.getElementById("zoomCamera").value = 70;
      document.getElementById("fovVal").innerHTML = 70;
      this.setFov(4010); //Equivalent to 70 rad
    }.bind(this);
  }

  getisUpCamera() {
    return this.upCamera;
  }

  getisRearCamera() {
    return this.rearCamera;
  }

  setAspect(canvas) {
    this.aspect = canvas.clientWidth / canvas.clientHeight;
  }

  setFov(fovDeg) {
    this.fovRad = degToRad(fovDeg);
  }

  getFov() {
    return radToDeg(this.fovRad);
  }

  setCameraTarget(x, y, z) {
    this.target.x = x;
    this.target.y = y;
    this.target.z = z;
  }

  setCameraPosition(position) {
    this.position = position;
  }

  getSharedUniforms(light) {
    // Compute the camera's matrix using look at.
    const lightPos = light.getPosition();
    const lightDir = light.getDirection();
    const cameraView = m4.lookAt(
      [this.position.x, this.position.y, this.position.z],
      [this.target.x, this.target.y, this.target.z],
      [this.up.x, this.up.y, this.up.z]
    );

    // Make a view matrix from the cameraView matrix.
    const view = m4.inverse(cameraView);
    const projection = m4.perspective(this.fovRad, this.aspect, this.near, this.far);

    return {
      u_lightWorldPosition: [lightPos.x, lightPos.y, lightPos.z],
      u_lightDirection: m4.normalize([lightDir.x, lightDir.y, lightDir.z]),
      u_view: view,
      u_projection: projection,
      u_viewWorldPosition: [this.position.x, this.position.y, this.position.z],
    };
  }

  //Update the camera position after a drag movement
  moveCamera() {
    if (this.movement.updateCamera) {
      this.position.x =
        this.radius * Math.cos(this.movement.angle.xz) * Math.cos(this.movement.angle.xy);
      this.position.y =
        this.radius * Math.cos(this.movement.angle.xz) * Math.sin(this.movement.angle.xy);
      this.position.z = this.radius * Math.sin(this.movement.angle.xz);
      this.movement.updateCamera = false;
    }
  }

  moveCameraTarget() {
    this.target.y += (this.movement.old.x - this.movement.pos.x) / 10;
    this.target.z += (this.movement.old.y - this.movement.pos.y) / 10;
  }

  moveTargetByBall(way, move) {
    switch (way) {
      case "x":
        this.target.x += move;
        break;
      case "y":
        this.target.y += move;
        break;
      case "z":
        this.target.z += move;
        break;
    }
  }

  //Set Camera event listeners
  static setCameraControls(canvas, camera) {
    var moveCameraStart = "mousedown";
    moveCameraStart.split(" ").forEach((e) => {
      canvas.addEventListener(e, function (event) {
        event.preventDefault();
        camera.movement.old.x = event.pageX;
        camera.movement.old.y = event.pageY;
        camera.movement.dragging = true;
      });
    });

    var moveCameraEnd = "mouseup";
    moveCameraEnd.split(" ").forEach((e) => {
      canvas.addEventListener(e, function (event) {
        event.preventDefault();
        camera.movement.dragging = false;
      });
    });

    var moveCameraMove = "mousemove";
    moveCameraMove.split(" ").forEach((e) => {
      canvas.addEventListener(e, function (event) {
        event.preventDefault();
        if (!camera.movement.dragging) return;
        // Save current mouse position
        camera.movement.pos.x = event.pageX;
        camera.movement.pos.y = event.pageY;
        camera.movement.updateCamera = true;
        camera.moveCameraTarget();
        camera.movement.old.x = event.pageX;
        camera.movement.old.y = event.pageY;
      });
    });

    canvas.addEventListener("wheel", function (event) {
      event.preventDefault();
      var fov = parseInt(document.getElementById("zoomCamera").value);
      const delta = Math.sign(event.deltaY);
      if ((delta > 0 && fov < 100) || (delta < 0 && fov > 5)) {
        fov += delta;
      }
      document.getElementById("fovVal").innerHTML = fov;
      document.getElementById("zoomCamera").value = fov;
      camera.setFov(fov);
    });
  }
}

function degToRad(d) {
  return (d * Math.PI) / 180;
}

function radToDeg(r) {
  return (r * 180) / Math.PI;
}

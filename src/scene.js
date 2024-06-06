class Scene {
  constructor(canvasName, objPositionList, cubesPos) {
    //Get canvas from canvas name
    const canvas = document.querySelector(canvasName);
    if (!canvas) {
      console.error("Can't find canvas " + canvasName);
      return;
    }
    //Create a WebGL2RenderingContext
    this.gl = canvas.getContext("webgl2");
    if (!this.gl) {
      console.error("Can't initialize WebGL2 on canvas " + canvasName);
      return;
    }

    //Compiles and links the shaders, looks up attribute and uniform locations
    this.programInfo = webglUtils.createProgramInfo(this.gl, [VS, FS]);
    //Set up the position of all objects in the scene
    this.objList = [];
    this.objPositionList = objPositionList;
    this.cubesPos = cubesPos;
    //Set up the camera and the ball
    this.light = new Light();
    this.camera = new Camera(this.gl.canvas);
    this.ball = new Ball(
      this.gl.canvas,
      this.objPositionList,
      cubesPos,
      this.removeObject.bind(this)
    );

    this.camera.setCameraTarget(this.ball.position.x, this.ball.position.y, this.ball.position.z);

    //Setting up controls for the camera and the ball
    Camera.setCameraControls(this.gl.canvas, this.camera, this.ball);
    Ball.setBallControls(this.ball);
  }

  //Add an object to the environment after loading its mesh
  async addObject(obj) {
    this.objList.push(obj);
    await obj.loadMesh(this.gl);
  }
  removeObject(objName) {
    this.objList = this.objList.filter((obj) => obj.name != objName);
  }

  render(time) {
    webglUtils.resizeCanvasToDisplaySize(this.gl.canvas);
    //Set the viewport to the canvas size
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.enable(this.gl.DEPTH_TEST);
    if (!document.querySelector("#transparencyCheckbox").checked) this.gl.disable(this.gl.BLEND);
    else this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.camera.moveCamera();

    this.objList.forEach((obj) => {
      if (obj.name == "ball") {
        this.ball.moveBall(this.camera);
        obj.position.x = this.ball.getXPosition();
        obj.position.y = this.ball.getYPosition();
        obj.position.z = this.ball.getZPosition();
        obj.rotation.x = this.ball.getXRotation();
        obj.rotation.y = this.ball.getYRotation();
        this.camera.setCameraPosition({
          x: obj.position.x - 2,
          y: obj.position.y,
          z: obj.position.z + 1,
        });
      }

      // rotate coins
      if (obj.name.startsWith("goldenCoin")) {
        obj.rotation.z += 0.01;
      }
    });

    this.objList.forEach((obj) => {
      obj.render(this.gl, this.programInfo, this.camera.getSharedUniforms(this.light));
    });
  }
}

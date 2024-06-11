class Scene {
  constructor(canvasName) {
    // init webgl components
    const canvas = document.querySelector(canvasName);
    if (!canvas) {
      console.error("Can't find canvas " + canvasName);
      return;
    }
    this.gl = canvas.getContext("webgl2");
    if (!this.gl) {
      console.error("Can't initialize WebGL2 on canvas " + canvasName);
      return;
    }

    this.programInfo = webglUtils.createProgramInfo(this.gl, [VS, FS]);

    // init main objects
    this.objList = [];
    this.light = new Light();
    this.camera = new Camera(this.gl.canvas);
    this.ball = new Ball(this.gl.canvas, this.removeObject.bind(this));

    this.camera.setCameraTarget(this.ball.position.x, this.ball.position.y, this.ball.position.z);

    // setting up controls for the camera and the ball
    Camera.setCameraControls(this.gl.canvas, this.camera, this.ball);
    Ball.setBallControls(this.ball);

    this.initSkybox(canvasName);
    this.initListeners(canvasName);
  }

  initSkybox(canvasName) {
    this.skyboxProgramInfo = webglUtils.createProgramFromScripts(this.gl, [
      "vertex-shader-3d",
      "fragment-shader-3d",
    ]);

    // look up where the vertex data needs to go.
    this.positionLocation = this.gl.getAttribLocation(this.skyboxProgramInfo, "a_position");

    // lookup uniforms
    this.skyboxLocation = this.gl.getUniformLocation(this.skyboxProgramInfo, "u_skybox");
    this.viewDirectionProjectionInverseLocation = this.gl.getUniformLocation(
      this.skyboxProgramInfo,
      "u_viewDirectionProjectionInverse"
    );

    // Create a buffer for positions
    this.positionBuffer = this.gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    // Put the positions in the buffer
    setGeometry(this.gl);

    // Create a texture.
    var texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture);

    const faceInfos = [
      {
        target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        url: "objs/skybox/1.png",
      },
      {
        target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        url: "objs/skybox/2.png",
      },
      {
        target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        url: "objs/skybox/6.png",
      },
      {
        target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        url: "objs/skybox/5.png",
      },
      {
        target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        url: "objs/skybox/4.png",
      },
      {
        target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        url: "objs/skybox/3.png",
      },
    ];

    faceInfos.forEach((faceInfo) => {
      const { target, url } = faceInfo;

      // Upload the canvas to the cubemap face.
      const level = 0;
      const internalFormat = this.gl.RGBA;
      const width = 2048;
      const height = 2048;
      const format = this.gl.RGBA;
      const type = this.gl.UNSIGNED_BYTE;

      // setup each face so it's immediately renderable
      this.gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

      // Asynchronously load an image
      const image = new Image();
      image.src = url;
      image.addEventListener("load", function () {
        // Now that the image has loaded make copy it to the texture.
        const canvas = document.querySelector(canvasName);
        var gl = canvas.getContext("webgl2");
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(target, level, internalFormat, format, type, image);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      });
    });
    this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
    this.gl.texParameteri(
      this.gl.TEXTURE_CUBE_MAP,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR_MIPMAP_LINEAR
    );
  }

  initListeners(canvasName) {
    document.getElementById("fullscreenBtn").addEventListener("click", function () {
      const canvas = document.querySelector(canvasName);
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      }
    });

    // manage audio
    var audio = document.getElementById("myaudio");
    var muteCheckbox = document.getElementById("soundCheckbox");
    audio.volume = 0.2;

    muteCheckbox.addEventListener("change", function () {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });

    document.getElementById("docsBtn").addEventListener("click", function () {
      var now = window.location;
      window.location.href = now + "docs";
    });
  }

  //Add an object to the environment after loading its mesh
  async addObject(obj) {
    this.objList.push(obj);
    this.ball.setObjList(this.objList);
    await obj.loadMesh(this.gl);
  }
  removeObject(objName) {
    this.objList = this.objList.filter((obj) => {
      var name = obj.getName();
      return name != objName;
    });
  }

  render(time) {
    webglUtils.resizeCanvasToDisplaySize(this.gl.canvas);
    //Set the viewport to the canvas size
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.enable(this.gl.DEPTH_TEST);
    if (!document.querySelector("#transparencyCheckbox").checked) this.gl.disable(this.gl.BLEND);
    else this.gl.enable(this.gl.BLEND);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    // this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.moveObjects();
    const shered = this.camera.getSharedUniforms(this.light);
    this.objList.forEach((obj) => {
      obj.render(this.gl, this.programInfo, shered);
    });

    this.renderSkybox();
  }

  moveObjects() {
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
      if (obj.name.startsWith("coin")) {
        obj.rotation.z += 0.01;
      }
    });
  }

  renderSkybox() {
    this.gl.useProgram(this.skyboxProgramInfo);

    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);

    var size = 2; // 2 components per iteration
    var type = this.gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    this.gl.vertexAttribPointer(this.positionLocation, size, type, normalize, stride, offset);

    var shared_unif = this.camera.getSharedUniforms(this.light);
    var viewMatrix = shared_unif.u_view;
    // We only care about direciton so remove the translation.
    // the next 3 lines are very important
    viewMatrix[12] = 0;
    viewMatrix[13] = 0;
    viewMatrix[14] = 0;

    var viewDirectionProjectionMatrix = m4.multiply(shared_unif.u_projection, viewMatrix);
    var viewDirectionProjectionInverseMatrix = m4.inverse(viewDirectionProjectionMatrix);

    // Set the uniforms
    this.gl.uniformMatrix4fv(
      this.viewDirectionProjectionInverseLocation,
      false,
      viewDirectionProjectionInverseMatrix
    );
    this.gl.uniform1i(this.skyboxLocation, 0);

    this.gl.depthFunc(this.gl.LEQUAL);
    // Draw the geometry.
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 1 * 6);
  }
}

// Fill the buffer with the values that define a quad.
function setGeometry(gl) {
  var positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function degToRad(d) {
  return (d * Math.PI) / 180;
}

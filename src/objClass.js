// Created starting from
// https://webgl2fundamentals.org/webgl/lessons/webgl-load-obj.html
// https://webgl2fundamentals.org/webgl/lessons/webgl-load-obj-w-mtl.html
class ObjectClass {
  constructor(
    name,
    start_pos = { x: 0, y: 0, z: 0 },
    objInfo = {
      objPath: null,
      objText: null,
      mtlText: null,
      mtlPath: null,
      textureText: null,
      texturePath: null,
    },
    start_rot = 0
  ) {
    this.name = name;
    this.position = start_pos;
    this.rotation = { x: 0, y: 0, z: 0 };
    this.start_rot = start_rot;
    this.objInfo = objInfo;
  }

  getName() {
    return this.name;
  }

  getPosition() {
    return this.position;
  }

  async loadMesh(gl) {
    var materials;
    var obj;
    var basePath = this.objInfo.basePath;
    var baseHref = new URL(basePath, window.location.href);

    //Load Mesh from OBJ file
    obj = ObjLoader.parseOBJ(this.objInfo.objText);

    // obj.materialLibs = this.objInfo.mtlText;
    materials = ObjLoader.parseMTL(this.objInfo.mtlText);

    const textures = {
      defaultWhite: ObjLoader.create1PixelTexture(gl, [255, 255, 255, 255]), //Nedeed for materials without textures
      defaultNormal: ObjLoader.create1PixelTexture(gl, [127, 127, 255, 0]),
    };
    //defaults for any material parameters that are missing
    const defaultMaterial = {
      diffuse: [1, 1, 1],
      diffuseMap: textures.defaultWhite,
      normalMap: textures.defaultNormal,
      ambient: [0, 0, 0],
      specular: [1, 1, 1],
      specularMap: textures.defaultWhite,
      shininess: 400,
      opacity: 1,
    };

    // Load texture for materials
    //Each texture is an object with a name and so different obj files can share the same texture
    for (const material of Object.values(materials)) {
      Object.entries(material)
        .filter(([key]) => key.endsWith("Map"))
        .forEach(([key, filename]) => {
          let texture = textures[filename];
          if (!texture) {
            const textureHref = new URL(filename, baseHref).href;
            texture = ObjLoader.createTexture(gl, textureHref);
            textures[filename] = texture;
          }
          material[key] = texture;
        });
    }

    this.parts = obj.geometries.map(({ material, data }) => {
      // Since each geometry has it's own buffer, we have to load them separately
      // Because data is just named arrays like this
      //
      // {
      //   position: [...],
      //   texcoord: [...],
      //   normal: [...],
      // }
      //
      // and because those names match the attributes in our vertex
      // shader we can pass it directly into `createBufferInfoFromArrays`
      // from the article "less code more fun" https://webgl2fundamentals.org/webgl/lessons/webgl-less-code-more-fun.html

      if (data.color) {
        if (data.position.length === data.color.length) {
          // it's 3. The our helper library assumes 4 so we need
          // to tell it there are only 3.
          data.color = { numComponents: 3, data: data.color };
        }
      } else {
        // there are no vertex colors so just use constant white
        data.color = { value: [1, 1, 1, 1] };
      }

      // generate tangents if we have the data to do so.
      if (data.texcoord && data.normal) {
        data.tangent = ObjLoader.generateTangents(data.position, data.texcoord);
      } else {
        // There are no tangents
        data.tangent = { value: [1, 0, 0] };
      }

      if (!data.texcoord) {
        data.texcoord = { value: [0, 0] };
      }

      if (!data.normal) {
        // we probably want to generate normals if there are none
        data.normal = { value: [0, 0, 1] };
      }

      // create a buffer for each array by calling
      // gl.createBuffer, gl.bindBuffer, gl.bufferData
      //... spread operator: shows all the properties of the object
      const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
      return {
        material: {
          ...defaultMaterial,
          ...materials[material],
        },
        bufferInfo,
      };
    });
  }

  render(gl, meshProgramInfo, uniforms) {
    gl.useProgram(meshProgramInfo.program);

    // calls gl.uniform
    webglUtils.setUniforms(meshProgramInfo, uniforms);
    // compute the world matrix once since all parts
    // are at the same space.
    let u_world = m4.identity();

    u_world = m4.translate(u_world, this.position.x, this.position.y, this.position.z);

    if (this.name == "tree") {
      u_world = m4.scale(u_world, 3, 3, 3);
      u_world = m4.xRotate(u_world, 1.5);
      u_world = m4.yRotate(u_world, this.start_rot);
    }
    if (this.name == "cube_propic") {
      u_world = m4.xRotate(u_world, 1.5);
    }
    if (this.rotation) {
      if (this.rotation.x != 0) {
        u_world = m4.xRotate(u_world, this.rotation.x);
      }
      if (this.rotation.y != 0) {
        u_world = m4.yRotate(u_world, this.rotation.y);
      }
      if (this.rotation.z != 0) {
        u_world = m4.zRotate(u_world, this.rotation.z);
      }
    }

    for (const { bufferInfo, material } of this.parts) {
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);

      // calls gl.uniform
      webglUtils.setUniforms(
        meshProgramInfo,
        {
          u_world,
          u_worldInverseTranspose: m4.transpose(m4.inverse(u_world)),
        },
        material
      );

      // calls gl.drawArrays or gl.drawElements
      webglUtils.drawBufferInfo(gl, bufferInfo);
    }
  }
}

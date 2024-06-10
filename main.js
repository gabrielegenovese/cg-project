function getRndInteger(min, max) {
  var num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num > -1 && num < 1 ? getRndInteger(min, max) : num;
}

async function fetchObjAndMtl(objInfo) {
  const objResponse = await fetch(objInfo.basePath + ".obj");
  objInfo.objText = await objResponse.text();
  const mtlResponse = await fetch(objInfo.basePath + ".mtl");
  objInfo.mtlText = await mtlResponse.text();
  return objInfo;
}

async function loadAllObjs(scene, coinPosList, cubesPos) {
  // add coins
  var coinInfo = { basePath: "objs/coin/mycoin" };
  coinInfo = await fetchObjAndMtl(coinInfo);
  for (const pos of coinPosList) {
    await scene.addObject(new ObjectClass(pos.name, pos, coinInfo));
  }

  // add floor
  var floorInfo = { basePath: "objs/floor/floor3" };
  floorInfo = await fetchObjAndMtl(floorInfo);
  await scene.addObject(new ObjectClass("floor", { x: 0, y: 0, z: 0 }, floorInfo));

  // add trees
  var treeInfo = { basePath: "objs/tree/birch_tree" };
  treeInfo = await fetchObjAndMtl(treeInfo);
  for (let i = 0; i < 30; i++) {
    await scene.addObject(
      new ObjectClass(
        "tree",
        {
          x: getRndInteger(-20, 40),
          y: getRndInteger(-40, 40),
          z: -1,
        },
        treeInfo,
        Math.random() * degToRad(360)
      )
    );
  }

  // add ball
  var ballInfo = { basePath: "objs/ball/ball" };
  ballInfo = await fetchObjAndMtl(ballInfo);
  await scene.addObject(new ObjectClass("ball", { x: 0, y: 0, z: 0 }, ballInfo));

  // add cubes
  var cubeInfo = { basePath: "objs/cube/redcube" };
  cubeInfo = await fetchObjAndMtl(cubeInfo);
  for (const pos of cubesPos) {
    await scene.addObject(new ObjectClass("cube", pos, cubeInfo));
  }
}

async function main() {
  loading_modal.showModal();

  var coinPosList = [
    { name: "coin_1", x: 12, y: 19, z: 9 },
    { name: "coin_2", x: 20, y: -10, z: 18 },
    { name: "coin_3", x: 35, y: -3, z: 21 },
  ];
  var cubesPos = [
    // first coin
    { x: 5, y: 5, z: 2 },
    { x: 7, y: 5, z: 4 },
    { x: 9, y: 5, z: 6 },
    { x: 11, y: 5, z: 8 },
    { x: 12, y: 7, z: 8 },
    { x: 12, y: 10, z: 8 },
    { x: 12, y: 13, z: 8 },
    { x: 12, y: 16, z: 8 },
    { x: 12, y: 19, z: 8 },
    // second coin
    { x: 21, y: -5, z: 2 },
    { x: 23, y: -5, z: 4 },
    { x: 25, y: -5, z: 6 },

    { x: 25, y: -6, z: 8 },
    { x: 25, y: -8, z: 10 },
    { x: 25, y: -10, z: 12 },

    { x: 23, y: -10, z: 14 },
    { x: 21, y: -10, z: 16 },
    { x: 20, y: -10, z: 17 },

    //third coin
    { x: 35, y: -6, z: 1 },
    { x: 35, y: -3, z: 4 },
    { x: 35, y: -6, z: 8 },
    { x: 35, y: -3, z: 12 },
    { x: 35, y: -6, z: 16 },
    { x: 35, y: -3, z: 20 },
  ];
  const scene = new Scene("#screenCanvas");

  await loadAllObjs(scene, coinPosList, cubesPos);

  loading_modal.close();

  async function render(time) {
    // convert to seconds
    time *= 0.001;
    scene.render(time);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();

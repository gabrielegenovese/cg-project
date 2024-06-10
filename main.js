function getRndInteger(min, max) {
  var num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num > -1 && num < 1 ? getRndInteger(min, max) : num;
}

function checkIfPositionFree(x, y, positionList) {
  var positionFree = true;
  for (var i = 0; i < positionList.length; i++) {
    if (positionList[i].x === x && positionList[i].y === y) {
      positionFree = false;
    }
  }
  return positionFree;
}

function addCoins() {
  var positionList = [];
  positionList.push({
    name: "coin_1",
    x: getRndInteger(-10, 10),
    y: getRndInteger(-8, 8),
    z: getRndInteger(2, 4),
  });
  positionList.push({
    name: "coin_2",
    x: getRndInteger(-10, 10),
    y: getRndInteger(-8, 8),
    z: getRndInteger(2, 4),
  });
  positionList.push({
    name: "coin_3",
    x: getRndInteger(-10, 10),
    y: getRndInteger(-8, 8),
    z: getRndInteger(2, 4),
  });
  return positionList;
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
  for (let i = 0; i < 10; i++) {
    await scene.addObject(
      new ObjectClass(
        "tree",
        {
          x: getRndInteger(-40, 40),
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

  var coinPosList = addCoins();
  var cubesPos = [
    { x: 4, y: 2, z: 1 },
    { x: 4, y: 3, z: 2 },
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

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
    name: "goldenCoin_1",
    x: getRndInteger(-10, 10),
    y: getRndInteger(-8, 8),
    z: getRndInteger(1, 2),
    visibility: true,
  });
  positionList.push({
    name: "goldenCoin_2",
    x: getRndInteger(-10, 10),
    y: getRndInteger(-8, 8),
    z: getRndInteger(1, 2),
    visibility: true,
  });
  positionList.push({
    name: "goldenCoin_3",
    x: getRndInteger(-10, 10),
    y: getRndInteger(-8, 8),
    z: getRndInteger(1, 2),
    visibility: true,
  });
  return positionList;
}

async function loadAllObjs(scene, coinsPositionList, cubesPos) {
  for (const element of coinsPositionList) {
    var nameFile = element.name.startsWith("goldenCoin") ? "coin/mycoin" : element.name;
    await scene.addObject(
      new ObjectClass(element.name, "./objs/" + nameFile + ".obj", {
        x: element.x,
        y: element.y,
        z: element.z,
      })
    );
  }

  await scene.addObject(new ObjectClass("plane", "./objs/floor/floor3.obj", { x: 0, y: 0, z: 0 }));
  await scene.addObject(new ObjectClass("ball", "./objs/ball/Ball.obj", { x: 0, y: 0, z: 1 }));

  // cubes
  var cube1 = cubesPos[0];
  var cube2 = cubesPos[1];
  await scene.addObject(new ObjectClass("redcube", "./objs/cube/redcube.obj", cube1));
  await scene.addObject(new ObjectClass("redcube", "./objs/cube/redcube.obj", cube2));
  // await scene.addObject(
  //   new ObjectClass("scene", "./objs/Scena2.obj", { x: 0, y: 0, z: 0 }, true)
  // );
}

async function main() {
  var coinsPositionList = addCoins();
  var cubesPos = [
    { name: "redcube", x: 4, y: 2, z: 1 },
    { name: "redcube", x: 4, y: 3, z: 2 },
  ];
  const scene = new Scene("#screenCanvas", coinsPositionList, cubesPos);

  await loadAllObjs(scene, coinsPositionList, cubesPos);

  async function render(time) {
    // convert to seconds
    time *= 0.001;
    scene.render(time);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();

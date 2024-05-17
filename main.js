import { ObjectClass } from "./src/objClass.js";
import { Scene } from "./src/scene.js";

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
    name: "yellowCard_1",
    x: getRndInteger(-10, 10),
    y: getRndInteger(-8, 8),
    z: getRndInteger(1, 5),
    visibility: true,
  });
  positionList.push({
    name: "yellowCard_2",
    x: getRndInteger(-10, 10),
    y: getRndInteger(-8, 8),
    z: getRndInteger(1, 5),
    visibility: true,
  });
  positionList.push({
    name: "yellowCard_3",
    x: getRndInteger(-10, 10),
    y: getRndInteger(-8, 8),
    z: getRndInteger(1, 5),
    visibility: true,
  });
  return positionList;
}

async function loadAllObjs(scene, coinsPositionList) {
  for (const element of coinsPositionList) {
    var nameFile = element.name.startsWith("yellowCard") ? "fish" : element.name;
    await scene.addObject(
      new ObjectClass(
        element.name,
        "./objs/" + nameFile + ".obj",
        { x: element.x, y: element.y, z: element.z },
        element.visibility
      )
    );
  }

  await scene.addObject(new ObjectClass("plane", "./objs/Plane.obj", { x: 0, y: 0, z: 0 }, true));
  await scene.addObject(new ObjectClass("ball", "./objs/Ball.obj", { x: 0, y: 0, z: 1 }, true));
  // await scene.addObject(
  //   new ObjectClass("scene", "./objs/Scena2.obj", { x: 0, y: 0, z: 0 }, true)
  // );
}

async function main() {
  var coinsPositionList = addCoins();
  const scene = new Scene("#screenCanvas", coinsPositionList);

  await loadAllObjs(scene, coinsPositionList);

  async function render(time) {
    // convert to seconds
    time *= 0.001;
    scene.render(time);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();

class Light {
  constructor() {
    this.position = structuredClone(DEFLIGHTPOS);
    this.direction = structuredClone(DEFLIGHTDIR);

    this.setDefault();

    document.getElementById("xLight").addEventListener(
      "input",
      function (event) {
        this.setPosition("x", event.target.value);
        document.getElementById("xVal").innerHTML = event.target.value;
      }.bind(this)
    );
    document.getElementById("yLight").addEventListener(
      "input",
      function (event) {
        this.setPosition("y", event.target.value);
        document.getElementById("yVal").innerHTML = event.target.value;
      }.bind(this)
    );
    document.getElementById("zLight").addEventListener(
      "input",
      function (event) {
        this.setPosition("z", event.target.value);
        document.getElementById("zVal").innerHTML = event.target.value;
      }.bind(this)
    );

    document.getElementById("defaultLightButton").onclick = this.setDefault.bind(this);
  }

  setDefault() {
    const x = DEFLIGHTPOS.x;
    const y = DEFLIGHTPOS.y;
    const z = DEFLIGHTPOS.z;
    document.getElementById("xLight").value = x;
    document.getElementById("xVal").innerHTML = x;
    document.getElementById("yLight").value = y;
    document.getElementById("yVal").innerHTML = y;
    document.getElementById("zLight").value = z;
    document.getElementById("zVal").innerHTML = z;
    this.setPosition("x", x);
    this.setPosition("y", y);
    this.setPosition("z", z);
  }

  getPosition() {
    return this.position;
  }

  setPosition(pos, value) {
    if (pos == "x") this.position.x = value;
    else if (pos == "y") this.position.y = value;
    else if (pos == "z") this.position.z = value;
  }

  getDirection() {
    return this.direction;
  }

  setDirection(pos, value) {
    if (pos == "x") this.direction.x = value;
    else if (pos == "y") this.direction.y = value;
    else if (pos == "z") this.direction.z = value;
  }
}

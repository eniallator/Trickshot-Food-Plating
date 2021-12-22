const componentId = window.opener.getId(window.name);
let selectedComponent;

const maxPower = 15;
const automaticAimAirTime = 1000;

const initialVelocityInUnitCircle = Vector.UP;
const initialVelocityEl = $("#initial-velocity");
const getMaxVelRadius = () =>
  (Math.min(window.innerWidth, window.innerHeight) -
    initialVelocityEl.width()) /
  2;
const updateInitialVelocityPos = (x, y) => {
  initialVelocityInUnitCircle.setHead(
    x - window.innerWidth / 2,
    y - window.innerHeight / 2
  );
  const maxRadius = Math.min(window.innerWidth, window.innerHeight) / 2;
  initialVelocityInUnitCircle.setMagnitude(
    Math.min(maxRadius, initialVelocityInUnitCircle.getMagnitude()) / maxRadius
  );
  window.onresize();
};
initialVelocityEl[0].ondragend = (evt) => {
  if (evt.clientX && evt.clientY) {
    updateInitialVelocityPos(evt.clientX, evt.clientY);
  }
};
initialVelocityEl[0].ontouchmove = (evt) => {
  if (evt.touches[0].clientX && evt.touches[0].clientY) {
    updateInitialVelocityPos(evt.touches[0].clientX, evt.touches[0].clientY);
  }
};

const monitorCoords = Vector.ONE;
window.onmousemove = (evt) => {
  if (
    monitorCoords.x !== evt.screenX - evt.clientX ||
    monitorCoords.y !== evt.screenY - evt.clientY
  ) {
    monitorCoords.setHead(evt.screenX - evt.clientX, evt.screenY - evt.clientY);
    window.opener.drawAllComponents();
  }
};

let launching = false;
window.onresize = () => {
  if (launching) return;
  const el = $("#selected-component");
  el.width(
    ~~(selectedComponent.sizePercent * window.opener.getPlateRadii().x * 2)
  );
  el.css("left", window.innerWidth / 2 - el.width() / 2).css(
    "top",
    window.innerHeight / 2 - el.height() / 2
  );
  const maxRadius = getMaxVelRadius();
  initialVelocityEl
    .css(
      "left",
      window.innerWidth / 2 +
        initialVelocityInUnitCircle.x * maxRadius -
        initialVelocityEl.width() / 2
    )
    .css(
      "top",
      window.innerHeight / 2 +
        initialVelocityInUnitCircle.y * maxRadius -
        initialVelocityEl.height() / 2
    );
};

const foodConfig = window.opener.getFoodConfig();

window.opener.initializeComponent($("#food-components"), () => monitorCoords);

selectedComponent = foodConfig[0];
$("#selected-component")
  .on("load", window.onresize)
  .attr("src", selectedComponent.imgPath);
$("#food-component")
  .append(
    foodConfig.map((item, i) => `<option value="${i}">${item.name}</option>`)
  )
  .change(() => {
    selectedComponent = foodConfig[$("#food-component").val()];
    $("#selected-component").attr("src", selectedComponent.imgPath);
    window.onresize();
  });

const getRelativeInitialCoords = () =>
  new Vector(
    +$("#selected-component").css("left").slice(0, -2),
    +$("#selected-component").css("top").slice(0, -2)
  );

function getAutomaticInitialVelocity() {
  const plateCoords = window.opener
    .getPlateCoords()
    .copy()
    .add(window.opener.getMonitorCoords())
    .sub(monitorCoords);
  const diff = plateCoords
    .sub(
      new Vector(
        $("#selected-component").width() / 2,
        $("#selected-component").height() / 2
      )
    )
    .sub(getRelativeInitialCoords());
  const resultingYAcceleration = window.opener.getGravity().copy();
  console.log(diff, automaticAimAirTime, resultingYAcceleration);
  return diff
    .divide(automaticAimAirTime)
    .sub(resultingYAcceleration.multiply(automaticAimAirTime).divide(2));
}

function launch() {
  document.body.classList.add("launching");
  let initialVel;
  if (document.body.classList.contains("manual")) {
    initialVel = initialVelocityInUnitCircle.copy().multiply(maxPower);
  } else {
    initialVel = getAutomaticInitialVelocity();
    console.log(initialVel);
  }
  window.opener.launchComponent(
    componentId,
    initialVel,
    getRelativeInitialCoords()
      .add(monitorCoords)
      .sub(window.opener.getMonitorCoords()),
    selectedComponent.imgPath,
    $("#selected-component").width()
  );
}

function reset() {
  document.body.classList.remove("launching");
  window.opener.resetComponent(componentId);
}

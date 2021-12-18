const componentId = window.opener.getId(window.name);
let selectedComponent;

const maxPower = 15;

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

window.opener.registerComponentContainer(
  $("#food-components"),
  () => monitorCoords
);

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

function launch() {
  document.body.classList.add("launching");
  const el = $("#selected-component");
  window.opener.launchComponent(
    componentId,
    initialVelocityInUnitCircle.copy().multiply(maxPower),
    new Vector(+el.css("left").slice(0, -2), +el.css("top").slice(0, -2))
      .add(monitorCoords)
      .sub(window.opener.getMonitorCoords()),
    selectedComponent.imgPath,
    el.width()
  );
}

function reset() {
  document.body.classList.remove("launching");
  window.opener.resetComponent(componentId);
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const mouse = new Mouse(canvas);
const paramConfig = new ParamConfig(
  "./config.json",
  document.querySelector("#cfg-outer")
);
paramConfig.addCopyToClipboardHandler("#share-btn");

const monitorCoords = Vector.ONE;
window.onmousemove = (evt) => {
  if (
    monitorCoords.x !== evt.screenX - evt.clientX ||
    monitorCoords.y !== evt.screenY - evt.clientY
  ) {
    monitorCoords.setHead(evt.screenX - evt.clientX, evt.screenY - evt.clientY);
    drawAllComponents();
  }
};
function getMonitorCoords() {
  return monitorCoords;
}

let componentId = 0;
const foodComponents = {};
const componentNamePrefix = "food-component-";

paramConfig.addListener(() => {
  const currId = componentId++;
  foodComponents[currId] = window.open(
    "./component.html",
    componentNamePrefix + currId,
    `innerWidth=${plateRadii.x * 2},innerHeight=${plateRadii.y * 2},screenX=${
      canvas.width / 2 - plateRadii.x
    },screenY=${
      canvas.height / 2 - plateRadii.y
    },menubar=0,toolbar=0,location=0,status=0,scrollbars=0`
  );
  foodComponents[currId].onbeforeunload = () => {
    if (activeComponents[currId]) resetComponent(currId);
    delete foodComponents[currId];
  };
}, ["add-component"]);

window.onresize = (evt) => {
  canvas.width = $("#canvas").width();
  canvas.height = $("#canvas").height();
  drawPlate();
  for (let component of Object.values(foodComponents)) {
    component.onresize();
  }
};

ctx.strokeStyle = "white";

const tps = 20;
const foodGravityAcceleration = new Vector(0, 1);
const plateMinSize = new Vector(100, 70);
const radiusMaxOffset = plateMinSize.copy().multiply(3);
const plateRimPercent = 0.7;
const plateRimWidthPercent = 0.05;
const plateHitboxPercent = plateRimPercent * 0.9;
let plateRadii;
let plateCoords = Vector.ONE;
let foodConfig;

fetch("food-config.json")
  .then((resp) => resp.json())
  .then((data) => (foodConfig = data));

function getFoodConfig() {
  return foodConfig;
}

function getId(id) {
  return +id.slice(componentNamePrefix.length);
}

function getPlateRadii() {
  return plateRadii;
}

const activeComponents = {};
const componentContainers = [];
let alreadyRunning = false;
let lastTime;

function registerComponentContainer(containerEl, getContainerCoords) {
  componentContainers.push({
    el: containerEl,
    getCoords: getContainerCoords,
  });
}

function launchComponent(currId, initialVel, initialPos, imgPath, width) {
  const el = $(
    `<img data-component-id="${currId}" src="${imgPath}" style="width: ${width}px; left: ${initialPos.x}px; top: ${initialPos.y}px;">`
  );
  $("#food-components").append(el);
  componentContainers.forEach((container) => {
    const coords = new Vector(el.offset().left, el.offset().top)
      .add(monitorCoords)
      .sub(container.getCoords());
    container.el.append(el.clone().offset({ left: coords.x, top: coords.y }));
  });
  activeComponents[currId] = {
    vel: initialVel,
    pos: initialPos,
    el: el,
    stopped: false,
  };
  if (!alreadyRunning) {
    alreadyRunning = true;
    lastTime = Date.now();
    mainLoop();
  }
}

function resetComponent(currId) {
  activeComponents[currId].el.remove();
  componentContainers.forEach((container) =>
    container.el.find(`[data-component-id=${currId}]`).remove()
  );
  delete activeComponents[currId];
}

function drawAllComponents() {
  let notStopped = false;

  for (let currId of Object.keys(activeComponents)) {
    const component = activeComponents[currId];
    notStopped = notStopped || !component.stopped;
    component.el.offset({ left: component.pos.x, top: component.pos.y });
    componentContainers.forEach((container) => {
      const coords = component.pos
        .copy()
        .add(monitorCoords)
        .sub(container.getCoords());
      container.el
        .find(`[data-component-id=${currId}]`)
        .offset({ left: coords.x, top: coords.y });
    });
  }

  return notStopped;
}

const updateComponents = (dt) => {
  for (let component of Object.values(activeComponents)) {
    if (component.stopped) continue;
    component.vel.add(foodGravityAcceleration.copy().multiply(dt));
    component.pos.add(component.vel);

    if (
      plateCoords.x - plateRadii.x * plateHitboxPercent < component.pos.x &&
      plateCoords.x + plateRadii.x * plateHitboxPercent > component.pos.x &&
      plateCoords.y - plateRadii.y * plateHitboxPercent < component.pos.y &&
      plateCoords.y + plateRadii.y * plateHitboxPercent > component.pos.y
    ) {
      component.stopped = true;
    }
  }
};

const mainLoop = () => {
  const currTime = Date.now();
  const dt = (currTime - lastTime) / (1000 / tps);
  lastTime = currTime;

  updateComponents(dt);

  drawPlate();
  if (drawAllComponents()) {
    requestAnimationFrame(mainLoop);
  } else {
    alreadyRunning = false;
  }
};

const drawPlate = () => {
  plateRadii = radiusMaxOffset
    .copy()
    .multiply(paramConfig.getVal("scale"))
    .add(plateMinSize);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  plateCoords.setHead(canvas.width / 2, canvas.height - plateRadii.y * 1.2);

  ctx.fillStyle = "#E5EDF0";
  ctx.beginPath();
  ctx.ellipse(
    plateCoords.x,
    plateCoords.y,
    plateRadii.x,
    plateRadii.y,
    0,
    0,
    2 * Math.PI
  );
  ctx.fill();

  const rimGradient = ctx.createLinearGradient(
    canvas.width / 2 - plateRadii.x,
    0,
    canvas.width / 2 + plateRadii.x,
    0
  );
  rimGradient.addColorStop(0.4, "#CFD0D2");
  rimGradient.addColorStop(0.6, "#F8F9FB");

  ctx.fillStyle = rimGradient;
  ctx.beginPath();
  ctx.ellipse(
    plateCoords.x,
    plateCoords.y,
    plateRadii.x * (plateRimPercent + plateRimWidthPercent / 2),
    plateRadii.y * (plateRimPercent + plateRimWidthPercent / 2),
    0,
    0,
    2 * Math.PI
  );
  ctx.fill();

  ctx.fillStyle = "#E5EDF0";
  ctx.beginPath();
  ctx.ellipse(
    plateCoords.x,
    plateCoords.y,
    plateRadii.x * (plateRimPercent - plateRimWidthPercent / 2),
    plateRadii.y * (plateRimPercent - plateRimWidthPercent / 2),
    0,
    0,
    2 * Math.PI
  );
  ctx.fill();
};

const init = () => {
  window.onresize();
  paramConfig.addListener(window.onresize, ["scale"]);
};

paramConfig.onLoad(init);

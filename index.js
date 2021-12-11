const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const mouse = new Mouse(canvas);
const paramConfig = new ParamConfig(
  "./config.json",
  document.querySelector("#cfg-outer")
);
paramConfig.addCopyToClipboardHandler("#share-btn");

window.onresize = (evt) => {
  canvas.width = $("#canvas").width();
  canvas.height = $("#canvas").height();
  draw();
};

ctx.strokeStyle = "white";

const plateMinSize = new Vector(100, 70);
const radiusMaxOffset = plateMinSize.copy().multiply(3);
const plateRimPercent = 0.7;
const plateRimWidthPercent = 0.05;

const draw = () => {
  const plateRadii = radiusMaxOffset
    .copy()
    .multiply(paramConfig.getVal("scale"))
    .add(plateMinSize);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#E5EDF0";
  ctx.beginPath();
  ctx.ellipse(
    canvas.width / 2,
    canvas.height / 2,
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
    canvas.width / 2,
    canvas.height / 2,
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
    canvas.width / 2,
    canvas.height / 2,
    plateRadii.x * (plateRimPercent - plateRimWidthPercent / 2),
    plateRadii.y * (plateRimPercent - plateRimWidthPercent / 2),
    0,
    0,
    2 * Math.PI
  );
  ctx.fill();
  // Animation code
};

const init = () => {
  window.onresize();
  paramConfig.addListener(window.onresize, ["scale"]);
};

paramConfig.onLoad(init);

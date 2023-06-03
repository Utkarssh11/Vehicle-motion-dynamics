let primaryStroke;

let wheels = []
let connections = [];
let checkPrecision = 1;

let groundHeights = {}; // store all x coords known

let paused = false;

function setup() {
  createCanvas(innerWidth, innerHeight);

  primaryStroke = color(255);

  initializeCar();

  noiseSeed(0.1);
}

function initializeCar() {
  wheels = [
    {
      id: 'wheel1',
      pos: createVector(100, 0),
      oldPos: createVector(100, 0),
      radius: 30,
      control: ['left', 'right']
    },
    {
      id: 'wheel2',
      pos: createVector(150, 0),
      oldPos: createVector(150, 0),
      radius: 30,
      control: ['left', 'right']
    }
  ];

  connections = [
    {
      ends: ['wheel1', 'wheel2'],
      length: 50,
      springiness: 0
    }
  ];
}

function getGroundHeight(x) {
  if (Object.keys(groundHeights).includes(round(x).toString())) {
    return groundHeights[round(x).toString()];
  }

  let inp = x - width / 2;

  let fOut = 10 * noise((x) / 100);

  return height - 50 - fOut;
}

function draw() {
  background(40);

  let scroll = getScroll();
  drawGround(scroll, 8);
  drawWheels(scroll);
  drawConnections(scroll);

  if (!paused) {
    applyVerlet(0.01);
  } else {
    wheels.forEach((wheel) => {
      wheel.oldPos = wheel.pos.copy();
    })
  }
  for (let i = 0; i < 8; i++) {
    applyConstraints();
  }

  if (mouseIsPressed) {
    addGround(scroll.x + mouseX, (keyIsDown(SHIFT) ? -1 : 1) * 2, 100);
  }
}

function keyPressed() {
  if (key === ' ') {
    paused = !paused;
  }
  if (key === 'r') {
    groundHeights = {};
    initializeCar();
  }
}

function applyVerlet(friction) {
  wheels.forEach((wheel) => {
    let oldPos = wheel.oldPos;
    wheel.oldPos = JSON.parse(JSON.stringify(wheel.pos));
    let diff = createVector(wheel.pos.x - oldPos.x, wheel.pos.y - oldPos.y);
    wheel.pos.add(diff.mult(1 - friction));
  });
}

function applyConstraints() {
  if (!paused) {
    wheels.forEach((wheel) => {
      wheel.pos.add(createVector(0, 0.03));
    });
  }

  handleControls(0.1);

  wheels.forEach((wheel) => {
    let center = wheel.pos;
    let radius = wheel.radius;

    for (let x = center.x; abs(x - center.x) <= radius; x = center.x - (x - center.x + ((x > center.x) * 2 - 1) * checkPrecision)) {
      let center = wheel.pos;
      let radius = wheel.radius;

      let groundTop = createVector(x, getGroundHeight(x));
      if (center.dist(groundTop) < radius / 2) {
        let diff = p5.Vector.sub(center, groundTop);
        diff.setMag(radius / 2);
        wheel.pos = p5.Vector.add(groundTop, diff);
      }
    }
  });

  connections.forEach((connection) => {
    let ends = [wheelById(connection.ends[0]), wheelById(connection.ends[1])];
    let wheelConnection = createVector(ends[1].pos.x - ends[0].pos.x, ends[1].pos.y - ends[0].pos.y);
    let oldWheelConnection = wheelConnection.copy();

    wheelConnection.setMag(connection.length);

    ends[0].pos.x += (oldWheelConnection.x - wheelConnection.x) / 2 * (1 - connection.springiness);
    ends[0].pos.y += (oldWheelConnection.y - wheelConnection.y) / 2 * (1 - connection.springiness);

    ends[1].pos.x -= (oldWheelConnection.x - wheelConnection.x) / 2 * (1 - connection.springiness);
    ends[1].pos.y -= (oldWheelConnection.y - wheelConnection.y) / 2 * (1 - connection.springiness);
  });
}

function handleControls(moveSpeed) {
  let controlDir = (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) ? 'right' : ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) ? 'left' : null);
  if (controlDir) {
    wheels.forEach((wheel) => {
      if (wheel.control.includes(controlDir) && isTouchingGround(wheel)) {
        let oldPos = wheel.oldPos;
        let pos = wheel.pos;

        let dir = createVector(pos.x - oldPos.x, pos.y - oldPos.y);
        dir.setMag(moveSpeed);
        if ((abs(dir.heading()) >= PI / 2 && controlDir === 'right') || (abs(dir.heading()) <= PI / 2 && controlDir === 'left')) {
          dir.mult(-1);
        }

        wheel.pos.add(dir);
      }
    });
  }
}

function isTouchingGround(wheel) {
  let center = wheel.pos;
  let radius = wheel.radius;

  for (let x = center.x; abs(x - center.x) <= radius; x = center.x - (x - center.x + ((x > center.x) * 2 - 1) * checkPrecision)) {
    let center = wheel.pos;
    let radius = wheel.radius;

    let groundTop = createVector(x, getGroundHeight(x));
    if (center.dist(groundTop) <= radius / 2) {
      return true;
    }
  }

  return false;
}

function wheelById(id) {
  matching = null;
  wheels.forEach((wheel) => {
    if (wheel.id === id) {
      matching = wheel;
      return;
    }
  });
  if (matching) {
    return matching;
  }
}

function wheelIndexById(id) {
  index = -1;
  wheels.forEach((wheel, i) => {
    if (wheel.id === id) {
      index = i;
      return;
    }
  });
  return index;
}

function drawGround(scroll, resolution) {
  let lastPoint;
  for (let x = 1; x - resolution < width; x += resolution) {
    let newPoint = createVector(x, getGroundHeight(x + scroll.x) - scroll.y);
    if (lastPoint) {
      line(lastPoint.x, lastPoint.y, newPoint.x, newPoint.y);
    }

    lastPoint = newPoint;
  }
}

function drawWheels(scroll) {
  noFill();
  stroke(primaryStroke);
  strokeWeight(5);
  wheels.forEach((wheel) => {
    circle(wheel.pos.x - scroll.x, wheel.pos.y - scroll.y, wheel.radius);
  });
}

function drawConnections(scroll) {
  stroke(primaryStroke);
  strokeWeight(5);
  connections.forEach((connection) => {
    let wheel1 = wheelById(connection.ends[0]);
    let wheel2 = wheelById(connection.ends[1]);
    line(wheel1.pos.x - scroll.x, wheel1.pos.y - scroll.y, wheel2.pos.x - scroll.x, wheel2.pos.y - scroll.y);
  });
}

function getScroll() {
  let avgWheelPos = createVector(0, 0);
  wheels.forEach((wheel) => {
    avgWheelPos.add(wheel.pos);
  });
  avgWheelPos.div(wheels.length);

  return createVector(avgWheelPos.x - width / 2, avgWheelPos.y - constrain(avgWheelPos.y, 80, height - 80));
}

function addGround(x, amount, spread) {
  for (let xOffset = -spread; xOffset <= spread; xOffset += 1) {
    groundHeights[round(x + xOffset)] = getGroundHeight(round(x + xOffset)) - (xOffset < 0 ? easeInOutCubic(0, amount, (spread + xOffset) / spread) : easeInOutCubic(amount, 0, xOffset / spread));
  }
}

function easeInOutCubic(a, b, t) {
  return lerp(a, b, t < 0.5 ? 4 * t ** 3 : 1 - pow(-2 * t + 2, 2) / 2);
}
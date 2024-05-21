let prey;
let pursuer;
let gainSlider, delaySlider, preySpeedSlider, pursuerSpeedSlider;

function setup() {
  createCanvas(800, 600);

  // Create sliders for gain, perception delay, and speeds
  createP('Gain');
  gainSlider = createSlider(0.1, 5, 1, 0.1); // 0.1 to 5, initial value 1, step 0.1
  
  createP('Perception Delay (ms)');
  delaySlider = createSlider(0, 500, 100, 10);
  
  createP('Prey Speed');
  preySpeedSlider = createSlider(1, 10, 4, 0.1);

  createP('Prey Randomness');
  preyRandomnessSlider = createSlider(0, 10, 1, 0.01);
  
  createP('Pursuer Speed');
  pursuerSpeedSlider = createSlider(1, 50, 10, 0.1);

  // Initialize prey and pursuer objects
  prey = new Prey();
  pursuer = new Pursuer();
}

function draw() {
  background(220);

  // Update prey and pursuer
  prey.update();
  pursuer.update(prey);

  // Display prey and pursuer
  prey.display();
  pursuer.display();
}

// Prey class
class Prey {
  constructor() {
    this.position = createVector(random(width), random(height));
    this.velocity = createVector(random(-1, 1), random(-1, 1)).normalize().mult(preySpeedSlider.value());
	this.direction = createVector(random(-1, 1), random(-1, 1)).normalize()
	this.randVec = createVector(random(-1, 1), random(-1, 1)).normalize().mult(preyRandomnessSlider.value());
  }

  update() {
    this.velocity = p5.Vector.mult(this.direction, preySpeedSlider.value());
	this.randVec = createVector(random(-1, 1), random(-1, 1)).normalize().mult(preyRandomnessSlider.value());
	this.velocity = p5.Vector.add(this.randVec, this.velocity);
    this.position.add(this.velocity);
    this.edges();
  }

  display() {
    fill(255, 0, 0);
    ellipse(this.position.x, this.position.y, 10, 10);
  }

  edges() {
    if (this.position.x > width) this.position.x = 0;
    if (this.position.x < 0) this.position.x = width;
    if (this.position.y > height) this.position.y = 0;
    if (this.position.y < 0) this.position.y = height;
  }
}

// Pursuer class
class Pursuer {
  constructor() {
    this.position = createVector(random(width), random(height));
    this.velocity = createVector(0, 0);
    this.heading = createVector(1, 0);
  }

  update(prey) {
    let gain = gainSlider.value();
    let delay = delaySlider.value();
    let preySpeed = preySpeedSlider.value();
    let pursuerSpeed = pursuerSpeedSlider.value();

    // Compute the delayed position of the prey
    let delayedPreyPosition = p5.Vector.add(prey.position, p5.Vector.mult(prey.velocity, delay / 1000));

    // Compute the range vector
    let rangeVector = p5.Vector.sub(delayedPreyPosition, this.position);

    // Compute the heading adjustment
    let desiredHeading = rangeVector.copy().normalize();
    this.heading.lerp(desiredHeading, gain * 0.01); // Adjust heading with gain

    // Update velocity and position
    this.velocity = this.heading.copy().mult(pursuerSpeed);
    this.position.add(this.velocity);
    this.edges();
  }

  display() {
    fill(0, 0, 255);
    ellipse(this.position.x, this.position.y, 20, 20);
  }

  edges() {
    if (this.position.x > width) this.position.x = 0;
    if (this.position.x < 0) this.position.x = width;
    if (this.position.y > height) this.position.y = 0;
    if (this.position.y < 0) this.position.y = height;
  }
}


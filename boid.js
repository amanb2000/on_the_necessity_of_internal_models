let boids = [];
let predator;
let numBoids = 50;
let targetBoid;
let targetBoidSelector;

function setup() {
  createCanvas(800, 600);

  // Initialize boids
  for (let i = 0; i < numBoids; i++) {
    boids.push(new Boid(i));
  }

  // Initialize predator
  predator = new Predator();

  // Create dropdown for selecting the target boid
  targetBoidSelector = createSelect();
  targetBoidSelector.position(10, height + 10);
  for (let i = 0; i < numBoids; i++) {
    targetBoidSelector.option('Boid ' + i, i);
  }
  targetBoidSelector.changed(() => {
    targetBoid = boids[int(targetBoidSelector.value())];
  });

  // Set initial target boid
  targetBoid = boids[0];
}

function draw() {
  background(220);

  // Update and display boids
  for (let boid of boids) {
    boid.update(boids, predator);
	
	if (boid.idx == int(targetBoidSelector.value())) {
		console.log("Target Boid: " + boid.idx)
		boid.display(100, 100, 255);
	}
    else {
		boid.display(0, 170, 0);
    }
  }

  // Update and display predator
  predator.update(targetBoid);
  predator.display();
}

// Boid class
class Boid {
  constructor(idx) {
    this.position = createVector(random(width), random(height));
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector();
    this.maxForce = 0.2;
    this.maxSpeed = 3;
	this.idx = idx;
  }

  update(boids, predator) {
    this.flock(boids, predator);
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.acceleration.mult(0);
    this.edges();
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  flock(boids, predator) {
    let separation = this.separation(boids).mult(1.5);
    let alignment = this.alignment(boids).mult(1.0);
    let cohesion = this.cohesion(boids).mult(1.0);
    let avoidance = this.avoid(predator).mult(2.0);

    this.applyForce(separation);
    this.applyForce(alignment);
    this.applyForce(cohesion);
    this.applyForce(avoidance);
  }

  separation(boids) {
    let perceptionRadius = 50;
    let steer = createVector();
    let count = 0;

    for (let other of boids) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other !== this && d < perceptionRadius) {
        let diff = p5.Vector.sub(this.position, other.position);
        diff.div(d * d); // Weight by distance
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
      steer.setMag(this.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(this.maxForce);
    }

    return steer;
  }

  alignment(boids) {
    let perceptionRadius = 50;
    let steering = createVector();
    let count = 0;

    for (let other of boids) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other !== this && d < perceptionRadius) {
        steering.add(other.velocity);
        count++;
      }
    }

    if (count > 0) {
      steering.div(count);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }

    return steering;
  }

  cohesion(boids) {
    let perceptionRadius = 50;
    let steering = createVector();
    let count = 0;

    for (let other of boids) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other !== this && d < perceptionRadius) {
        steering.add(other.position);
        count++;
      }
    }

    if (count > 0) {
      steering.div(count);
      steering.sub(this.position);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }

    return steering;
  }

  avoid(predator) {
    let perceptionRadius = 100;
    let steering = createVector();
    let d = dist(this.position.x, this.position.y, predator.position.x, predator.position.y);

    if (d < perceptionRadius) {
      steering = p5.Vector.sub(this.position, predator.position);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }

    return steering;
  }

  display() {
    fill(0, 255, 0);
    stroke(200);
    ellipse(this.position.x, this.position.y, 10, 10);
  }
  display(r, g, b){
	fill(r, g, b);
	stroke(200);
	ellipse(this.position.x, this.position.y, 10, 10);
  }

  edges() {
    if (this.position.x > width) this.position.x = 0;
    if (this.position.x < 0) this.position.x = width;
    if (this.position.y > height) this.position.y = 0;
    if (this.position.y < 0) this.position.y = height;
  }
}

// Predator class
class Predator {
  constructor() {
    this.position = createVector(random(width), random(height));
    this.velocity = createVector(0, 0);
    this.maxSpeed = 5;
    this.maxForce = 0.5;
  }

  update(targetBoid) {
    let target = targetBoid.position.copy();
    let desired = p5.Vector.sub(target, this.position);
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxForce);

    this.velocity.add(steer);
    this.position.add(this.velocity);
    this.edges();
  }

  display() {
    fill(255, 0, 0);
    stroke(0);
    ellipse(this.position.x, this.position.y, 20, 20);
  }

  edges() {
    if (this.position.x > width) this.position.x = 0;
    if (this.position.x < 0) this.position.x = width;
    if (this.position.y > height) this.position.y = 0;
    if (this.position.y < 0) this.position.y = height;
  }
}


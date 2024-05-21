let boids = [];
let predator;
let numBoids = 50;
let targetBoid;
let targetBoidSelector;
let killTimer = 0;

// Sliders for boid parameters
let boidMaxForceSlider, boidMaxSpeedSlider, perceptionRadiusSlider;

// Sliders for predator parameters
let predatorMaxSpeedSlider, predatorMaxForceSlider, killTimeSlider;

// Slider for number of boids
let numBoidsSlider;

function setup() {
    const canvas = createCanvas(800, 600);
    canvas.parent('canvas');

    // Create sliders for boid parameters
    boidMaxForceSlider = createSlider(0.1, 1.0, 0.2, 0.01).parent('boid-max-force');
    boidMaxSpeedSlider = createSlider(1, 5, 3, 0.1).parent('boid-max-speed');
    perceptionRadiusSlider = createSlider(10, 100, 50, 1).parent('perception-radius');

    // Create sliders for predator parameters
    predatorMaxSpeedSlider = createSlider(1, 10, 5, 0.1).parent('predator-max-speed');
    predatorMaxForceSlider = createSlider(0.1, 1.0, 0.5, 0.01).parent('predator-max-force');
    killTimeSlider = createSlider(100, 5000, 1000, 100).parent('kill-time');

    // Create slider for number of boids
    numBoidsSlider = createSlider(1, 200, 50, 1).parent('num-boids');

    // Initialize boids
    for (let i = 0; i < numBoids; i++) {
        boids.push(new Boid(i));
    }

    // Initialize predator
    predator = new Predator();

    // Create dropdown for selecting the target boid
    targetBoidSelector = createSelect().parent('target-boid-selector');
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

    // Display slider values
    fill(0);
    text(`Boid Max Force: ${boidMaxForceSlider.value()}`, 10, height - 220);
    text(`Boid Max Speed: ${boidMaxSpeedSlider.value()}`, 10, height - 200);
    text(`Perception Radius: ${perceptionRadiusSlider.value()}`, 10, height - 180);
    text(`Predator Max Speed: ${predatorMaxSpeedSlider.value()}`, 10, height - 160);
    text(`Predator Max Force: ${predatorMaxForceSlider.value()}`, 10, height - 140);
    text(`Kill Time (ms): ${killTimeSlider.value()}`, 10, height - 120);
    text(`Number of Boids: ${numBoidsSlider.value()}`, 10, height - 100);

    // Update the number of boids
    adjustBoids(numBoidsSlider.value());

    // Update and display boids
    for (let boid of boids) {
        boid.update(boids, predator);
        
        if (boid.idx == int(targetBoidSelector.value())) {
            boid.display(100, 100, 255);
        } else {
            boid.display(0, 170, 0);
        }
    }

    // Update and display predator
    predator.update(targetBoid);
    predator.display();

    // Display perception radius of the target boid
    noFill();
    stroke(0, 0, 255, 100);
    ellipse(targetBoid.position.x, targetBoid.position.y, perceptionRadiusSlider.value() * 2);

    // Plot velocity vector of the predator
    stroke(255, 0, 0);
    line(predator.position.x, predator.position.y, predator.position.x + predator.velocity.x * 10, predator.position.y + predator.velocity.y * 10);

    // Plot range vector pointing toward the target boid
    stroke(0, 255, 0);
    line(predator.position.x, predator.position.y, targetBoid.position.x, targetBoid.position.y);

    // Check if the predator is within the radius of the prey
    let distance = dist(predator.position.x, predator.position.y, targetBoid.position.x, targetBoid.position.y);
    if (distance < perceptionRadiusSlider.value()) {
        killTimer += deltaTime;
        if (killTimer > killTimeSlider.value()) {
            console.log(`Boid ${targetBoid.idx} caught by predator!`);
            targetBoid = boids[int(random(numBoids))];
            targetBoidSelector.value(targetBoid.idx);
            killTimer = 0;
        }
    } else {
        killTimer = 0;
    }
}

function adjustBoids(newNumBoids) {
    if (newNumBoids > boids.length) {
        let currentLength = boids.length;
        for (let i = currentLength; i < newNumBoids; i++) {
            boids.push(new Boid(i));
            targetBoidSelector.option('Boid ' + i, i);
        }
    } else if (newNumBoids < boids.length) {
        boids.splice(newNumBoids, boids.length - newNumBoids);
        targetBoidSelector.html(''); // Clear options
        for (let i = 0; i < newNumBoids; i++) {
            targetBoidSelector.option('Boid ' + i, i);
        }
        targetBoidSelector.value(targetBoid.idx); // Set to current target boid
    }
}

// Boid class
class Boid {
    constructor(idx) {
        this.position = createVector(random(width), random(height));
        this.velocity = p5.Vector.random2D();
        this.acceleration = createVector();
        this.idx = idx;
    }

    update(boids, predator) {
        this.maxForce = boidMaxForceSlider.value();
        this.maxSpeed = boidMaxSpeedSlider.value();
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
        let perceptionRadius = perceptionRadiusSlider.value();
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
        let perceptionRadius = perceptionRadiusSlider.value();
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
        let perceptionRadius = perceptionRadiusSlider.value();
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

    display(r, g, b) {
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
    }

    update(targetBoid) {
        this.maxSpeed = predatorMaxSpeedSlider.value();
        this.maxForce = predatorMaxForceSlider.value();

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


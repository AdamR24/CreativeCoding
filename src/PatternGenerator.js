import {sketch} from 'p5js-wrapper';

// ConfigurationOptions

const ParticleCount = 5000; // Number of particles to be created // Recommended range 250 - 10000 (Higher still looks good but doesn't run smoothly)
const MaxFrameCount = 500; // Number of frames until particles stop moving // Recommended range 30 - 500
const NoiseIncrement = 0.2; // Increment for noise, smaller = smoother, larger = more chaotic // Recommended range 0 - 0.4
const GridSize = 20; // Size of each cell in the grid, smaller = more detail, larger = simpler // Recommended range 5 - 50
const FlowMagnitude = 0.1; // Modifies how much the particles move each frame, smaller = smoother lines, larger = more jagged lines // Recommended range 0.1 - 2
const LineThickness = 1.2; // Changes the thickness of the lines, smaller = thinner, larger = thicker // Recommended range 0.5 - 3

let grid = [];
let cols, rows;
let particles = [];

class Particle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = 2;
        this.hue = random(255);
        this.alpha = random(30, 80);
    }

    follow(vectors) {
        let x = Math.floor(this.pos.x / GridSize);
        let y = Math.floor(this.pos.y / GridSize);
        let index = x + y * cols;
        let force = vectors[index];
        this.acc.add(force);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    show() {
        stroke(this.hue, 100, 200);
        strokeWeight(LineThickness);
        strokeCap(ROUND);
        stroke(this.hue, 100, 50, this.alpha);
        point(this.pos.x, this.pos.y);
    }
}

sketch.setup = function() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSL);
    background(0, 0, 20);

    cols = Math.floor(width / GridSize);
    rows = Math.floor(height / GridSize);

    let yOffset = 0;
    for (let y = 0; y < rows; y++) {
        let xOffset = 0;
        for (let x = 0; x < cols; x++) {
            let angle = noise(xOffset, yOffset) * TWO_PI * 2;
            let v = p5.Vector.fromAngle(angle);
            v.setMag(FlowMagnitude);
            grid[x + y * cols] = v;
            xOffset += NoiseIncrement;
        }
        yOffset += NoiseIncrement;
    }

    for (let i = 0; i < ParticleCount; i++) {
        particles[i] = new Particle();
    }
}

sketch.draw = function() {
    particles.forEach(particle => {
        particle.follow(grid);
        particle.update();
        particle.show();
    })

    if (frameCount > MaxFrameCount)
        noLoop();
}

// Using redraw doesn't work in this situation because the flow field is generated inside setup to help with performance
// Setting window.location to itself results in the page refreshing
sketch.mousePressed = function() {
    window.location = window.location;
}
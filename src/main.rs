#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Point {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

impl Point {
    pub fn new(x: f32, y: f32, z: f32) -> Self {
        Self { x, y, z }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AABB {
    pub min: Point,
    pub max: Point,
}

impl AABB {
    pub fn empty() -> Self {
        Self {
            min: Point::new(f32::INFINITY, f32::INFINITY, f32::INFINITY),
            max: Point::new(f32::NEG_INFINITY, f32::NEG_INFINITY, f32::NEG_INFINITY),
        }
    }

    pub fn new(min: Point, max: Point) -> Self {
        Self { min, max }
    }
}

fn main() {
    println!("BVH Builder for Splats");
}

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

    pub fn expand(&mut self, p: &Point) {
        self.min.x = self.min.x.min(p.x);
        self.min.y = self.min.y.min(p.y);
        self.min.z = self.min.z.min(p.z);
        self.max.x = self.max.x.max(p.x);
        self.max.y = self.max.y.max(p.y);
        self.max.z = self.max.z.max(p.z);
    }

    pub fn merge(&self, other: &AABB) -> AABB {
        AABB {
            min: Point::new(
                self.min.x.min(other.min.x),
                self.min.y.min(other.min.y),
                self.min.z.min(other.min.z),
            ),
            max: Point::new(
                self.max.x.max(other.max.x),
                self.max.y.max(other.max.y),
                self.max.z.max(other.max.z),
            ),
        }
    }
}

#[derive(Debug)]
pub enum BVHNode {
    Leaf {
        bounds: AABB,
        points: Vec<Point>,
    },
    Inner {
        bounds: AABB,
        left: Box<BVHNode>,
        right: Box<BVHNode>,
    },
}

impl BVHNode {
    pub fn bounds(&self) -> AABB {
        match self {
            BVHNode::Leaf { bounds, .. } => *bounds,
            BVHNode::Inner { bounds, .. } => *bounds,
        }
    }

    pub fn build(mut points: Vec<Point>) -> Self {
        let mut bounds = AABB::empty();
        for p in &points {
            bounds.expand(p);
        }
        
        if points.len() <= 4 {
            return BVHNode::Leaf { bounds, points };
        }

        let dx = bounds.max.x - bounds.min.x;
        let dy = bounds.max.y - bounds.min.y;
        let dz = bounds.max.z - bounds.min.z;

        let mut axis = 0;
        if dy > dx && dy > dz { axis = 1; }
        if dz > dx && dz > dy { axis = 2; }

        points.sort_by(|a, b| {
            let va = match axis { 0 => a.x, 1 => a.y, _ => a.z };
            let vb = match axis { 0 => b.x, 1 => b.y, _ => b.z };
            va.partial_cmp(&vb).unwrap()
        });

        let mid = points.len() / 2;
        let right_points = points.split_off(mid);
        let left_points = points;

        let left = Box::new(BVHNode::build(left_points));
        let right = Box::new(BVHNode::build(right_points));

        BVHNode::Inner {
            bounds,
            left,
            right,
        }
    }
}

pub struct BVH {
    pub root: Option<BVHNode>,
}

impl BVH {
    pub fn new(points: Vec<Point>) -> Self {
        if points.is_empty() {
            Self { root: None }
        } else {
            Self {
                root: Some(BVHNode::build(points)),
            }
        }
    }
}

fn main() {
    println!("BVH Builder for Splats");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_point() {
        let p = Point::new(1.0, 2.0, 3.0);
        assert_eq!(p.x, 1.0);
    }

    #[test]
    fn test_aabb() {
        let mut aabb = AABB::empty();
        aabb.expand(&Point::new(0.0, 0.0, 0.0));
        aabb.expand(&Point::new(1.0, 1.0, 1.0));
        assert_eq!(aabb.min.x, 0.0);
        assert_eq!(aabb.max.x, 1.0);
    }
}

# Animation Prototype

It's time to work on a new animation. We are gonna build it up carefully.

Let's start with a prototype page.
- it has the same background as the welcome page.
- it stores all parameters in variables at the top of the code, so that I can tweak them.
- It can import existing CSS, and also add its own styles. Don't modify app css.

# Step 1: the cylinder

Let's draw a rectangle.

The rectangle is a projection of a cylinder, standing up on its end. I cannot see either end of the cylinder. Only its side.

Start with 600px height, 100px width.

# Step 2: the cylinder has stripes

Along the surface of the cylinder are vertical lines. These lines are every 30px going around -- not 30px on the screen, you have to project them onto the rectangle as they would look when they're every 30px around the circumference of the cylinder.


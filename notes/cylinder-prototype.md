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

Try to give it a background that makes it look round.

# Step 2: the cylinder has stripes

Along the surface of the cylinder are vertical lines. They're a bright gold so I can see them easily. These lines are every 30px going around -- not 30px on the screen, you have to project them onto the rectangle as they would look when they're every 30px around the circumference of the cylinder.

# Step 3:

Make the cylinder roll.

Make it roll across the screen. Give me buttons for roll left, roll right.

The stripes will make it very clear that it is rolling.

# failure

... this isn't getting me there.

Maybe I should start by getting it to develop a mathematical model of a 2px-thick surface rolled into a spiral.

Yeah, the logo as an inspiration. Start from the spiral. Make it unroll.
It can do that part as an svg.

Then draw the projection of it from the side at the same time.

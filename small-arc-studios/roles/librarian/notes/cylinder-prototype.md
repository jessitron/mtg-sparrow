# Animation Prototype

It's time to work on a new animation. We are gonna build it up carefully.

Let's start with a prototype page.

- it stores all parameters in variables at the top of the code, so that I can tweak them.
- Use its own styles. Don't modify app css.
- Use dark brown for the background.

# Step 1: the spiral

Draw an Archimedean spiral (like the app logo) in SVG. It's a solid color though, maybe khaki.

The 'start' of the spiral is the outermost point.

Make this spiral start at the left, instead of at the top.

Make whatever parameters are needed for this, including the thickness of the spiral (stroke width), and the gap between successive turns of the spiral. (do you have better words for this? I welcome them.)

# step: variable length

Make a parameter for the 'length' of the spiral, like the total length of the curved line. Use this to calculate how many times the spiral should go around.

# Step 2: the spiral unrolls

Add an "unroll" button.

The metaphor: this is a scroll (like a rolled-up piece of paper), viewed from above. The wall is on the left side.

When I push unroll:
- The outermost point of the spiral (on the left) stays anchored — this is where the paper meets the wall.
- The coil unrolls, converting curved spiral into a straight vertical line that extends downward along the left edge (hugging the wall).
- The remaining coil shrinks and its center shifts leftward to keep its left edge flush against the wall (against the straight line).
- The straight line gets longer as the coil gets smaller.

# Step 3: the reverse

Make a "roll up" button that reverses this.

Then add a parameter for stopping-point: the remaining length of spiral before it stops unrolling. (Measured as length of the still-coiled portion.)

# The analysis

Now write formulas for

- the length of the straight line
- the height of the remaining spiral
- the position of the remaining spiral

# The projection

The spiral represents a scroll with a z-depth of 600px (the width of the paper, going "into" the screen from the top-down spiral view).

Draw the side view next to the spiral. In this projection:
- When fully rolled: a rectangle (coil diameter tall × 600px wide)
- As it unrolls: the rectangle shrinks in height (smaller coil) and moves down, with a flat strip (the unrolled paper) pressed against the wall above it, growing taller
- The flat paper strip has essentially zero thickness in the side view

The side view shows the real story — the paper being revealed as the scroll unrolls. Like dough for cinnamon rolls.

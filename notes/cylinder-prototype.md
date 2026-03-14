# Animation Prototype

It's time to work on a new animation. We are gonna build it up carefully.

Let's start with a prototype page.

- it stores all parameters in variables at the top of the code, so that I can tweak them.
- Use its own styles. Don't modify app css.
- Use dark brown for the background.

# Step 1: the spiral

Draw a spiral like the app logo, in svg. It's a solid color though, maybe khaki.

The 'start' of the spiral is the outermost point.

Make this spiral start at the left, instead of at the top.

Make whatever parameters are needed for this, including the thickness of the spiral, and the spacing between the different layers of the spiral. (do you have better words for this? I welcome them.)

# step: variable length

Make a parameter for the 'length' of the spiral, like the total length of the curved line. Use this to calculate how many times the spiral should go around.

# Step 2: the spiral unrolls

Add an "unroll" button.

When I push it, the start of the spiral stays where it is. The rest of the spiral rolls downward.

The center of the spiral will move as this happens, to keep the outer edge of the shrinking spiral lined up on the left.

The curve is slowly converted into a straight line going down the page.

# Step 3: the reverse

Make a "roll up" button that reverses this.

Then add a parameter for stopping-point, for how much of the spiral is left before it stops unrolling.

# The analysis

Now write formulas for

- the length of the straight line
- the height of the remaining spiral
- the position of the remaining spiral

# The projection

Imagine the spiral has a z-height of 600px. What would it look like from the side? Draw this projection next to the spiral, as it unrolls and rolls like the dough for cinnamon rolls.

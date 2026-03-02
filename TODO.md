# Client notes

## End screen refinements

(this section is done)

Let's get some terminology. There are four levels in this app: allied guilds, enemy guilds, wedges, and shards.
On the end screen, I want completed levels to show information sections; and then a "Next Level" button at the bottom that starts the slides for the next level.

The information sections are currently columns, but I want them to be rows. That way we have the full screen width for each information section.

Each information section has three parts, which can be columns in desktop, or however they fit on Mobile.

1. Summary.
   a. A title
   b. description. eg, "Allied Guilds\nMagic's five colors form a circle: ☀️ 💧 💀 🔥 🌿. Allied guilds are pairs of neighboring colors"
   c. The list of the color combos in this level, with their names.
2. The color circle, with lines connecting the color combos in this level. This should be in the center of the page.
3. A section that is blank until a color combo is highlighted, and then shows a flavorful description of that color combo.

As part of this, we need to come up with the flavorful description of each color combo.
Here's some source material: https://magic.wizards.com/en/news/feature/flavorful-guide-guilds-ravnica-20

eg, for Boros, say stuff about how the Boros Legion values order, honor, glory. They have a military hierarchy and enforce the law. They consider themselves righteous and brave. Lots of angels and soldiers. Include the name of the guild; but not its story really. I'm more looking for adjectives, philosophy, how they think of themselves, what they think the world needs more of. Include a link to "More Boros cards" which goes to https://scryfall.com/search?q=c%3Drw+-is%3Aub (scryfall for exactly red + white, exclude Universes Beyond).

Also based on this description, let's make sure the card selection for Boros includes Aurelia. (It's cool to add to the list of cards for each color.)

### After that

OK, it implemented something I didn't like. Let's try to describe this.

The sections are each good, don't change the appearance of the sections.

add a header and a footer to the page. The header has a wide "up" button. The footer has a wide "down" button. (for now, they can say that, we can iterate on that later.)

The main body between those shows one information section. The section height is such that the other ones don't show.

When you push the "down" button, the main body of the page scrolls to the next section. Similarly for "Up", it takes you to the previous section.
Also when you scroll the main body of the page more than a tiny bit, it kind of clinks to show the next section. Like in a slot machine, the different pictures settle into place.

Now, if you haven't unlocked the next section, then the "down" button changes to "Next level" and it takes you to the slides for that level. If you've unlocked all levels and you're at the last section, the "down" button changes to "Share" which is a placeholder for now.
If you're in the first section, the "up" button changes to "home" and takes you to the home page.

If you hit the end page while nothing is open, then instead it only shows you a link to home.

## Other

- Where is the librarian hiding notes?
- move settings to upper right
- slideshow footer colors
- when paused, make space resume. (Space doesn't pause, because it advances when the slideshow is running.)
- add markers to Honeycomb on deploy
- add an 'about' page with acknowledgements
- add a license file, CC0
- ask the project lead for general professionalism and cleanup
- on mobile, make the opening screen have fewer words
- implement share
- change consulting process to not have a separate SOW step, it seems like a lot

- implement wedges and shards.
- tutorial in single colors? with speech bubbles to tell them what to say.
- silly one for four-color? "not red"
- silly one for wubrg
- add a sneaky one for colorless? ... that would be a level above.
- add a mixed level??? ooh yeah that would be fun. as a bonus level

- audio!

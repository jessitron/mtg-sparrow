# Client notes

## End screen refinements

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

I want only one information section to show at each time. after a slide session, when we land on the end screen, it's the information section for the level just completed.
Above the information section is a big up arrow button, which slides the screen to the previous level's information section. Below the information section is a big down arrow button, which slides to the next level's information section. Or if they haven't completed the next level, it's a button that starts the slide session for the next level.

This way the color circle can be fully and satisfyingly centered (on desktop).

At the top of the first level is a "home" button, which takes you to the welcome screen.
At the bottom of the last level is a "share" button, which, um... I don't know what that does yet, it can be a placeholder unless you have a good idea.

## Other

- BUG: I'm not seeing the self-assessment screen
- BUG: home -> slides -> end -> back: goes to slides but the slideshow doesn't start. It's frozen.
- on the slides, move or remove the card count.
- when paused, make space resume. (Space doesn't pause, because it advances when the slideshow is running.)
- make an animation between a slide and the self-assessment. It shrinks or folds or something
- add markers to Honeycomb on deploy
- add an 'about' page with acknowledgements
- add a license file, CC0
- ask the project lead for general professionalism and cleanup
- on mobile, make the opening screen have fewer words

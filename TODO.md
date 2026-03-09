# Client notes

- BUG: the "home" link on the end screen doesn't work in production. Can you look at the current URL and remove "/end" from it, instead of using "/"?
- when the slide loads but the card image hasn't loaded yet, then it changes size. Load the slide with a placeholder the same size as the card so it doesn't move when the image loads.
- update the end screen URL when switching between info sections, so that if someone c&p the link, it'll take the recipient to the right page.
  - remove the cards and completed URL params when changing the other
- on the slides, move the pause button to the right - put it in the same place the pause button is on the home screen (the one for the mana gas).
- when paused, make the space key resume. (Space doesn't pause, because it advances when the slideshow is running.)
- also make tapping the slide resume from pause... or maybe it should advance but not start playing?
- Add a progress marker to the end screen, like some dots at the left that shows where you are and that you could move up or down. I think they defined an arc for this but then we got distracted in a different direction
- add markers to Honeycomb on deploy
- add an 'about' page with acknowledgements. Include scryfall, that wiki where we got the mana and guild symbols, that Wizards article where we got the flavorful guild descriptions.
- implement Share further, like make it show some links to share on social media, etc.
- a support link that goes to my Patreon (requires client help)
  - and some Patreon levels that are specific to this
  - which means I need stickers
- AI-friendly versions that give it the info this app supplies? so that agents and bots can read the page usefully. they don't need the slideshow, they need all the nice descriptive text though.
- make the settings into a hamburger? with About and Share, it's more of a general menu than settings
- Make the "current trace" link only present if "debug=true" is in local storage. Update this local storage attribute if you ever see 'debug=bool' as a query param
- on the home page, give players a button for each level they've unlocked. Change "learn" to "practice" for the ones they've completed.
- VISUAL BUG: on the end screen, when it loads on Allied Guilds (the top section), the "up" arrow chevron starts visible then moves down to hide. I think both arrows should start in their hidden positions, and then the ones that need to be visible slide out. That will draw attention to them.
- build a board in Honeycomb to see site usage

# Expanding features

- tutorial in single colors? with speech bubbles to tell them what to say.
  - start with a level (section info) on single colors that's always unlocked.
- silly one for four-color? "not red" Just 5 slides. ... once you look at all of them it unlocks wubrg and colorless
- silly one for wubrg (always wubrg)
- add a sneaky one for colorless? ... that would be a level above. It's kind of an easter egg
- easter egg: add Steve and Sad Robot, with cute annotations that point to them, and link to articles explaining the name
- add a mixed level??? ooh yeah that would be fun. as a bonus level
- internationalization. add German
- and maybe Canadian? that's mostly Audio, what if I got Jim to record the words

- audio!

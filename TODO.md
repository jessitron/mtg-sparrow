# Client notes

- Make the "current trace" link only present if "debug=true" is in local storage. Update this local storage attribute if you ever see 'debug=bool' as a query param
- update the end screen URL when switching between info sections, so that if someone c&p the link, it'll take the recipient to the right page.
  - remove the cards and completed URL params when changing the other
- on the slides, move the pause button to the right - put it in the same place the pause button is on the home screen (the one for the mana gas).
- when paused, make the space key resume. (Space doesn't pause, because it advances when the slideshow is running.)
- also make tapping the slide when paused advance but not start playing
- Add a progress marker to the end screen, like some dots at the left that shows where you are and that you could move up or down. I think they defined an arc for this but then we got distracted in a different direction
- implement Share further, like make it show some links to share on social media, etc.
- a support link that goes to my Patreon (requires client help)
  - and some Patreon levels that are specific to this
- AI-friendly versions that give it the info this app supplies? so that agents and bots can read the page usefully. they don't need the slideshow, they need all the nice descriptive text though.
- on the home page, give players a button for each level they've unlocked. Change "learn" to "practice" for the ones they've completed.
- VISUAL BUG: on the end screen, when it loads on Allied Guilds (the top section), the "up" arrow chevron starts visible then moves down to hide. I think both arrows should start in their hidden positions, and then the ones that need to be visible slide out. That will draw attention to them.
- on the end screen, can we make it look a little more like a window maybe ... I want bits of the next sections to show (maybe less visible) so that people know there's more to scroll to.
- on the end screen, there is a vertical size that hides the down arrow. It seems to find this arrow optional.
  - maybe, on a sufficiently squatty screen, the chevrons get replaced with something smaller, so that it fits?
  - ideally for that shape the up/down move to the right or the left. This is a nice-to-have. (but this site is all about these little niceties, that is what's fun about it)
- let's talk about the color pallette. Pull all colors from everywhere in the site into variables (or make a report of them), and then let's get them standardized on fewer.
  - some of the text could have more contrast. like 
- build a board in Honeycomb to see site usage
- the minimizing welcome screen, see if it can precisely shrink to the button. Being able to do this calculation will teach me some things that will be useful in mtg-deck-shuffler
- a newsletter landing page on ConvertKit, and then we need to get the agent to write exciting upate emails.
- a changelog

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

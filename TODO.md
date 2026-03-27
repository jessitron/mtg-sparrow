# Client notes

## other

- the logs for local storage updates are not showing in the context of the page trace
- a cute 404 page
- o11y: put the session id and player ID on every span event as well.
- o11y: add the scryfall URL to the card spans
- on the home page, pushing 'pause' or 'fan' should make a log. (not a span event, because the span might have ended)
- What would make this site show up in google search for MTG color combo names? that's what could really make it have an impact.
- How many people are we trying to reach? Make an impact assessment.
- update the end screen URL when switching between info sections, so that if someone c&p the link, it'll take the recipient to the right page.
- make the logo into a game? I wanna click it and it spins clockwise, and as the end of the spiral hits mana symbols they light up (with their usual color), and then it stops somewhere randomly, settles on one mana symbol and leaves that one lit. The harder I click (hold, or click repeatedly) the faster it goes.
- on the slides page: when paused, make the space key resume. (Space doesn't pause, because it advances when the slideshow is running.)
- on the slides page: make tapping the slide when paused advance but not start playing
- Add a progress marker to the end screen, like some dots at the left that shows where you are and that you could move up or down. I think they defined an arc for this but then we got distracted in a different direction
- implement Share further, like make it show some links to share on social media, etc.
- a support link that goes to my Patreon (requires client help)
  - and some Patreon levels that are specific to this
- AI-friendly versions that give it the info this app supplies? so that agents and bots can read the page usefully. they don't need the slideshow, they need all the nice descriptive text though.
- Remove the instructions from the home page; replace with tutorial
- on the home page, give players a button for each level they've unlocked. Change "learn" to "practice" for the ones they've completed.
- VISUAL BUG: on the end screen, when it loads on Allied Guilds (the top section), the "up" arrow chevron starts visible then moves down to hide. I think both arrows should start in their hidden positions, and then the ones that need to be visible slide out. That will draw attention to them.
- Bug on the end screen: "Next Level" button only shows below the Allied Guilds section. It should show below every section if the first level they haven't completed is below this one.
- on the end screen, can we make it look a little more like a window maybe ... I want bits of the next sections to show (maybe less visible) so that people know there's more to scroll to.
- on the end screen, there is a vertical size that hides the down arrow. It seems to find this arrow optional.
  - maybe, on a sufficiently squatty screen, the chevrons get replaced with something smaller, so that it fits?
  - ideally for that shape the up/down move to the right or the left. This is a nice-to-have. (but this site is all about these little niceties, that is what's fun about it)
- let's talk about the color pallette. Pull all colors from everywhere in the site into variables (or make a report of them), and then let's get them standardized on fewer.
- o11y: run an OTel Collector so that sendBeacon works for span export. Currently the SDK falls back to XHR because Honeycomb needs auth headers, which sendBeacon can't send. A collector on same-origin (or localhost) removes the need for auth headers in the browser — the collector adds them server-side. This would make pre-navigation spans (like debug.mode_changed) reliable without UI delays.
  - this is an infrastructure problem for jess to solve, not something we would solve in this repo.
- build a board in Honeycomb to see site usage
- get email alerts to jessitron@gmail.com if
  - someone fills out the newsletter form
  - someone sends feedback
  - traffic is up 100% from a week ago
- the minimizing welcome screen, see if it can precisely shrink to the button. Being able to do this calculation will teach me some things that will be useful in mtg-deck-shuffler
- a changelog
- add feedback and share to the about page

## Expanding features

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

## idea for testing

what if I had a spy installed in the website that could notice movement, position, etc and tell the AI about it? that could say "the scroll is not fully in the viewport" or "the level name moved" or "the title is almost aligned with the content but not quite" or "the footer text is very low-contrast"

Specifically, right now, I need it to have a way to know that there is a flash of the first slide in the wrong size before the card image loads.

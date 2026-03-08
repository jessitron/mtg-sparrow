# Client notes

- BUG: the "home" link on the end screen doesn't work in production. Can you look at the current URL and remove "/end" from it, instead of using "/"?
- when the slide loads but the card image hasn't loaded yet, then it changes size. Load the slide with a placeholder the same size as the card so it doesn't move when the image loads.
- update the end screen URL when switching between info sections, so that if someone c&p the link, it'll take the recipient to the right page.
  - remove the cards and completed URL params when changing the other
- When arriving at the end screen from an Enemy Guilds session, there's a flash of Allied Guilds before it moves to Enemy guilds. What if the section opened (like it's a scroll) after the page loads, which would give some time? so it starts with 0 height and then transitions to open.
- add a "feedback" link in the settings. It can open a little popup asking for the feedback, which then gets added to telemetry. Then set up a trigger in Honeycomb (just 1x/day) that sends me an email if we get any feedback.
- when paused, make the space key resume. (Space doesn't pause, because it advances when the slideshow is running.)
- also make tapping the slide resume... or maybe it should advance but not start playing?
- Add a progress marker to the end screen, like some dots at the left that shows where you are and that you could move up or down
- add markers to Honeycomb on deploy
- add an 'about' page with acknowledgements. Include scryfall, that wiki where we got the mana and guild symbols, that Wizards article where we got the flavorful guild descriptions.
- add a license file, CC0
- ask the project lead for general professionalism and cleanup
- on mobile, make the opening screen have fewer words (client to curate)
- implement Share, like make it show some links to share on social media, etc.
- change consulting process to not have a separate SOW step, it seems like a lot
- a custom URL, obvs.
- a support link that goes to my Patreon
  - and some Patreon levels that are specific to this
  - which means I need stickers
- AI-friendly versions that give it the info this app supplies?
- make the settings into a hamburger? with About and Share, it's more of a general menu than settings
- Make the "current trace" link only present if "debug=true" is in local storage. Update this local storage attribute if you ever see 'debug=bool' as a query param

# Expanding features

- on the home page, give them a button for each level they've unlocked. Change "learn" to "practice" for the ones they've completed.
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

# El Guacal — Product brief

Status: Draft
Author: Pedro (with Claude as editor)
Date: 2026-04-11
Supersedes: the prose brief that previously lived in the README

## Why this exists

Everyone needs a taste of home sometimes. For the roughly 7.9 million
Venezuelans living outside Venezuela — about a fifth of the population
of the country we left behind — that taste has a specific shape. It is
Harina P.A.N. for the arepas you make on a Sunday morning. It is queso
de mano crumbled over a black-bean stew. It is Pirulín and Toddy and
Savoy chocolate and the small, ordinary things you stop thinking about
until they are not there any more.

Finding those things outside Venezuela is unreasonably hard. The
information exists, but it lives in Facebook groups, in WhatsApp
chains that go quiet after six months, in a cousin's text thread, in
the memory of one person who used to live in that neighbourhood. It is
not searchable, it goes stale, and it is completely inaccessible to
anyone who is not already plugged in to a diaspora community. I
experienced this myself after moving to London: the only stores I know
about are the ones somebody happened to mention to me, and I have no
idea what exists ten Tube stops away.

El Guacal exists because that information ought to be a map, not a
rumour.

## What El Guacal is

El Guacal is an open, crowdsourced database of every shop, market,
restaurant and distributor where you can buy Venezuelan products
outside Venezuela, together with the specific products each place
carries. Anyone can propose a new location or an edit; a lightweight
moderation pipeline turns proposals into canonical entries; the
resulting dataset is queryable, mappable, and freely licensed so the
diaspora can build on top of it.

The emphasis is on two words in that definition. *Open* means the
dataset itself, not only the app on top of it, is the thing we are
building — the app is the first reader, not the product. *Specific*
means we treat "carries Harina P.A.N." as a different fact from
"carries Venezuelan products in general," because experience says
those two facts matter to users in completely different ways.

## What a guacal is, and why it is the right name

A *guacal* in Venezuelan Spanish is a slatted wooden crate used to
carry fruit, vegetables and fragile goods — the standard commercial
unit at street markets like Mercado de Quinta Crespo, Mercado de
Chacao, or Mercado de Guaicaipuro. The word is also used as a rough
unit of measurement: *un guacal de aguacates*, one crate of avocados.
It is culturally specific to Venezuela and the Caribbean coast, not
pan-Latin American, which is exactly what we want. A container for
Venezuelan things, carried across borders, arriving somewhere new —
the metaphor is the product.

## Who this is for

The primary audience is the Venezuelan diaspora: the 7.9 million of us
who left, mostly after 2015, mostly for economic or political reasons,
and who still cook Venezuelan food at home. That population is spread
unevenly — large concentrations in Colombia, Peru, Chile, Spain, the
United States, Portugal and the United Kingdom, and smaller pockets in
almost every OECD country. Every one of those pockets has the same
information problem.

A secondary audience is the people who moved in with Venezuelans —
partners, friends, flatmates — who end up shopping for Venezuelan
ingredients and have no idea where to start.

Every Venezuelan in the primary audience speaks Spanish. English is
a nice-to-have for the secondary audience. This means Spanish must be
the primary language of the product, not a locale switch hidden behind
a dropdown, and the voice of the copy has to sound Venezuelan, not
translated-from-English. "Panita, ¿dónde consigues la Harina P.A.N.
cerca de ti?" hits the audience differently than "Search for stores
carrying Venezuelan products." We write for the first one.

## The shape of the information

The unit of truth in El Guacal is not the location. It is the pair
*(location, product)*. A user does not want to know "is there a
Venezuelan store near me;" they want to know "can I buy Harina P.A.N.
within walking distance tonight." Those are different questions,
because a Colombian tienda in Miami may carry 90% of what a Venezuelan
user wants but label it all in Colombian names, a Turkish corner shop
in Hackney might stock Harina P.A.N. next to the bulgur, and a
Venezuelan restaurant in Madrid has every product on its menu but
sells none of it retail. None of those cases is adequately described
by a yes/no flag on a location.

Concretely: El Guacal's database has `stores` and `products` as
first-class entities, with `store_products` as the many-to-many
linking table, and the user-facing search is filterable by product —
not only by distance. This decision is already reflected in
`apps/server` and the GraphQL schema; this brief just names it
explicitly so every future decision is anchored against it.

## User journeys, reframed

The earlier version of this brief listed four transactional journeys:
find the closest place, add a location, update a location, delete a
location. Those are accurate tasks, but they are not the journeys that
should drive the design. The real journeys start from an emotional
state, not a task state.

*"I just moved to a new city and I am homesick."* A user who has been
in a place for three weeks opens El Guacal for the first time. The
landing experience is not a search box. It is a geolocated answer:
"The nearest store we know about is a twelve-minute walk from here. It
closes at 9pm tonight. It was last verified two weeks ago by somebody
in your area." The product's job is to make that first open feel like
an arrival.

*"I found a place nobody has added yet."* A user who already uses the
product finds a store on the way home from work that is not on the
map. The add flow has to survive being done on a phone, in the street,
in under ninety seconds, with the kind of attention a busy human has
on a Tuesday evening. Every extra field is a drop-off.

*"I went to the store on the map and it was closed for good."* A user
who relied on El Guacal's data and hit a dead store. The flow needs to
turn that failure into a contribution — a single-tap "report this
place closed" that feeds the moderation queue rather than silently
abandoning the user to the next broken experience.

*"I want to check if this place is still here before I go."* A user
who is about to make a 30-minute bus ride wants a confidence signal,
not a commitment. Every location page shows when it was last verified
and by whom, and offers a one-tap "yes, still here" confirmation to
any user who visits. That single interaction is the difference between
a dataset that stays useful and one that becomes a graveyard.

The transactional tasks still exist, but they live underneath the
emotional framing, not in place of it.

## Trust, moderation, and the freshness problem

The earlier version of this brief said "anyone can go to the
repository and add, edit, or remove locations." That is not quite
right, and the fuller answer lives in
[docs/design/contribution-and-moderation.md](../design/contribution-and-moderation.md).
The short version is that proposals are not edits. Every contribution
enters a moderation queue; canonical state is only updated through an
atomic approval transaction; every change is versioned for optimistic
concurrency; every action is audited; rate limits, trust scores, and
Cloudflare Turnstile protect the pipeline from the first scraper or
angry competitor that finds the form. The design anticipates 100k
monthly active users, 100k stores and 1k submissions per day at peak.

What that document does not yet cover, and what this brief commits to
as a first-class concern, is *data decay*. Stores close. Products go
out of stock. Owners change. Opening hours change. Every listing has a
half-life measured in months, and a crowdsourced map without a
freshness mechanism becomes unreliable within a year and unused soon
after. The mitigations El Guacal commits to from day one are three:
every location carries a visible "last verified" timestamp, every
visit offers a one-tap "still here?" confirmation that refreshes that
timestamp without needing the user to fill a form, and stale entries
are visually de-emphasised in the UI after a configurable age (likely
90 days) and eligible for soft-archival after a longer one (likely 180
days). The exact curve is a separate design, but the commitment
belongs in the brief so nothing we build contradicts it later.

## Distribution, sharing, and the open dataset

A crowdsourced map is worthless without a distribution strategy. The
realistic Day 1 channel for El Guacal is not search engines; it is the
Venezuelan WhatsApp groups, Facebook groups and Telegram channels that
already coordinate the diaspora. The product must be shareable the way
those groups share things: a single URL per location that previews
nicely when dropped into a chat, a URL per city that lists every
store, and a URL per product that shows where to buy it. Open Graph
and Twitter Card metadata are not an afterthought — they are the
default way people discover this product.

The dataset is licensed under ODbL (Open Database License), the same
licence OpenStreetMap uses. This is a commitment made now, for free,
that unlocks everything the community might want to build on top of
the data — a Venezuelan restaurants map, a diaspora food price index,
an API for researchers studying migration patterns, a Google Sheets
integration for a community organiser in Chile. The app is the first
consumer of the dataset, not the only one, and the licence is what
makes that statement real.

## Inspirations, and where they stop

The immediate inspiration is
[toiletmap.org.uk](https://www.toiletmap.org.uk/), a crowdsourced map
of public toilets in the UK that has been running for over a decade
and actually works. The data model, the add-edit-remove flow, the
moderation lightness and the public API are all worth studying. Credit
where it is due — El Guacal would be a harder problem to imagine
without ToiletMap having existed first.

Where the analogy stops matters as much as where it starts. Toilets
are geographically uniform, functionally interchangeable, free,
emotionally neutral and politically neutral. Venezuelan product stores
are geographically sparse, functionally non-interchangeable (the store
with Harina P.A.N. may not have queso de mano), priced, emotionally
loaded, and in some cases politically charged — some diaspora members
actively avoid stores they associate with the government, and some
actively seek them out. The UX that works for toilets does not fully
transfer. Where it does, we copy. Where it does not, we redesign from
first principles rather than importing friction that has nothing to do
with our audience.

The second inspiration, less direct but worth naming, is
OpenStreetMap. Not the editor — we are not asking anyone to learn JOSM
— but the *idea* that an open dataset maintained by a small community
of committed contributors, under a permissive licence, can outlast and
outcompete closed alternatives for anything off the beaten path.
El Guacal is almost definitionally off the beaten path, and the OSM
model is the closest precedent we have for how this survives in year
three.

## What "working" looks like in six months

The metric that matters is not downloads or sessions; it is the
number of stores with a verification event in the last 30 days. A
store that has been confirmed as "still there" by a real user in the
last month is a store the product can be trusted on. At six months I
would call El Guacal working if there are at least 300 such stores
spread across at least 20 cities in at least 6 countries, with a
median verification age under 45 days. Those are aggressive targets
for a side project, and they are honest about the fact that
comprehensiveness and freshness are the product — not the map widget,
not the UI, not the tech stack.

## Sustainability

El Guacal is a side project maintained by one Venezuelan engineer in
London (with occasional help from an AI pair), hosted on Firebase and
a small Cloud Run backend, and designed deliberately to have a tiny
operational footprint so it can outlive any single burst of energy.
Concretely, the infra budget is under £20 a month and will stay there
until traffic forces otherwise; the moderation load is bounded by the
rate-limit design in the contribution-and-moderation document; and
the dataset is licensed openly so it can be forked and continued by
someone else if this project goes dormant. None of those decisions
are accidents. A diaspora project that cannot survive a maintainer
taking a six-month break is not a tool for the diaspora; it is a
personal blog.

## Status

The first working version is live at
[el-guacal.web.app](https://el-guacal.web.app/), under construction
and deliberately rough. The design system migration documented in
[ADR 0014](../adrs/0014-visual-design-system-and-design-tokens.md) is
in progress; the moderation pipeline designed in
[contribution-and-moderation.md](../design/contribution-and-moderation.md)
is not yet implemented; the logo is the next near-term piece of work
(see ADR 0015 once it lands). Everything else is a known backlog item
rather than a surprise.

We ship rough because the diaspora forgives rough. We do not ship
unsafe, unlicensed, or unfresh, because the diaspora does not forgive
those.

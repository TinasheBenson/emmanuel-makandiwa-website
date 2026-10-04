/**
 * Gatherings shown on the home page track and the Transforming Lives page.
 * TODO: check each line against the current site's Transforming Lives page.
 * Photos are placeholders (see CREDITS.md) until the ministry's event
 * photography is available.
 */
import johnThreeSixteen from '../assets/media/bible-john-3-16.jpg';
import earthAtNight from '../assets/media/earth-at-night.jpg';
import psalm23 from '../assets/media/bible-psalm-23.jpg';
import starTrails from '../assets/media/star-trails.jpg';
import footprints from '../assets/media/footprints.jpg';

export const stories = [
  {
    title: 'Seminars',
    copy: 'Teaching sessions on faith and everyday life.',
    image: johnThreeSixteen,
    alt: 'An open Bible at John chapter 3',
  },
  {
    title: 'Conferences',
    copy: 'Several days of preaching and worship, with guests from UFIC branches abroad.',
    image: earthAtNight,
    alt: 'City lights seen from orbit at night',
  },
  {
    title: 'Masterclasses',
    copy: 'Smaller sessions with Emmanuel and Ruth on marriage, family, work and money.',
    image: psalm23,
    alt: 'An open Bible at Psalm 23',
  },
  {
    title: 'Judgement Night',
    copy: 'A night of prayer in a stadium, running from evening until morning.',
    image: starTrails,
    alt: 'Star trails over a dark ridge',
  },
  {
    title: 'Outreach',
    copy: 'Help for people in the communities around UFIC branches.',
    image: footprints,
    alt: 'Footprints across a sand dune',
  },
];

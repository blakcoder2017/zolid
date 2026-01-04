/**
 * Testimonials Data
 */
export const testimonials = [
  {
    id: 1,
    name: 'Kwame Asante',
    role: 'Plumber, Accra',
    image: null,
    rating: 5,
    testimonial: 'ZOLID changed my life. I get paid instantly, and the health insurance through RiviaCo gives me peace of mind. No more waiting weeks for payments or worrying about medical bills.',
    type: 'artisan'
  },
  {
    id: 2,
    name: 'Akosua Mensah',
    role: 'Homeowner, East Legon',
    image: null,
    rating: 5,
    testimonial: 'The escrow system gave me confidence to hire someone I didn\'t know. The work was excellent, and I had 30 days warranty. This is how trust should work in Ghana.',
    type: 'client'
  },
  {
    id: 3,
    name: 'Yaw Boateng',
    role: 'Electrician, Tema',
    image: null,
    rating: 5,
    testimonial: 'Before ZOLID, I struggled with clients not paying or paying late. Now I see jobs with locked funds, complete the work, and get paid immediately via MoMo. Small fee, big protection.',
    type: 'artisan'
  },
  {
    id: 4,
    name: 'Efua Osei',
    role: 'Business Owner, Osu',
    image: null,
    rating: 5,
    testimonial: 'I\'ve used ZOLID for multiple projects. The verification system means I only work with certified professionals. The warranty has already saved me money on a repair that failed.',
    type: 'client'
  },
  {
    id: 5,
    name: 'Kofi Adjei',
    role: 'Carpenter, Kasoa',
    image: null,
    rating: 5,
    testimonial: 'The RiviaCo health insurance is a game-changer. My family is covered, and it\'s automatic with every job. ZOLID really cares about artisans beyond just payments.',
    type: 'artisan'
  },
  {
    id: 6,
    name: 'Ama Serwaa',
    role: 'Property Manager, Labone',
    image: null,
    rating: 5,
    testimonial: 'Managing multiple properties means lots of repairs. ZOLID makes it easy to find verified artisans quickly, and the escrow ensures quality work every time. Highly recommend!',
    type: 'client'
  },
];

export const getTestimonialsByType = (type) => {
  return testimonials.filter(t => t.type === type);
};

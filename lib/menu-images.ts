/**
 * Curated menu photography. Existing Supabase image_url values take priority;
 * these URLs are fallbacks for menu rows that do not have an image yet.
 * Wikimedia Commons files are displayed from their original hosts.
 */
const commons = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1000`

export const menuImageByName: Record<string, string> = {
  'Smoky Party Jollof Royale': commons('Party Nigerian jollof rice.jpg'),
  'Ofada Rice & Ayamase Reserve': commons('Ofada Rice.jpg'),
  'Coconut Rice & Jumbo Prawns': commons('Isip (coconut) rice.jpg'),
  'Imperial Fried Rice': commons('African Fried Rice with Fried Plantain and Beef.jpg'),
  'Jollof & Peppered Goat Meat': commons('Nigerian jollof rice.jpg'),
  'Egusi Soup & Pounded Yam': commons('Egusi soup with pounded yam and assorted meats.jpg'),
  'Efo Riro Supreme & Eba': commons('Efo riro and pounded yam.jpg'),
  'Amala, Ewedu & Gbegiri Gourmet': commons('Amala and ewedu with gbegiri soup.jpg'),
  'Banga Soup & Starch': commons('Banga Soup.jpg'),
  'Oha Soup & Fufu': commons('Soup and swallow ( Oha soup and swallow).jpg'),
  'Edikang Ikong & Semo': commons('Edikang ikong.jpg'),
  'Signature Beef Suya Platter': commons('Home made Suya.jpg'),
  'Ram Suya Skewers': commons('Suya.jpg'),
  'Asun Peppered Goat': commons('Chevon pepper soup.jpg'),
  'Charcoal Grilled Chicken (Half)': commons('Grilled chicken meat.jpg'),
  'Grilled Croaker Fish & Yam': commons('Abacha and Ugba with Ponmo and Croaker Fish.jpg'),
  'Peppered Snail Gourmet': commons('Peppered Snail . 1.jpg'),
  'Jumbo Prawn Pepper Soup': commons('Nigerian prepared Pepper-Soup.jpg'),
  'Catfish Pepper Soup (Point & Kill)': commons('Catfish pepper soup with vegetables.jpg'),
  'Grilled Lobster & Yam Porridge': commons('Grilled Lobster (8558909573).jpg'),
  'Small Chops Royale Box': commons('Nigerian Small Chops.jpg'),
  'Gizdodo Deluxe': commons('Chinwe Uzoma kitchen & Lifestyle - How to make gizdodo - This is so GOOD!!! Chinwe Uzoma Kitchen & Lifestyle.png'),
  'Moi Moi Royale': commons('Moi moi with fresh fish and boiled egg.jpg'),
  'Akara & Pap Morning Set': commons('Akara na Akamu (Fried Bean cakes and Pap).jpg'),
  'Asaro Yam Porridge & Smoked Fish': commons('Asaro Yam porridge.jpg'),
  'Chin Chin Gift Jar': 'https://images.unsplash.com/photo-1665554837563-3782d21a676b?auto=format&fit=crop&w=1000&q=85',
  'Puff Puff Tower': commons('Puff-Puff.jpg'),
  'Chapman Royale': commons('A glass of Chapman.jpg'),
  'Zobo Reserve (500ml)': commons('Zobo drink.jpg'),
}

const creditFiles: Record<string, string> = {
  'Smoky Party Jollof Royale': 'Party Nigerian jollof rice.jpg',
  'Ofada Rice & Ayamase Reserve': 'Ofada Rice.jpg',
  'Coconut Rice & Jumbo Prawns': 'Isip (coconut) rice.jpg',
  'Imperial Fried Rice': 'African Fried Rice with Fried Plantain and Beef.jpg',
  'Jollof & Peppered Goat Meat': 'Nigerian jollof rice.jpg',
  'Egusi Soup & Pounded Yam': 'Egusi soup with pounded yam and assorted meats.jpg',
  'Efo Riro Supreme & Eba': 'Efo riro and pounded yam.jpg',
  'Amala, Ewedu & Gbegiri Gourmet': 'Amala and ewedu with gbegiri soup.jpg',
  'Banga Soup & Starch': 'Banga Soup.jpg',
  'Oha Soup & Fufu': 'Soup and swallow ( Oha soup and swallow).jpg',
  'Edikang Ikong & Semo': 'Edikang ikong.jpg',
  'Signature Beef Suya Platter': 'Home made Suya.jpg',
  'Ram Suya Skewers': 'Suya.jpg',
  'Asun Peppered Goat': 'Chevon pepper soup.jpg',
  'Charcoal Grilled Chicken (Half)': 'Grilled chicken meat.jpg',
  'Grilled Croaker Fish & Yam': 'Abacha and Ugba with Ponmo and Croaker Fish.jpg',
  'Peppered Snail Gourmet': 'Peppered Snail . 1.jpg',
  'Jumbo Prawn Pepper Soup': 'Nigerian prepared Pepper-Soup.jpg',
  'Catfish Pepper Soup (Point & Kill)': 'Catfish pepper soup with vegetables.jpg',
  'Grilled Lobster & Yam Porridge': 'Grilled Lobster (8558909573).jpg',
  'Small Chops Royale Box': 'Nigerian Small Chops.jpg',
  'Gizdodo Deluxe': 'Chinwe Uzoma kitchen & Lifestyle - How to make gizdodo - This is so GOOD!!! Chinwe Uzoma Kitchen & Lifestyle.png',
  'Moi Moi Royale': 'Moi moi with fresh fish and boiled egg.jpg',
  'Akara & Pap Morning Set': 'Akara na Akamu (Fried Bean cakes and Pap).jpg',
  'Asaro Yam Porridge & Smoked Fish': 'Asaro Yam porridge.jpg',
  'Chin Chin Gift Jar': 'Chin-chin.jpg',
  'Puff Puff Tower': 'Puff-Puff.jpg',
  'Chapman Royale': 'A glass of Chapman.jpg',
  'Zobo Reserve (500ml)': 'Zobo drink.jpg',
}

export const menuImageCredits = Object.entries(creditFiles).map(([dish, file]) => ({
  dish,
  source: dish === 'Chin Chin Gift Jar'
    ? 'https://unsplash.com/photos/a-bowl-of-food-7y1snMf6yXM'
    : `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file).replaceAll('%20', '_')}`,
}))

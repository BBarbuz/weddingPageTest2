/* ------------------------------------------------------------------
   Dane kolekcji — edytuj tutaj swoje suknie.
   Każda suknia może mieć pole `photos: ['img/nazwa-1.jpg', 'img/nazwa-2.jpg', 'img/nazwa-3.jpg']`.
   Jeśli je dodasz, zamiast ilustracji pojawią się Twoje zdjęcia
   (1. zdjęcie = cała suknia, 2. = góra / detal, 3. = dół / tren).
------------------------------------------------------------------- */

const COLORS = {
  white:      { name: 'Biel optyczna',     hex: '#FDFCF9' },
  ivory:      { name: 'Kość słoniowa',     hex: '#F6EDDD' },
  champagne:  { name: 'Szampan',           hex: '#EAD7BA' },
  blush:      { name: 'Pudrowy róż',       hex: '#F0D2CC' },
  sage:       { name: 'Szałwia',           hex: '#A7B39B' },
  dustyblue:  { name: 'Gołębi błękit',     hex: '#9DB1C6' },
  lavender:   { name: 'Lawenda',           hex: '#BBAED2' },
  terracotta: { name: 'Terakota',          hex: '#C07A5E' },
  burgundy:   { name: 'Burgund',           hex: '#7A2C3A' },
  emerald:    { name: 'Butelkowa zieleń',  hex: '#2F5245' },
  navy:       { name: 'Granat',            hex: '#26304A' },
  black:      { name: 'Czerń',             hex: '#1F1C1E' },
};

const CATEGORIES = {
  wedding:    'Suknie ślubne',
  bridesmaid: 'Dla druhen',
  evening:    'Wieczorowe',
};

const SILHOUETTES = {
  aline:   'Litera A',
  ball:    'Księżniczka',
  mermaid: 'Syrenka',
  sheath:  'Prosta',
};

const NECKLINES = {
  sweetheart:  'Serce',
  v:           'Litera V',
  offshoulder: 'Odkryte ramiona',
  square:      'Karo',
  bateau:      'Łódka',
  halter:      'Halter',
};

const PRODUCTS = [
  {
    id: 'aurelia', name: 'Aurelia', category: 'wedding',
    silhouette: 'aline', neckline: 'sweetheart', lace: 'bodice', sash: true, train: true,
    colors: ['ivory', 'white', 'champagne'], price: 4290, badge: 'Bestseller',
    fabric: 'Tiul jedwabny, koronka chantilly', rating: 4.9, reviews: 128, added: 3,
    description: 'Gorset w kształcie serca pokryty francuską koronką, która miękko przechodzi w zwiewną spódnicę z warstw tiulu. Satynowy pas podkreśla talię, a krótki tren dodaje lekkości przy każdym kroku.',
  },
  {
    id: 'celestyna', name: 'Celestyna', category: 'wedding',
    silhouette: 'ball', neckline: 'offshoulder', sparkle: true, train: true,
    colors: ['white', 'ivory', 'blush'], price: 5890, badge: 'Nowość',
    fabric: 'Tiul z brokatem, mikado', rating: 4.8, reviews: 42, added: 16,
    description: 'Bajkowa suknia księżniczki z odkrytymi ramionami. Kilkanaście warstw połyskującego tiulu tworzy obłok, który mieni się delikatnie w świetle świec.',
  },
  {
    id: 'seraphine', name: 'Seraphine', category: 'wedding',
    silhouette: 'mermaid', neckline: 'v', lace: 'full', sleeves: true, train: true,
    colors: ['ivory', 'champagne'], price: 6490,
    fabric: 'Koronka gipiurowa, tiul illusion', rating: 5.0, reviews: 37, added: 12,
    description: 'Syrenka, która otula sylwetkę jak druga skóra. Długie, transparentne rękawy z gipiury i koronkowe aplikacje spływające aż po tren.',
  },
  {
    id: 'liliana', name: 'Liliana', category: 'wedding',
    silhouette: 'sheath', neckline: 'v',
    colors: ['white', 'ivory'], price: 3190,
    fabric: 'Krepa jedwabna', rating: 4.7, reviews: 89, added: 8,
    description: 'Minimalizm w najczystszej postaci. Prosta, płynna linia z krepy jedwabnej i głęboki dekolt V — dla panny młodej, która stawia na ponadczasową elegancję.',
  },
  {
    id: 'wiktoria', name: 'Wiktoria', category: 'wedding',
    silhouette: 'ball', neckline: 'square', lace: 'bodice', sash: true,
    colors: ['ivory', 'white'], price: 6990, badge: 'Limitowana',
    fabric: 'Satyna duchesse, koronka', rating: 4.9, reviews: 21, added: 10,
    description: 'Królewska suknia z dekoltem karo i koronkowym gorsetem. Ciężka satyna duchesse układa się w szlachetne, głębokie fałdy.',
  },
  {
    id: 'rozalia', name: 'Rozalia', category: 'wedding',
    silhouette: 'aline', neckline: 'bateau', lace: 'full', sleeves: true,
    colors: ['ivory', 'white'], price: 4790, badge: 'Nowość',
    fabric: 'Koronka alençon, tiul', rating: 4.8, reviews: 54, added: 15,
    description: 'Romantyczna, w duchu vintage. Dekolt łódka, koronkowe rękawy i spódnica, na której kwiatowy wzór stopniowo rozpływa się w tiulu.',
  },
  {
    id: 'amelia', name: 'Amelia', category: 'wedding',
    silhouette: 'mermaid', neckline: 'sweetheart', sparkle: true, train: true,
    colors: ['white', 'blush', 'champagne'], price: 5290, oldPrice: 5990,
    fabric: 'Tiul z cekinami', rating: 4.7, reviews: 66, added: 6,
    description: 'Dopasowana do kolan, potem rozkloszowana kaskadą migoczącego tiulu. Suknia na wieczorny pierwszy taniec.',
  },
  {
    id: 'leonia', name: 'Leonia', category: 'wedding',
    silhouette: 'aline', neckline: 'halter',
    colors: ['white', 'ivory'], price: 3590,
    fabric: 'Szyfon, satyna', rating: 4.6, reviews: 33, added: 5,
    description: 'Lekka suknia z wiązaniem halter i odsłoniętymi plecami. Idealna na ślub w plenerze, nad morzem albo w winnicy.',
  },
  {
    id: 'oliwia', name: 'Oliwia', category: 'wedding',
    silhouette: 'sheath', neckline: 'offshoulder',
    colors: ['ivory', 'champagne'], price: 2890, oldPrice: 3290,
    fabric: 'Krepa stretch', rating: 4.5, reviews: 47, added: 2,
    description: 'Subtelna, prosta sylwetka z odkrytymi ramionami. Świetnie sprawdzi się na ślub cywilny i kameralne przyjęcie.',
  },
  {
    id: 'estera', name: 'Estera', category: 'wedding',
    silhouette: 'ball', neckline: 'v', lace: 'bodice', sleeves: true, sparkle: true, train: true,
    colors: ['white'], price: 7490,
    fabric: 'Tiul z brokatem, koronka', rating: 5.0, reviews: 12, added: 14,
    description: 'Nasza najbardziej spektakularna kreacja. Koronkowy gorset z rękawami illusion, długi tren i spódnica jak rozgwieżdżone niebo.',
  },

  /* ---------- Druhny ---------- */
  {
    id: 'kalina', name: 'Kalina', category: 'bridesmaid',
    silhouette: 'aline', neckline: 'v',
    colors: ['sage', 'dustyblue', 'terracotta', 'lavender', 'burgundy'], price: 690, badge: 'Bestseller',
    fabric: 'Szyfon', rating: 4.8, reviews: 312, added: 4,
    description: 'Ulubiona suknia druhen — zwiewny szyfon, dekolt V i spódnica, która pięknie faluje w tańcu. Dostępna w pięciu modnych odcieniach.',
  },
  {
    id: 'nadia', name: 'Nadia', category: 'bridesmaid',
    silhouette: 'sheath', neckline: 'offshoulder',
    colors: ['dustyblue', 'sage', 'blush', 'navy'], price: 590,
    fabric: 'Krepa', rating: 4.6, reviews: 98, added: 7,
    description: 'Prosta, wysmuklająca sylwetka z odkrytymi ramionami. Elegancka, ale wygodna przez całą noc.',
  },
  {
    id: 'zofia', name: 'Zofia', category: 'bridesmaid',
    silhouette: 'aline', neckline: 'square', sash: true,
    colors: ['terracotta', 'burgundy', 'emerald', 'lavender'], price: 640, badge: 'Nowość',
    fabric: 'Satyna matowa', rating: 4.7, reviews: 41, added: 13,
    description: 'Dekolt karo i paski na ramiona w klimacie lat 90. Matowa satyna o pięknym, głębokim kolorze.',
  },
  {
    id: 'melodia', name: 'Melodia', category: 'bridesmaid',
    silhouette: 'mermaid', neckline: 'halter',
    colors: ['emerald', 'navy', 'burgundy', 'black'], price: 790,
    fabric: 'Aksamit stretch', rating: 4.7, reviews: 57, added: 9,
    description: 'Aksamitna syrenka z wiązaniem halter — dla druhen na zimowy lub wieczorny ślub.',
  },

  /* ---------- Wieczorowe ---------- */
  {
    id: 'malwina', name: 'Malwina', category: 'evening',
    silhouette: 'mermaid', neckline: 'v', sparkle: true,
    colors: ['black', 'navy', 'emerald', 'burgundy'], price: 1290,
    fabric: 'Tiul z cekinami', rating: 4.9, reviews: 73, added: 11,
    description: 'Wieczorowa syrenka obsypana drobnymi cekinami. Na poprawiny, bal albo gala.',
  },
  {
    id: 'iris', name: 'Iris', category: 'evening',
    silhouette: 'aline', neckline: 'offshoulder',
    colors: ['lavender', 'dustyblue', 'blush'], price: 990, oldPrice: 1190,
    fabric: 'Tiul, satyna', rating: 4.6, reviews: 29, added: 1,
    description: 'Pastelowa, tiulowa suknia z odkrytymi ramionami — dla mamy panny młodej lub gościa, który lubi się wyróżnić.',
  },
];

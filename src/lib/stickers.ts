import type { StickerInfo, TeamDef } from './types';

export const GROUPS: Record<string, TeamDef[]> = {
  A: [
    { code: 'MEX', name: 'México', group: 'A', flag: 'MEX' },
    { code: 'RSA', name: 'Sudáfrica', group: 'A', flag: 'RSA' },
    { code: 'KOR', name: 'Corea del Sur', group: 'A', flag: 'KOR' },
    { code: 'CZE', name: 'Rep. Checa', group: 'A', flag: 'CZE' },
    ],
    B: [
    { code: 'CAN', name: 'Canadá', group: 'B', flag: 'CAN' },
    { code: 'BIH', name: 'Bosnia', group: 'B', flag: 'BIH' },
    { code: 'QAT', name: 'Qatar', group: 'B', flag: 'QAT' },
    { code: 'SUI', name: 'Suiza', group: 'B', flag: 'SUI' },
    ],
    C: [
    { code: 'BRA', name: 'Brasil', group: 'C', flag: 'BRA' },
    { code: 'MAR', name: 'Marruecos', group: 'C', flag: 'MAR' },
    { code: 'HAI', name: 'Haití', group: 'C', flag: 'HAI' },
    { code: 'SCO', name: 'Escocia', group: 'C', flag: 'SCO' },
    ],
    D: [
    { code: 'USA', name: 'EEUU', group: 'D', flag: 'USA' },
    { code: 'PAR', name: 'Paraguay', group: 'D', flag: 'PAR' },
    { code: 'AUS', name: 'Australia', group: 'D', flag: 'AUS' },
    { code: 'TUR', name: 'Turquía', group: 'D', flag: 'TUR' },
    ],
    E: [
    { code: 'GER', name: 'Alemania', group: 'E', flag: 'GER' },
    { code: 'CUW', name: 'Curazao', group: 'E', flag: 'CUW' },
    { code: 'CIV', name: 'Costa de Marfil', group: 'E', flag: 'CIV' },
    { code: 'ECU', name: 'Ecuador', group: 'E', flag: 'ECU' },
    ],
    F: [
    { code: 'NED', name: 'Países Bajos', group: 'F', flag: 'NED' },
    { code: 'JPN', name: 'Japón', group: 'F', flag: 'JPN' },
    { code: 'SWE', name: 'Suecia', group: 'F', flag: 'SWE' },
    { code: 'TUN', name: 'Túnez', group: 'F', flag: 'TUN' },
    ],
    G: [
    { code: 'BEL', name: 'Bélgica', group: 'G', flag: 'BEL' },
    { code: 'EGY', name: 'Egipto', group: 'G', flag: 'EGY' },
    { code: 'IRN', name: 'Irán', group: 'G', flag: 'IRN' },
    { code: 'NZL', name: 'Nueva Zelanda', group: 'G', flag: 'NZL' },
    ],
    H: [
    { code: 'ESP', name: 'España', group: 'H', flag: 'ESP' },
    { code: 'CPV', name: 'Cabo Verde', group: 'H', flag: 'CPV' },
    { code: 'KSA', name: 'Arabia Saudita', group: 'H', flag: 'KSA' },
    { code: 'URU', name: 'Uruguay', group: 'H', flag: 'URU' },
    ],
    I: [
    { code: 'FRA', name: 'Francia', group: 'I', flag: 'FRA' },
    { code: 'SEN', name: 'Senegal', group: 'I', flag: 'SEN' },
    { code: 'IRQ', name: 'Irak', group: 'I', flag: 'IRQ' },
    { code: 'NOR', name: 'Noruega', group: 'I', flag: 'NOR' },
    ],
    J: [
    { code: 'ARG', name: 'Argentina', group: 'J', flag: 'ARG' },
    { code: 'ALG', name: 'Argelia', group: 'J', flag: 'ALG' },
    { code: 'AUT', name: 'Austria', group: 'J', flag: 'AUT' },
    { code: 'JOR', name: 'Jordania', group: 'J', flag: 'JOR' },
    ],
    K: [
    { code: 'POR', name: 'Portugal', group: 'K', flag: 'POR' },
    { code: 'COD', name: 'Congo', group: 'K', flag: 'COD' },
    { code: 'UZB', name: 'Uzbekistán', group: 'K', flag: 'UZB' },
    { code: 'COL', name: 'Colombia', group: 'K', flag: 'COL' },
    ],
    L: [
    { code: 'ENG', name: 'Inglaterra', group: 'L', flag: 'ENG' },
    { code: 'CRO', name: 'Croacia', group: 'L', flag: 'CRO' },
    { code: 'GHA', name: 'Ghana', group: 'L', flag: 'GHA' },
    { code: 'PAN', name: 'Panamá', group: 'L', flag: 'PAN' },
    ],
};

export const ALL_TEAMS: TeamDef[] = Object.values(GROUPS).flat();

// ── Real player names — index = sticker_num - 1 ──────────────────────────────
// Format: [Escudo, P1..P11, Plantel, P12..P18]
const PLAYER_NAMES: Record<string, string[]> = {
  // ── Group A ──
  MEX: [
    'Escudo México',
    'Luis Malagón', 'Johan Vásquez', 'Jorge Sánchez', 'César Montes',
    'Jesús Gallardo', 'Israel Reyes', 'Diego Lainez', 'Carlos Rodríguez',
    'Edson Álvarez', 'Orbelín Pineda', 'Marcel Ruiz',
    'Plantel México',
    'Erick Sánchez', 'Hirving Lozano', 'Santiago Giménez', 'Raúl Jiménez',
    'Alexis Vega', 'Roberto Alvarado', 'César Huerta',
  ],
  RSA: [
   'Escudo Sudáfrica', 
   'Ronwen Williams',  'Sipho Chaine',  'Aubrey Modiba',  'Samukele Kabini', 
   'Mbekezeli Mbokazi',  'Khulumani Ndamane',  'Siyabonga Ngezana',  'Khuliso Mudau',
   'Nkosinathi Sibisi',  'Teboho Mokoena',  'Thalente Mbatha',
   'Plantel Sudáfrica',
   'Bathusi Aubaas',  'Yaya Sithole',  'Sipho Mbule',  'Lyle Foster',
   'Iqraam Rayners', 'Mohau Nkota',  'Oswin Appollis',
],
  KOR: [
    'Escudo Corea del Sur',
    'Hyeonwoo Jo', 'Seunggyu Kim', 'Minjae Kim', 'Yumin Cho',
    'Youngwoo Seol', 'Hanbeom Lee', 'Taeseok Lee', 'Myungjae Lee',
    'Jaesung Lee', 'Inbeom Hwang', 'Kangin Lee',
    'Plantel Corea del Sur',
    'Seungho Paik', 'Jens Castrop', 'Donggyeong Lee', 'Guesung Cho',
    'Heungmin Son', 'Heechan Hwang', 'Hyeongyu Oh',
  ],
  CZE: [
    'Escudo República Checa',
    'Matěj Kovář', 'Jindřich Staněk', 'Ladislav Krejčí', 'Vladimír Coufal',
    'Jaroslav Zelený', 'Tomáš Holeš', 'David Zima', 'Michal Sadílek',
    'Lukáš Provod', 'Lukáš Červ', 'Tomáš Souček',
    'Plantel República Checa',
    'Pavel Šulc', 'Matěj Vydra', 'Vasil Kušej', 'Tomáš Chorý',
    'Václav Černý', 'Adam Hložek', 'Patrik Schick',
  ],  

  // ── Group B ──
  CAN: [
    'Escudo Canadá',
    'Dayne St. Clair', 'Alphonso Davies', 'Alistair Johnston', 'Samuel Adekugbe',
    'Richie Laryea', 'Derek Cornelius', 'Moïse Bombito', 'Kamal Miller',
    'Stephen Eustáquio', 'Ismaël Koné', 'Jonathan Osorio',
    'Plantel Canadá',
    'Jacob Shaffelburg', 'Mathieu Choinière', 'Niko Sigur', 'Tajon Buchanan',
    'Liam Millar', 'Cyle Larin', 'Jonathan David',
  ],
  BIH: [
    'Escudo Bosnia y Herzegovina',
    'Nikola Vasilj', 'Amar Dedić', 'Sead Kolašinac', 'Tarik Muharemović',
    'Nihad Mujakić', 'Nikola Katić', 'Amir Hadžiahmetović', 'Benjamin Tahirović',
    'Armin Gigović', 'Ivan Šunjić', 'Ivan Bašić',
    'Plantel Bosnia y Herzegovina',
    'Dženis Burnić', 'Esmir Bajraktarević', 'Amar Memić', 'Ermedin Demirović',
    'Edin Džeko', 'Samed Baždar', 'Haris Tabaković',
  ],
  QAT: [
    'Escudo Qatar',
    'Meshaal Barsham', 'Sultan Al-Brake', 'Lucas Mendes', 'Homam Ahmed',
    'Boualem Khoukhi', 'Pedro Miguel', 'Tarek Salman', 'Mohammed Mannai',
    'Karim Boudiaf', 'Assim Madibo', 'Hamed Fathi',
    'Plantel Qatar',
    'Mohammed Waad', 'Abdulaziz Hatem', 'Hassan Al-Haydos', 'Edmilson Junior',
    'Akram Afif', 'Ahmed Al-Ganehi', 'Almoez Ali',
  ],
  SUI: [
    'Escudo Suiza',
    'Gregor Kobel', 'Yvon Mvogo', 'Manuel Akanji', 'Ricardo Rodríguez',
    'Nico Elvedi', 'Aurèle Amenda', 'Silvan Widmer', 'Granit Xhaka',
    'Denis Zakaria', 'Remo Freuler', 'Fabian Rieder',
    'Plantel Suiza',
    'Ardon Jashari', 'Johan Manzambi', 'Michel Aebischer', 'Breel Embolo',
    'Rubén Vargas', 'Dan Ndoye', 'Zeki Amdouni',
  ],

  // ── Group C ──
  BRA: [
    'Escudo Brasil',
    'Alisson', 'Bento', 'Marquinhos', 'Éder Militão',
    'Gabriel Magalhães', 'Danilo', 'Wesley', 'Lucas Paquetá',
    'Casemiro', 'Bruno Guimarães', 'Luiz Henrique',
    'Plantel Brasil',
    'Vinícius Júnior', 'Rodrygo', 'João Pedro', 'Matheus Cunha',
    'Gabriel Martinelli', 'Raphinha', 'Estevão',
  ],
  MAR: [
    'Escudo Marruecos',
    'Yassine Bounou', 'Munir El Kajoui', 'Achraf Hakimi', 'Noussair Mazraoui',
    'Nayef Aguerd', 'Romain Saïss', 'Jawad El Yamiq', 'Adam Masina',
    'Sofyan Amrabat', 'Azzedine Ounahi', 'Eliesse Ben Seghir',
    'Plantel Marruecos',
    'Bilal El Khannouss', 'Ismael Saibari', 'Youssef En-Nesyri', 'Abde Ezzalzouli',
    'Soufiane Rahimi', 'Brahim Díaz', 'Ayoub El Kaabi',
  ],
  HAI: [
    'Escudo Haití',
    'Johny Placide', 'Carlens Arcus', 'Martin Expérience', 'Jean-Kévin Duverne',
    'Ricardo Adé', 'Duke Lacroix', 'Garven Metusala', 'Hannes Delcroix',
    'Leverton Pierre', 'Danley Jean Jacques', 'Jean-Ricner Bellegarde',
    'Plantel Haití',
    'Christopher Attys', 'Derrick Étienne Jr.', 'Josué Casimir', 'Ruben Providence',
    'Duckens Nazon', 'Louicius Deedson', 'Frantzdy Pierrot',
  ],
  SCO: [
    'Escudo Escocia',
    'Angus Gunn', 'Jack Hendry', 'Kieran Tierney', 'Aaron Hickey',
    'Andrew Robertson', 'Scott McKenna', 'John Souttar', 'Anthony Ralston',
    'Grant Hanley', 'Scott McTominay', 'Billy Gilmour',
    'Plantel Escocia',
    'Lewis Ferguson', 'Ryan Christie', 'Kenny McLean', 'John McGinn',
    'Lyndon Dykes', 'Ché Adams', 'Ben Gannon-Doak',
  ],

  // ── Group D ──
  USA: [
    'Escudo Estados Unidos',
    'Matt Freese', 'Chris Richards', 'Tim Ream', 'Mark McKenzie',
    'Alex Freeman', 'Antonee Robinson', 'Tyler Adams', 'Tanner Tessmann',
    'Weston McKennie', 'Cristian Roldan', 'Timothy Weah',
    'Plantel Estados Unidos',
    'Diego Luna', 'Malik Tillman', 'Christian Pulisic', 'Brenden Aaronson',
    'Ricardo Pepi', 'Haji Wright', 'Folarin Balogun',
  ],
  PAR: [
    'Escudo Paraguay',
    'Roberto Fernández', 'Orlando Gill', 'Gustavo Gómez', 'Fabián Balbuena',
    'Juan José Cáceres', 'Omar Alderete', 'Júnior Alonso', 'Mathías Villasanti',
    'Diego Gómez', 'Damián Bobadilla', 'Andrés Cubas',
    'Plantel Paraguay',
    'Matías Galarza Fonda', 'Julio Enciso', 'Alejandro Romero Gamarra', 'Miguel Almirón',
    'Ramón Sosa', 'Ángel Romero', 'Antonio Sanabria',
  ],
  AUS: [
    'Escudo Australia',
    'Mathew Ryan', 'Joe Gauci', 'Harry Souttar', 'Alessandro Circati',
    'Jordan Bos', 'Aziz Behich', 'Cameron Burgess', 'Lewis Miller',
    'Milos Degenek', 'Jackson Irvine', 'Riley McGree',
    'Plantel Australia',
    "Aiden O'Neill", 'Connor Metcalfe', 'Patrick Yazbek', 'Craig Goodwin',
    'Kusini Yengi', 'Nestory Irankunda', 'Mohamed Touré',
  ],
  TUR: [
    'Escudo Turquía',
    'Uğurcan Çakır', 'Mert Müldür', 'Zeki Çelik', 'Abdülkerim Bardakcı',
    'Çağlar Söyüncü', 'Merih Demiral', 'Ferdi Kadıoğlu', 'Kaan Ayhan',
    'İsmail Yüksek', 'Hakan Çalhanoğlu', 'Orkun Kökçü',
    'Plantel Turquía',
    'Arda Güler', 'İrfan Can Kahveci', 'Yunus Akgün', 'Can Uzun',
    'Barış Alper Yılmaz', 'Kerem Aktürkoğlu', 'Kenan Yıldız',
  ],

  // ── Group E ──
  GER: [
    'Escudo Alemania',
    'Marc-André ter Stegen', 'Jonathan Tah', 'David Raum', 'Nico Schlotterbeck',
    'Antonio Rüdiger', 'Waldemar Anton', 'Ridle Baku', 'Maximilian Mittelstädt',
    'Joshua Kimmich', 'Florian Wirtz', 'Felix Nmecha',
    'Plantel Alemania',
    'Leon Goretzka', 'Jamal Musiala', 'Serge Gnabry', 'Kai Havertz',
    'Leroy Sané', 'Karim Adeyemi', 'Nick Woltemade',
  ],
  CUW: [
    'Escudo Curazao',
    'Eloy Room', 'Armando Obispo', 'Sherel Floranus', 'Jurien Gaari',
    'Joshua Brenet', 'Roshon van Eijma', 'Shurandy Sambo', 'Livano Comenencia',
    'Godfried Roemeratoe', 'Juninho Bacuna', 'Leandro Bacuna',
    'Plantel Curazao',
    'Tahith Chong', 'Kenji Gorré', 'Jearl Margarita', 'Jürgen Locadia',
    'Jeremy Antonisse', 'Gervane Kastaneer', 'Sontje Hansen',
  ],
  CIV: [
    'Escudo Costa de Marfil',
    'Yahia Fofana', 'Ghislain Konan', 'Wilfried Singo', 'Odilon Kossounou',
    'Evan Ndicka', 'Willy Boly', 'Emmanuel Agbadou', 'Ousmane Diomande',
    'Franck Kessié', 'Seko Fofana', 'Ibrahim Sangaré',
    'Plantel Costa de Marfil',
    'Jean-Philippe Gbamin', 'Amad Diallo', 'Sébastien Haller',
    'Simon Adingra', 'Yan Diomande', 'Evann Guessand', 'Oumar Diakité',
  ],
  ECU: [
    'Escudo Ecuador',
    'Hernán Galíndez', 'Gonzalo Valle', 'Piero Hincapié', 'Pervis Estupiñán',
    'Willian Pacho', 'Ángelo Preciado', 'Joel Ordóñez', 'Moisés Caicedo',
    'Alan Franco', 'Kendry Páez', 'Pedro Vite',
    'Plantel Ecuador',
    'John Yeboah', 'Leonardo Campana', 'Gonzalo Plata',
    'Nilson Angulo', 'Alan Minda', 'Kevin Rodríguez', 'Enner Valencia',
  ],

  // ── Group F ──
  NED: [
    'Escudo Países Bajos',
    'Bart Verbruggen', 'Virgil van Dijk', 'Micky van de Ven', 'Jurriën Timber',
    'Denzel Dumfries', 'Nathan Aké', 'Jeremie Frimpong', 'Jan Paul van Hecke',
    'Tijjani Reijnders', 'Ryan Gravenberch', 'Teun Koopmeiners',
    'Plantel Países Bajos',
    'Frenkie de Jong', 'Xavi Simons', 'Justin Kluivert',
    'Memphis Depay', 'Donyell Malen', 'Wout Weghorst', 'Cody Gakpo',
  ],
  JPN: [
    'Escudo Japón',
    'Zion Suzuki', 'Henry Heroki Mochizuki', 'Ayumu Seko', 'Junnosuke Suzuki',
    'Shogo Taniguchi', 'Tsuyoshi Watanabe', 'Kaishu Sano', 'Yuki Soma',
    'Ao Tanaka', 'Daichi Kamada', 'Takefusa Kubo',
    'Plantel Japón',
    'Ritsu Doan', 'Keito Nakamura', 'Takumi Minamino',
    'Shuto Machino', 'Junya Ito', 'Koki Ogawa', 'Ayase Ueda',
  ],
  SWE: [
    'Escudo Suecia',
    'Viktor Johansson', 'Isak Hien', 'Gabriel Gudmundsson', 'Emil Holm',
    'Victor Nilsson Lindelöf', 'Gustaf Lagerbielke', 'Lucas Bergvall',
    'Hugo Larsson', 'Jesper Karlström', 'Yasin Ayari', 'Mattias Svanberg',
    'Plantel Suecia',
    'Daniel Svensson', 'Ken Sema', 'Roony Bardghji',
    'Dejan Kulusevski', 'Anthony Elanga', 'Alexander Isak', 'Viktor Gyökeres',
  ],
  TUN: [
    'Escudo Túnez',
    'Bechir Ben Saïd', 'Aymen Dahmen', 'Yan Valery', 'Montassar Talbi',
    'Yassine Meriah', 'Ali Abdi', 'Dylan Bronn', 'Ellyes Skhiri',
    'Aïssa Laïdouni', 'Ferjani Sassi', 'Mohamed Ali Ben Romdhane',
    'Plantel Túnez',
    'Hannibal Mejbri', 'Elias Achouri', 'Elias Saad',
    'Hazem Mastouri', 'Ismaël Gharbi', 'Sayfallah Ltaief', 'Naïm Sliti',
  ],

  // ── Group G ──
  BEL: [
    'Escudo Bélgica',
    'Thibaut Courtois', 'Arthur Theate', 'Timothy Castagne', 'Zeno Debast',
    'Brandon Mechele', 'Maxim De Cuyper', 'Thomas Meunier', 'Youri Tielemans',
    'Amadou Onana', 'Nicolas Raskin', 'Alexis Saelemaekers',
    'Plantel Bélgica',
    'Hans Vanaken', 'Kevin De Bruyne', 'Jérémy Doku',
    'Charles De Ketelaere', 'Leandro Trossard', 'Loïs Openda', 'Romelu Lukaku',
  ],
  EGY: [
    'Escudo Egipto',
    'Mohamed Elshenawy', 'Mohamed Hany', 'Mohamed Hamdy', 'Yasser Ibrahim',
    'Khaled Sobhi', 'Ramy Rabia', 'Hossam Abdelmaguid',
    'Ahmed Fatouh', 'Marwan Attia', 'Zizo', 'Hamdy Fathy',
    'Plantel Egipto',
    'Mohanad Lasheen', 'Emam Ashour', 'Osama Faisal',
    'Mohamed Salah', 'Mostafa Mohamed', 'Trezeguet', 'Omar Marmoush',
  ],
  IRN: [
    'Escudo Irán',
    'Alireza Beiranvand', 'Morteza Pouraliganji', 'Ehsan Hajsafi', 'Milad Mohammadi', 
    'Shojae Khalilzadeh', 'Ramin Rezaeian', 'Hossein Kanaani', 'Sadegh Moharrami', 
    'Saleh Hardani', 'Saeed Ezatolahi', 'Saman Ghoddos',
    'Plantel Irán',
    'Omid Noorafkan', 'Rouzbeh Cheshmi', 'Mohammad Mohebi',
    'Sardar Azmoun', 'Mehdi Taremi', 'Alireza Jahanbakhsh', 'Ali Gholizadeh',
  ],
  NZL: [
  'Escudo Nueva Zelanda',
  'Max Crocombe', 'Alex Paulsen', 'Michael Boxall', 'Liberato Cacace',
  'Tim Payne', 'Tyler Bindon', 'Francis De Vries', 'Finn Surman',
  'Joe Bell', 'Sarpreet Singh', 'Ryan Thomas',
  'Plantel Nueva Zelanda',
  'Matthew Garbett', 'Marko Stamenic', 'Ben Old',
  'Chris Wood', 'Elijah Just', 'Callum McCowatt', 'Kosta Barbarouses',
],

  // ── Group H ──
  ESP: [
    'Escudo España',
    'Unai Simón', 'Robin Le Normand', 'Aymeric Laporte', 'Dean Huijsen',
    'Pedro Porro', 'Dani Carvajal', 'Marc Cucurella',
    'Martín Zubimendi', 'Rodri', 'Pedri', 'Fabián Ruiz',
    'Plantel España',
    'Mikel Merino', 'Lamine Yamal', 'Dani Olmo',
    'Nico Williams', 'Ferran Torres', 'Álvaro Morata', 'Mikel Oyarzabal',
  ],
  CPV: [
    'Escudo Cabo Verde',
    'Vozinha', 'Logan Costa', 'Pico', 'Diney', 'Steven Moreira',
    'Wagner Pina', 'João Paulo', 'Vannick Semedo', 'Kevin Pina',
    'Patrick Andrade', 'Jamiro Monteiro',
    'Plantel Cabo Verde',
    'Deroy Duarte', 'Garry Rodrigues', 'Jovane Cabral',
    'Ryan Mendes', 'Dailon Livramento', 'Willy Semedo', 'Bebé',
  ],
  KSA: [
    'Escudo Arabia Saudita',
    'Nawaf Alaqidi', 'Abdulrahman Alsanbi', 'Saud Abdulhamid', 'Nawaf Buwashl', 
    'Jehad Thikri', 'Moteb Alharbi', 'Hassan Altambakti', 'Musab Aljuwayr',
    'Ziyad Aljohani', 'Abdullah Alkhaibari', 'Nasser Aldawsari',
    'Plantel Arabia Saudita',
    'Saleh Abu Alshamat', 'Marwan Alsahafi', 'Salem Aldawsari',
    'Abdulrahman Alobud', 'Feras Albrikan', 'Saleh Alshehri', 'Abdullah Alhamdan',
  ],
  URU: [
  'Escudo Uruguay',
  'Sergio Rochet', 'Santiago Mele', 'Ronald Araújo', 'José María Giménez',
  'Sebastián Cáceres', 'Mathías Olivera', 'Guillermo Varela',
  'Nahitan Nández', 'Federico Valverde', 'Giorgian De Arrascaeta', 'Rodrigo Bentancur',
  'Plantel Uruguay',
  'Manuel Ugarte', 'Nicolás De La Cruz', 'Maxi Araújo',
  'Darwin Núñez', 'Federico Viñas', 'Rodrigo Aguirre', 'Facundo Pellistri',
],

  // ── Group I ──
  FRA: [
  'Escudo Francia',
  'Mike Maignan', 'Théo Hernández', 'William Saliba', 'Jules Koundé', 'Ibrahima Konaté',
  'Dayot Upamecano', 'Lucas Digne', 'Aurélien Tchouaméni', 'Eduardo Camavinga',
  'Manu Koné', 'Adrien Rabiot',
  'Plantel Francia',
  'Michael Olise', 'Ousmane Dembélé', 'Bradley Barcola', 'Désiré Doué',
  'Kingsley Coman', 'Hugo Ekitiké', 'Kylian Mbappé',
],

SEN: [
  'Escudo Senegal',
  'Édouard Mendy', 'Yehvann Diouf', 'Moussa Niakhaté',
  'Abdoulaye Seck', 'Ismail Jakobs', 'El Hadji Malick Diouf', 'Kalidou Koulibaly',
  'Idrissa Gana Gueye', 'Pape Matar Sarr', 'Pape Gueye', 'Habib Diallo',
  'Plantel Senegal',
  'Lamine Camara', 'Sadio Mané', 'Ismaïla Sarr', 'Boulaye Dia',
  'Iliman Ndiaye', 'Nicolas Jackson', 'Krèpin Diatta',
],

IRQ: [
  'Escudo Irak',
  'Jalal Hassan', 'Rebin Sulaka', 'Hussein Ali',
  'Akam Hashem', 'Merchas Doski', 'Zaid Tahseen', 'Manaf Younis',
  'Zidane Iqbal', 'Amir Al-Ammari', 'Ibrahim Bayesh', 'Ali Jasim',
  'Plantel Irak',
  'Youssef Amyn', 'Aimar Sher', 'Marko Farji', 'Osama Rashid',
  'Ali Al-Hamadi', 'Aymen Hussein', 'Mohanad Ali',
],
 NOR: [
    'Escudo Noruega',
    'Ørjan Nyland', 'Julian Ryerson', 'Leo Østigård',
    'Kristoffer Vassbakk Ajer', 'Marcus Holmgren Pedersen', 'David Møller Wolfe', 'Torbjørn Heggem',
    'Morten Thorsby', 'Martin Ødegaard', 'Sander Berge', 'Andreas Schjelderup',
    'Plantel Noruega',
    'Patrick Berg', 'Erling Haaland', 'Alexander Sørloth',
    'Aron Dønnum', 'Jørgen Strand Larsen', 'Antonio Nusa', 'Oscar Bobb',
  ],

  // ── Group J ──
  ARG: [
    'Escudo Argentina',
    'Emiliano Martínez', 'Nahuel Molina', 'Cristian Romero', 'Nicolás Otamendi',
    'Nicolás Tagliafico', 'Leonardo Balerdi', 'Enzo Fernández', 'Alexis Mac Allister',
    'Rodrigo De Paul', 'Exequiel Palacios', 'Leandro Paredes',
    'Plantel Argentina',
    'Nico Paz', 'Franco Mastantuono', 'Nico González', 'Lionel Messi',
    'Lautaro Martínez', 'Julián Álvarez', 'Giuliano Simeone',
  ],
  ALG: [
    'Escudo Argelia',
    'Alexis Guendouz','Ramzy Bensebaini', 'Youcef Atal', 'Rayan Aït-Nouri', 
    'Mohamed Amine Tougai', 'Aïssa Mandi', 'Ismaël Bennacer', 'Houssem Aouar', 
    'Hicham Boudaoui', 'Ramiz Zerrouki', 'Nabil Bentaleb',
    'Plantel Argelia',
    'Farès Chaïbi', 'Riyad Mahrez', 'Saïd Benrahma', 'Anis Hadj Moussa',
    'Amine Gouiri', 'Baghdad Bounedjah', 'Mohammed Amoura',
  ],
  AUT: [
    'Escudo Austria',
    'Alexander Schlager', 'Patrick Pentz', 'David Alaba', 'Kevin Danso',
    'Philipp Lienhart', 'Stefan Posch', 'Phillipp Mwene', 'Alexander Prass',
    'Xaver Schlager', 'Marcel Sabitzer', 'Konrad Laimer',
    'Plantel Austria',
    'Florian Grillitsch', 'Nicolas Seiwald', 'Romano Schmid', 'Patrick Wimmer',
    'Christoph Baumgartner', 'Michael Gregoritsch', 'Marko Arnautović',
  ],
  JOR: [
    'Escudo Jordania',
    'Yazeed Abulaila', 'Ihsan Haddad', 'Mohammad Abu Hashish', 'Vazan Al-Arab',
    'Abdallah Nasib', 'Saleem Obaid', 'Mohammad Abualnadi', 'Ibrahim Saadeh',
    'Nizar Al-Rashdan', 'Noor Al-Rawabdeh', 'Mohannad Abu Taha',
    'Plantel Jordania',
    'Amer Jamous', 'Mousa Al-Taamari', 'Yazan Al-Naimat', 'Mahmoud Al-Mardi',
    'Ali Olwan', 'Mohammad Abu Zrayq', 'Ibrahim Sabra',
  ],

  // ── Group K ──
  POR: [
    'Escudo Portugal',
    'Diogo Costa', 'José Sá', 'Rúben Dias', 'João Cancelo',
    'Diogo Dalot', 'Nuno Mendes', 'Gonçalo Inácio', 'Bernardo Silva',
    'Bruno Fernandes', 'Rúben Neves', 'Vitinha',
    'Plantel Portugal',
    'João Neves', 'Cristiano Ronaldo', 'Francisco Trincão', 'João Félix',
    'Gonçalo Ramos', 'Pedro Neto', 'Rafael Leão',
  ],
  COD: [
    'Escudo Congo DR',
    'Lionel Mpasi', 'Aaron Wan-Bissaka', 'Axel Tuanzebe', 'Arthur Masuaku',
    'Chancel Mbemba', 'Joris Kayembe', 'Charles Pickel', 'Ngal\'ayel Mukau',
    'Edo Kayembe', 'Samuel Moutoussamy', 'Noah Sadiki',
    'Plantel Congo DR',
    'Théo Bongonda', 'Meschack Elia', 'Yoane Wissa', 'Brian Cipenga',
    'Fiston Mayele', 'Cédric Bakambu', 'Nathanaël Mbuku',
  ],
  UZB: [
    'Escudo Uzbekistán',
    'Utkir Yusupov', 'Farrukh Sayfiev', 'Sherzod Nasrullaev', 'Umar Eshmurodov',
    'Husniddin Aliqulov', 'Rustam Ashurmatov', 'Khojiakbar Alijonov', 'Abdukodir Khusanov',
    'Odiljon Hamrobekov', 'Otabek Shukurov', 'Jamshid Iskanderov',
    'Plantel Uzbekistán',
    'Azizbek Turgunboev', 'Khojimat Erkinov', 'Eldor Shomurodov', 'Oston Urunov',
    'Jaloliddin Masharipov', 'Igor Sergeev', 'Abbosbek Fayzullaev',
  ],
  COL: [
    'Escudo Colombia',
    'Camilo Vargas', 'David Ospina', 'Dávinson Sánchez', 'Yerry Mina',
    'Daniel Muñoz', 'Johan Mojica', 'Jhon Lucumí', 'Santiago Arias',
    'Jefferson Lerma', 'Kevin Castaño', 'Richard Ríos',
    'Plantel Colombia',
    'James Rodríguez', 'Juan Fernando Quintero', 'Jorge Carrascal', 'Jhon Arias',
    'Jhon Córdoba', 'Luis Suárez', 'Luis Díaz',
  ],

  // ── Group L ──
  ENG: [
    'Escudo Inglaterra',
    'Jordan Pickford', 'John Stones', 'Marc Guéhi', 'Ezri Konsa',
    'Trent Alexander-Arnold', 'Reece James', 'Dan Burn', 'Jordan Henderson',
    'Declan Rice', 'Jude Bellingham', 'Cole Palmer',
    'Plantel Inglaterra',
    'Morgan Rogers', 'Anthony Gordon', 'Phil Foden', 'Bukayo Saka',
    'Harry Kane', 'Marcus Rashford', 'Ollie Watkins',
  ],
  CRO: [
    'Escudo Croacia',
    'Dominik Livaković', 'Duje Ćaleta-Car', 'Joško Gvardiol', 'Josip Stanišić',
    'Luka Vušković', 'Josip Šutalo', 'Kristijan Jakić', 'Luka Modrić',
    'Mateo Kovačić', 'Martin Baturina', 'Lovro Majer',
    'Plantel Croacia',
    'Mario Pašalić', 'Petar Sučić', 'Ivan Perišić', 'Marco Pašalić',
    'Ante Budimir', 'Andrej Kramarić', 'Franjo Ivanović',
  ],
  GHA: [
    'Escudo Ghana',
    'Lawrence Ati Zigi', 'Tariq Lamptey', 'Mohammed Salisu', 'Alidu Seidu',
    'Alexander Djiku', 'Gideon Mensah', 'Caleb Virenkyi', 'Abdul Issahaku Fatawu',
    'Thomas Partey', 'Salis Abdul Samed', 'Kamaldeen Sulemana',
    'Plantel Ghana',
    'Mohammed Kudus', 'Iñaki Williams', 'Jordan Ayew', 'André Ayew',
    'Joseph Paintsil', 'Osman Bukari', 'Antoine Semenyo',
  ],
  PAN: [
    'Escudo Panamá',
    'Orlando Mosquera', 'Luis Mejía', 'Fidel Escobar', 'Andrés Andrade',
    'Michael Amir Murillo', 'Eric Davis', 'José Córdoba', 'César Blackman',
    'Cristian Martínez', 'Aníbal Godoy', 'Adalberto Carrasquilla',
    'Plantel Panamá',
    'Édgar Bárcenas', 'Carlos Harvey', 'Ismael Díaz', 'José Fajardo',
    'Cecilio Waterman', 'José Luis Rodríguez', 'Alberto Quintero',
  ],

  // ── Coca-Cola ──
  CC: [
    'Lamine Yamal', 'Joshua Kimmich', 'Harry Kane', 'Santiago Giménez',
    'Joško Gvardiol', 'Federico Valverde', 'Jefferson Lerma', 'Enner Valencia',
    'Gabriel Magalhães', 'Virgil van Dijk', 'Alphonso Davies', 'Emiliano Martínez',
    'Raúl Jiménez', 'Lautaro Martínez',
  ],
};

function getTeamStickerName(teamCode: string, n: number, teamName: string): string {
  const names = PLAYER_NAMES[teamCode];
  if (names) return names[n - 1] ?? `Jugador ${n}`;
  if (n === 1) return `Escudo ${teamName}`;
  if (n >= 2 && n <= 12) return `Jugador ${n - 1}`;
  if (n === 13) return `Plantel ${teamName}`;
  return `Jugador ${n - 2}`;
}

// ── Extra stickers ────────────────────────────────────────────────────────────
export const EXTRA_PLAYERS = [
  'Kylian Mbappé',
  'Erling Haaland',
  'Vinícius Jr.',
  'Lionel Messi',
  'Jude Bellingham',
  'Cristiano Ronaldo',
  'Mohamed Salah',
  'Luka Modrić',
  'Federico Valverde',
  'Alphonso Davies',
  'Heung-min Son',
  'Luis Díaz',
  'Florian Wirtz',
  'Achraf Hakimi',
  'Moisés Caicedo',
  'Lamine Yamal',
  'Cody Gakpo',
  'Jérémy Doku',
  'Raúl Jiménez',
] as const;

/** ISO team code for each EXTRA_PLAYERS entry (same index). */
export const EXTRA_COUNTRIES: string[] = [
  'FRA', // Mbappé
  'NOR', // Haaland
  'BRA', // Vinícius Jr.
  'ARG', // Messi
  'ENG', // Bellingham
  'POR', // Ronaldo
  'EGY', // Salah
  'CRO', // Modrić
  'URU', // Valverde
  'CAN', // Davies
  'KOR', // Son
  'COL', // Díaz
  'GER', // Wirtz
  'MAR', // Hakimi
  'ECU', // Caicedo
  'ESP', // Yamal
  'NED', // Gakpo
  'BEL', // Doku
  'MEX', // Jiménez
];

export const EXTRA_VARIANTS = ['BASE', 'BRO', 'SIL', 'ORO'] as const;
export type ExtraVariant = (typeof EXTRA_VARIANTS)[number];

const VARIANT_LABELS: Record<ExtraVariant, string> = {
  BASE: 'Base',
  BRO: 'Bronce',
  SIL: 'Plata',
  ORO: 'Oro',
};

// ── Generator ─────────────────────────────────────────────────────────────────
function generateAllStickers(): StickerInfo[] {
  const stickers: StickerInfo[] = [];

  // FCW-00 to FCW-19
  for (let i = 0; i <= 19; i++) {
    const code = `FCW-${String(i).padStart(2, '0')}`;
    stickers.push({
      code,
      label: code,
      role: i <= 8 ? `Intro ${i + 1}` : `Historia ${i - 8}`,
      section: 'fcw',
    });
  }

  // Teams (48 × 20 = 960)
  for (const team of ALL_TEAMS) {
    for (let n = 1; n <= 20; n++) {
      stickers.push({
        code: `${team.code}-${n}`,
        label: `${team.code}-${n}`,
        role: getTeamStickerName(team.code, n, team.name),
        section: 'team',
        group: team.group,
        teamCode: team.code,
        teamName: team.name,
      });
    }
  }

  // CC-01 to CC-14 (Coca-Cola official stickers)
  const ccNames = PLAYER_NAMES['CC'] ?? [];
  for (let i = 1; i <= 14; i++) {
    const code = `CC-${String(i).padStart(2, '0')}`;
    stickers.push({ code, label: code, role: ccNames[i - 1] ?? `Coca-Cola ${i}`, section: 'cc' });
  }

  // Extra stickers (21 × 4 = 84)
  EXTRA_PLAYERS.forEach((playerName, idx) => {
    EXTRA_VARIANTS.forEach((variant) => {
      stickers.push({
        code: `EXT-${String(idx + 1).padStart(2, '0')}-${variant}`,
        label: VARIANT_LABELS[variant],
        role: playerName,
        section: 'extra',
        extraIndex: idx + 1,
        extraVariant: variant,
        extraPlayerName: playerName,
        extraCountry: EXTRA_COUNTRIES[idx],
      });
    });
  });

  return stickers;
}

export const ALL_STICKERS = generateAllStickers();
export const STICKER_MAP = new Map<string, StickerInfo>(ALL_STICKERS.map((s) => [s.code, s]));

export const getTeamStickers = (teamCode: string) =>
  ALL_STICKERS.filter((s) => s.teamCode === teamCode);
export const getGroupTeams = (groupId: string): TeamDef[] => GROUPS[groupId] ?? [];
export const getFCWStickers = () => ALL_STICKERS.filter((s) => s.section === 'fcw');
export const getCCStickers = () => ALL_STICKERS.filter((s) => s.section === 'cc');
/** @deprecated use getCCStickers */
export const getCOStickers = getCCStickers;
export const getExtraStickers = () => ALL_STICKERS.filter((s) => s.section === 'extra');
export const getTeamDef = (code: string) => ALL_TEAMS.find((t) => t.code === code);

export const TOTAL_REGULAR = 20 + 48 * 20 + 14; // 994
export const TOTAL_EXTRA = 19 * 4; // 76
export const TOTAL_ALL = TOTAL_REGULAR + TOTAL_EXTRA; // 1070

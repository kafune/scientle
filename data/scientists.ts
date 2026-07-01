// Base de cientistas do Spotle Científico.
// Atributos comparados no jogo: área, ano de nascimento, nacionalidade,
// gênero, prêmio e status (vivo/falecido).

export type Field =
  | "Física"
  | "Química"
  | "Biologia"
  | "Matemática"
  | "Medicina"
  | "Astronomia"
  | "Computação"
  | "Engenharia";

export type Gender = "M" | "F";

export type Award =
  | "Nobel de Física"
  | "Nobel de Química"
  | "Nobel de Medicina"
  | "Medalha Fields"
  | "Prêmio Turing";

export interface Scientist {
  name: string;
  field: Field;
  birthYear: number;
  nationality: string;
  gender: Gender;
  // Prêmios contabilizados no jogo. Vazio = "Nenhum". Pode conter repetições
  // (ex.: um duplo-laureado tem dois "Nobel de Química").
  awards: Award[];
  alive: boolean;
}

// Grupo macro de cada área — usado para a pista "amarela" (área relacionada).
export const FIELD_GROUP: Record<Field, string> = {
  Física: "exatas",
  Astronomia: "exatas",
  Química: "exatas",
  Engenharia: "exatas",
  Matemática: "formais",
  Computação: "formais",
  Biologia: "vida",
  Medicina: "vida",
};

// Nome legível de cada grande área, exibido nas dicas.
export const FIELD_GROUP_LABEL: Record<string, string> = {
  exatas: "Exatas",
  formais: "Formais",
  vida: "Ciências da vida",
};

// Disciplinas agrupadas por grande área, na ordem em que aparecem nas dicas.
// Serve para explicar, de forma concreta, o que cada "grande área" engloba.
export const FIELDS_BY_GROUP: {
  group: string;
  label: string;
  fields: Field[];
}[] = (["exatas", "formais", "vida"] as const).map((group) => ({
  group,
  label: FIELD_GROUP_LABEL[group],
  fields: (Object.keys(FIELD_GROUP) as Field[]).filter(
    (f) => FIELD_GROUP[f] === group,
  ),
}));

// Continente de cada país (modelo de 6 continentes usado no Brasil: a América
// é um continente único). Usado para a pista "amarela" do país: acertar o
// continente, mas não o país exato.
export const COUNTRY_CONTINENT: Record<string, string> = {
  // América
  EUA: "América",
  Canadá: "América",
  Brasil: "América",
  // Europa
  Alemanha: "Europa",
  "Reino Unido": "Europa",
  França: "Europa",
  Itália: "Europa",
  Áustria: "Europa",
  Dinamarca: "Europa",
  Polônia: "Europa",
  Rússia: "Europa",
  Sérvia: "Europa",
  Finlândia: "Europa",
  Suécia: "Europa",
  Suíça: "Europa",
  Hungria: "Europa",
  Irlanda: "Europa",
  "Países Baixos": "Europa",
  // Ásia
  Índia: "Ásia",
  Japão: "Ásia",
  China: "Ásia",
  Irã: "Ásia",
  // Oceania
  Austrália: "Oceania",
  "Nova Zelândia": "Oceania",
};

// Bandeira (emoji) de cada país, exibida no tile de nacionalidade.
export const COUNTRY_FLAG: Record<string, string> = {
  Alemanha: "🇩🇪",
  "Reino Unido": "🇬🇧",
  França: "🇫🇷",
  Itália: "🇮🇹",
  Áustria: "🇦🇹",
  Dinamarca: "🇩🇰",
  Polônia: "🇵🇱",
  Rússia: "🇷🇺",
  Sérvia: "🇷🇸",
  Finlândia: "🇫🇮",
  Suécia: "🇸🇪",
  Suíça: "🇨🇭",
  Hungria: "🇭🇺",
  Irlanda: "🇮🇪",
  "Países Baixos": "🇳🇱",
  EUA: "🇺🇸",
  Canadá: "🇨🇦",
  Brasil: "🇧🇷",
  Índia: "🇮🇳",
  Japão: "🇯🇵",
  China: "🇨🇳",
  Austrália: "🇦🇺",
  Irã: "🇮🇷",
  "Nova Zelândia": "🇳🇿",
};

// Código ISO 3166-1 alpha-2 de cada país, usado para a bandeira em SVG
// (public/flags/<código>.svg). Emoji de bandeira não renderiza em muitos
// dispositivos (Windows não tem os glifos), por isso servimos imagens.
export const COUNTRY_ISO: Record<string, string> = {
  Alemanha: "de",
  "Reino Unido": "gb",
  França: "fr",
  Itália: "it",
  Áustria: "at",
  Dinamarca: "dk",
  Polônia: "pl",
  Rússia: "ru",
  Sérvia: "rs",
  Finlândia: "fi",
  Suécia: "se",
  Suíça: "ch",
  Hungria: "hu",
  Irlanda: "ie",
  "Países Baixos": "nl",
  EUA: "us",
  Canadá: "ca",
  Brasil: "br",
  Índia: "in",
  Japão: "jp",
  China: "cn",
  Austrália: "au",
  Irã: "ir",
  "Nova Zelândia": "nz",
};

// Áreas e prêmios considerados no jogo (lista canônica, exibida nas instruções).
export const FIELDS: Field[] = [
  "Física",
  "Química",
  "Biologia",
  "Matemática",
  "Medicina",
  "Astronomia",
  "Computação",
  "Engenharia",
];

// Prêmios reconhecidos no atributo "Prêmio". Quem não tem nenhum deles aparece
// como "Nenhum" (que não consta aqui por ser a ausência de prêmio).
export const AWARDS: Award[] = [
  "Nobel de Física",
  "Nobel de Química",
  "Nobel de Medicina",
  "Medalha Fields",
  "Prêmio Turing",
];

export const SCIENTISTS: Scientist[] = [
  { name: "Albert Einstein", field: "Física", birthYear: 1879, nationality: "Alemanha", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Isaac Newton", field: "Física", birthYear: 1643, nationality: "Reino Unido", gender: "M", awards: [], alive: false },
  { name: "Marie Curie", field: "Química", birthYear: 1867, nationality: "Polônia", gender: "F", awards: ["Nobel de Química", "Nobel de Física"], alive: false },
  { name: "Charles Darwin", field: "Biologia", birthYear: 1809, nationality: "Reino Unido", gender: "M", awards: [], alive: false },
  { name: "Galileu Galilei", field: "Astronomia", birthYear: 1564, nationality: "Itália", gender: "M", awards: [], alive: false },
  { name: "Nikola Tesla", field: "Engenharia", birthYear: 1856, nationality: "Sérvia", gender: "M", awards: [], alive: false },
  { name: "Stephen Hawking", field: "Física", birthYear: 1942, nationality: "Reino Unido", gender: "M", awards: [], alive: false },
  { name: "Niels Bohr", field: "Física", birthYear: 1885, nationality: "Dinamarca", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Richard Feynman", field: "Física", birthYear: 1918, nationality: "EUA", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Alan Turing", field: "Computação", birthYear: 1912, nationality: "Reino Unido", gender: "M", awards: [], alive: false },
  { name: "Ada Lovelace", field: "Computação", birthYear: 1815, nationality: "Reino Unido", gender: "F", awards: [], alive: false },
  { name: "Gregor Mendel", field: "Biologia", birthYear: 1822, nationality: "Áustria", gender: "M", awards: [], alive: false },
  { name: "Louis Pasteur", field: "Biologia", birthYear: 1822, nationality: "França", gender: "M", awards: [], alive: false },
  { name: "Dmitri Mendeleev", field: "Química", birthYear: 1834, nationality: "Rússia", gender: "M", awards: [], alive: false },
  { name: "Michael Faraday", field: "Física", birthYear: 1791, nationality: "Reino Unido", gender: "M", awards: [], alive: false },
  { name: "James Clerk Maxwell", field: "Física", birthYear: 1831, nationality: "Reino Unido", gender: "M", awards: [], alive: false },
  { name: "Erwin Schrödinger", field: "Física", birthYear: 1887, nationality: "Áustria", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Werner Heisenberg", field: "Física", birthYear: 1901, nationality: "Alemanha", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Max Planck", field: "Física", birthYear: 1858, nationality: "Alemanha", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Enrico Fermi", field: "Física", birthYear: 1901, nationality: "Itália", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Carl Sagan", field: "Astronomia", birthYear: 1934, nationality: "EUA", gender: "M", awards: [], alive: false },
  { name: "Tim Berners-Lee", field: "Computação", birthYear: 1955, nationality: "Reino Unido", gender: "M", awards: ["Prêmio Turing"], alive: true },
  { name: "Linus Torvalds", field: "Computação", birthYear: 1969, nationality: "Finlândia", gender: "M", awards: [], alive: true },
  { name: "Rosalind Franklin", field: "Química", birthYear: 1920, nationality: "Reino Unido", gender: "F", awards: [], alive: false },
  { name: "James Watson", field: "Biologia", birthYear: 1928, nationality: "EUA", gender: "M", awards: ["Nobel de Medicina"], alive: true },
  { name: "Francis Crick", field: "Biologia", birthYear: 1916, nationality: "Reino Unido", gender: "M", awards: ["Nobel de Medicina"], alive: false },
  { name: "Jane Goodall", field: "Biologia", birthYear: 1934, nationality: "Reino Unido", gender: "F", awards: [], alive: false },
  { name: "Alexander Fleming", field: "Medicina", birthYear: 1881, nationality: "Reino Unido", gender: "M", awards: ["Nobel de Medicina"], alive: false },
  { name: "Sigmund Freud", field: "Medicina", birthYear: 1856, nationality: "Áustria", gender: "M", awards: [], alive: false },
  { name: "Johannes Kepler", field: "Astronomia", birthYear: 1571, nationality: "Alemanha", gender: "M", awards: [], alive: false },
  { name: "Nicolau Copérnico", field: "Astronomia", birthYear: 1473, nationality: "Polônia", gender: "M", awards: [], alive: false },
  { name: "Edwin Hubble", field: "Astronomia", birthYear: 1889, nationality: "EUA", gender: "M", awards: [], alive: false },
  { name: "Carl Linnaeus", field: "Biologia", birthYear: 1707, nationality: "Suécia", gender: "M", awards: [], alive: false },
  { name: "Antoine Lavoisier", field: "Química", birthYear: 1743, nationality: "França", gender: "M", awards: [], alive: false },
  { name: "Robert Boyle", field: "Química", birthYear: 1627, nationality: "Irlanda", gender: "M", awards: [], alive: false },
  { name: "Leonhard Euler", field: "Matemática", birthYear: 1707, nationality: "Suíça", gender: "M", awards: [], alive: false },
  { name: "Carl Friedrich Gauss", field: "Matemática", birthYear: 1777, nationality: "Alemanha", gender: "M", awards: [], alive: false },
  { name: "Emmy Noether", field: "Matemática", birthYear: 1882, nationality: "Alemanha", gender: "F", awards: [], alive: false },
  { name: "Srinivasa Ramanujan", field: "Matemática", birthYear: 1887, nationality: "Índia", gender: "M", awards: [], alive: false },
  { name: "Katherine Johnson", field: "Matemática", birthYear: 1918, nationality: "EUA", gender: "F", awards: [], alive: false },
  { name: "Grace Hopper", field: "Computação", birthYear: 1906, nationality: "EUA", gender: "F", awards: [], alive: false },
  { name: "John von Neumann", field: "Matemática", birthYear: 1903, nationality: "Hungria", gender: "M", awards: [], alive: false },
  { name: "Wernher von Braun", field: "Engenharia", birthYear: 1912, nationality: "Alemanha", gender: "M", awards: [], alive: false },
  { name: "Robert Oppenheimer", field: "Física", birthYear: 1904, nationality: "EUA", gender: "M", awards: [], alive: false },
  { name: "Lise Meitner", field: "Física", birthYear: 1878, nationality: "Áustria", gender: "F", awards: [], alive: false },
  { name: "Subrahmanyan Chandrasekhar", field: "Astronomia", birthYear: 1910, nationality: "Índia", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "César Lattes", field: "Física", birthYear: 1924, nationality: "Brasil", gender: "M", awards: [], alive: false },
  { name: "Santos Dumont", field: "Engenharia", birthYear: 1873, nationality: "Brasil", gender: "M", awards: [], alive: false },
  { name: "Carlos Chagas", field: "Medicina", birthYear: 1879, nationality: "Brasil", gender: "M", awards: [], alive: false },
  { name: "Oswaldo Cruz", field: "Medicina", birthYear: 1872, nationality: "Brasil", gender: "M", awards: [], alive: false },
  { name: "Hideki Yukawa", field: "Física", birthYear: 1907, nationality: "Japão", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Chien-Shiung Wu", field: "Física", birthYear: 1912, nationality: "China", gender: "F", awards: [], alive: false },
  { name: "Tu Youyou", field: "Medicina", birthYear: 1930, nationality: "China", gender: "F", awards: ["Nobel de Medicina"], alive: true },
  { name: "Katalin Karikó", field: "Medicina", birthYear: 1955, nationality: "Hungria", gender: "F", awards: ["Nobel de Medicina"], alive: true },
  { name: "Jennifer Doudna", field: "Química", birthYear: 1964, nationality: "EUA", gender: "F", awards: ["Nobel de Química"], alive: true },
  { name: "Andrew Wiles", field: "Matemática", birthYear: 1953, nationality: "Reino Unido", gender: "M", awards: [], alive: true },
  { name: "Donna Strickland", field: "Física", birthYear: 1959, nationality: "Canadá", gender: "F", awards: ["Nobel de Física"], alive: true },
  { name: "Roger Penrose", field: "Física", birthYear: 1931, nationality: "Reino Unido", gender: "M", awards: ["Nobel de Física"], alive: true },
  { name: "Neil deGrasse Tyson", field: "Astronomia", birthYear: 1958, nationality: "EUA", gender: "M", awards: [], alive: true },
  { name: "Margaret Hamilton", field: "Computação", birthYear: 1936, nationality: "EUA", gender: "F", awards: [], alive: true },

  // Acréscimos: ganhadores de Fields/Turing e mais nomes para variedade.
  { name: "Terence Tao", field: "Matemática", birthYear: 1975, nationality: "Austrália", gender: "M", awards: ["Medalha Fields"], alive: true },
  { name: "Maryam Mirzakhani", field: "Matemática", birthYear: 1977, nationality: "Irã", gender: "F", awards: ["Medalha Fields"], alive: false },
  { name: "Donald Knuth", field: "Computação", birthYear: 1938, nationality: "EUA", gender: "M", awards: ["Prêmio Turing"], alive: true },
  { name: "Edsger Dijkstra", field: "Computação", birthYear: 1930, nationality: "Países Baixos", gender: "M", awards: ["Prêmio Turing"], alive: false },
  { name: "Vint Cerf", field: "Computação", birthYear: 1943, nationality: "EUA", gender: "M", awards: ["Prêmio Turing"], alive: true },
  { name: "Barbara McClintock", field: "Biologia", birthYear: 1902, nationality: "EUA", gender: "F", awards: ["Nobel de Medicina"], alive: false },
  { name: "Dorothy Hodgkin", field: "Química", birthYear: 1910, nationality: "Reino Unido", gender: "F", awards: ["Nobel de Química"], alive: false },
  { name: "Linus Pauling", field: "Química", birthYear: 1901, nationality: "EUA", gender: "M", awards: ["Nobel de Química"], alive: false },
  { name: "Paul Dirac", field: "Física", birthYear: 1902, nationality: "Reino Unido", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Vera Rubin", field: "Astronomia", birthYear: 1928, nationality: "EUA", gender: "F", awards: [], alive: false },
  { name: "Rachel Carson", field: "Biologia", birthYear: 1907, nationality: "EUA", gender: "F", awards: [], alive: false },
  { name: "Tycho Brahe", field: "Astronomia", birthYear: 1546, nationality: "Dinamarca", gender: "M", awards: [], alive: false },

  // Professores (homenagem) — sem foto, exibidos como avatar de monograma.
  { name: "Leonardo André Testoni", field: "Física", birthYear: 1979, nationality: "Brasil", gender: "M", awards: [], alive: true },
  { name: "Arthur Biasotto", field: "Física", birthYear: 2000, nationality: "Brasil", gender: "M", awards: [], alive: true },
  { name: "Juliana de Lemos", field: "Biologia", birthYear: 1996, nationality: "Brasil", gender: "F", awards: [], alive: true },
  { name: "Amanda Lanzotti", field: "Química", birthYear: 1994, nationality: "Brasil", gender: "F", awards: [], alive: true },

  // Cientistas e educadores brasileiros (César Lattes já consta acima).
  { name: "Oscar Sala", field: "Física", birthYear: 1922, nationality: "Itália", gender: "M", awards: [], alive: false },
  { name: "Mario Schenberg", field: "Física", birthYear: 1914, nationality: "Brasil", gender: "M", awards: [], alive: false },
  { name: "José Leite Lopes", field: "Física", birthYear: 1918, nationality: "Brasil", gender: "M", awards: [], alive: false },
  { name: "Abrahão de Moraes", field: "Astronomia", birthYear: 1917, nationality: "Brasil", gender: "M", awards: [], alive: false },
  { name: "Elisa Frota Pessoa", field: "Física", birthYear: 1921, nationality: "Brasil", gender: "F", awards: [], alive: false },
  { name: "Amélia Império Hamburger", field: "Física", birthYear: 1932, nationality: "Brasil", gender: "F", awards: [], alive: false },

  // Mais nomes para variedade (dados verificados).
  { name: "Wilhelm Röntgen", field: "Física", birthYear: 1845, nationality: "Alemanha", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Heinrich Hertz", field: "Física", birthYear: 1857, nationality: "Alemanha", gender: "M", awards: [], alive: false },
  { name: "J.J. Thomson", field: "Física", birthYear: 1856, nationality: "Reino Unido", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Hendrik Lorentz", field: "Física", birthYear: 1853, nationality: "Países Baixos", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Ernest Rutherford", field: "Física", birthYear: 1871, nationality: "Nova Zelândia", gender: "M", awards: ["Nobel de Química"], alive: false },
  { name: "Fritz Haber", field: "Química", birthYear: 1868, nationality: "Alemanha", gender: "M", awards: ["Nobel de Química"], alive: false },
  { name: "Glenn Seaborg", field: "Química", birthYear: 1912, nationality: "EUA", gender: "M", awards: ["Nobel de Química"], alive: false },
  { name: "Stephanie Kwolek", field: "Química", birthYear: 1923, nationality: "EUA", gender: "F", awards: [], alive: false },
  { name: "Robert Koch", field: "Medicina", birthYear: 1843, nationality: "Alemanha", gender: "M", awards: ["Nobel de Medicina"], alive: false },
  { name: "Edward Jenner", field: "Medicina", birthYear: 1749, nationality: "Reino Unido", gender: "M", awards: [], alive: false },
  { name: "Frederick Banting", field: "Medicina", birthYear: 1891, nationality: "Canadá", gender: "M", awards: ["Nobel de Medicina"], alive: false },
  { name: "Rita Levi-Montalcini", field: "Medicina", birthYear: 1909, nationality: "Itália", gender: "F", awards: ["Nobel de Medicina"], alive: false },
  { name: "Jonas Salk", field: "Medicina", birthYear: 1914, nationality: "EUA", gender: "M", awards: [], alive: false },
  { name: "William Herschel", field: "Astronomia", birthYear: 1738, nationality: "Reino Unido", gender: "M", awards: [], alive: false },
  { name: "Caroline Herschel", field: "Astronomia", birthYear: 1750, nationality: "Reino Unido", gender: "F", awards: [], alive: false },
  { name: "Henrietta Swan Leavitt", field: "Astronomia", birthYear: 1868, nationality: "EUA", gender: "F", awards: [], alive: false },
  { name: "Annie Jump Cannon", field: "Astronomia", birthYear: 1863, nationality: "EUA", gender: "F", awards: [], alive: false },
  { name: "Évariste Galois", field: "Matemática", birthYear: 1811, nationality: "França", gender: "M", awards: [], alive: false },
  { name: "David Hilbert", field: "Matemática", birthYear: 1862, nationality: "Alemanha", gender: "M", awards: [], alive: false },
  { name: "John McCarthy", field: "Computação", birthYear: 1927, nationality: "EUA", gender: "M", awards: ["Prêmio Turing"], alive: false },

  // Acréscimos recentes.
  { name: "Gottfried Wilhelm Leibniz", field: "Matemática", birthYear: 1646, nationality: "Alemanha", gender: "M", awards: [], alive: false },
  { name: "Peter Higgs", field: "Física", birthYear: 1929, nationality: "Reino Unido", gender: "M", awards: ["Nobel de Física"], alive: false },

  // Lote adicional (dados verificados): mais áreas, países e mulheres.
  { name: "John Dalton", field: "Química", birthYear: 1766, nationality: "Reino Unido", gender: "M", awards: [], alive: false },
  { name: "Alessandro Volta", field: "Física", birthYear: 1745, nationality: "Itália", gender: "M", awards: [], alive: false },
  { name: "André-Marie Ampère", field: "Física", birthYear: 1775, nationality: "França", gender: "M", awards: [], alive: false },
  { name: "Georg Ohm", field: "Física", birthYear: 1789, nationality: "Alemanha", gender: "M", awards: [], alive: false },
  { name: "Ludwig Boltzmann", field: "Física", birthYear: 1844, nationality: "Áustria", gender: "M", awards: [], alive: false },
  { name: "Wolfgang Pauli", field: "Física", birthYear: 1900, nationality: "Áustria", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "Christiaan Huygens", field: "Astronomia", birthYear: 1629, nationality: "Países Baixos", gender: "M", awards: [], alive: false },
  { name: "Antonie van Leeuwenhoek", field: "Biologia", birthYear: 1632, nationality: "Países Baixos", gender: "M", awards: [], alive: false },
  { name: "Claude Shannon", field: "Computação", birthYear: 1916, nationality: "EUA", gender: "M", awards: [], alive: false },
  { name: "Sophie Germain", field: "Matemática", birthYear: 1776, nationality: "França", gender: "F", awards: [], alive: false },
  { name: "George Boole", field: "Matemática", birthYear: 1815, nationality: "Reino Unido", gender: "M", awards: [], alive: false },
  { name: "Henri Poincaré", field: "Matemática", birthYear: 1854, nationality: "França", gender: "M", awards: [], alive: false },
  { name: "Bernhard Riemann", field: "Matemática", birthYear: 1826, nationality: "Alemanha", gender: "M", awards: [], alive: false },
  { name: "Murray Gell-Mann", field: "Física", birthYear: 1929, nationality: "EUA", gender: "M", awards: ["Nobel de Física"], alive: false },
  { name: "John Bardeen", field: "Física", birthYear: 1908, nationality: "EUA", gender: "M", awards: ["Nobel de Física", "Nobel de Física"], alive: false },
  { name: "Frederick Sanger", field: "Química", birthYear: 1918, nationality: "Reino Unido", gender: "M", awards: ["Nobel de Química", "Nobel de Química"], alive: false },
  { name: "Jocelyn Bell Burnell", field: "Astronomia", birthYear: 1943, nationality: "Reino Unido", gender: "F", awards: [], alive: true },
  { name: "Svante Arrhenius", field: "Química", birthYear: 1859, nationality: "Suécia", gender: "M", awards: ["Nobel de Química"], alive: false },
  { name: "Karl Landsteiner", field: "Medicina", birthYear: 1868, nationality: "Áustria", gender: "M", awards: ["Nobel de Medicina"], alive: false },
  { name: "Gertrude Elion", field: "Medicina", birthYear: 1918, nationality: "EUA", gender: "F", awards: ["Nobel de Medicina"], alive: false },

  // Acréscimos: duplo-laureados e laureados de Turing.
  { name: "Barry Sharpless", field: "Química", birthYear: 1941, nationality: "EUA", gender: "M", awards: ["Nobel de Química", "Nobel de Química"], alive: true },
  { name: "Geoffrey Hinton", field: "Computação", birthYear: 1947, nationality: "Reino Unido", gender: "M", awards: ["Nobel de Física", "Prêmio Turing"], alive: true },
  { name: "Herbert A. Simon", field: "Computação", birthYear: 1916, nationality: "EUA", gender: "M", awards: ["Prêmio Turing"], alive: false },
];

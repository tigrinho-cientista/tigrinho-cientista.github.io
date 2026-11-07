// Dados extraídos das escalas "Banca de Avaliação JCC 2026" (10 e 17 de outubro).
// Cada pessoa: [nome, eixo, nave de referência]. A nave nem sempre é o local do bloco.
// Eixos: S = Saúde, E = Educação, T = Tecnologia e Inovação, I = Inovação Social,
// C = Cidades Inteligentes e Sustentabilidade, G = Gestão Pública, X = Economia Criativa

const EIXOS = {
  S: { nome: "Saúde", curto: "Saúde", cor: "#36d68f" },
  E: { nome: "Educação", curto: "Educação", cor: "#5cc8ff" },
  T: { nome: "Tecnologia e Inovação", curto: "Tecnologia", cor: "#b896ff" },
  I: { nome: "Inovação Social", curto: "Inov. Social", cor: "#ff93b6" },
  C: { nome: "Cidades Inteligentes e Sustentabilidade", curto: "Cidades Sust.", cor: "#c8ea55" },
  G: { nome: "Gestão Pública", curto: "Gestão Pública", cor: "#ffb357" },
  X: { nome: "Economia Criativa", curto: "Econ. Criativa", cor: "#ff7ae0" },
};

const BLOCOS = [
  {
    n: 1, local: "Irajá", data: "10 de outubro",
    turnos: [
      ["Manhã", [
        ["Lívia De Paula Tamburro Da Costa", "T", "Triagem"],
        ["Júlia Silva Moreno", "S", "Triagem"],
        ["Maria Marta Barros De Mendonça", "C", "Triagem"],
        ["Rayanne Lucas Porto", "S", "Triagem"],
        ["Tatiana Paola Da Rocha Becerra Navarro", "S", "Triagem"],
      ]],
      ["Tarde", [
        ["Ana Beatriz Dos Santos Da Costa", "S", "Irajá"],
        ["Ana Melissa Lemos Medeiros Teixeira", "T", "Irajá"],
        ["Caio Garcia Telles", "E", "Irajá"],
        ["Gabriela Dos Santos Soares", "I", "Irajá"],
        ["Letícia De Almeida Andrade", "S", "Irajá"],
        ["Jade Pereira", "S", "Irajá"],
        ["Luiza Piçarro Rios", "I", "Irajá"],
        ["Maria Eduarda Pinho Da Natividade", "S", "Irajá"],
        ["Yasmin Cunha Guimarães", "I", "Irajá"],
      ]],
    ],
  },
  {
    n: 2, local: "Pavuna", data: "10 de outubro",
    turnos: [
      ["Manhã", [
        ["Aisha Paola De Abreu Brito", "S", "Nova Brasília"],
        ["Julienne Ramos Vance", "S", "Pavuna"],
        ["Daniela Maria Da Silva", "C", "Nova Brasília"],
        ["Julia da Silva Padula", "S", "Nova Brasília"],
        ["Lucas Eduardo Sanches Cordeiro", "T", "Nova Brasília"],
        ["Luis Guilherme Quintanilha Jacintho", "C", "Nova Brasília"],
        ["Mayara Da Silva Oliveira", "S", "Nova Brasília"],
        ["Samara De Oliveira Pagano", "E", "Nova Brasília"],
      ]],
      ["Tarde", [
        ["Ana Carolina Zacarias Bispo De Jesus", "C", "Pavuna"],
        ["Denis Reis Carvalho Da Rosa", "E", "Pavuna"],
        ["Gustavo Ricardo Da Silva Vieira", "S", "Pavuna"],
        ["Caroline Oliveira Do Carmo", "E", "Nova Brasília"],
        ["Kamille Cristina Corrêa Costa", "S", "Pavuna"],
        ["Ke'ári Ybyara", "E", "Pavuna"],
        ["Laryssa Silva Ferreira", "S", "Pavuna"],
        ["Marcus Vinícius Souza Araújo", "T", "Pavuna"],
        ["Maria Eduarda Barbosa Dos Santos", "I", "Pavuna"],
        ["Vitor Olavo De Oliveira Castro Moreira", "T", "Pavuna"],
      ]],
    ],
  },
  {
    n: 3, local: "Penha", data: "10 de outubro",
    turnos: [
      ["Manhã", [
        ["Thalys Maia Moreira", "I", "Penha"],
        ["Henrique Pinheiro Rosa", "S", "Penha"],
        ["Luiz Felipe Serpa De Almeida", "S", "Penha"],
        ["Luiza Elena Reckziegel", "E", "Penha"],
        ["Marcelle Pellegrino Campeche", "I", "Penha"],
        ["Raul Pereira De Sousa", "S", "Penha"],
        ["Ana Karolina Vieira Mendes", "E", "Penha"],
        ["Wallace Souza Da Silva", "T", "Penha"],
      ]],
      ["Tarde", [
        ["Ana Carolina Oliveira Figueiredo Dos Santos", "E", "Engenhão"],
        ["Eduardo Moraes Braga", "E", "Engenhão"],
        ["Esther Quarterolli Dos Santos", "G", "Engenhão"],
        ["Gabriel De Andrade Conceição", "S", "Engenhão"],
        ["Lara Lisboa Alves", "E", "Engenhão"],
        ["Luiza Maria Martins Souto", "I", "Engenhão"],
        ["Maria Eduarda Lima Calixto Netto", "S", "Engenhão"],
        ["Melanie Caires Marques", "I", "Engenhão"],
        ["Rafaela Da Glória Gama De Jesus", "E", "Engenhão"],
      ]],
    ],
  },
  {
    n: 4, local: "Madureira", data: "17 de outubro",
    turnos: [
      ["Manhã", [
        ["Alexia Do Nascimento Siqueira", "I", "Realengo"],
        ["Anderson Martins Araújo Pessoa", "T", "Realengo"],
        ["Beatriz Silva Soares", "I", "Realengo"],
        ["Brenda Coutinho Dias", "S", "Realengo"],
        ["Clarice Ribeiro Schumacker", "C", "Realengo"],
        ["Jasmin Da Silva Santos", "G", "Realengo"],
        ["Karina Da Silva Gomes", "S", "Realengo"],
        ["Kaylane De Mattos Silva", "S", "Realengo"],
      ]],
      ["Tarde", [
        ["Ana Clara Do Couto Von Borell", "S", "Madureira"],
        ["Caique Monteiro Matheus", "C", "Madureira"],
        ["Elaine Vieitas Da Cruz", "I", "Madureira"],
        ["Gabriel De Oliveira Alves Rodrigues", "E", "Madureira"],
        ["Henry Noguchi Bezerra Da Silva", "C", "Madureira"],
        ["Julia De Assunção Maia", "S", "Madureira"],
        ["Kalli Guilherme", "C", "Madureira"],
        ["Renata Linhares De Araujo", "X", "Madureira"],
        ["Silvia Lopes De Oliveira", "S", "Madureira"],
        ["Vitoria Cristina Rodrigues Pereira", "S", "Triagem"],
      ]],
    ],
  },
  {
    n: 5, local: "Realengo", data: "17 de outubro",
    turnos: [
      ["Manhã", [
        ["Alvaro Climaco Dos Santos Neto", "E", "Padre Miguel"],
        ["Anna Luisa Teixeira Pessoa", "I", "Padre Miguel"],
        ["Isabele Sessa Soares", "S", "Padre Miguel"],
        ["Lívia Cristina Martinho De Brito", "I", "Padre Miguel"],
        ["Lorena Peçanha De Souza", "E", "Padre Miguel"],
        ["Marcela Benjamim Da Silva", "S", "Padre Miguel"],
        ["Téo Luá Braga Campello", "E", "Padre Miguel"],
      ]],
      ["Tarde", [
        ["Aimée De Moraes Freitas", "S", "Vila Aliança"],
        ["Ana Victória Da Conceição Pereira", "S", "Vila Aliança"],
        ["Francielly Souza De Oliveira", "S", "Vila Aliança"],
        ["Matheus Da Silva De Oliveira", "T", "Vila Aliança"],
        ["Yasmin De Assis Santana Da Silva", "X", "Vila Aliança"],
      ]],
    ],
  },
  {
    n: 6, local: "Santa Cruz", data: "17 de outubro",
    turnos: [
      ["Manhã", [
        ["Ana Carollina Rubim Bordallo", "S", "Santa Cruz"],
        ["André De Assunção Barros Junior", "E", "Santa Cruz"],
        ["Caio Immanuel Soares de Oliveira", "E", "Santa Cruz"],
        ["Isabela Cabral Da Cunha Souza", "S", "Santa Cruz"],
        ["Kauã Soares Dos Santos Rodrigues", "T", "Santa Cruz"],
        ["Lara Aparecida Rodrigues Dos Santos", "T", "Santa Cruz"],
        ["Maria Eduarda De Carvalho Franco Oppenheimer", "S", "Santa Cruz"],
        ["Ruan Da Cunha Eliezer", "I", "Santa Cruz"],
      ]],
      ["Tarde", [
        ["Augusto Bruno Menezes Silva", "G", "Campo Grande"],
        ["Aynã Felix Da Silva", "T", "Campo Grande"],
        ["Bruna Santos Das Chagas", "E", "Campo Grande"],
        ["Joyce Christine De Melo Santana", "T", "Campo Grande"],
        ["Júlia Rodrigues Maciel", "I", "Campo Grande"],
        ["Juliana Caldeira Carvalho", "S", "Campo Grande"],
        ["Maria Luiza Santos Silva Nunes", "I", "Campo Grande"],
      ]],
    ],
  },
];

const POR_BLOCO = 5;

// Prazo do bolão: depois disso ninguém faz nem altera palpites (horário de Brasília, UTC-3).
const PRAZO = new Date("2026-11-23T23:59:59-03:00");
const PRAZO_TEXTO = "23/11 às 23:59";

export type TarotCard = {
  id: string;
  arcano: "maior" | "menor";
  numero?: number;
  nome: string;
  grupo?: "paus" | "copas" | "espadas" | "ouros";
  entidade?: string;
  traducao: string;
  normal: string;
};

export const TAROT_PABLO_78: TarotCard[] = [
  {
    id: "maior_01_mago",
    arcano: "maior",
    numero: 1,
    nome: "O Mago",
    entidade: "Exu e Crianças",
    traducao: "A pessoa é criativa, comunicativa, tem iniciativa, força de vontade, fé e sabedoria. Carta positiva e de incentivo, mas alerta para a lei do retorno: tudo que se planta, colhe.",
    normal: "Inteligência, vontade, iniciativa e atividade mental consciente."
  },
  {
    id: "maior_02_papisa",
    arcano: "maior",
    numero: 2,
    nome: "A Papisa",
    entidade: "Iemanjá",
    traducao: "Fala da mulher intuitiva, sensível e de grande força. Representa reflexão, energia interna, segredo, mistério, silêncio, memória, intuição e sabedoria.",
    normal: "Intuição, sabedoria, mistério e força interior."
  },
  {
    id: "maior_03_imperatriz",
    arcano: "maior",
    numero: 3,
    nome: "A Imperatriz",
    entidade: "Oxum",
    traducao: "Representa o poder da imaginação, a visualização criativa, as belas emoções e o amor.",
    normal: "Materialização do desejo."
  },
  {
    id: "maior_04_imperador",
    arcano: "maior",
    numero: 4,
    nome: "O Imperador",
    entidade: "Ogum",
    traducao: "Representa poder, autoridade, razão, lógica, raciocínio, comando, determinação e vontade de tomar as rédeas da própria vida.",
    normal: "Atividade, força, poder, comando e justiça."
  },
  {
    id: "maior_05_papa",
    arcano: "maior",
    numero: 5,
    nome: "O Papa",
    entidade: "Oxalá e Oxalufã",
    traducao: "Representa o professor, o inspirador, o conhecimento aplicado, o guia interior, o mestre espiritual e a ligação com pessoa sábia, calma e espiritualizada.",
    normal: "Conhecimento, amadurecimento e superação."
  },
  {
    id: "maior_06_namorados",
    arcano: "maior",
    numero: 6,
    nome: "Os Namorados",
    entidade: "Erês",
    traducao: "Representa amor, paixão, dúvidas, retorno de alguém, sinceridade consigo mesmo e escolha do coração.",
    normal: "Uniões, amor e situações felizes."
  },
  {
    id: "maior_07_carro",
    arcano: "maior",
    numero: 7,
    nome: "O Carro",
    entidade: "Ogum e Iemanjá",
    traducao: "Fala de busca interna e externa, disputas vencidas, vitória, sucesso, inteligência emocional e ação.",
    normal: "Sucesso em conflitos, vitória e avanço."
  },
  {
    id: "maior_08_justica",
    arcano: "maior",
    numero: 8,
    nome: "A Justiça",
    entidade: "Xangô",
    traducao: "Plante coisas boas e colherá coisas boas. Equilíbrio entre bem e mal, ação justa e calma diante das circunstâncias.",
    normal: "Justiça a favor, equilíbrio e colheita."
  },
  {
    id: "maior_09_ermitao",
    arcano: "maior",
    numero: 9,
    nome: "O Ermitão",
    entidade: "Ifá",
    traducao: "Representa reflexão, meditação, prudência, isolamento, quebra de ilusões e revelação da realidade verdadeira.",
    normal: "Organização, verdade, prudência e clareza."
  },
  {
    id: "maior_10_roda_fortuna",
    arcano: "maior",
    numero: 10,
    nome: "Roda da Fortuna",
    entidade: "Iansã",
    traducao: "Fortuna, abundância, alegria de viver, bons frutos, progresso, sucesso, mudanças e movimentos de boa sorte.",
    normal: "Boa fortuna, sincronia e movimento favorável."
  },
  {
    id: "maior_11_forca",
    arcano: "maior",
    numero: 11,
    nome: "A Força",
    entidade: "Iniciação",
    traducao: "Representa energia interna, energia sexual, instintos, impulso, magia e necessidade de estudo.",
    normal: "Força interior, domínio dos impulsos e magnetismo."
  },
  {
    id: "maior_12_enforcado",
    arcano: "maior",
    numero: 12,
    nome: "O Enforcado",
    traducao: "Trabalho em prol de uma causa, abnegação, resgate, sacrifício para despertar espiritual e desapego do que prejudica o progresso.",
    normal: "Renúncia, pausa, sacrifício e libertação de prisão."
  },
  {
    id: "maior_13_morte",
    arcano: "maior",
    numero: 13,
    nome: "A Morte",
    entidade: "Omolu",
    traducao: "Transformação, mudanças, libertação de restrições, fim de ciclo e início de outro. Algo que atrapalhava deixa de atrapalhar.",
    normal: "Fim, transformação e recomeço."
  },
  {
    id: "maior_14_temperanca",
    arcano: "maior",
    numero: 14,
    nome: "A Temperança",
    entidade: "Xangô",
    traducao: "Equilíbrio interior, guia interno, voz que pede equilíbrio, cura, sucesso e mudança positiva.",
    normal: "Equilíbrio, cura e harmonia."
  },
  {
    id: "maior_15_diabo",
    arcano: "maior",
    numero: 15,
    nome: "O Diabo",
    entidade: "Exu",
    traducao: "Magnetismo pessoal, poder de sedução, fome de sexo, poder, política, jogo de cintura, desejo de manipular, apego, prazer, sexualidade e erotismo.",
    normal: "Sedução, desejo, magnetismo, poder e apego."
  },
  {
    id: "maior_16_torre",
    arcano: "maior",
    numero: 16,
    nome: "A Torre",
    traducao: "Lutas, discórdias, necessidade de eliminar o errado, destruição do orgulho e do ego, recomeço e libertação das armadilhas do passado.",
    normal: "Queda do ego, ruptura, libertação e recomeço."
  },
  {
    id: "maior_17_estrela",
    arcano: "maior",
    numero: 17,
    nome: "A Estrela",
    entidade: "Iemanjá",
    traducao: "Esperança, capacidade de doar, acreditar em algo melhor, amor e fé.",
    normal: "Carta ótima, esperança, amor e fé."
  },
  {
    id: "maior_18_lua",
    arcano: "maior",
    numero: 18,
    nome: "A Lua",
    traducao: "Mistério, fascinação, sonhos, ilusões, lado criativo e sombrio da mente, subconsciente, feitiçamentos e demanda.",
    normal: "Mistério, ilusão, sonho e força do subconsciente."
  },
  {
    id: "maior_19_sol",
    arcano: "maior",
    numero: 19,
    nome: "O Sol",
    traducao: "Boa sorte, luz, destino favorecido, bênção grandiosa, sucesso, portas abertas, bons acontecimentos e felicidade.",
    normal: "Sucesso, luz, alegria e bênção."
  },
  {
    id: "maior_20_julgamento",
    arcano: "maior",
    numero: 20,
    nome: "O Julgamento",
    entidade: "Nanã",
    traducao: "Reconstruir, redirecionar, assumir novo padrão de comportamento e receber nova oportunidade.",
    normal: "Nova oportunidade, chamado e renascimento."
  },
  {
    id: "maior_21_mundo",
    arcano: "maior",
    numero: 21,
    nome: "O Mundo",
    traducao: "Poderes paranormais, domínio sobre leis físicas e matéria, planeta Saturno, cor azul violeta, sucesso e domínio das situações.",
    normal: "Sucesso, domínio e realização."
  },
  {
    id: "maior_22_cometa",
    arcano: "maior",
    numero: 22,
    nome: "O Cometa",
    traducao: "Sucesso, superação, êxtase, poder sobre a própria vida, alinhamento, sabedoria e equilíbrio acima de tudo.",
    normal: "Carta ótima, superação e alinhamento."
  },

  { id: "paus_rei", arcano: "menor", grupo: "paus", nome: "Rei de Paus", traducao: "Representa a ação possível.", normal: "Homem respeitável e amigável." },
  { id: "paus_rainha", arcano: "menor", grupo: "paus", nome: "Rainha de Paus", traducao: "Representa a ação desejável.", normal: "Mulher atraente e inteligente." },
  { id: "paus_cavaleiro", arcano: "menor", grupo: "paus", nome: "Cavaleiro de Paus", traducao: "Representa a ação necessária.", normal: "Troca de residência." },
  { id: "paus_valete", arcano: "menor", grupo: "paus", nome: "Valete de Paus", traducao: "Representa ação imediata.", normal: "Chegada de boas notícias." },
  { id: "paus_10", arcano: "menor", grupo: "paus", numero: 10, nome: "Dez de Paus", traducao: "Situações opressivas e opressão que chega ao limite.", normal: "Opressão." },
  { id: "paus_09", arcano: "menor", grupo: "paus", numero: 9, nome: "Nove de Paus", traducao: "Poder da informação e força física ou psíquica.", normal: "Conhecimentos especiais." },
  { id: "paus_08", arcano: "menor", grupo: "paus", numero: 8, nome: "Oito de Paus", traducao: "Imprevisto, percepção dos sentimentos de outras pessoas e rapidez de ação.", normal: "Notícias imprevistas e rapidez." },
  { id: "paus_07", arcano: "menor", grupo: "paus", numero: 7, nome: "Sete de Paus", traducao: "Valor, prazer em riscos e atividades perigosas que resultam em estímulo.", normal: "Atividades arriscadas." },
  { id: "paus_06", arcano: "menor", grupo: "paus", numero: 6, nome: "Seis de Paus", traducao: "Esforços compensados e vitórias depois de lutas.", normal: "Esforços compensados." },
  { id: "paus_05", arcano: "menor", grupo: "paus", numero: 5, nome: "Cinco de Paus", traducao: "Luta pela vida, competitividade e respeito pelos outros.", normal: "Luta pela vida e poder." },
  { id: "paus_04", arcano: "menor", grupo: "paus", numero: 4, nome: "Quatro de Paus", traducao: "Fim de um trabalho bem feito, satisfação proporcionada, ambientes agradáveis e boa comunicação.", normal: "Ambientes agradáveis e boa comunicação." },
  { id: "paus_03", arcano: "menor", grupo: "paus", numero: 3, nome: "Três de Paus", traducao: "União que cria força e ética pessoal.", normal: "Criatividade e associações férteis." },
  { id: "paus_02", arcano: "menor", grupo: "paus", numero: 2, nome: "Dois de Paus", traducao: "Poder que se manifesta como cooperação e ajuda.", normal: "Cooperação e assistência." },
  { id: "paus_01", arcano: "menor", grupo: "paus", numero: 1, nome: "Ás de Paus", traducao: "Força criativa, propulsora e entusiasmo.", normal: "Estágios iniciais, começos e nascimento de algo." },

  { id: "copas_rei", arcano: "menor", grupo: "copas", nome: "Rei de Copas", traducao: "Representa emoções espirituais e místicas.", normal: "Homem culto e generoso." },
  { id: "copas_rainha", arcano: "menor", grupo: "copas", nome: "Rainha de Copas", traducao: "Representa emoções estéticas.", normal: "Mulher ativa e inteligente." },
  { id: "copas_cavaleiro", arcano: "menor", grupo: "copas", nome: "Cavaleiro de Copas", traducao: "Representa emoções sentimentais.", normal: "Chegada de amizades e afeições." },
  { id: "copas_valete", arcano: "menor", grupo: "copas", nome: "Valete de Copas", traducao: "Representa emoções, desejos e temor.", normal: "Propostas amorosas." },
  { id: "copas_10", arcano: "menor", grupo: "copas", numero: 10, nome: "Dez de Copas", traducao: "Sucesso no nível emocional e felicidade familiar.", normal: "Boa reputação e lar feliz." },
  { id: "copas_09", arcano: "menor", grupo: "copas", numero: 9, nome: "Nove de Copas", traducao: "Felicidade e bem-estar material.", normal: "Bem-estar e segurança material." },
  { id: "copas_08", arcano: "menor", grupo: "copas", numero: 8, nome: "Oito de Copas", traducao: "Abandono material e busca do espiritual.", normal: "Busca pelo espiritual." },
  { id: "copas_07", arcano: "menor", grupo: "copas", numero: 7, nome: "Sete de Copas", traducao: "Ilusões e megalomania.", normal: "Êxito de pouco valor e fantasias." },
  { id: "copas_06", arcano: "menor", grupo: "copas", numero: 6, nome: "Seis de Copas", traducao: "Ânsia pelo passado e recordações felizes.", normal: "Paz interior e aceitação do passado." },
  { id: "copas_05", arcano: "menor", grupo: "copas", numero: 5, nome: "Cinco de Copas", traducao: "Alegria perdida e tristezas.", normal: "Lamentações e prazeres obscuros." },
  { id: "copas_04", arcano: "menor", grupo: "copas", numero: 4, nome: "Quatro de Copas", traducao: "Aborrecimentos e depressão.", normal: "Depressão, traições e insatisfação." },
  { id: "copas_03", arcano: "menor", grupo: "copas", numero: 3, nome: "Três de Copas", traducao: "Abundância, alegria e diversão.", normal: "Celebrações e sucessos." },
  { id: "copas_02", arcano: "menor", grupo: "copas", numero: 2, nome: "Dois de Copas", traducao: "Amor, afeição e amizade.", normal: "Uniões afetivas e casamentos." },
  { id: "copas_01", arcano: "menor", grupo: "copas", numero: 1, nome: "Ás de Copas", traducao: "Poder do sentimento, amor e fundo do céu.", normal: "Abundância, alegria e prazer." },

  { id: "espadas_rei", arcano: "menor", grupo: "espadas", nome: "Rei de Espadas", traducao: "Representa o pensamento lógico possível.", normal: "Homem energético e autoritário." },
  { id: "espadas_rainha", arcano: "menor", grupo: "espadas", nome: "Rainha de Espadas", traducao: "Representa o pensamento como raciocínio indutivo.", normal: "Mulher de caráter forte e muito intelectual." },
  { id: "espadas_cavaleiro", arcano: "menor", grupo: "espadas", nome: "Cavaleiro de Espadas", traducao: "Representa as sequências ordenadas do pensamento lógico.", normal: "Imprevisível e agressivo." },
  { id: "espadas_valete", arcano: "menor", grupo: "espadas", nome: "Valete de Espadas", traducao: "Representa o pensamento aproximado e a verificação.", normal: "Espionagem e vigilância." },
  { id: "espadas_10", arcano: "menor", grupo: "espadas", numero: 10, nome: "Dez de Espadas", traducao: "Ruína total e irreversível.", normal: "Ruína total e desolação." },
  { id: "espadas_09", arcano: "menor", grupo: "espadas", numero: 9, nome: "Nove de Espadas", traducao: "Desespero, tristeza e depressão.", normal: "Preocupação e desespero." },
  { id: "espadas_08", arcano: "menor", grupo: "espadas", numero: 8, nome: "Oito de Espadas", traducao: "Força paralisada e impossibilidade de ação.", normal: "Indecisão e impossibilidade de movimento." },
  { id: "espadas_07", arcano: "menor", grupo: "espadas", numero: 7, nome: "Sete de Espadas", traducao: "Esforço inútil.", normal: "Esforço inútil." },
  { id: "espadas_06", arcano: "menor", grupo: "espadas", numero: 6, nome: "Seis de Espadas", traducao: "Procura de novos objetivos, progresso e viagem.", normal: "Viagens e sucessos merecidos." },
  { id: "espadas_05", arcano: "menor", grupo: "espadas", numero: 5, nome: "Cinco de Espadas", traducao: "Derrotas e traições.", normal: "Derrotas e aflições." },
  { id: "espadas_04", arcano: "menor", grupo: "espadas", numero: 4, nome: "Quatro de Espadas", traducao: "Período de descanso ou trégua.", normal: "Trégua, tempo de retiro." },
  { id: "espadas_03", arcano: "menor", grupo: "espadas", numero: 3, nome: "Três de Espadas", traducao: "Sofrimento, dor e infortúnio.", normal: "Sofrimento e privação." },
  { id: "espadas_02", arcano: "menor", grupo: "espadas", numero: 2, nome: "Dois de Espadas", traducao: "Tempo de paz.", normal: "Período de paz e estagnação." },
  { id: "espadas_01", arcano: "menor", grupo: "espadas", numero: 1, nome: "Ás de Espadas", traducao: "Poder da mente, razão e descendente.", normal: "Capacidade para o triunfo." },

  { id: "ouros_rei", arcano: "menor", grupo: "ouros", nome: "Rei de Ouros", traducao: "Representa a sensação auditiva.", normal: "Homem inteligente com sucesso." },
  { id: "ouros_rainha", arcano: "menor", grupo: "ouros", nome: "Rainha de Ouros", traducao: "Representa a sensação visual.", normal: "Mulher inteligente com dinheiro." },
  { id: "ouros_cavaleiro", arcano: "menor", grupo: "ouros", nome: "Cavaleiro de Ouros", traducao: "Representa a sensação do paladar e do olfato.", normal: "Assunto de dinheiro e ofertas." },
  { id: "ouros_valete", arcano: "menor", grupo: "ouros", nome: "Valete de Ouros", traducao: "Representa a sensação do tato.", normal: "Observação e estudo." },
  { id: "ouros_10", arcano: "menor", grupo: "ouros", numero: 10, nome: "Dez de Ouros", traducao: "Opulência, posse e segredo da riqueza.", normal: "Opulência e plenitude." },
  { id: "ouros_09", arcano: "menor", grupo: "ouros", numero: 9, nome: "Nove de Ouros", traducao: "Riqueza material.", normal: "Sucesso econômico." },
  { id: "ouros_08", arcano: "menor", grupo: "ouros", numero: 8, nome: "Oito de Ouros", traducao: "Tarefas sistemáticas, esforços dirigidos e aprendizado.", normal: "Aprendizado paciente." },
  { id: "ouros_07", arcano: "menor", grupo: "ouros", numero: 7, nome: "Sete de Ouros", traducao: "Fracassos e estagnação.", normal: "Estagnação e fracasso." },
  { id: "ouros_06", arcano: "menor", grupo: "ouros", numero: 6, nome: "Seis de Ouros", traducao: "Surpresas agradáveis e presentes.", normal: "Filantropia e presentes." },
  { id: "ouros_05", arcano: "menor", grupo: "ouros", numero: 5, nome: "Cinco de Ouros", traducao: "Desemprego e pobreza.", normal: "Ruína econômica." },
  { id: "ouros_04", arcano: "menor", grupo: "ouros", numero: 4, nome: "Quatro de Ouros", traducao: "Poder econômico.", normal: "Prosperidade econômica." },
  { id: "ouros_03", arcano: "menor", grupo: "ouros", numero: 3, nome: "Três de Ouros", traducao: "Trabalho material e construção.", normal: "Construção e fabricação." },
  { id: "ouros_02", arcano: "menor", grupo: "ouros", numero: 2, nome: "Dois de Ouros", traducao: "Trocas harmoniosas e favoráveis.", normal: "Trocas favoráveis." },
  { id: "ouros_01", arcano: "menor", grupo: "ouros", numero: 1, nome: "Ás de Ouros", traducao: "Concreto, material e percepção sensorial.", normal: "Ganhos materiais e riquezas." }
];

export function drawPabloTarotCards(count = 3): TarotCard[] {
  const deck = [...TAROT_PABLO_78];
  const drawn: TarotCard[] = [];

  while (drawn.length < count && deck.length > 0) {
    const index = Math.floor(Math.random() * deck.length);
    drawn.push(deck.splice(index, 1)[0]);
  }

  return drawn;
}

export function formatPabloTarotCards(cards: TarotCard[]): string {
  return cards
    .map((card, index) => {
      const position =
        index === 0 ? "Carta principal" :
        index === 1 ? "Desafio / influência" :
        index === 2 ? "Caminho / conselho" :
        `Carta ${index + 1}`;

      return `
${position}: ${card.nome}
Arcano: ${card.arcano}${card.grupo ? ` de ${card.grupo}` : ""}
Entidade/força associada: ${card.entidade || "Não informada"}
Leitura verdadeira do Cigano Pablo: ${card.traducao}
Referência clássica complementar: ${card.normal}
`;
    })
    .join("\n");
}
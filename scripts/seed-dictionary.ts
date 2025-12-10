/**
 * Seed Dictionary Script - OPTIMIZED VERSION
 * 
 * This script populates the dictionary table with Portuguese words and their embeddings.
 * Uses batch processing for both OpenAI API and Supabase inserts for maximum speed.
 * 
 * Usage:
 * 1. Set environment variables in .env.local
 * 2. Run: npx tsx scripts/seed-dictionary.ts
 */

import { createClient } from "@supabase/supabase-js";

// =============================================
// PORTUGUESE WORDS DATABASE - Expanded Edition
// =============================================

const NATUREZA = [
  "sol", "lua", "estrela", "céu", "nuvem", "chuva", "vento", "mar", "rio", "montanha",
  "floresta", "árvore", "flor", "folha", "grama", "terra", "areia", "pedra", "fogo", "água",
  "neve", "gelo", "raio", "trovão", "tempestade", "oceano", "lago", "cachoeira", "ilha", "praia",
  "planeta", "universo", "galáxia", "cometa", "meteoro", "aurora", "neblina", "orvalho", "geada",
  "vulcão", "terremoto", "tsunami", "furacão", "tornado", "deserto", "savana", "pântano", "caverna", "gruta",
  "rochedo", "penhasco", "vale", "colina", "planície", "campo", "bosque", "selva", "jardim", "parque",
  "nascente", "córrego", "riacho", "mangue", "recife", "coral", "onda", "maré", "espuma", "brisa",
  "relâmpago", "granizo", "seca", "enchente", "erosão", "cristal", "mineral", "rocha", "lava", "magma",
  "atmosfera", "clima", "estação", "primavera", "verão", "outono", "inverno", "eclipse", "constelação", "nebulosa",
];

const ANIMAIS = [
  "cachorro", "gato", "pássaro", "peixe", "cavalo", "vaca", "porco", "galinha", "pato", "coelho",
  "hamster", "tartaruga", "papagaio", "periquito", "canário", "pombo", "ganso", "peru", "ovelha", "cabra",
  "leão", "tigre", "elefante", "girafa", "macaco", "cobra", "jacaré", "crocodilo", "hipopótamo", "rinoceronte",
  "zebra", "gorila", "chimpanzé", "orangotango", "leopardo", "pantera", "jaguar", "onça", "lobo", "raposa",
  "urso", "panda", "coala", "canguru", "camelo", "dromedário", "búfalo", "bisão", "alce", "veado",
  "baleia", "tubarão", "golfinho", "foca", "morsa", "pinguim", "polvo", "lula", "caranguejo", "lagosta",
  "camarão", "ostra", "mexilhão", "arraia", "enguia", "salmão", "atum", "sardinha", "bacalhau", "truta",
  "borboleta", "abelha", "formiga", "aranha", "mosca", "mosquito", "barata", "grilo", "cigarra", "libélula",
  "joaninha", "besouro", "lagarta", "minhoca", "lesma", "caracol", "escorpião", "carrapato", "pulga", "percevejo",
  "águia", "falcão", "coruja", "gavião", "urubu", "pelicano", "flamingo", "cisne", "garça", "tucano",
  "arara", "pardal", "andorinha", "corvo", "gralha", "pavão", "avestruz", "ema", "sapo", "rã",
  "salamandra", "lagarto", "iguana", "camaleão", "cascavel", "jiboia", "sucuri", "coral",
];

const COMIDAS = [
  "arroz", "feijão", "carne", "frango", "peixe", "salada", "legumes", "verdura", "pão", "bolo",
  "macarrão", "pizza", "hambúrguer", "sanduíche", "sopa", "caldo", "torta", "empada", "pastel", "coxinha",
  "maçã", "banana", "laranja", "uva", "morango", "abacaxi", "melancia", "manga", "limão", "coco",
  "mamão", "goiaba", "pêssego", "ameixa", "cereja", "framboesa", "mirtilo", "kiwi", "maracujá", "acerola",
  "abacate", "pêra", "figo", "romã", "carambola", "pitaya", "lichia", "caqui", "jabuticaba", "açaí",
  "tomate", "batata", "cenoura", "cebola", "alho", "pepino", "abobrinha", "berinjela", "pimentão", "brócolis",
  "repolho", "alface", "rúcula", "espinafre", "agrião", "couve", "acelga", "beterraba", "nabo",
  "rabanete", "inhame", "mandioca", "cará", "abóbora", "quiabo", "jiló", "maxixe", "chuchu", "vagem",
  "bife", "filé", "costela", "picanha", "alcatra", "fraldinha", "maminha", "linguiça", "salsicha", "bacon",
  "presunto", "salame", "mortadela", "peito", "coxa", "asa", "cordeiro", "cabrito",
  "leite", "queijo", "manteiga", "iogurte", "requeijão", "nata", "coalhada", "ricota", "mussarela",
  "café", "chá", "suco", "refrigerante", "cerveja", "vinho", "champanhe", "whisky", "vodka", "rum",
  "cachaça", "caipirinha", "limonada", "milkshake", "smoothie", "vitamina", "cappuccino", "espresso",
  "chocolate", "sorvete", "pudim", "brigadeiro", "beijinho", "trufa", "brownie", "cookie", "biscoito", "bolacha",
  "cheesecake", "mousse", "gelatina", "paçoca", "cocada", "goiabada", "rapadura", "mel",
  "sal", "açúcar", "pimenta", "orégano", "manjericão", "salsa", "cebolinha", "coentro", "louro", "canela",
  "cravo", "cominho", "curry", "açafrão", "gengibre", "hortelã", "alecrim", "tomilho", "sálvia",
];

const CASA_OBJETOS = [
  "casa", "apartamento", "quarto", "sala", "cozinha", "banheiro", "varanda", "jardim", "garagem", "sótão",
  "porão", "terraço", "escritório", "corredor", "despensa", "lavanderia", "sacada", "quintal", "piscina", "churrasqueira",
  "porta", "janela", "teto", "parede", "chão", "escada", "elevador", "telhado", "portão", "cerca",
  "muro", "grade", "campainha", "interfone", "fechadura", "maçaneta", "dobradiça", "trinco", "aldrava", "soleira",
  "sofá", "cadeira", "mesa", "cama", "armário", "estante", "prateleira", "gaveta", "cômoda",
  "rack", "aparador", "buffet", "cristaleira", "escrivaninha", "poltrona", "banco", "banqueta", "pufe",
  "berço", "beliche", "colchão", "travesseiro", "cobertor", "lençol", "edredom", "almofada", "tapete", "cortina",
  "geladeira", "fogão", "forno", "liquidificador", "batedeira", "torradeira", "cafeteira", "sanduicheira", "fritadeira",
  "secadora", "ferro", "aspirador", "ventilador", "aquecedor", "umidificador", "purificador", "exaustor",
  "televisão", "computador", "notebook", "tablet", "celular", "telefone", "rádio", "microfone",
  "câmera", "filmadora", "projetor", "videogame", "controle", "carregador", "cabo", "tomada", "extensão", "adaptador",
  "prato", "copo", "xícara", "tigela", "travessa", "panela", "frigideira", "chaleira", "assadeira", "forma",
  "colher", "garfo", "faca", "concha", "espátula", "escumadeira", "ralador", "abridor", "tesoura",
  "chuveiro", "torneira", "pia", "vaso", "bidê", "banheira", "espelho", "toalha", "sabonete", "shampoo",
  "condicionador", "creme", "escova", "pasta", "enxaguante", "barbeador", "secador", "pente",
  "vassoura", "rodo", "pá", "balde", "esfregão", "esponja", "detergente", "sabão", "desinfetante", "alvejante",
  "amaciante", "lixeira", "flanela", "pano", "luva", "máscara", "álcool", "multiuso",
  "quadro", "vaso", "planta", "luminária", "abajur", "lustre", "vela", "relógio", "calendário",
];

const CORPO_SAUDE = [
  "cabeça", "cabelo", "rosto", "testa", "sobrancelha", "olho", "cílio", "pálpebra", "íris", "pupila",
  "nariz", "narina", "boca", "lábio", "língua", "dente", "gengiva", "garganta", "orelha",
  "queixo", "bochecha", "mandíbula", "têmpora", "nuca", "pescoço", "barba", "bigode", "cavanhaque",
  "ombro", "peito", "seio", "mamilo", "costela", "barriga", "umbigo", "cintura", "quadril", "costas",
  "coluna", "lombar", "axila", "virilha", "nádegas", "bumbum", "músculo", "osso", "pele",
  "braço", "antebraço", "cotovelo", "pulso", "mão", "palma", "dedo", "polegar", "indicador", "mindinho",
  "unha", "punho", "perna", "coxa", "joelho", "canela", "tornozelo", "pé", "calcanhar", "dedão",
  "coração", "pulmão", "fígado", "estômago", "intestino", "rim", "bexiga", "cérebro", "sangue", "veia",
  "artéria", "nervo", "tendão", "ligamento", "cartilagem", "medula", "baço", "pâncreas", "vesícula", "tireoide",
  "médico", "enfermeiro", "hospital", "clínica", "consultório", "farmácia", "laboratório", "exame", "diagnóstico", "tratamento",
  "remédio", "comprimido", "cápsula", "xarope", "pomada", "injeção", "vacina", "curativo", "gesso", "tala",
  "cirurgia", "operação", "anestesia", "internação", "alta", "consulta", "receita", "prontuário", "atestado", "laudo",
  "dor", "febre", "gripe", "resfriado", "tosse", "espirro", "alergia", "infecção", "inflamação", "inchaço",
  "náusea", "vômito", "diarreia", "tontura", "vertigem", "desmaio", "cansaço", "fadiga", "insônia",
];

const SENTIMENTOS_EMOCOES = [
  "amor", "alegria", "felicidade", "paz", "calma", "serenidade", "tranquilidade", "esperança", "fé", "confiança",
  "gratidão", "carinho", "ternura", "afeto", "paixão", "encanto", "fascínio", "admiração", "respeito", "orgulho",
  "entusiasmo", "empolgação", "euforia", "êxtase", "prazer", "satisfação", "realização", "contentamento", "alívio", "conforto",
  "tristeza", "raiva", "medo", "ansiedade", "angústia", "aflição", "desespero", "pânico", "terror", "horror",
  "ódio", "rancor", "ressentimento", "mágoa", "sofrimento", "agonia", "tormento", "culpa", "remorso",
  "vergonha", "humilhação", "constrangimento", "embaraço", "inveja", "ciúme", "cobiça", "ganância", "avareza", "mesquinharia",
  "surpresa", "espanto", "choque", "curiosidade", "interesse", "indiferença", "tédio", "monotonia", "nostalgia", "saudade",
  "melancolia", "solidão", "vazio", "confusão", "dúvida", "incerteza", "hesitação", "indecisão", "ambiguidade", "ambivalência",
  "bondade", "generosidade", "humildade", "simplicidade", "sinceridade", "honestidade", "lealdade", "fidelidade", "coragem", "bravura",
  "paciência", "tolerância", "compaixão", "empatia", "solidariedade", "altruísmo", "perdão", "misericórdia", "sabedoria", "prudência",
];

const PROFISSOES = [
  "médico", "enfermeiro", "dentista", "veterinário", "fisioterapeuta", "psicólogo", "nutricionista", "farmacêutico", "biomédico", "fonoaudiólogo",
  "terapeuta", "massagista", "acupunturista", "quiroprata", "paramédico", "socorrista", "cuidador", "parteira", "anestesista", "cirurgião",
  "professor", "pedagogo", "coordenador", "diretor", "orientador", "tutor", "instrutor", "treinador", "monitor", "educador",
  "advogado", "juiz", "promotor", "delegado", "policial", "bombeiro", "militar", "soldado", "detetive", "investigador",
  "guarda", "vigilante", "segurança", "perito", "legista", "escrivão", "oficial", "sargento", "capitão", "coronel",
  "engenheiro", "arquiteto", "urbanista", "construtor", "pedreiro", "eletricista", "encanador", "pintor", "carpinteiro", "marceneiro",
  "serralheiro", "soldador", "torneiro", "mecânico", "técnico", "topógrafo", "agrônomo", "geólogo", "químico", "físico",
  "empresário", "empreendedor", "administrador", "gerente", "executivo", "consultor", "analista", "assistente",
  "secretário", "recepcionista", "atendente", "vendedor", "comprador", "negociador", "corretor", "representante", "promotor", "demonstrador",
  "programador", "desenvolvedor", "designer", "webdesigner", "ilustrador", "animador", "editor", "produtor",
  "artista", "músico", "cantor", "compositor", "maestro", "ator", "atriz", "roteirista",
  "cineasta", "fotógrafo", "cinegrafista", "jornalista", "repórter", "apresentador", "locutor", "radialista", "escritor", "poeta",
  "escultor", "desenhista", "cartunista", "grafiteiro", "tatuador", "estilista", "modelo", "manequim", "figurinista",
  "cozinheiro", "chef", "garçom", "barman", "padeiro", "confeiteiro", "açougueiro", "peixeiro", "verdureiro", "feirante",
  "motorista", "taxista", "caminhoneiro", "piloto", "comissário", "maquinista", "marinheiro", "pescador", "agricultor", "fazendeiro",
  "jardineiro", "paisagista", "florista", "zelador", "porteiro", "faxineiro", "empregado", "babá", "diarista", "cozinheira",
  "atleta", "jogador", "árbitro", "comentarista", "narrador", "assessor",
];

const TEMPO_CALENDARIO = [
  "segundo", "minuto", "hora", "dia", "semana", "quinzena", "mês", "bimestre", "trimestre", "semestre",
  "ano", "biênio", "triênio", "década", "século", "milênio", "era", "época", "período", "fase",
  "madrugada", "amanhecer", "manhã", "tarde", "entardecer", "anoitecer", "noite", "aurora",
  "crepúsculo", "alvorada", "poente", "nascente", "ocaso", "penumbra", "escuridão", "claridade", "luz",
  "domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado", "feriado", "folga",
  "janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro",
  "novembro", "dezembro",
  "ontem", "hoje", "amanhã", "agora", "antes", "depois", "sempre", "nunca", "frequentemente",
  "raramente", "passado", "presente", "futuro", "antigamente", "atualmente", "futuramente", "eternamente", "momentaneamente", "temporariamente",
  "instantâneo", "breve", "longo", "curto", "rápido", "lento", "veloz", "demorado", "urgente", "imediato",
  "aniversário", "natal", "páscoa", "carnaval", "réveillon", "festa", "celebração", "comemoração", "evento",
];

const CORES = [
  "vermelho", "azul", "verde", "amarelo", "laranja", "roxo", "rosa", "marrom", "preto", "branco",
  "cinza", "bege", "creme", "dourado", "prateado", "bronze", "cobre", "turquesa", "violeta", "lilás",
  "claro", "escuro", "forte", "fraco", "vivo", "opaco", "brilhante", "fosco", "neon", "pastel",
  "magenta", "ciano", "coral", "salmão", "vinho", "bordô", "carmim", "escarlate", "púrpura", "índigo",
];

const LUGARES = [
  "cidade", "bairro", "rua", "avenida", "praça", "parque", "jardim", "calçada", "esquina", "cruzamento",
  "semáforo", "faixa", "ponte", "viaduto", "túnel", "passarela", "estacionamento", "garagem", "posto", "loja",
  "shopping", "mercado", "supermercado", "hipermercado", "feira", "padaria", "açougue", "farmácia", "drogaria", "livraria",
  "papelaria", "banca", "lanchonete", "restaurante", "bar", "boteco", "balada", "boate", "clube", "academia",
  "salão", "barbearia", "clínica", "hospital", "laboratório", "consultório", "cartório", "banco", "lotérica", "correio",
  "escola", "colégio", "universidade", "faculdade", "cursinho", "creche", "biblioteca", "museu", "teatro", "cinema",
  "galeria", "exposição", "auditório", "anfiteatro", "planetário", "observatório", "arquivo", "memorial",
  "aeroporto", "rodoviária", "estação", "terminal", "porto", "marina", "heliporto", "metrô", "trem", "ônibus",
  "praia", "sítio", "fazenda", "chácara", "rancho", "camping", "trilha", "mirante",
  "igreja", "catedral", "capela", "templo", "mesquita", "sinagoga", "terreiro", "mosteiro", "convento", "santuário",
  "prefeitura", "câmara", "assembleia", "senado", "congresso", "palácio", "tribunal", "fórum", "delegacia", "quartel",
  "país", "estado", "município", "continente", "hemisfério", "equador", "trópico", "polo", "latitude", "longitude",
];

const TRANSPORTES = [
  "carro", "moto", "bicicleta", "triciclo", "patinete", "skate", "ônibus", "trem", "metrô", "bonde",
  "táxi", "uber", "caminhão", "van", "kombi", "perua", "pickup", "jipe", "buggy", "quadriciclo",
  "ambulância", "viatura", "trator", "colheitadeira", "escavadeira", "guindaste", "empilhadeira", "retroescavadeira",
  "navio", "barco", "lancha", "iate", "veleiro", "catamarã", "canoa", "caiaque", "jangada", "balsa",
  "ferry", "cruzeiro", "transatlântico", "cargueiro", "petroleiro", "rebocador", "saveiro", "traineira", "submarino",
  "avião", "helicóptero", "jato", "monomotor", "bimotor", "planador", "ultraleve", "balão", "dirigível", "drone",
  "foguete", "satélite", "sonda", "cápsula", "paraquedas", "parapente", "paramotor",
  "roda", "pneu", "volante", "pedal", "freio", "acelerador", "embreagem", "câmbio", "marcha", "motor",
  "farol", "lanterna", "pisca", "retrovisor", "buzina", "capô",
];

const ESPORTES_LAZER = [
  "futebol", "basquete", "vôlei", "handebol", "futsal", "rugby", "hóquei", "polo", "beisebol", "softbol",
  "críquete", "lacrosse", "futevôlei", "padel", "squash", "badminton", "sinuca",
  "tênis", "golfe", "natação", "atletismo", "ginástica", "ciclismo", "corrida", "maratona", "triathlon", "pentatlo",
  "boxe", "luta", "judô", "karatê", "taekwondo", "capoeira", "esgrima", "wrestling",
  "surfe", "snowboard", "esqui", "escalada", "rapel", "paraquedismo", "mergulho",
  "rafting", "canoagem", "wakeboard", "kitesurf", "windsurf", "motocross", "rally", "drift", "parkour", "slackline",
  "bola", "raquete", "taco", "rede", "gol", "cesta", "placar", "apito", "cartão", "uniforme",
  "chuteira", "luva", "capacete", "joelheira", "cotoveleira", "caneleira", "protetor", "óculos", "touca",
  "jogo", "brincadeira", "brinquedo", "boneca", "carrinho", "patins", "pipa", "ioiô", "peão",
  "baralho", "dominó", "xadrez", "dama", "gamão", "lego", "massinha", "tinta", "giz",
];

const MUSICA_ARTE = [
  "música", "canção", "melodia", "harmonia", "ritmo", "compasso", "nota", "acorde", "tom", "escala",
  "grave", "agudo", "soprano", "alto", "tenor", "baixo", "coral", "orquestra", "banda", "grupo",
  "violão", "guitarra", "bateria", "piano", "teclado", "órgão", "acordeão", "sanfona", "gaita",
  "violino", "viola", "violoncelo", "contrabaixo", "harpa", "flauta", "clarinete", "oboé", "fagote", "saxofone",
  "trompete", "trombone", "tuba", "trompa", "corneta", "pandeiro", "tambor", "surdo", "zabumba", "triângulo",
  "berimbau", "cuíca", "agogô", "cavaquinho", "bandolim", "ukulele", "banjo", "cítara", "sitar",
  "rock", "pop", "jazz", "blues", "country", "folk", "reggae", "funk", "soul",
  "rap", "eletrônica", "house", "techno", "trance", "samba", "pagode", "forró", "axé", "sertanejo",
  "mpb", "chorinho", "baião", "frevo", "maracatu", "carimbó", "lambada", "zouk", "bachata",
  "pintura", "desenho", "escultura", "gravura", "fotografia", "colagem", "mosaico", "vitral", "grafite", "mural",
  "aquarela", "óleo", "acrílica", "pastel", "carvão", "nanquim", "lápis", "caneta", "pincel",
  "tela", "quadro", "moldura", "cavalete", "paleta", "espátula", "estúdio", "ateliê", "galeria", "vernissage",
  "balé", "contemporâneo", "sapateado", "flamenco", "tango", "salsa", "merengue",
  "valsa", "ciranda", "quadrilha",
];

const TECNOLOGIA = [
  "computador", "notebook", "laptop", "desktop", "servidor", "monitor", "tela", "display", "teclado", "mouse",
  "touchpad", "webcam", "microfone", "fone", "headset", "impressora", "scanner", "roteador", "modem",
  "hd", "ssd", "pendrive", "processador", "memória", "cooler",
  "celular", "smartphone", "tablet", "smartwatch", "carregador", "powerbank", "capinha", "película", "suporte",
  "programa", "aplicativo", "app", "sistema", "software", "hardware", "firmware", "driver", "plugin", "extensão",
  "navegador", "browser", "buscador", "antivírus", "firewall", "backup", "nuvem", "hospedagem", "domínio",
  "internet", "wifi", "rede", "conexão", "fibra", "dados", "download",
  "upload", "streaming", "buffer", "lag", "ping", "vpn", "proxy",
  "instagram", "facebook", "twitter", "youtube", "tiktok", "linkedin", "whatsapp", "telegram", "discord", "snapchat",
  "post", "foto", "vídeo", "story", "reels", "live", "like", "comentário", "compartilhar", "seguir",
  "código", "programação", "algoritmo", "variável", "função", "classe", "objeto", "array", "loop", "condição",
  "bug", "erro", "debug", "teste", "deploy", "git", "repositório", "commit", "branch", "merge",
];

const FAMILIA_RELACOES = [
  "pai", "mãe", "filho", "filha", "irmão", "irmã", "marido", "esposa", "cônjuge", "parceiro",
  "avô", "avó", "neto", "neta", "bisavô", "bisavó", "bisneto", "bisneta", "tio", "tia",
  "primo", "prima", "sobrinho", "sobrinha", "cunhado", "cunhada", "sogro", "sogra", "genro", "nora",
  "padrasto", "madrasta", "enteado", "enteada", "padrinho", "madrinha", "afilhado", "afilhada", "compadre", "comadre",
  "namorado", "namorada", "noivo", "noiva", "amante", "ficante", "crush", "paquera", "caso",
  "amigo", "amiga", "colega", "conhecido", "vizinho", "vizinha", "sócio", "companheiro", "camarada",
  "solteiro", "casado", "divorciado", "viúvo", "separado", "comprometido", "enrolado", "livre", "disponível",
  "casamento", "noivado", "batizado", "comunhão", "crisma", "formatura", "despedida",
];

const EDUCACAO_TRABALHO = [
  "creche", "fundamental", "médio", "superior", "graduação", "mestrado", "doutorado",
  "escola", "colégio", "universidade", "faculdade", "instituto", "academia", "cursinho", "curso", "aula", "turma",
  "aluno", "estudante", "professor", "coordenador", "diretor", "pedagogo", "orientador", "inspetor", "bedel", "merendeira",
  "livro", "caderno", "apostila", "fichário", "pasta", "mochila", "estojo", "lápis", "caneta", "borracha",
  "apontador", "régua", "compasso", "transferidor", "esquadro", "calculadora", "dicionário", "atlas", "globo", "mapa",
  "prova", "teste", "exame", "avaliação", "trabalho", "projeto", "seminário", "apresentação", "dissertação", "tese",
  "nota", "média", "boletim", "histórico", "diploma", "certificado", "aprovado", "reprovado", "recuperação", "dependência",
  "emprego", "trabalho", "serviço", "ocupação", "profissão", "carreira", "cargo", "função", "vaga", "oportunidade",
  "empresa", "firma", "companhia", "corporação", "organização", "instituição", "startup", "negócio", "empreendimento", "escritório",
  "salário", "pagamento", "remuneração", "benefício", "bônus", "comissão", "férias", "licença", "aposentadoria",
  "currículo", "entrevista", "contratação", "demissão", "promoção", "transferência", "treinamento", "capacitação", "experiência", "qualificação",
];

const CONCEITOS_ABSTRATOS = [
  "vida", "morte", "existência", "essência", "ser", "consciência", "mente", "alma", "espírito",
  "realidade", "ilusão", "verdade", "mentira", "bem", "mal", "certo", "errado", "moral", "ética",
  "liberdade", "destino", "acaso", "sorte", "azar", "karma", "sina", "fado", "providência",
  "justiça", "igualdade", "fraternidade", "solidariedade", "dignidade", "honra", "integridade", "caráter", "virtude",
  "democracia", "cidadania", "direito", "dever", "responsabilidade", "compromisso", "credibilidade",
  "conhecimento", "inteligência", "razão", "lógica", "intuição", "instinto", "percepção", "sensação", "sentido",
  "pensamento", "ideia", "conceito", "teoria", "hipótese", "argumento", "premissa", "conclusão", "dedução",
  "memória", "lembrança", "recordação", "esquecimento", "aprendizado", "educação", "formação", "cultura", "civilização", "progresso",
  "sociedade", "comunidade", "grupo", "coletivo", "individual", "público", "privado", "social", "político", "econômico",
  "poder", "autoridade", "hierarquia", "ordem", "caos", "sistema", "estrutura", "organização", "governo",
  "tempo", "espaço", "dimensão", "infinito", "eterno", "finito", "temporal", "permanente", "efêmero", "transitório",
  "começo", "fim", "meio", "início", "término", "ciclo", "processo", "evolução", "revolução", "transformação",
];

const ACOES_VERBOS = [
  "andar", "correr", "pular", "saltar", "nadar", "voar", "subir", "descer", "entrar", "sair",
  "chegar", "partir", "ir", "vir", "voltar", "passar", "atravessar", "cruzar", "seguir", "parar",
  "falar", "dizer", "contar", "conversar", "dialogar", "discutir", "debater", "argumentar", "explicar", "perguntar",
  "responder", "gritar", "sussurrar", "murmurar", "cantar", "recitar", "declamar", "narrar", "descrever", "relatar",
  "ver", "olhar", "observar", "assistir", "contemplar", "ouvir", "escutar", "sentir", "tocar", "cheirar",
  "provar", "degustar", "saborear", "perceber", "notar", "reparar", "detectar", "identificar", "reconhecer", "distinguir",
  "pegar", "segurar", "soltar", "largar", "jogar", "lançar", "arremessar", "empurrar", "puxar", "arrastar",
  "carregar", "levantar", "abaixar", "colocar", "tirar", "guardar", "organizar", "arrumar", "limpar", "lavar",
  "pensar", "refletir", "meditar", "imaginar", "sonhar", "lembrar", "esquecer", "aprender", "estudar", "ensinar",
  "entender", "compreender", "conhecer", "saber", "descobrir", "inventar", "criar", "desenvolver", "planejar", "projetar",
  "amar", "gostar", "adorar", "odiar", "detestar", "temer", "recear", "esperar", "desejar", "querer",
  "precisar", "necessitar", "preferir", "escolher", "decidir", "aceitar", "recusar", "negar", "concordar", "discordar",
  "trabalhar", "produzir", "fabricar", "construir", "destruir", "consertar", "reparar", "modificar", "alterar", "transformar",
  "comprar", "vender", "trocar", "negociar", "investir", "economizar", "gastar", "pagar", "receber", "devolver",
];

// Combine all categories
const PORTUGUESE_WORDS = [
  ...NATUREZA,
  ...ANIMAIS,
  ...COMIDAS,
  ...CASA_OBJETOS,
  ...CORPO_SAUDE,
  ...SENTIMENTOS_EMOCOES,
  ...PROFISSOES,
  ...TEMPO_CALENDARIO,
  ...CORES,
  ...LUGARES,
  ...TRANSPORTES,
  ...ESPORTES_LAZER,
  ...MUSICA_ARTE,
  ...TECNOLOGIA,
  ...FAMILIA_RELACOES,
  ...EDUCACAO_TRABALHO,
  ...CONCEITOS_ABSTRATOS,
  ...ACOES_VERBOS,
];

// Remove duplicates and normalize
const UNIQUE_WORDS = [...new Set(PORTUGUESE_WORDS.map(w => w.toLowerCase().trim()))];

// =============================================
// OPTIMIZED BATCH PROCESSING
// =============================================

const OPENAI_BATCH_SIZE = 100; // OpenAI supports up to 2048 inputs per request
const SUPABASE_BATCH_SIZE = 100; // Insert in batches
const CONCURRENT_REQUESTS = 3; // Number of parallel OpenAI requests

interface WordEmbedding {
  word: string;
  embedding: number[];
}

async function getBatchEmbeddings(words: string[], apiKey: string): Promise<WordEmbedding[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: words
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  
  return words.map((word, index) => ({
    word,
    embedding: data.data[index].embedding
  }));
}

async function processBatchWithRetry(
  words: string[], 
  apiKey: string, 
  retries = 3
): Promise<WordEmbedding[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await getBatchEmbeddings(words, apiKey);
    } catch (error) {
      if (attempt === retries) throw error;
      console.log(`  ⚠️ Retry ${attempt}/${retries} for batch...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return [];
}

async function seed() {
  const startTime = Date.now();
  
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  if (!openaiKey) {
    console.error("❌ Missing OPENAI_API_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("🚀 CONTEXTO LIVE - Dictionary Seed (Optimized)");
  console.log("=".repeat(50));
  console.log(`📊 Total unique words: ${UNIQUE_WORDS.length}`);
  console.log(`⚡ OpenAI batch size: ${OPENAI_BATCH_SIZE}`);
  console.log(`⚡ Concurrent requests: ${CONCURRENT_REQUESTS}`);
  console.log(`⚡ Supabase batch size: ${SUPABASE_BATCH_SIZE}`);
  console.log("");

  // Check which words already exist
  console.log("🔍 Checking existing words...");
  const { data: existingWords } = await supabase
    .from("dictionary")
    .select("word");
  
  const existingSet = new Set(existingWords?.map(w => w.word) || []);
  const wordsToProcess = UNIQUE_WORDS.filter(w => !existingSet.has(w));
  
  console.log(`   ✅ Already in database: ${existingSet.size}`);
  console.log(`   📝 Words to process: ${wordsToProcess.length}`);
  console.log("");

  if (wordsToProcess.length === 0) {
    console.log("🎉 All words already in database!");
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  // Split into batches for OpenAI
  const openAIBatches: string[][] = [];
  for (let i = 0; i < wordsToProcess.length; i += OPENAI_BATCH_SIZE) {
    openAIBatches.push(wordsToProcess.slice(i, i + OPENAI_BATCH_SIZE));
  }

  console.log(`📦 Processing ${openAIBatches.length} batches...`);
  console.log("");

  // Process batches with concurrency
  for (let i = 0; i < openAIBatches.length; i += CONCURRENT_REQUESTS) {
    const concurrentBatches = openAIBatches.slice(i, i + CONCURRENT_REQUESTS);
    const batchNumbers = concurrentBatches.map((_, idx) => i + idx + 1);
    
    console.log(`⏳ Processing batches ${batchNumbers.join(", ")} of ${openAIBatches.length}...`);

    try {
      // Get embeddings in parallel
      const embeddingsPromises = concurrentBatches.map(batch => 
        processBatchWithRetry(batch, openaiKey)
      );
      
      const embeddingsResults = await Promise.all(embeddingsPromises);
      const allEmbeddings = embeddingsResults.flat();

      // Insert into Supabase in batches
      for (let j = 0; j < allEmbeddings.length; j += SUPABASE_BATCH_SIZE) {
        const insertBatch = allEmbeddings.slice(j, j + SUPABASE_BATCH_SIZE);
        
        const { error } = await supabase
          .from("dictionary")
          .insert(insertBatch.map(({ word, embedding }) => ({ word, embedding })));

        if (error) {
          console.error(`   ❌ Supabase insert error: ${error.message}`);
          errorCount += insertBatch.length;
        } else {
          successCount += insertBatch.length;
        }
      }

      const progress = Math.round(((i + CONCURRENT_REQUESTS) / openAIBatches.length) * 100);
      console.log(`   ✅ Done. Progress: ${Math.min(progress, 100)}% (${successCount} words)`);

    } catch (error) {
      console.error(`   ❌ Batch error: ${error}`);
      errorCount += concurrentBatches.flat().length;
    }

    // Small delay between concurrent batches to avoid rate limits
    if (i + CONCURRENT_REQUESTS < openAIBatches.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log("");
  console.log("=".repeat(50));
  console.log("🎉 Seed completed!");
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${existingSet.size}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total in database: ${existingSet.size + successCount}`);
  console.log(`   ⏱️  Duration: ${duration}s`);
}

seed().catch(console.error);

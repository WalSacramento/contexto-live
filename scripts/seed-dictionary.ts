/**
 * Seed Dictionary Script
 * 
 * This script populates the dictionary table with Portuguese words and their embeddings.
 * 
 * Usage:
 * 1. Set environment variables in .env.local
 * 2. Run: npx tsx scripts/seed-dictionary.ts
 */

import { createClient } from "@supabase/supabase-js";

// Portuguese words - Common words for the PoC
// In production, use a larger dataset from a .txt file
const PORTUGUESE_WORDS = [
  // Natureza
  "sol", "lua", "estrela", "céu", "nuvem", "chuva", "vento", "mar", "rio", "montanha",
  "floresta", "árvore", "flor", "folha", "grama", "terra", "areia", "pedra", "fogo", "água",
  "neve", "gelo", "raio", "trovão", "tempestade", "oceano", "lago", "cachoeira", "ilha", "praia",
  
  // Animais
  "cachorro", "gato", "pássaro", "peixe", "leão", "tigre", "elefante", "girafa", "macaco", "cobra",
  "borboleta", "abelha", "formiga", "aranha", "cavalo", "vaca", "porco", "galinha", "pato", "coelho",
  "urso", "lobo", "raposa", "veado", "baleia", "tubarão", "golfinho", "tartaruga", "jacaré", "sapo",
  
  // Comida
  "arroz", "feijão", "carne", "frango", "peixe", "salada", "legumes", "frutas", "pão", "bolo",
  "maçã", "banana", "laranja", "uva", "morango", "abacaxi", "melancia", "manga", "limão", "coco",
  "café", "chá", "leite", "suco", "água", "cerveja", "vinho", "queijo", "ovo", "manteiga",
  
  // Casa
  "casa", "apartamento", "quarto", "sala", "cozinha", "banheiro", "varanda", "jardim", "garagem", "porta",
  "janela", "teto", "parede", "chão", "escada", "sofá", "cadeira", "mesa", "cama", "armário",
  "geladeira", "fogão", "televisão", "computador", "telefone", "lâmpada", "espelho", "tapete", "cortina", "quadro",
  
  // Corpo
  "cabeça", "cabelo", "olho", "nariz", "boca", "orelha", "pescoço", "ombro", "braço", "mão",
  "dedo", "peito", "barriga", "costas", "perna", "joelho", "pé", "coração", "cérebro", "sangue",
  "osso", "músculo", "pele", "dente", "língua", "lábio", "sobrancelha", "cílio", "unha", "cotovelo",
  
  // Sentimentos
  "amor", "alegria", "felicidade", "tristeza", "raiva", "medo", "surpresa", "esperança", "paz", "calma",
  "ansiedade", "saudade", "paixão", "carinho", "ternura", "orgulho", "vergonha", "culpa", "inveja", "ciúme",
  "gratidão", "confiança", "coragem", "paciência", "bondade", "generosidade", "humildade", "respeito", "admiração", "compaixão",
  
  // Profissões
  "médico", "professor", "engenheiro", "advogado", "arquiteto", "dentista", "enfermeiro", "policial", "bombeiro", "cozinheiro",
  "motorista", "piloto", "atleta", "artista", "músico", "cantor", "ator", "escritor", "jornalista", "fotógrafo",
  "cientista", "programador", "designer", "contador", "vendedor", "gerente", "diretor", "presidente", "secretário", "agricultor",
  
  // Tempo
  "segundo", "minuto", "hora", "dia", "semana", "mês", "ano", "década", "século", "momento",
  "manhã", "tarde", "noite", "madrugada", "amanhecer", "anoitecer", "ontem", "hoje", "amanhã", "sempre",
  "nunca", "agora", "antes", "depois", "passado", "presente", "futuro", "eterno", "instantâneo", "breve",
  
  // Cores
  "vermelho", "azul", "verde", "amarelo", "laranja", "roxo", "rosa", "marrom", "preto", "branco",
  "cinza", "dourado", "prateado", "bege", "turquesa", "violeta", "coral", "salmão", "creme", "bronze",
  
  // Objetos
  "livro", "caneta", "lápis", "papel", "tesoura", "cola", "régua", "borracha", "mochila", "caderno",
  "relógio", "óculos", "chave", "carteira", "bolsa", "guarda-chuva", "chapéu", "sapato", "camisa", "calça",
  "vestido", "saia", "casaco", "gravata", "cinto", "anel", "colar", "brinco", "pulseira", "perfume",
  
  // Lugares
  "cidade", "país", "continente", "mundo", "planeta", "universo", "rua", "avenida", "praça", "parque",
  "shopping", "mercado", "farmácia", "hospital", "escola", "universidade", "biblioteca", "museu", "teatro", "cinema",
  "restaurante", "hotel", "aeroporto", "estação", "banco", "igreja", "prédio", "ponte", "túnel", "estrada",
  
  // Transportes
  "carro", "moto", "bicicleta", "ônibus", "trem", "metrô", "avião", "helicóptero", "navio", "barco",
  "táxi", "caminhão", "ambulância", "foguete", "submarino", "patinete", "skate", "canoa", "veleiro", "jato",
  
  // Esportes
  "futebol", "basquete", "vôlei", "tênis", "natação", "corrida", "ciclismo", "boxe", "judô", "karatê",
  "ginástica", "surfe", "skate", "esqui", "golfe", "beisebol", "rugby", "handebol", "atletismo", "luta",
  
  // Música
  "música", "canção", "melodia", "ritmo", "harmonia", "violão", "guitarra", "piano", "bateria", "flauta",
  "violino", "saxofone", "trompete", "harpa", "acordeão", "pandeiro", "tambor", "microfone", "amplificador", "palco",
  
  // Tecnologia
  "internet", "celular", "tablet", "notebook", "mouse", "teclado", "monitor", "impressora", "câmera", "drone",
  "aplicativo", "software", "hardware", "programa", "sistema", "rede", "servidor", "nuvem", "dados", "código",
  
  // Família
  "pai", "mãe", "filho", "filha", "irmão", "irmã", "avô", "avó", "neto", "neta",
  "tio", "tia", "primo", "prima", "sobrinho", "sobrinha", "marido", "esposa", "namorado", "namorada",
  
  // Verbos comuns (substantivados para o jogo)
  "trabalho", "estudo", "viagem", "passeio", "compra", "venda", "ajuda", "apoio", "luta", "vitória",
  "derrota", "começo", "fim", "mudança", "escolha", "decisão", "pensamento", "sonho", "desejo", "objetivo",
  
  // Conceitos abstratos
  "tempo", "espaço", "vida", "morte", "verdade", "mentira", "bem", "mal", "justiça", "liberdade",
  "igualdade", "fraternidade", "democracia", "poder", "força", "fraqueza", "sucesso", "fracasso", "sorte", "destino",
  "alma", "espírito", "mente", "consciência", "memória", "imaginação", "criatividade", "inteligência", "sabedoria", "conhecimento",
  
  // Elementos e materiais
  "ouro", "prata", "ferro", "aço", "cobre", "bronze", "alumínio", "plástico", "vidro", "madeira",
  "papel", "tecido", "couro", "borracha", "concreto", "tijolo", "cimento", "cerâmica", "mármore", "granito",
  
  // Formas
  "círculo", "quadrado", "triângulo", "retângulo", "losango", "oval", "esfera", "cubo", "pirâmide", "cilindro",
  "cone", "linha", "ponto", "curva", "ângulo", "borda", "centro", "superfície", "volume", "área"
];

// Remove duplicates and normalize
const UNIQUE_WORDS = [...new Set(PORTUGUESE_WORDS.map(w => w.toLowerCase().trim()))];

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function seed() {
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

  console.log(`🚀 Starting seed with ${UNIQUE_WORDS.length} words...`);
  console.log("");

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  // Process in batches to avoid rate limits
  const BATCH_SIZE = 20;
  const DELAY_MS = 1000; // 1 second delay between batches

  for (let i = 0; i < UNIQUE_WORDS.length; i += BATCH_SIZE) {
    const batch = UNIQUE_WORDS.slice(i, i + BATCH_SIZE);
    
    console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(UNIQUE_WORDS.length / BATCH_SIZE)}...`);

    for (const word of batch) {
      try {
        // Check if word already exists
        const { data: existing } = await supabase
          .from("dictionary")
          .select("id")
          .eq("word", word)
          .single();

        if (existing) {
          skipCount++;
          continue;
        }

        // Get embedding from OpenAI
        const embedding = await getEmbedding(word, openaiKey);

        // Insert into database
        const { error } = await supabase
          .from("dictionary")
          .insert({ word, embedding });

        if (error) {
          console.error(`  ❌ Error inserting "${word}": ${error.message}`);
          errorCount++;
        } else {
          console.log(`  ✅ ${word}`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Error processing "${word}": ${err}`);
        errorCount++;
      }
    }

    // Delay between batches to avoid rate limits
    if (i + BATCH_SIZE < UNIQUE_WORDS.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log("");
  console.log("🎉 Seed completed!");
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total: ${UNIQUE_WORDS.length}`);
}

seed().catch(console.error);


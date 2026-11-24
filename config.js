/**
 * Feitiva Clinic — Configuração White-Label Centralizada
 * ---------------------------------------------------------------------------
 * Edite apenas este arquivo para personalizar o site para uma nova clínica.
 * Mantenha URLs externas válidas (https://) e cores em formato hexadecimal.
 *
 * AVISO: Os dados abaixo são demonstrativos/fictícios. Substitua por dados
 * reais e autorizados da clínica contratante antes da publicação em produção.
 */
window.FEITIVA_CLINIC_CONFIG = {
  meta: {
    // Exibir ou ocultar a barra superior de demonstração ("PROJETO DEMONSTRATIVO...")
    showDemoBanner: true,
    developerName: "Feitiva",
    copyrightYear: "2026"
  },

  clinic: {
    // Nome completo da clínica (usado em títulos, rodapé e descrições)
    name: "Clínica Aurora",
    // Composição visual do logotipo textual no cabeçalho e rodapé
    brandPrefix: "clínica",
    brandHighlight: "aurora",
    tagline: "SAÚDE INTEGRADA",
    // Metadados da página
    pageTitle: "Clínica Aurora | Cuidado que acolhe",
    description:
      "Clínica Aurora — cuidado médico próximo, humano e integrado. Projeto demonstrativo desenvolvido pela Feitiva."
  },

  logo: {
    // "monogram" usa a letra configurada abaixo; "image" exibe uma imagem via URL segura
    type: "monogram",
    monogram: "a",
    // Exemplo para logotipo próprio: "https://seusite.com.br/logo.png" ou "./assets/logo.png"
    imageUrl: "",
    alt: "Logotipo da Clínica Aurora"
  },

  colors: {
    // Cores principais e secundárias aplicadas automaticamente às variáveis CSS
    primary: "#102b46",
    primaryHover: "#244b68",
    primaryDark: "#0e263d",
    secondary: "#668475",
    secondaryHover: "#47745f",
    secondarySoft: "#dce8e1",
    accent: "#b9d2c2",
    background: "#f6f7f4"
  },

  contact: {
    // Telefone fixo ou principal
    phoneDisplay: "(11) 3000-0000",
    phoneRaw: "+551130000000",

    // WhatsApp: informe apenas DDI + DDD + número (somente dígitos)
    whatsappNumber: "5511999999999",
    whatsappDisplay: "(11) 99999-9999",
    whatsappDefaultMessage: "Olá! Gostaria de mais informações sobre atendimento.",

    // E-mail institucional
    email: "contato@clinicaaurora.example",

    // Endereço, link opcional direto do Google Maps e cidade exibida na dobra principal
    address: "Av. Exemplo, 1000 · São Paulo, SP",
    // Opcional: cole aqui um link direto do Google Maps (se vazio, busca automaticamente pelo endereço acima)
    mapsUrl: "",
    cityUpper: "SÃO PAULO",

    // Horário de funcionamento
    hours: "Segunda a sexta · 08h às 18h"
  },

  media: {
    // Imagem principal da seção inicial (Hero)
    heroImageUrl:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=85",
    heroImageAlt: "Ambiente claro e acolhedor de uma clínica moderna"
  },

  // Especialidades exibidas na grade e carregadas automaticamente no formulário
  specialties: [
    {
      number: "01",
      icon: "♡",
      name: "Cardiologia",
      description: "Prevenção e acompanhamento da saúde cardiovascular."
    },
    {
      number: "02",
      icon: "✧",
      name: "Dermatologia",
      description: "Cuidados com a saúde e o bem-estar da pele."
    },
    {
      number: "03",
      icon: "⌁",
      name: "Endocrinologia",
      description: "Atenção à saúde hormonal e metabólica."
    },
    {
      number: "04",
      icon: "✿",
      name: "Pediatria",
      description: "Acompanhamento cuidadoso em cada etapa da infância."
    },
    {
      number: "05",
      icon: "◉",
      name: "Neurologia",
      description: "Avaliação e cuidado especializado do sistema nervoso."
    },
    {
      number: "06",
      icon: "＋",
      name: "Clínica geral",
      description: "Acompanhamento integral e orientação em saúde."
    }
  ],

  // Profissionais exibidos na seção de equipe (perfis fictícios de demonstração)
  professionals: [
    {
      name: "Dra. Marina Costa",
      specialty: "Cardiologia",
      registrationNote: "CRM fictício · perfil demonstrativo",
      photoUrl:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=700&q=80",
      photoAlt: "Retrato ilustrativo de médica"
    },
    {
      name: "Dr. Rafael Mendes",
      specialty: "Clínica geral",
      registrationNote: "CRM fictício · perfil demonstrativo",
      photoUrl:
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=700&q=80",
      photoAlt: "Retrato ilustrativo de médico"
    },
    {
      name: "Dra. Luiza Ferreira",
      specialty: "Dermatologia",
      registrationNote: "CRM fictício · perfil demonstrativo",
      photoUrl:
        "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=700&q=80",
      photoAlt: "Retrato ilustrativo de médica"
    }
  ],

  booking: {
    // "supabase": especialidades, profissionais e agendamentos vêm do banco da clínica
    //             (via Edge Function "public-booking", com validação no servidor).
    // "demo":     valida apenas no navegador, sem enviar ou armazenar dados.
    // "api":      envia para um serviço externo próprio em endpointUrl.
    mode: "supabase",
    // Identificador público da clínica no banco (coluna "slug" da tabela clinics)
    clinicSlug: "clinica-aurora-demo",
    endpointUrl: ""
  },

  supabase: {
    // Preencha com os dados públicos do seu projeto no Supabase:
    // Painel Supabase > Project Settings > API (ou Data API / API Keys)
    url: "https://dwuhofdspdkkeygmceie.supabase.co",
    // IMPORTANTE: Use APENAS a chave pública ("Publishable key" ou "anon public").
    // NUNCA coloque a chave "service_role" ou "secret" neste arquivo.
    publishableKey: "sb_publishable_LG8jOIdpg7FHpYybR_xxMw_dZfutV-U"
  }
};
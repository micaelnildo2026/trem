import {
  MotorOption,
  TransmissionConfig,
  LocomotiveSpecs,
  SustainableBomItem,
  FabricationStep,
} from '../types/locomotive';

export const MOTOR_OPTIONS: MotorOption[] = [
  {
    id: 'motor-775-planetary',
    name: 'Motor DC 775 com Redutor Planetário Metálico (1:19.2 / 12V-24V)',
    type: 'dc_planetary',
    voltage: 14.8, // Bateria LiPo 4S ou 12V LiFePO4
    noLoadRpm: 450,
    ratedRpm: 340,
    ratedTorque: 4.8, // N.m no eixo do redutor
    stallTorque: 18.5, // N.m no eixo do redutor
    ratedCurrent: 6.5,
    stallCurrent: 35.0,
    weight: 780,
    efficiency: 82,
    recommended: true,
    scoreHelpers: 9.8,
    scoreElevation: 9.6,
    scoreAcceleration: 8.9,
    scoreTugOfWar: 9.9,
    pros: [
      'Torque brutal de partida (indispensável para Cabo de Guerra e Helpers 20kg)',
      'Engrenagens planetárias internas 100% em aço sinterizado temperado',
      'Curva de torque linear com excelente resposta em baixa rotação',
      'Fácil controle por driver PWM de alta potência (Ponte H BTS7960 43A)',
      'Robustez comprovada em robótica pesada contra travamento sob carga extrema'
    ],
    cons: [
      'Peso próprio um pouco mais elevado (780g), porém benéfico como massa tratora',
      'Requer driver de potência com capacidade para picos de corrente > 30A'
    ],
    verdict: 'ESCOLHA CAMPEÃ: O motor DC 775 com planetária oferece a melhor relação torque/confiabilidade sem risco de desarmes de ESC ou perda de passos.'
  },
  {
    id: 'motor-brushless-3548',
    name: 'Motor Brushless Outrunner 3548 790KV + Redutor Modular 1:30',
    type: 'brushless_gear',
    voltage: 14.8,
    noLoadRpm: 390,
    ratedRpm: 320,
    ratedTorque: 4.2,
    stallTorque: 12.0,
    ratedCurrent: 8.0,
    stallCurrent: 45.0,
    weight: 420,
    efficiency: 88,
    recommended: false,
    scoreHelpers: 8.5,
    scoreElevation: 8.0,
    scoreAcceleration: 9.8,
    scoreTugOfWar: 7.6,
    pros: [
      'Altíssima eficiência elétrica (88%) e excelente relação potência/peso',
      'Arrancada violentamente rápida para a prova de aceleração 2500mm'
    ],
    cons: [
      'Cogging (trepidação) severo na partida se o ESC não for sensorizado (sensored)',
      'No cabo de guerra parado sob torque máximo, o ESC pode cortar por sobrecorrente térmica',
      'Complexidade maior de montagem e necessidade de redutor impresso customizado'
    ],
    verdict: 'Ótimo para velocidade pura, porém arriscado no Cabo de Guerra e na arrancada com 20kg no Helpers.'
  },
  {
    id: 'motor-550-worm',
    name: 'Motor DC 550 com Redutor de Rosca Sem-Fim (Worm Gear 1:40)',
    type: 'dc_worm',
    voltage: 12.0,
    noLoadRpm: 220,
    ratedRpm: 180,
    ratedTorque: 3.5,
    stallTorque: 10.0,
    ratedCurrent: 4.2,
    stallCurrent: 18.0,
    weight: 490,
    efficiency: 58,
    recommended: false,
    scoreHelpers: 8.0,
    scoreElevation: 9.0,
    scoreAcceleration: 5.5,
    scoreTugOfWar: 7.2,
    pros: [
      'Auto-travamento intrínseco (segura a locomotiva na rampa sem descer)',
      'Saída em 90 graus compacta'
    ],
    cons: [
      'Baixo rendimento mecânico (perde >40% da energia em atrito térmico)',
      'Velocidade muito lenta, prejudicando severamente a Prova de Aceleração 2500mm',
      'Fragilidade dos dentes da coroa de latão sob trancos bruscos de cabo de guerra'
    ],
    verdict: 'Excelente para segurar rampa, mas perde preciosos pontos na prova de velocidade.'
  },
  {
    id: 'motor-stepper-nema23',
    name: 'Motor de Passo NEMA 23 (2.2 N.m) + Driver Microstep',
    type: 'stepper',
    voltage: 24.0,
    noLoadRpm: 300,
    ratedRpm: 200,
    ratedTorque: 2.2,
    stallTorque: 2.2,
    ratedCurrent: 3.0,
    stallCurrent: 3.0,
    weight: 1050,
    efficiency: 65,
    recommended: false,
    scoreHelpers: 6.0,
    scoreElevation: 6.5,
    scoreAcceleration: 6.0,
    scoreTugOfWar: 4.5,
    pros: [
      'Precisão milimétrica de posicionamento e controle digital sem sensores extras'
    ],
    cons: [
      'Risco fatal de perda de passos (stall) no Cabo de Guerra e Helpers com 20kg',
      'Quando perde o passo, o torque cai para zero e o motor vibra parado sem tracionar',
      'Muito pesado (1.05 kg só o motor) e consumo estático contínuo elevado'
    ],
    verdict: 'Inadequado para tração pesada competitiva devido à perda catastrófica de passo sob sobrecarga.'
  },
  {
    id: 'motor-diy-sustainable-afpm',
    name: 'Motor Próprio Sustentável AFPM 12N14P + Planetária 3D (Fabricação Própria)',
    type: 'diy_axial_planetary',
    voltage: 12.8, // Bateria LiFePO4 4S livre de cobalto (2000+ ciclos)
    noLoadRpm: 340,
    ratedRpm: 285,
    ratedTorque: 4.82, // N.m após estágio planetário impresso 5:1
    stallTorque: 13.55, // N.m limitado pelo ESC sensored a 45A
    ratedCurrent: 16.0,
    stallCurrent: 45.0,
    weight: 710,
    efficiency: 86,
    recommended: true,
    scoreHelpers: 9.7,
    scoreElevation: 9.5,
    scoreAcceleration: 9.2,
    scoreTugOfWar: 9.6,
    pros: [
      '100% reparável e modular: bobinas, ímãs N52 e engrenagens planetárias são substituíveis sem descarte',
      'Zero aço silício laminado complexo: estator sem núcleo ferroso impresso em rPETG reciclado com discos de aço 1020 de sucata',
      'Sensores Hall integrados no estator eliminam cogging na partida com carga de 20 kg (Helpers)',
      'Opera com bateria LiFePO4 4S livre de cobalto (6,7x mais ciclos de vida útil que LiPo)'
    ],
    cons: [
      'Exige ~6 horas de bobinagem manual com gabarito impresso em 3D e alinhamento cuidadoso de entreferro',
      'Necessita de driver BLDC sensored (VESC / ODrive mini) com leitura Hall para torque em rotação zero'
    ],
    verdict: 'SOLUÇÃO SUSTENTÁVEL AUTORAL: Combina impressão 3D em rPETG, fabricação de oficina (bobinagem + retorno em aço 1020) e componentes comprados essenciais com desempenho competitivo equivalente ao motor comercial.'
  },
  {
    id: 'motor-parafusadeira-12v',
    name: 'Motor de Parafusadeira 12V (1ª Marcha Planetária 1:36 + Corrente Bike)',
    type: 'screwdriver_chain',
    voltage: 12.0,
    noLoadRpm: 350,
    ratedRpm: 290,
    ratedTorque: 4.6,
    stallTorque: 14.5,
    ratedCurrent: 12.0,
    stallCurrent: 35.0,
    weight: 520,
    efficiency: 74,
    recommended: false,
    scoreHelpers: 9.4,
    scoreElevation: 9.2,
    scoreAcceleration: 9.0,
    scoreTugOfWar: 9.5,
    pros: [
      'Custo imbatível (<= R$ 200 com bateria 20A, eixos, pinhões, corrente e kit fixação 3.g/3.h)',
      'Já vem com caixa planetária metálica de 2 velocidades (~1:36 na 1ª marcha)',
      'Transmissão 4x4 por corrente de bicicleta 1/2" x 1/8" não patina nem rompe em tração pesada'
    ],
    cons: [
      'Exige acoplamento hexagonal ou chavetado firme no eixo de saída para o pinhão 14T',
      'Pack 3S precisa suportar descarga >= 20A contínuos (BMS 40A) para não cortar no Cabo de Guerra'
    ],
    verdict: 'ESCOLHA ECONÔMICA DEFINITIVA (<= R$ 200): Motor RS-550 12V c/ planetária 1:36 + Bateria Li-Ion 3S Alta Descarga 20A e corrente 4x4 para vencer as 4 provas cumprindo 100% do regulamento.'
  }
];

export const DEFAULT_TRANSMISSION: TransmissionConfig = {
  motorRpm: 340, // RPM nominal da saída do redutor planetário 775
  motorPinionTeeth: 15, // Pinhão de aço/POM M1.0
  drivenGearTeeth: 45, // Engrenagem cilíndrica reta M1.0 no Eixo 1 (Redução 3:1)
  internalGearboxRatio: 19.2, // Redução interna planetária do motor
  pulleyWheelAxle1Teeth: 30, // Polia GT2 30T fixada no Eixo 1
  pulleyWheelAxle2Teeth: 30, // Polia GT2 30T fixada no Eixo 2 (Relação 1:1)
  wheelbaseMm: 160, // Distância entre eixos (wheelbase)
  wheelDiameterMm: 65, // Diâmetro de rolamento da roda
  beltPitchMm: 2, // Passo GT2 padrão = 2.0 mm
  beltWidthMm: 9 // Largura da correia GT2 reforçada = 9 mm
};

export const DEFAULT_LOCOMOTIVE_SPECS: LocomotiveSpecs = {
  gaugeMm: 150.0, // Exatamente 150 mm (Regulamento UFSC 3.a)
  hitchHeightMm: 107.5, // 105 a 110 mm (Regulamento UFSC 3.b) - Centro exato
  totalLengthMm: 335.0, // Máximo 360 mm (Margem segura de 25mm)
  totalWidthMm: 205.0, // Máximo 220 mm (Margem segura de 15mm)
  totalHeightMm: 245.0, // Máximo 330 mm (Margem segura de 85mm)
  totalWeightGrams: 7650, // Limite máximo 8000 g (Massa otimizada para atrito com margem de segurança de 350g)
  chassisWeightG: 1450, // Chassi e suportes de mancais em PETG/PA12-CF
  shellWeightG: 950, // Carenagem aerodinâmica impressa em PLA+/PETG
  motorGearboxWeightG: 880, // Motor 775 + Planetária + engrenagens
  batteryWeightG: 520, // LiPo 4S 5200mAh 50C com conector XT60
  wheelsetBearingsWeightG: 950, // 4 rodas de aço/alumínio + 2 eixos 8mm + 4 rolamentos 608ZZ
  ballastWeightG: 2900, // Compartimento de lastro em chumbo/esferas de aço centralizado no fundo
  wheelFrictionCoeff: 0.65 // Com inserto de anel o-ring de poliuretano na banda de rodagem sobre trilho
};

export const REGULATION_RULES = [
  {
    id: 'gauge',
    rule: '3.a',
    title: 'Medição da Bitola',
    requirement: 'Distância entre a parte central das rodas: exatamente 150 mm',
    ourValue: '150,0 mm',
    status: 'COMPLIANT',
    penalty: 'Reprovação imediata na inspeção técnica'
  },
  {
    id: 'hitch',
    rule: '3.b',
    title: 'Altura do Engate',
    requirement: 'Medido do nível inferior das rodas: deve compreender de 105 a 110 mm',
    ourValue: '107,5 mm (Centro da tolerância)',
    status: 'COMPLIANT',
    penalty: 'Reprovação na inspeção técnica (-3 pts se retestar)'
  },
  {
    id: 'weight',
    rule: '3.c',
    title: 'Peso Máximo do Protótipo',
    requirement: 'Não deve exceder 8000 gramas (8,0 kg)',
    ourValue: '7.650 g (Lastrado estrategicamente p/ atrito)',
    status: 'COMPLIANT',
    penalty: '+100g além de 8000g → penalidade de -0.2 pontos na nota'
  },
  {
    id: 'width',
    rule: '3.d',
    title: 'Largura Máxima',
    requirement: 'A largura do protótipo não pode ultrapassar 220 mm',
    ourValue: '205,0 mm (Margem de segurança de 15 mm)',
    status: 'COMPLIANT',
    penalty: '+10mm além de 220mm → -0.5 pontos'
  },
  {
    id: 'length',
    rule: '3.e',
    title: 'Comprimento Máximo',
    requirement: 'O comprimento do protótipo não deve superar 360 mm',
    ourValue: '335,0 mm (Margem de segurança de 25 mm)',
    status: 'COMPLIANT',
    penalty: '+10mm além de 360mm → -0.5 pontos'
  },
  {
    id: 'height',
    rule: '3.f',
    title: 'Altura Máxima',
    requirement: 'A altura não deve superar 330 mm',
    ourValue: '245,0 mm (Margem de segurança de 85 mm)',
    status: 'COMPLIANT',
    penalty: '+10mm além de 330mm → -0.5 pontos'
  },
  {
    id: 'loose_parts',
    rule: '3.g',
    title: 'Verificação de Partes Soltas',
    requirement: 'Não haver peças soltas no protótipo (inspeção rigorosa)',
    ourValue: 'Fixação 100% por parafusos M3/M4 sextavados e insertos roscados de latão termofixados',
    status: 'COMPLIANT',
    penalty: 'Reprovação imediata da equipe'
  },
  {
    id: 'power_plug',
    rule: '3.h',
    title: 'Alimentação Autônoma (Sem Tomadas)',
    requirement: 'Proibido funcionamento plugado em tomadas elétricas',
    ourValue: 'Bateria LiPo 4S 14.8V 5200mAh embarcada com chave geral industrial',
    status: 'COMPLIANT',
    penalty: 'Desqualificação'
  }
];

export const USER_CAD_SCREENSHOTS = [
  {
    id: 'cad-top',
    title: 'Vista Superior da Carenagem (Onshape)',
    path: '/assets/aistudio/Screenshot_20261106-160019_19bcb911.png',
    desc: 'Perfil aerodinâmico frontal com teto plano para escoamento e acesso interno à bateria.'
  },
  {
    id: 'cad-bottom',
    title: 'Vista Inferior do Chassi & 1º Eixo Montado',
    path: '/assets/aistudio/Screenshot_20261106-160106_449d222b.png',
    desc: 'Vão inferior com o primeiro rodeiro instalado e cavidade aberta para instalação do 2º eixo, correia GT2 e polias.'
  },
  {
    id: 'cad-inside-rear',
    title: 'Vista Traseira Interna da Cabine',
    path: '/assets/aistudio/Screenshot_20261106-160132_8bc985fe.png',
    desc: 'Visão dos apoios centrais do chassi, berço do motor 775 e altura do engate traseiro.'
  },
  {
    id: 'cad-iso-high',
    title: 'Perspectiva Isométrica Superior',
    path: '/assets/aistudio/Screenshot_20261106-160005_d592405b.png',
    desc: 'Geometria fluida moderna com montantes de janelas reforçados para rigidez torcional.'
  },
  {
    id: 'cad-side',
    title: 'Vista Lateral (Elevação)',
    path: '/assets/aistudio/Screenshot_20261106-155942_2b87f2c4.png',
    desc: 'Janela panorâmica frontal inclinada, porta de cabine e proporções para cumprimento de 335 mm e altura de 245 mm.'
  },
  {
    id: 'cad-front',
    title: 'Vista Frontal com Rodeiro 150mm',
    path: '/assets/aistudio/Screenshot_20261106-155924_1b876034.png',
    desc: 'Bitola de 150 mm entre os centros das rodas com flange ferroviário nos trilhos.'
  }
];

export const SUSTAINABLE_LOCOMOTIVE_SPECS: LocomotiveSpecs = {
  ...DEFAULT_LOCOMOTIVE_SPECS,
  motorGearboxWeightG: 790, // Motor próprio AFPM (710g) + engrenagens externas M1.0
  batteryWeightG: 540, // LiFePO4 4S 12.8V 5000mAh sem cobalto
  ballastWeightG: 2970, // Lastro ecológico de sucata ferrosa/parafusos reciclados (ZERO chumbo tóxico)
  totalWeightGrams: 7650, // Mantém massa ótima de aderência abaixo dos 8000 g
};

export const SUSTAINABLE_BOM_ITEMS: SustainableBomItem[] = [
  // IMPRESSÃO 3D (rPETG Reciclado / PA12-CF / PLA+)
  {
    id: 'bom-stator-carrier',
    subsystem: 'motor',
    name: 'Estator Porta-Bobinas 12N + Gabarito de Bobinagem',
    method: 'print3d',
    materialOrSpec: 'rPETG Reciclado (100% sólido, Tg 80°C)',
    sustainabilityRole: 'Elimina chapas estampadas de aço silício; permite desenrolar e reciclar o cobre ao fim da vida útil.',
    massG: 85,
    estimatedCostBrl: 14,
    tooling: 'Impressora 3D FDM (bico 0.4 mm, camada 0.16 mm)',
  },
  {
    id: 'bom-planetary-stage',
    subsystem: 'motor',
    name: 'Redutor Planetário 5:1 Integrado (Sol 15T / Planetas 22T / Coroa 60T M1.5)',
    method: 'print3d',
    materialOrSpec: 'Nylon PA12-CF / rPETG lubrificado com graxa PTFE',
    sustainabilityRole: 'Substitui caixa planetária metálica selada importada por estágio modular reparável peça a peça.',
    massG: 125,
    estimatedCostBrl: 24,
    tooling: 'Impressora 3D FDM (infill 100% concêntrico, camada 0.12 mm)',
  },
  {
    id: 'bom-chassis-shell',
    subsystem: 'chassis',
    name: 'Chassi Modular 150 mm + Carenagem Sem Cola (Encaixes Parafusados)',
    method: 'print3d',
    materialOrSpec: 'rPETG reciclado (chassi) + PLA biodegradável (carenagem)',
    sustainabilityRole: 'Montagem 100% reversível com insertos de latão; peças avariadas são reimpressas isoladamente.',
    massG: 2400,
    estimatedCostBrl: 165,
    tooling: 'Impressora 3D FDM + Ferro de solda 220°C (insertos)',
  },
  {
    id: 'bom-gears-wheels',
    subsystem: 'transmission',
    name: 'Par M1.0 (15T/45T), Polias GT2 30T e Núcleo das 4 Rodas (150 mm)',
    method: 'print3d',
    materialOrSpec: 'PA12 / rPETG alta resistência + anel O-ring de PU reutilizável',
    sustainabilityRole: 'Desmontagem rápida de rodeiros e engrenagens sem colagem permanente.',
    massG: 260,
    estimatedCostBrl: 38,
    tooling: 'Impressora 3D FDM (0.12 mm de precisão dental)',
  },

  // FABRICAÇÃO PRÓPRIA / REAPROVEITAMENTO EM OFICINA
  {
    id: 'bom-winding-assembly',
    subsystem: 'motor',
    name: 'Bobinagem Trifásica Estrela (12 bobinas × 20 espiras) + Resina Biobase',
    method: 'fabrication',
    materialOrSpec: 'Bobinagem manual em gabarito + amarração e verniz isolante',
    sustainabilityRole: 'Construção autoral do estator sem perdas por histerese no núcleo (ironless), reduzindo aquecimento.',
    massG: 118,
    estimatedCostBrl: 18,
    tooling: 'Gabarito impresso 3D, multímetro, ferro de solda e estufa 50°C',
  },
  {
    id: 'bom-backiron-discs',
    subsystem: 'motor',
    name: '2 Discos de Retorno Magnético do Rotor (14 Polos)',
    method: 'fabrication',
    materialOrSpec: 'Chapa de aço carbono SAE 1020 (3 mm) reaproveitada de retalho',
    sustainabilityRole: 'Reúso de sobras metálicas industriais cortadas e faceadas em oficina universitária.',
    massG: 260,
    estimatedCostBrl: 15,
    tooling: 'Esmerilhadeira / serra copo + furadeira de bancada',
  },
  {
    id: 'bom-reclaimed-shafts',
    subsystem: 'transmission',
    name: 'Eixos Temperados Ø8 mm (Motor + 2 Eixos das Rodas 150 mm)',
    method: 'fabrication',
    materialOrSpec: 'Varões lineares Ø8 mm reaproveitados de impressoras 2D/3D sucateadas',
    sustainabilityRole: 'Reaproveitamento direto de aço retificado de lixo eletrônico (e-waste) com tolerância h6.',
    massG: 290,
    estimatedCostBrl: 0,
    tooling: 'Dremel / lima para chanfro D-cut e canal de chaveta',
  },
  {
    id: 'bom-eco-ballast',
    subsystem: 'chassis',
    name: 'Lastro Ecológico de Aderência (Zero Chumbo Tóxico)',
    method: 'fabrication',
    materialOrSpec: '2.970 g de sucata ferrosa limpa (arruelas/porcas velhas encapsuladas)',
    sustainabilityRole: 'Elimina 100% do chumbo metálico tóxico (2,9 kg) tradicionalmente usado em modelismo.',
    massG: 2970,
    estimatedCostBrl: 12,
    tooling: 'Balança digital e estojo modular impresso no fundo do chassi',
  },

  // COMPRA ESTRATÉGICA (COMPONENTES ESSENCIAIS NÃO FABRICÁVEIS)
  {
    id: 'bom-enameled-copper',
    subsystem: 'motor',
    name: 'Fio de Cobre Esmaltado Classe F (AWG 19 / Ø0,95 mm — 15 m)',
    method: 'purchase',
    materialOrSpec: 'Cobre eletrolítico com duplo esmalte poliéster-imida (155°C)',
    sustainabilityRole: 'Cobre 100% reciclável ao final do projeto; alta seção reduz perdas Joule (I²R).',
    massG: 95,
    estimatedCostBrl: 36,
    tooling: 'Compra em bobina fracionada (ou reaproveitamento de transformador)',
  },
  {
    id: 'bom-n52-magnets',
    subsystem: 'motor',
    name: '28 Ímãs de Neodímio N52 (15×10×4 mm para 14 polos dupla face)',
    method: 'purchase',
    materialOrSpec: 'NdFeB N52 revestidos com Ni-Cu-Ni (fixados em alojamento sem cola definitiva)',
    sustainabilityRole: 'Alojamento mecânico com anel trava permite extrair e reutilizar os ímãs de terras raras.',
    massG: 92,
    estimatedCostBrl: 112,
    tooling: 'Gabarito polarizador impresso (N-S-N-S)',
  },
  {
    id: 'bom-bearings-belt',
    subsystem: 'transmission',
    name: '6 Rolamentos 608ZZ + Correia Fechada GT2-380 (9 mm largura)',
    method: 'purchase',
    materialOrSpec: 'Aço cromo 608ZZ (2 no motor + 4 nos mancais) + borracha/fibra de vidro GT2',
    sustainabilityRole: 'Componentes padronizados de longa vida útil e baixo atrito mecânico.',
    massG: 145,
    estimatedCostBrl: 68,
    tooling: 'Compra padrão industrial',
  },
  {
    id: 'bom-lifepo4-vesc',
    subsystem: 'electronics',
    name: 'Bateria LiFePO4 4S (12,8V 5Ah) + ESC Sensored BLDC (45A) + 3 Sensores Hall',
    method: 'purchase',
    materialOrSpec: 'Células LiFePO4 (sem cobalto, 2000+ ciclos) + driver VESC/BLDC Hall + SS41F',
    sustainabilityRole: 'Química livre de cobalto e risco térmico; dura 6,7× mais que LiPo e permite freio regenerativo.',
    massG: 670,
    estimatedCostBrl: 380,
    tooling: 'Conectores XT60 reaproveitáveis e solda sem chumbo (Sn-Ag-Cu)',
  },
];

export const DIY_MOTOR_FABRICATION_STEPS: FabricationStep[] = [
  {
    stepNumber: 1,
    title: 'Impressão 3D do Estator, Gabarito de Bobinagem e Redutor Planetário',
    methodBadge: 'Impressão 3D (rPETG / PA12-CF)',
    durationEst: '4h 30min',
    summary: 'Imprima o suporte anelar de 12 alojamentos em rPETG reciclado, o carretel gabarito bipartido e as engrenagens planetárias M1.5 (Sol 15T, 3 Planetas 22T, Coroa 60T).',
    details: [
      'Fatie o estator com 100% de preenchimento e altura de camada 0.16 mm para garantir rigidez dimensional no entreferro de 6 mm.',
      'Imprima os alojamentos para os 3 sensores Hall (SS41F) defasados em 120° elétricos diretamente na borda externa do estator.',
      'Faça o pós-processamento dos dentes da planetária com lixa fina e aplique pasta de PTFE seca para amaciamento.'
    ],
    qualityCheck: 'Conferir planicidade do estator (< 0,2 mm de empenamento) e giro livre dos 3 satélites antes da montagem.'
  },
  {
    stepNumber: 2,
    title: 'Bobinagem das 12 Bobinas no Gabarito Impresso',
    methodBadge: 'Fabricação Própria (Enrolamento)',
    durationEst: '2h 00min',
    summary: 'Enrole 12 bobinas trapezoidais idênticas com fio de cobre esmaltado Ø0,95 mm usando o gabarito impresso montado na parafusadeira em baixa rotação.',
    details: [
      'Aplique fita Kapton ou papel Nomex reciclado no núcleo do gabarito e conte exatamente o número de espiras configurado (ex: 20 espiras/bobina).',
      'Encaixe as 12 bobinas no estator impresso seguindo a sequência trifásica 12N14P: A-a-B-b-C-c-A-a-B-b-C-c.',
      'Solde em ligação Estrela (Y) com solda lead-free (Sn-Ag-Cu) e isole as emendas com tubo termo-retrátil.'
    ],
    qualityCheck: 'Medir resistência entre fases (A-B, B-C, C-A) com multímetro: diferença máxima aceita < 3% e isolamento infinito para os discos.'
  },
  {
    stepNumber: 3,
    title: 'Usinagem dos 2 Discos de Retorno Magnético & Eixo Ø8 mm',
    methodBadge: 'Oficina & Reaproveitamento',
    durationEst: '1h 30min',
    summary: 'Corte dois discos circulares em retalho de aço carbono SAE 1020 (espessura 3 mm) para fechar o fluxo magnético dos ímãs N52 e prepare o eixo Ø8 mm de sucata.',
    details: [
      'Fure o centro do disco traseiro e dianteiro com serra copo/broca escalonada e adicione 4 furos de ventilação inclinados.',
      'Reaproveite um varão retificado Ø8 mm de impressora antiga, faça o chanfro plano (D-cut) para travamento da engrenagem solar 15T.',
      'Prenda os anéis espaçadores impressos em 3D que posicionam os 14 ímãs N52 sem uso de cola permanente (desmontável).'
    ],
    qualityCheck: 'Verificar batimento axial dos discos no eixo sobre dois mancais 608ZZ (< 0,15 mm).'
  },
  {
    stepNumber: 4,
    title: 'Inserção Polarizada dos 28 Ímãs N52 & Montagem do Sanduíche Axial',
    methodBadge: 'Compra Estratégica + Gabarito 3D',
    durationEst: '45min',
    summary: 'Instale 14 ímãs N52 em cada disco alternando polos (N-S-N-S) e garantindo atração face a face entre os dois rotores através do estator.',
    details: [
      'Utilize o gabarito polarizador impresso para nunca inverter um polo; pinte a face Norte de cada ímã antes de alojar.',
      'Monte os dois rotores no eixo Ø8 mm usando porcas trava de nylon M8 que ajustam o entreferro para 0,8 mm de cada lado do estator.',
      'Fixe os dois mancais com rolamentos 608ZZ na carcaça externa impressa em rPETG.'
    ],
    qualityCheck: 'Girar o eixo manualmente: deve apresentar rotação suave sem raspagem mecânica no estator e zero cogging excessivo.'
  },
  {
    stepNumber: 5,
    title: 'Acoplamento do Redutor Planetário 5:1 & Teste em Bancada com ESC Sensored',
    methodBadge: 'Integração Eletromecânica',
    durationEst: '1h 00min',
    summary: 'Feche o estágio planetário impresso na frente do motor axial e calibre os 3 sensores Hall no ESC (VESC/BLDC) alimentado pela bateria LiFePO4 4S.',
    details: [
      'Conecte as 3 fases (U, V, W) e o cabo de 5 vias dos sensores Hall ao controlador BLDC sensored de 45A.',
      'Execute a rotina automática de detecção de fluxo e sensores Hall para obter partida suave com torque pleno a 0 RPM.',
      'Acople o pinhão M1.0 15T na saída do porta-planetárias e verifique o alinhamento com a coroa 45T do eixo dianteiro.'
    ],
    qualityCheck: 'Medir corrente a vazio (< 1,8 A a 12,8 V) e testar inversão rápida de sentido para a prova de Cabo de Guerra.'
  },
  {
    stepNumber: 6,
    title: 'Montagem Final na Locomotiva Circular (Lastro Ferroso & Bitola 150 mm)',
    methodBadge: 'Integração Sustentável Final',
    durationEst: '1h 15min',
    summary: 'Instale o conjunto motorizado no chassi rPETG, aplique a correia GT2 nos 2 rodeiros de 150 mm e adicione o lastro de sucata ferrosa até 7.650 g.',
    details: [
      'Posicione o estojo de sucata ferrosa limpa (2.970 g) no fundo central do chassi para abaixar o centro de gravidade sem chumbo tóxico.',
      'Instale a bateria LiFePO4 4S 12,8V no compartimento superior com chave geral industrial e conector XT60.',
      'Parafuse a carenagem modular com parafusos M3 nos insertos de latão, garantindo zero peças soltas (Regra 3.g).'
    ],
    qualityCheck: 'Inspeção completa do Edital: bitola 150,0 mm, engate 107,5 mm, massa 7.650 g (< 8000 g) e teste de tração.'
  }
];

export const BUDGET_200_CORE_ITEMS_OUTLET = [
  {
    id: 'b-motor',
    name: 'Motor Escolhido: DC RS-550 c/ Redutor Planetário Metálico 1:36 (1ª Marcha)',
    spec: 'Conjunto motor + planetária de parafusadeira 12V (290 RPM, 4,6 N.m nom / 14,5 N.m stall)',
    category: 'core_budget' as const,
    unitCostBrl: 65,
    massG: 520,
    sourceTip: 'Parafusadeira 12V outlet/desmanche (evita engrenagem plástica no Cabo de Guerra)'
  },
  {
    id: 'b-battery',
    name: 'Bateria Escolhida: Pack Li-Ion 12V Alta Descarga (3S 18650 2500mAh · 20A/40A BMS)',
    spec: '11,1V–12,6V · 20A contínuos / pico 35A sem corte de BMS na rampa e cabo de guerra (Regra 3.h)',
    category: 'core_budget' as const,
    unitCostBrl: 52,
    massG: 240,
    sourceTip: 'Pack 3S alta descarga ou bateria original de parafusadeira 12V/18V adaptada com BMS 40A'
  },
  {
    id: 'b-axles',
    name: '2× Eixos de Aço (Ø 10 mm × 195 mm + 8 Porcas Travantes Parlock M10 + Arruelas)',
    spec: 'Barra roscada/lisa de aço carbono 10 mm para bitola exata 150,0 mm (Regra 3.a) sem folga',
    category: 'core_budget' as const,
    unitCostBrl: 20,
    massG: 270,
    sourceTip: 'Casa de ferragens (porcas autofrenantes travam roda + pinhão sem peça solta)'
  },
  {
    id: 'b-sprockets',
    name: '3× Rodas Dentadas de Bicicleta (1× Pinhão 14T motor + 2× Pinhões 16T eixos 4x4)',
    spec: 'Passo 1/2" (12,7 mm) em aço temperado: redução 1,14:1 garante > 110 N com vão seguro no trilho',
    category: 'core_budget' as const,
    unitCostBrl: 30,
    massG: 340,
    sourceTip: 'Bicicletaria de bairro (3 pinhões simples de aço ~R$ 10 cada)'
  },
  {
    id: 'b-chain',
    name: 'Corrente de Bicicleta Grossa (1/2" × 1/8") + Emenda Rápida',
    spec: 'Loop único 4x4 sincronizando os dois eixos — não patina e não estoura sob 355 N',
    category: 'core_budget' as const,
    unitCostBrl: 20,
    massG: 290,
    sourceTip: 'Bicicletaria local (corrente comum BMX / barra forte cortada sob medida)'
  },
  {
    id: 'b-fasteners',
    name: 'Kit Inspeção Regras 3.g & 3.h: Parafusos M4/M5 Travantes, Chave Geral 20A & Cabos 14 AWG',
    spec: 'Chave alavanca 20A no painel + terminal XT60/barra + fixação anti-peça solta em todo o chassi',
    category: 'core_budget' as const,
    unitCostBrl: 9,
    massG: 90,
    sourceTip: 'Loja de eletrônica/parafusos (cumpre 100% da vistoria técnica do edital)'
  },
  {
    id: 'b-wheels-3d',
    name: '4× Rodas Ferroviárias Ø 84 mm (Bitola 150 mm) + Banda Câmara de Bike (μ=0,68)',
    spec: 'Cubo hexagonal M10 reforçado (100% infill) + anel de borracha reutilizada para 51 N de aderência',
    category: 'free_3d_print' as const,
    unitCostBrl: 0,
    massG: 480,
    sourceTip: 'Serviço de Impressão 3D Gratuito + câmara furada gratuita de bicicletaria'
  },
  {
    id: 'b-chassis-3d',
    name: 'Chassi 335×205×245 mm + Berço Motor + Esticador + Engate 107,5 mm (Regras 3.b/d/e/f)',
    spec: 'Estrutura em PETG com compartimento travado para lastro e chave geral (Regra 3.g)',
    category: 'free_3d_print' as const,
    unitCostBrl: 0,
    massG: 1420,
    sourceTip: 'Serviço de Impressão 3D Gratuito (bitola 150,0 mm e engate 107,5 mm)'
  },
  {
    id: 'b-ballast',
    name: 'Lastro de Aderência 4x4 (Sucata Ferrosa Limpa / Arruelas Encapsuladas)',
    spec: '3.870 g travados no fundo do chassi → massa final ~7.650 g (< 8.000 g Regra 3.c)',
    category: 'zero_cost_scrap' as const,
    unitCostBrl: 0,
    massG: 3870,
    sourceTip: 'Sucata de ferro/parafusos de oficina a custo zero (garante 51,0 N no trilho)'
  }
];

export const BUDGET_200_RC_OPTIONS = [
  {
    id: 'rc-esp32',
    label: 'Opção Econômica: ESP32 + Ponte H BTS7960 (43A) via Celular/Gamepad',
    totalBrl: 95,
    items: [
      {
        id: 'rc-esp',
        name: 'Microcontrolador ESP32 DevKit (Wi-Fi / Bluetooth)',
        spec: 'Gera PWM suave com rampa anti-patinagem e controle pelo navegador/gamepad',
        category: 'remote_control_excluded' as const,
        unitCostBrl: 35,
        massG: 18,
        sourceTip: 'Fora do teto de R$ 200'
      },
      {
        id: 'rc-bts',
        name: 'Driver Ponte H BTS7960 43A (Frente + Ré + Freio Motor)',
        spec: 'Suporta pico de 35A da parafusadeira 12V sem aquecer, com reversão rápida',
        category: 'remote_control_excluded' as const,
        unitCostBrl: 48,
        massG: 65,
        sourceTip: 'Fora do teto de R$ 200'
      },
      {
        id: 'rc-buck',
        name: 'Regulador 5V (LM2596/Mini-360) + Chave Geral + Fios 14 AWG',
        spec: 'Alimenta o ESP32 em 5V estáveis a partir da bateria 12V da parafusadeira',
        category: 'remote_control_excluded' as const,
        unitCostBrl: 12,
        massG: 45,
        sourceTip: 'Fora do teto de R$ 200'
      }
    ]
  },
  {
    id: 'rc-flysky',
    label: 'Opção Competição: Rádio Controle RC 2.4 GHz + ESC Brushed 60A',
    totalBrl: 235,
    items: [
      {
        id: 'rc-txrx',
        name: 'Conjunto Transmissor + Receptor 2.4 GHz (3CH/6CH)',
        spec: 'Alcance > 100 m sem interferência de Wi-Fi no ginásio/hall do bloco',
        category: 'remote_control_excluded' as const,
        unitCostBrl: 180,
        massG: 35,
        sourceTip: 'Fora do teto de R$ 200 (receptor na locomotiva; rádio portátil)'
      },
      {
        id: 'rc-esc60',
        name: 'ESC Brushed 60A com BEC 5V Integrado (Frente / Freio / Ré)',
        spec: 'Plug-and-play direto no canal do acelerador do receptor RC para motor 550',
        category: 'remote_control_excluded' as const,
        unitCostBrl: 55,
        massG: 42,
        sourceTip: 'Fora do teto de R$ 200'
      }
    ]
  }
];


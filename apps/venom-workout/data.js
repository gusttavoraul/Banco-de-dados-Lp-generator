// =====================================================================
// Venom Workout — dados base (movimentos de Cross + grade de aulas)
// type: load  = peso (kg) x reps
//       reps  = máximo de repetições (peso opcional)
//       time  = tempo (mm:ss) — "for time" / distâncias
//       amrap = rounds + reps
//       cal   = calorias
//       dist  = distância (m) / altura (cm)
//       hold  = tempo de sustentação (mm:ss)
// =====================================================================

const MOVEMENT_GROUPS = [
  {
    id: 'squat', name: 'Agachamentos', type: 'load',
    items: ['Back Squat', 'Front Squat', 'Overhead Squat', 'Box Squat', 'Pause Back Squat', 'Pause Front Squat',
      'Zercher Squat', 'Goblet Squat', 'Bulgarian Split Squat', 'Front Rack Lunge', 'Back Rack Lunge',
      'Overhead Lunge', 'Walking Lunge (DB)', 'Step-up (DB)']
  },
  {
    id: 'deadlift', name: 'Levantamentos Terra & Posterior', type: 'load',
    items: ['Deadlift', 'Sumo Deadlift', 'Romanian Deadlift', 'Stiff-Leg Deadlift', 'Deficit Deadlift',
      'Trap Bar Deadlift', 'Sumo Deadlift High Pull', 'Good Morning', 'Hip Thrust', 'Barbell Row', 'Pendlay Row']
  },
  {
    id: 'clean', name: 'Clean', type: 'load',
    items: ['Clean', 'Squat Clean', 'Power Clean', 'Hang Clean', 'Hang Power Clean', 'Hang Squat Clean',
      'High Hang Clean', 'Muscle Clean', 'Clean Pull', 'Clean High Pull', 'Clean Deadlift', 'Tall Clean']
  },
  {
    id: 'jerk', name: 'Jerk & Press', type: 'load',
    items: ['Strict Press', 'Push Press', 'Push Jerk', 'Split Jerk', 'Squat Jerk', 'Power Jerk',
      'Behind the Neck Jerk', 'Jerk Recovery', 'Bench Press', 'Close Grip Bench Press', 'Floor Press',
      'Z Press', 'Seated DB Press']
  },
  {
    id: 'cnj', name: 'Clean & Jerk / Complexos', type: 'load',
    items: ['Clean & Jerk', 'Squat Clean & Jerk', 'Power Clean & Jerk', 'Hang Clean & Jerk',
      'Clean + Front Squat + Jerk', 'Thruster', 'Cluster', 'Ground to Overhead', 'Shoulder to Overhead']
  },
  {
    id: 'snatch', name: 'Snatch', type: 'load',
    items: ['Snatch', 'Squat Snatch', 'Power Snatch', 'Hang Snatch', 'Hang Power Snatch', 'Hang Squat Snatch',
      'High Hang Snatch', 'Muscle Snatch', 'Snatch Balance', 'Heaving Snatch Balance', 'Drop Snatch',
      'Snatch Pull', 'Snatch High Pull', 'Snatch Deadlift', 'Sots Press', 'Snatch Grip Push Press',
      'Snatch Grip Deadlift', 'Overhead Squat (Snatch Grip)']
  },
  {
    id: 'dbkb', name: 'Halter & Kettlebell', type: 'load',
    items: ['DB Snatch', 'DB Clean', 'DB Clean & Jerk', 'DB Thruster', 'DB Push Press', 'DB Bench Press',
      'DB Row', 'Devil Press', 'Man Maker', 'KB Swing (Russo)', 'KB Swing (Americano)', 'KB Snatch',
      'KB Clean', 'KB Goblet Squat', 'Turkish Get-up', 'Farmer Carry', 'Sandbag Clean', 'Sandbag to Shoulder',
      'Wall Ball (peso)', 'D-Ball Over Shoulder', 'Sled Push', 'Yoke Carry']
  },
  {
    id: 'weighted', name: 'Ginástica com Carga', type: 'load',
    items: ['Weighted Pull-up', 'Weighted Chin-up', 'Weighted Ring Dip', 'Weighted Bar Dip',
      'Weighted Pistol', 'Weighted Push-up']
  },
  {
    id: 'gym', name: 'Ginástica (máx. reps)', type: 'reps',
    items: ['Pull-up (Kipping)', 'Butterfly Pull-up', 'Strict Pull-up', 'Chin-up', 'Chest-to-Bar',
      'Strict Chest-to-Bar', 'Bar Muscle-up', 'Ring Muscle-up', 'Strict Ring Muscle-up', 'Toes-to-Bar',
      'Strict Toes-to-Bar', 'Knees-to-Elbow', 'Handstand Push-up (Kipping)', 'Strict Handstand Push-up',
      'Deficit HSPU', 'Wall-Facing HSPU', 'Ring Dip', 'Bar Dip', 'Push-up', 'Hand Release Push-up',
      'Ring Push-up', 'Pistol', 'Air Squat', 'Burpee', 'Bar-Facing Burpee', 'Burpee Box Jump-over',
      'Box Jump', 'Wall Walk', 'GHD Sit-up', 'AbMat Sit-up', 'V-up', 'Rope Climb (15 ft)',
      'Legless Rope Climb', 'Pegboard Ascent', 'Wall Ball (máx. unbroken)', 'Double-unders (unbroken)',
      'Triple-unders (unbroken)', 'Crossover Double-unders', 'Single-unders (unbroken)',
      'Ring Row', 'Back Extension', 'Hip Extension']
  },
  {
    id: 'hold', name: 'Isometria / Holds', type: 'hold',
    items: ['Handstand Hold', 'Free Handstand Hold', 'L-Sit (paralelas)', 'L-Sit (argolas)',
      'Dead Hang', 'Plank', 'Hollow Hold', 'Ring Support Hold', 'Chin-over-bar Hold']
  },
  {
    id: 'dist', name: 'Distância / Altura', type: 'dist',
    items: ['Handstand Walk (m, unbroken)', 'Box Jump (altura cm)', 'Broad Jump (cm)',
      'Overhead Walk (m)', 'Sled Pull (m)']
  },
  {
    id: 'mono', name: 'Monoestrutural (tempo)', type: 'time',
    items: ['Remo 250 m', 'Remo 500 m', 'Remo 1.000 m', 'Remo 2.000 m', 'Remo 5.000 m', 'Remo 10.000 m',
      'Corrida 200 m', 'Corrida 400 m', 'Corrida 800 m', 'Corrida 1 milha', 'Corrida 5 km', 'Corrida 10 km',
      'Corrida 21 km', 'Ski Erg 250 m', 'Ski Erg 500 m', 'Ski Erg 1.000 m', 'Ski Erg 2.000 m',
      'Bike Erg 1 km', 'Bike Erg 5 km', 'Bike Erg 10 km', 'Assault/Echo Bike 50 cal', 'Assault/Echo Bike 100 cal',
      'Natação 400 m', '100 Double-unders (tempo)', '100 Burpees (tempo)', '100 Wall Balls (tempo)']
  },
  {
    id: 'cal', name: 'Calorias (máx.)', type: 'cal',
    items: ['Assault/Echo Bike 1 min', 'Assault/Echo Bike 10 min', 'Remo 1 min', 'Remo 20 min',
      'Ski Erg 1 min', 'Bike Erg 1 min']
  },
  {
    id: 'girls', name: 'Benchmarks — The Girls', type: 'time',
    items: ['Fran', 'Grace', 'Isabel', 'Diane', 'Elizabeth', 'Helen', 'Karen', 'Annie', 'Angie', 'Barbara',
      'Chelsea', 'Jackie', 'Linda', 'Nancy', 'Eva', 'Kelly', 'Amanda', 'Marguerita', 'Hope', 'Gwen',
      'Lynne', 'Nicole', 'Candy', 'Maggie', 'Christine', 'Ingrid', 'Barbara Ann', 'Lyla', 'Ellen',
      'Andi', 'Lane', 'Megan', 'Laura']
  },
  {
    id: 'girls_amrap', name: 'Benchmarks — The Girls (AMRAP)', type: 'amrap',
    items: ['Cindy', 'Mary']
  },
  {
    id: 'heroes', name: 'Hero WODs (for time)', type: 'time',
    items: [
      'Murph', 'DT', 'Randy', 'Michael', 'JT', 'Badger', 'Josh', 'Jason', 'Daniel', 'Joshie', 'Tommy V',
      'Griff', 'Ryan', 'Erin', 'Mr. Joshua', 'Holleyman', 'Glen', 'Luce', 'Loredo', 'Chad', 'Kalsu',
      'Whitten', 'Bull', 'Lumberjack 20', 'The Seven', 'Clovis', 'Wittman', 'Jerry', 'Hansen', 'Roy',
      'Small', 'Abbate', 'Nutts', 'Hidalgo', 'Tumilson', 'Hammer', 'Bradshaw', 'Manion', 'Adam Brown', 'Coe',
      'Severin', 'Tommy Mac', 'Brenton', 'Blake', 'Collin', 'Thompson', 'Wood', 'Spehar', 'Arnie', 'The Don',
      'Bert', 'Dork', 'Pheezy', 'Gator', 'Big Sexy', 'Paul', 'Riley', 'Garrett', 'Ship', 'Desforges',
      'Morrison', 'Wilmot', 'Klepto', 'Jag 28', 'RJ', 'Sean', 'Weaver', 'Hall', 'Lee', 'Willy', 'Coffland',
      'Alexander', 'Dae Han', 'Ty', 'Marco', 'Santiago', 'Carse', 'Bowen', 'Tully', 'Wes', 'Bell',
      'Hollywood', 'Bulger', 'Brehm', 'Omar', 'Gallant', 'Bruck', 'Smykowski', 'Donny', 'Dobogai', 'Lucas',
      'Kevin', 'Andy', 'Liam', 'Gaza', 'Crain', 'Jared', 'Strange', 'Taylor', 'Justin', 'Nukes', 'Zeus',
      'Ozzy', 'Holsinger', 'Matt 16', 'Hamilton', 'heroes_amrap', 'Hero WODs (AMRAP)', 'amrap'
    ]
  },
  {
    id: 'heroes_amrap', name: 'Hero WODs (AMRAP)', type: 'amrap',
    items: [
      'Nate', 'Jack', 'Jenny', 'McGhee', 'Johnson', 'Ricky', 'Moore', 'Tom', 'Rankel', 'Barraza', 'Rocket',
      'Falkel', 'Hortman', 'Zimmerman', 'Danny', 'Rahoi'
    ]
  },
  {
    id: 'classics', name: 'Clássicos & Open', type: 'time',
    items: ['Filthy Fifty', 'The Chief', 'Fight Gone Bad (reps)', 'Death by Pull-ups', 'Tabata Something Else',
      'Open 11.1', 'Open 12.1', 'Open 13.1', 'Open 14.1', 'Open 15.1', 'Open 16.1', 'Open 17.1', 'Open 18.1',
      'Open 19.1', 'Open 20.1', 'Open 21.1', 'Open 22.1', 'Open 23.1', 'Open 24.1', 'Open 25.1', 'Open 26.1',
      'Total CrossFit (Back Squat + Press + Deadlift)', 'Sinclair Total (Snatch + C&J)']
  }
];

// remove duplicados dentro de cada grupo
MOVEMENT_GROUPS.forEach(g => { g.items = [...new Set(g.items)]; });

const TYPE_LABEL = {
  load: 'Carga', reps: 'Reps', time: 'Tempo', amrap: 'AMRAP', cal: 'Calorias', dist: 'Distância', hold: 'Sustentação'
};

// =====================================================================
// Grade de aulas — Skyfit Mogi das Cruzes (cronograma semanal da Venom)
// 0 = domingo ... 6 = sábado
// =====================================================================
const GYM = {
  name: 'Skyfit Mogi das Cruzes',
  team: 'Venom Workout',
  instagram: 'https://www.instagram.com/crossvenomworkout/',
  capacity: 16,          // padrão; o coach altera no Painel do Coach
  cancelLimitMin: 60,
  schedule: {
    0: ['10:00'],                                   // domingo: aulão
    1: ['06:00', '07:00', '18:10', '19:10', '20:10'], // segunda: manhã + noite
    2: ['18:10', '19:10', '20:10'],                 // terça: noite
    3: ['06:00', '07:00'],                          // quarta: manhã
    4: ['06:00', '07:00', '18:10', '19:10', '20:10'], // quinta: manhã + noite
    5: [],                                          // sexta: sem aula
    6: []                                           // sábado: sem aula
  },
  coach: 'Karrasco',
  // nome/tema da aula: 'dia|horário' > 'dia' > padrão
  classTypes: {
    default: 'Cross Training',
    0: 'Aulão de Domingo',
    '2|18:10': 'Deadly Barbell — The Clean', '2|19:10': 'Deadly Barbell — The Clean', '2|20:10': 'Deadly Barbell — The Clean',
    '3|06:00': 'Deadly Barbell — The Clean', '3|07:00': 'Deadly Barbell — The Clean',
    4: 'Handstand Walking'
  },
  // datas sem aula (feriados, campeonatos…)
  closures: {
    '2026-11-28': 'Não haverá aula — dia de campeonato 🏆'
  }
};

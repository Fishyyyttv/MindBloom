export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export interface Emotion {
  label: string
  emoji: string
  color: string
}

export const EMOTIONS: Emotion[] = [
  { label: 'Happy', emoji: '😊', color: 'bg-yellow-100 text-yellow-800' },
  { label: 'Calm', emoji: '😌', color: 'bg-sage-100 text-sage-800' },
  { label: 'Anxious', emoji: '😰', color: 'bg-orange-100 text-orange-800' },
  { label: 'Sad', emoji: '😢', color: 'bg-blue-100 text-blue-800' },
  { label: 'Angry', emoji: '😠', color: 'bg-red-100 text-red-800' },
  { label: 'Overwhelmed', emoji: '😵', color: 'bg-purple-100 text-purple-800' },
  { label: 'Numb', emoji: '😶', color: 'bg-gray-100 text-gray-800' },
  { label: 'Tired', emoji: '😴', color: 'bg-indigo-100 text-indigo-800' },
  { label: 'Lonely', emoji: '🥺', color: 'bg-pink-100 text-pink-800' },
  { label: 'Hopeful', emoji: '🌱', color: 'bg-green-100 text-green-800' },
  { label: 'Frustrated', emoji: '😤', color: 'bg-red-100 text-red-700' },
  { label: 'Grateful', emoji: '🙏', color: 'bg-amber-100 text-amber-800' },
]

export const BREATHING_EXERCISES = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Inhale, hold, exhale, hold — equal counts. Calms your nervous system fast.',
    emoji: '⬜',
    phases: [
      { label: 'Inhale', duration: 4, color: '#7C9A7E' },
      { label: 'Hold', duration: 4, color: '#A8C5AA' },
      { label: 'Exhale', duration: 4, color: '#5e7e60' },
      { label: 'Hold', duration: 4, color: '#A8C5AA' },
    ],
  },
  {
    id: '478',
    name: '4-7-8 Breathing',
    description: 'A powerful technique to reduce anxiety and help you sleep.',
    emoji: '✨',
    phases: [
      { label: 'Inhale', duration: 4, color: '#7C9A7E' },
      { label: 'Hold', duration: 7, color: '#A8C5AA' },
      { label: 'Exhale', duration: 8, color: '#5e7e60' },
    ],
  },
  {
    id: 'calm',
    name: 'Calm Breath',
    description: 'Long exhales activate your rest-and-digest response.',
    emoji: '🍃',
    phases: [
      { label: 'Inhale', duration: 4, color: '#7C9A7E' },
      { label: 'Exhale', duration: 6, color: '#5e7e60' },
    ],
  },
  {
    id: 'energize',
    name: 'Energizing Breath',
    description: 'Short cycles to boost alertness and focus.',
    emoji: '⚡',
    phases: [
      { label: 'Inhale', duration: 2, color: '#C9A84C' },
      { label: 'Exhale', duration: 2, color: '#a88830' },
    ],
  },
]

export const DBT_SKILLS = [
  {
    category: 'Distress Tolerance',
    color: 'bg-blue-50 border-blue-200',
    accent: '#3B82F6',
    skills: [
      { name: 'TIPP', description: 'Temperature, Intense exercise, Paced breathing, Paired muscle relaxation', steps: ['Apply cold water to face or wrists for 30 seconds', 'Do 20 minutes of intense exercise', 'Slow your breath — long exhales', 'Tense and release each muscle group'] },
      { name: 'STOP', description: 'Stop, Take a breath, Observe, Proceed mindfully', steps: ['Stop — literally freeze in place', 'Take one slow, deep breath', 'Observe what you\'re feeling and thinking', 'Proceed with awareness, not reaction'] },
      { name: 'Radical Acceptance', description: 'Accept reality as it is, not as you wish it were', steps: ['Notice you\'re fighting reality ("This shouldn\'t be happening")', 'Remind yourself: "It is what it is right now"', 'Feel the grief or frustration — don\'t suppress it', 'Turn your mind toward acceptance again and again'] },
      { name: 'Self-Soothe', description: 'Comfort yourself through the five senses', steps: ['Vision: Look at something beautiful', 'Hearing: Listen to soothing music', 'Smell: Use a calming scent', 'Taste: Have a comforting drink or food', 'Touch: Hold something soft or warm'] },
    ],
  },
  {
    category: 'Emotion Regulation',
    color: 'bg-sage-50 border-sage-200',
    accent: '#7C9A7E',
    skills: [
      { name: 'PLEASE', description: 'Reduce vulnerability to emotional mind', steps: ['treat PhysicaL illness — see a doctor', 'balance Eating — don\'t skip meals', 'Avoid mood-altering substances', 'balance Sleep — maintain a schedule', 'get Exercise — at least 20 min daily'] },
      { name: 'Opposite Action', description: 'Act opposite to what your emotion urges you to do', steps: ['Identify the emotion and its action urge', 'Check if acting on it serves your goals', 'If not, do the opposite fully', 'Anxiety → approach instead of avoid', 'Sadness → activate instead of withdraw', 'Anger → be kind instead of attacking'] },
      { name: 'Check the Facts', description: 'Ask if your interpretation matches reality', steps: ['What is the emotion I\'m feeling?', 'What triggered it?', 'What are my interpretations of the event?', 'What evidence supports or contradicts them?', 'Does my emotion fit the facts?'] },
    ],
  },
  {
    category: 'Interpersonal Effectiveness',
    color: 'bg-blush-100 border-blush-300',
    accent: '#D4967F',
    skills: [
      { name: 'DEAR MAN', description: 'Get what you need while maintaining the relationship', steps: ['Describe the situation factually', 'Express your feelings ("I feel...")', 'Assert what you want or need', 'Reinforce — explain why it benefits both', 'stay Mindful — don\'t get distracted', 'Appear confident — even if you\'re not', 'Negotiate — be willing to give and take'] },
      { name: 'FAST', description: 'Maintain your self-respect in any interaction', steps: ['be Fair to yourself and others', 'no Apologies for existing or having needs', 'Stick to your values', 'be Truthful — don\'t lie or exaggerate'] },
    ],
  },
]

export const GROUNDING_TECHNIQUES = [
  {
    id: '54321',
    name: '5-4-3-2-1',
    description: 'Use your senses to anchor yourself in the present moment.',
    emoji: '🌿',
    steps: [
      { sense: 'See', count: 5, prompt: 'Name 5 things you can see right now', icon: '👁️', color: '#7C9A7E' },
      { sense: 'Touch', count: 4, prompt: 'Name 4 things you can physically feel', icon: '✋', color: '#A8C5AA' },
      { sense: 'Hear', count: 3, prompt: 'Name 3 sounds you can hear', icon: '👂', color: '#5e7e60' },
      { sense: 'Smell', count: 2, prompt: 'Name 2 things you can smell', icon: '👃', color: '#A8C5AA' },
      { sense: 'Taste', count: 1, prompt: 'Name 1 thing you can taste', icon: '👅', color: '#7C9A7E' },
    ],
  },
  {
    id: 'body-scan',
    name: 'Body Scan',
    description: 'Slowly scan your body to release tension and come home to yourself.',
    emoji: '🧘',
    steps: [
      { sense: 'Head & Face', count: 0, prompt: 'Relax your forehead, jaw, and neck. Notice any tension and breathe into it.', icon: '🧠', color: '#B8D4E8' },
      { sense: 'Shoulders & Arms', count: 0, prompt: 'Drop your shoulders away from your ears. Let your arms be heavy.', icon: '💪', color: '#B8D4E8' },
      { sense: 'Chest & Belly', count: 0, prompt: 'Notice the rise and fall of your breath. Place a hand on your belly.', icon: '💚', color: '#7C9A7E' },
      { sense: 'Hips & Legs', count: 0, prompt: 'Feel the weight of your lower body. Unclench your hips and thighs.', icon: '🦵', color: '#A8C5AA' },
      { sense: 'Feet', count: 0, prompt: 'Press your feet flat to the floor. Feel grounded, rooted, supported.', icon: '🦶', color: '#5e7e60' },
    ],
  },
  {
    id: 'safe-place',
    name: 'Safe Place Visualization',
    description: 'Create a mental sanctuary to return to whenever you need calm.',
    emoji: '🏡',
    steps: [
      { sense: 'Find', count: 0, prompt: 'Close your eyes. Picture a place — real or imagined — where you feel completely safe.', icon: '🔍', color: '#C4B8E8' },
      { sense: 'See', count: 0, prompt: 'What does this place look like? Describe the colors, light, and surroundings.', icon: '👁️', color: '#7C9A7E' },
      { sense: 'Hear', count: 0, prompt: 'What sounds are here? Wind, water, silence, music?', icon: '👂', color: '#A8C5AA' },
      { sense: 'Feel', count: 0, prompt: 'What does the air feel like? The ground beneath you? Temperature?', icon: '✋', color: '#5e7e60' },
      { sense: 'Rest', count: 0, prompt: 'You are safe here. Breathe slowly. You can return here anytime.', icon: '💙', color: '#B8D4E8' },
    ],
  },
]

export const WORKSHEETS = [
  { id: 'thought-record', name: 'Thought Record', emoji: '🧠', description: 'Catch and challenge unhelpful thinking patterns using CBT.', category: 'CBT' },
  { id: 'emotion-checkin', name: 'Emotion Check-In', emoji: '💗', description: 'Map what you\'re feeling, where it lives in your body, and why.', category: 'Awareness' },
  { id: 'safety-plan', name: 'Safety Plan', emoji: '🛡️', description: 'Build your personal plan for when things feel really hard.', category: 'Crisis' },
  { id: 'values', name: 'Values Clarification', emoji: '🧭', description: 'Reconnect with what actually matters to you.', category: 'ACT' },
  { id: 'anger-chain', name: 'Anger Chain Analysis', emoji: '🔥', description: 'Break down an anger episode so you can catch it earlier.', category: 'Emotion Reg' },
  { id: 'stress-bucket', name: 'Stress Bucket', emoji: '🪣', description: 'Map what fills you up and what actually drains stress out.', category: 'Awareness' },
  { id: 'behavioral-activation', name: 'Behavioral Activation', emoji: '🌅', description: 'Schedule meaningful activities to lift your mood.', category: 'CBT' },
  { id: 'gratitude', name: 'Gratitude Practice', emoji: '🙏', description: 'Train your brain to notice what\'s good, even in hard times.', category: 'Mindfulness' },
]

export const COPING_CARDS = [
  { id: 'ice-dive', name: 'Ice Dive', emoji: '🧊', category: 'DBT', description: 'Activates dive reflex — rapidly slows heart rate and stops panic.', steps: ['Fill a bowl with cold water and ice', 'Take a breath and hold it', 'Submerge your face for 15–30 seconds', 'Repeat 2–3 times as needed'] },
  { id: 'move', name: 'Move Your Body', emoji: '🏃', category: 'Regulation', description: 'Stress hormones need somewhere to go — movement burns them off fast.', steps: ['20 jumping jacks or a short run', 'Shake your hands out vigorously', 'Dance to one full song', 'Walk around the block briskly'] },
  { id: 'brain-dump', name: 'Brain Dump', emoji: '✍️', category: 'Mindfulness', description: 'Get it out of your head. No filter, no judgment, just write.', steps: ['Set a 5-minute timer', 'Write everything in your head — no editing', 'Don\'t stop until the timer ends', 'Set it aside. You don\'t have to read it.'] },
  { id: 'cold-water', name: 'Cold Water Reset', emoji: '💧', category: 'Somatic', description: 'Cold water on face or wrists rapidly reduces emotional intensity.', steps: ['Run cold water over your wrists for 30 seconds', 'Splash cold water on your face', 'Notice the physical sensation fully', 'Take three slow breaths after'] },
  { id: 'opposite-action', name: 'Opposite Action', emoji: '🔄', category: 'DBT', description: 'Do the opposite of what your emotion is pushing you to do.', steps: ['Anxiety → approach instead of avoid', 'Sadness → activate instead of withdraw', 'Anger → speak softly or walk away', 'Shame → share with one safe person'] },
  { id: 'progressive-relaxation', name: 'Progressive Relaxation', emoji: '🌊', category: 'Somatic', description: 'Systematically tense and release muscle groups to release stress.', steps: ['Start with your feet — tense for 5 seconds', 'Release and notice the contrast', 'Work upward through each muscle group', 'End with a full body release and three breaths'] },
  { id: 'boundary-script', name: 'Boundary Script', emoji: '🧱', category: 'Interpersonal', description: 'Protect your energy with short, repeatable language.', steps: ['"I\'m not available right now, but I can talk at 6pm."', '"I hear you. I still need a break before we continue."', '"I\'m not available for yelling. I\'ll come back when we\'re calm."', '"I care about this relationship and I need a moment."'] },
  { id: 'night-winddown', name: 'Night Wind-Down', emoji: '🌙', category: 'Sleep', description: 'A 15-minute routine for anxious evenings.', steps: ['2 min: Dim lights, phone face down', '5 min: Brain dump thoughts on paper', '5 min: Slow stretch and shoulder release', '3 min: Inhale 4, exhale 6 in bed'] },
]

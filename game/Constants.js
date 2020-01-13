const States = {
    MinusEnergy: 'minusEnergy',
    MinusSpeed: 'minusSpeed',
    PlusInitiative: 'plusInitiative',
    MinusInitiative: 'minusInitiative',
    Dazzled: 'dazzled',
    Immobilized: 'immobilized',
    Poisoned: 'poisoned',
    Taunted: 'taunted',
    Unnamed: 'unnamedState'
};

const DieColors = {
    Black: 'black',
    Green: 'green',
    Red: 'red',
    Orange: 'orange',
    Yellow: 'yellow',
    Blue: 'blue'
};

const Symbols = {
    Success: 'success',
    Block: 'block',
    Special: 'special',
    CriticalSuccess: 'criticalSuccess',
    CritialBlock: 'criticalBlock'
};

const SymbolsOrder = [
    Symbols.Success,
    Symbols.Block,
    Symbols.Special,
    Symbols.CriticalSuccess,
    Symbols.CritialBlock
];

const RollTypes = {
    Simple: 'simple',
    FaceToFace: 'face2face'
};

const EventNames = {
    //Framework steps
    OnRoundStarted: 'onRoundStarted',
    OnRoundEnded: 'onRoundEnded',
    OnPhaseStarted: 'onPhaseStarted',
    OnPhaseEnded: 'onPhaseEnded',
    OnActivationStarted: 'onActivationStarted',
    OnActivationEnded: 'onActivationEnded',
    OnPreparationStepStarted: 'onPreparationStepStarted',
    OnPreparationStepEnded: 'onPreparationStepEnded',
    OnActionStepStarted: 'onActionStepStarted',
    OnActionStepEnded: 'onActionStepEnded',
    OnStatesStepStarted: 'onStatesStepStarted',
    OnStatesStepEnded: 'onStatesStepEnded',
    OnAtEndOfPhase: 'onAtEndOfPhase',
    //Actions
    OnMovementPointsAdded: 'onMovementPointsAdded',
    OnPiecePlaced: 'onPiecePlaced',
    OnStateImposed: 'onStateImposed',
    //Misc
    Unnamed: 'unnamedEvent'
};

const EffectNames = {
    
};

const ActionTypes = {
    Normal: 'normal',
    Attack: 'attack'
};

const EffectTypes = {
    Conditional: 'conditional',
    Automatic: 'automatic'
};
	
const AbilityTypes = {
    WouldInterrupt: 'wouldinterrupt',
    ForcedInterrupt: 'forcedinterrupt',
    Interrupt: 'interrupt',
    ForcedReaction: 'forcedreaction',
    Reaction: 'reaction',
    Action: 'action',
    OtherEffects: 'others'
};	

const TargetModes = {
    Select: 'select',
    Exactly: 'exactly',
    Single: 'single',
    Unlimited: 'unlimited',
    UpTo: 'upTo'
};

const Stages = {
    PreTarget: 'pretarget',
    Cost: 'cost',
    Target: 'target',
    Roll: 'roll',
    Effect: 'effect'
};

const Players = {
    Self: 'self',
    Opponent: 'opponent',
    NotSelf: 'notSelf',
    NotOponent: 'notoponent',
    Any: 'any'
};

const Durations = {
    Persistent: 'persistent',
    UntilEndOfTurn: 'untilEndOfTurn',
    UntilEndOfPhase: 'untilEndOfPhase',
    UntilEndOfRound: 'untilEndOfRound'
};

module.exports = {
    States,
    DieColors,
    Symbols,
    SymbolsOrder,
    RollTypes,
    EventNames,
    EffectNames,
    ActionTypes,
    EffectTypes,
    AbilityTypes,
    TargetModes,
    Stages,
    Players,
    Durations
};

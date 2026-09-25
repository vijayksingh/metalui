// @unlocalhosted/metalui/gadgets: the gadget foundations (materials lit by one light).
export { GADGETS, GADGET_MATERIALS, type GadgetMaterial } from './gadgets/gadgets.generated';
export { pigment, deltaE, type Pigment } from './gadgets/color';
export { materialFilter, holeFilter, bodyFill, tierFor, type Tier, type Host, type LightOptions } from './gadgets/light';
export { normalize, JOBS, MATERIALS, PARTS, MECHANISMS, type Job, type Feel, type GadgetSpec, type RigSpec, type PartPlacement, type Channel, type Value } from './gadgets/spec';
export { resolve, resolveFeel, materialFor, bodyColor, accentFor, checkSet, type ResolvedFeel, type ResolvedGadget, type Placement, type SetProblem } from './gadgets/resolve';
export { validate, validateGadget, validateRig, type Problem, type ProblemCode, type Validation } from './gadgets/validate';
export { simulateCvd } from './gadgets/color';

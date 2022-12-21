// a => b => c -> a
// a => d -> e => a

// C D B A E

import {B} from "./b"
import {D} from "./d"

export class A extends B {
}

new D().runOn(new A())
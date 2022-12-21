# Parcel packager that properly resolves circular dependencies

Did you ever had an error out of the blue that tells you that some imported value is `undefined`, or, worse, not present at all?  
Did you then spend an hour to learn that it have something to do with circular dependencies and then spend a hour more to juggle your code around until error goes away... until next time?  
This package aims to prevent this kind of stuff once and for all! At least it will try its best.  

DISCLAIMER: this package is very hacky "fork" of original `@parcel/packager-js`. It may not work in some circumstances that I didn't take into account when writing the patch. Proceed with caution.  

## Install

Install the package:

```bash
npm install --save-dev @nartallax/parcel-packager-js-with-circular-dep-resolving
```

And put it into `.parcelrc`:

```json
{
  "extends": "@parcel/config-default",
  "packagers": {
    "*.js": "@nartallax/parcel-packager-js-with-circular-dep-resolving"
  }
}
```

Done, now your bundles should be better.  

## But how does it work exactly?

This is kinda long story.  

### Let's start with understanding the problem properly

The problem is that the bundler needs to lay out your modules in a sequence. It's fine - until it discovers circular dependency.  
Most of the bundlers (all of the popular ones, including default Parcel, webpack, requirejs and many more) don't think too much about how to resolve it. They just put SOME module to be evaluated before others, breaking the cycle of dependency. This means that this one module won't get a dependency at definition time.  
This isn't a big deal - the dependency will be present later anyway - until that one module tries to use an imported value at definition time synchronously. Most common case of this error is extending a class. And boom - runtime error.  

The thing is, in circle of dependencies there are "hot" dependencies (that means requiring module will use imported value synchronously) and "cold" dependencies (that means it won't). Hot dependencies must never be broken, as this will result in error; but it's fine to break cold dependencies. In most of dependency cycles there is at least one cold dependency; if there isn't - that means the code is very weird and that's probably a programmer's error.  
So now we can see that default cyclic dependency resolution rule is "let's hope that this dependency is not hot", and that's very insufficient.  

### But what can we do?

The first step is to build dependency graph and drop everything that is not a part of the cycle.  
Then we go over each dependency and check if it's cold. If it is - we cut it and drop everything that is not in cycle anymore; then we repeat the process until there's no cycles.  

The interesting (and unreliable) part of how we determine if dependency is cold or hot - we analyse its code (going through its AST), trying to find which imported values it uses at definition time. You can imagine that there's a lot of cases that are not caught by this approach - but there's also a lot of simple cases that are caught, and that's usually sufficient. Even if it's not - you can always explicitly tell the packager that value is used by putting something like `void myImportedValue` in the module root.  
There's different approach of detecting hot dependencies - just wrap each module in `Proxy` object and evaluate it lazily. It will work 100% of the time, but it will be a performance hit, and also will prevent a lot of optimizations, so I'd rather not do that.  

When the graph is all de-cycled, we can easily build a sequence in which packages should be present in the bundle.

### And how do we enforce that order?

This is also a fun part, like the one above!  
We apply some hacks, introducing new imports to original code in proper order and limiting traversal of dependencies, so modules are substitute in required order.  
Initially I tried to make a separate packager that wraps original `@parcel/packager-js`, but original is too complex to be non-invasively patched from outside.  

And that's it.  

## Why this logic is not a part of most existing bundlers?

Looks like it's ECMAScript standard behaviour for this kind of things (which sucks).  
Seems like everyone have this problem, like, once or twice a year, solving it just by juggling the code a little, and don't care the rest of the time.  
If you're maintaining some bundler and want to adopt this logic - please do so. I'll be delighted to know that at least one bundler is better now.  

## Updating the fork to newer version of original

This part is for maintainers (me).  
As you can see, this package is not a fork from git's point of view. It is forked by getting code of original package from npm and introducing some patches to it.  
So, the update procedure is following:

1. Backup `lib` directory
2. Run `scripts/pull_upstream.sh`. This will substitute `lib` directory with newer version, as well as bring some additional files like `package.json`
3. Search original `lib` directory for `/** <PATCH> **/`. Those are places that were patched. You need to copy the changes into new code (don't worry, there's like 5 or 7 of them).
4. Test, it should be good now. And you may also delete your backup of `lib`, you won't need it anymore.
5. Build, publish, whatever.

# js-chat
PubNub JavaScript Chat SDK


## Contract tests. Integration level.

This repository contains contract integration tests for JS-Chat SDK.

### Setup

1. Clone the repository `git clone`
####
2. Install dependencies with: `yarn`
####

### Running Tests

Run test with `yarn test`

### Tests structure

Contract integration tests are stored in core library of JS Chat SDK repository. Every feature has dedicated file:

`lib/tests/**/*.test.ts`

All tests stored inside `**/*.test.ts` files

Tests are run against PubNub SDK infrastructure and verified JS Chat SDK proper behavior.

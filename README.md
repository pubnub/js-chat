# js-chat
PubNub JavaScript Chat SDK


## Contract tests

This repository contains contract integration tests for JS-Chat SDK.

### Setup

1. Clone the repository `git clone`
####
2. Install dependencies with: `yarn`
####

### Running Tests

Run test with `yarn test`

### Tests structure

We use Cucumber framework that allows to write test scenarios in [Gherkin language](https://cucumber.io/docs/gherkin/reference/)

All tests stored inside `lib/tests/features` folder.

Gherkin scenario is stored in `features/**/*.feature` file.

Tests stored in `step-definitions/**/*.ts` file

Tests are run against PubNub SDK infrastructure and verified JS Chat SDK proper behavior.

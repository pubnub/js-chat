# Vue app

Run a simple Vue chat app built with Chat SDK (TypeScript) and [JavaScript SDK](https://www.pubnub.com/docs/sdks/javascript).

This app uses a `test-user` and the `demo` Subscribe and Publish Keys. After running it, you'll see a screen divided into two parts - two separate views showing sample message input, message list, and typing indicator fields, created with the JavaScript SDK (on the left) and the Chat SDK (on the right).

The idea behind the app was to replicate and test the same basic chat functionalities using separate SDKs.

## Prerequisites

Before you start, make sure you have the following package managers installed:

* [Node.js](https://nodejs.org/en) (v18.10.0 or higher)
* [yarn](https://yarnpkg.com/cli/version) (v1.22.19 or higher)

## Usage

Follow these steps to run the Vue app:

1. Open the terminal, select the location, and download the Chat SDK.

    ```ssh showLineNumbers
    git clone git@github.com:pubnub/js-chat.git
    ```

1. Go to the downloaded repository folder.

    ```bash showLineNumbers
    cd js-chat
    ```

1. Resolve and fetch packages, and link the required dependencies.

    ```bash showLineNumbers
    yarn
    ```

1. Go to the `lib` folder that contains the TypeScript sources.

    ```bash showLineNumbers
    cd lib
    ```

1. Bundle the TypeScript library and compile it down to a JavaScript script.

    ```bash showLineNumbers
    yarn build
    ```

1. Go to the `samples/vue` folder with the app's source code.

    ```bash showLineNumbers
    cd ..
    cd samples/vue
    ```

1. Run the app.

    ```bash showLineNumbers
    yarn dev
    ```

1. When the app compiles successfully, you will see the link to the localhost in the terminal. Open it in your browser and test the app by sending a sample message.

    ![Vue sample](/samples/vue/src/assets/vue-sample.png)
